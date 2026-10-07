import jwt from "jsonwebtoken";
import { redis } from "../config/cache.js";




export async function identifyUser(req, res, next) {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const token = req.cookies?.token || bearerToken;

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
            success: false,
            err: "No token provided"
        });
    }

    try {
        // Check if token is blacklisted safely
        try {
            const isBlacklisted = await redis.get(token);
            if (isBlacklisted) {
                return res.status(401).json({
                    message: "Unauthorized",
                    success: false,
                    err: "Token has been revoked"
                });
            }
        } catch (_) {
            // Redis unavailable - proceed with JWT verification
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "intellix_default_jwt_secret_key");
        req.user = decoded;
        next();

    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized",
            success: false,
            err: "Invalid token"
        });
    }
}
