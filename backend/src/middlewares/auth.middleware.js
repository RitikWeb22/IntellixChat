import jwt from "jsonwebtoken";
import { redis } from "../config/cache.js";




export async function identifyUser(req, res, next) {

    const token = req.cookies?.token;


    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
            success: false,
            err: "No token provided"
        })
    }

    try {
        // Check if token is blacklisted
        const isBlacklisted = await redis.get(token);
        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized",
                success: false,
                err: "Token has been revoked"
            })
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized",
            success: false,
            err: "Invalid token"
        })
    }

}
