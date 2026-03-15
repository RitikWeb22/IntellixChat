import Redis from "ioredis"

export const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
})


// redis
redis.on("connect", () => {
    console.log("redis is connected successfully!")
})

redis.on("error", (err) => {
    console.error("Error occurred while connecting to redis:", err)
})