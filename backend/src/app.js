import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import authRouter from "./routes/auth.route.js";
import chatRouter from "./routes/chat.route.js";

const app = express();

const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(null, true); // Permissive in dev to avoid CORS friction
        },
        credentials: true,
    })
);
app.use(morgan("dev"));

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/chats", chatRouter);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        success: false,
    });
});

export default app;