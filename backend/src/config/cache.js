import Redis from "ioredis";

// In-memory fallback cache when Redis is unavailable or unconfigured
class MemoryCache {
    constructor() {
        this.store = new Map();
        this.timers = new Map();
    }

    async get(key) {
        return this.store.get(key) || null;
    }

    async set(key, value, mode, durationSeconds) {
        this.store.set(key, value);
        if (mode === "EX" && typeof durationSeconds === "number") {
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
            }
            const timer = setTimeout(() => {
                this.store.delete(key);
                this.timers.delete(key);
            }, durationSeconds * 1000);
            this.timers.set(key, timer);
        }
        return "OK";
    }

    async del(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        return this.store.delete(key) ? 1 : 0;
    }
}

const memoryFallback = new MemoryCache();
let redisClient = null;
let isRedisReady = false;

const hasRedisConfig = Boolean(process.env.REDIS_HOST);

if (hasRedisConfig) {
    try {
        redisClient = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            retryStrategy: (times) => {
                // Stop retrying after 3 attempts to avoid log spam
                if (times > 3) {
                    return null;
                }
                return Math.min(times * 500, 2000);
            },
        });

        redisClient.on("connect", () => {
            isRedisReady = true;
            console.log("Redis connected successfully");
        });

        redisClient.on("ready", () => {
            isRedisReady = true;
        });

        redisClient.on("close", () => {
            isRedisReady = false;
        });

        redisClient.on("error", (err) => {
            isRedisReady = false;
            // Log once as warning, do not crash process
            console.warn("Redis connection warning (using memory fallback):", err?.message || err);
        });

        redisClient.connect().catch((err) => {
            console.warn("Redis initial connect failed (using memory fallback):", err?.message || err);
        });
    } catch (err) {
        console.warn("Failed to initialize Redis client, falling back to memory:", err?.message || err);
        redisClient = null;
    }
} else {
    console.log("Redis not configured. Using high-performance in-memory cache.");
}

export const redis = {
    async get(key) {
        if (isRedisReady && redisClient) {
            try {
                return await redisClient.get(key);
            } catch (e) {
                return memoryFallback.get(key);
            }
        }
        return memoryFallback.get(key);
    },

    async set(key, value, mode, durationSeconds) {
        if (isRedisReady && redisClient) {
            try {
                return await redisClient.set(key, value, mode, durationSeconds);
            } catch (e) {
                return memoryFallback.set(key, value, mode, durationSeconds);
            }
        }
        return memoryFallback.set(key, value, mode, durationSeconds);
    },

    async del(key) {
        if (isRedisReady && redisClient) {
            try {
                return await redisClient.del(key);
            } catch (e) {
                return memoryFallback.del(key);
            }
        }
        return memoryFallback.del(key);
    },
};

export default redis;