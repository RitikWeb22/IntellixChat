import { Server } from "socket.io";

let io;

export const initSocketServer = (httpServer) => {
    const allowedOrigin = process.env.FRONTEND_URL || "https://intellix-chat.vercel.app";

    io = new Server(httpServer, {
        cors: {
            origin: [
                allowedOrigin,
                "https://intellix-chat.vercel.app",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
            ],
            credentials: true,
        },
    });

    console.log("Socket.IO server initialized with allowed origins:", allowedOrigin);

    io.on("connection", (socket) => {
        socket.on("chat:join", ({ chatId }) => {
            if (!chatId) return;
            socket.join(String(chatId));
        });

        socket.on("chat:leave", ({ chatId }) => {
            if (!chatId) return;
            socket.leave(String(chatId));
        });

        socket.on("disconnect", () => {
            // client disconnected
        });
    });
};

export function getIO() {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
}