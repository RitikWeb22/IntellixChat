import e, { json } from 'express';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from "morgan"
import chatRouter from './routes/chat.route.js';
const app = express();
// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))
app.use(morgan("dev"));


// Routes
import authRouter from './routes/auth.route.js';
app.use("/api/auth", authRouter);


app.use("/api/chats", chatRouter);

export default app;