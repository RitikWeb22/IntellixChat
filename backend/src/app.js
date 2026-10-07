import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/database.js";
import authRouter from "./routes/auth.route.js";
import chatRouter from "./routes/chat.route.js";

const app = express();

// Trust reverse proxies (Vercel, AWS, Nginx) for secure cookies
app.set("trust proxy", 1);

const allowedOrigins = [
    process.env.FRONTEND_URL,
    "https://intellix-chat.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
].filter(Boolean);

// CORS configuration supporting credentials across Vercel deployments
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
            if (!origin) return callback(null, true);

            if (
                allowedOrigins.includes(origin) ||
                origin.endsWith(".vercel.app") ||
                origin.includes("localhost") ||
                origin.includes("127.0.0.1")
            ) {
                return callback(null, true);
            }
            // Allow in dev / fallback to avoid hard CORS blocks
            return callback(null, true);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
        exposedHeaders: ["Set-Cookie"],
    })
);

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Health check endpoint (does not require DB connection)
app.get(["/api/health", "/health", "/"], (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "Intellix API",
        env: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
    });
});

// Database connection middleware for Serverless (Vercel) & Traditional Environments
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("Database connection failed in request middleware:", err.message);
        return res.status(500).json({
            message: "Database connection failed. Please ensure MONGO_URI is set in Vercel environment variables and MongoDB Atlas has Network Access set to 0.0.0.0/0.",
            error: err.message,
            success: false,
        });
    }
});

// Routes (supporting both /api/auth and /auth for flexible serverless proxies)
app.use("/api/auth", authRouter);
app.use("/auth", authRouter);
app.use("/api/chats", chatRouter);
app.use("/chats", chatRouter);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        success: false,
    });
});

export default app;