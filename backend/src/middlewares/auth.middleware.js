import jwt from "jsonwebtoken";
import { redis } from "../config/cache.js";




export function identifyUser(req, res, next) {

    const token = req.cookies.token;


    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
            success: false,
            err: "No token provided"
        })
    }

    const blacklisted = redis.get(token)
    if (blacklisted) {
        console.log("Token is blacklisted sucessfully")
    }

    try {

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
