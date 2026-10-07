import { Server } from "socket.io";

let io;

export const initSocketServer = (httpServer) => {
    const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

    io = new Server(httpServer, {
        cors: {
            origin: [allowedOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
            credentials: true,
        },
    });

    console.log("Socket.IO server initialized with allowed origins:", allowedOrigin);

    io.on("connection", (socket) => {
        // Track connected client
        socket.on("chat:join", ({ chatId }) => {
            if (!chatId) return;
            socket.join(String(chatId));
        });

        socket.on("chat:leave", ({ chatId }) => {
            if (!chatId) return;
            socket.leave(String(chatId));
        });

        socket.on("disconnect", () => {
            // disconnected
        });
    });
};

export function getIO() {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
}