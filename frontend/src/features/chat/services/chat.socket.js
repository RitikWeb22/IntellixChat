import { io } from "socket.io-client";

let socket = null;

export function initializeSocketConnection() {
    if (socket) {
        return socket;
    }

    const socketUrl = import.meta.env.DEV
        ? ""
        : (import.meta.env.VITE_API_URL || "https://intellix-chat-bacend.vercel.app");

    try {
        socket = io(socketUrl, {
            withCredentials: true,
            transports: ["websocket", "polling"],
            reconnectionAttempts: 2,
            timeout: 3000,
            autoConnect: true,
        });

        socket.on("connect_error", () => {
            // Silently handle socket failure on serverless platforms
        });
    } catch (err) {
        console.warn("Socket init error:", err?.message || err);
        socket = null;
    }

    return socket;
}

export function joinChatRoom(chatId) {
    if (!chatId) return;
    try {
        const activeSocket = initializeSocketConnection();
        if (activeSocket?.connected) {
            activeSocket.emit("chat:join", { chatId });
        }
    } catch (err) {
        console.warn("Socket join error:", err?.message || err);
    }
}

export function onTypingChange(handler) {
    const activeSocket = initializeSocketConnection();
    if (!activeSocket) return () => {};
    activeSocket.on("ai:typing", handler);
    return () => {
        activeSocket.off("ai:typing", handler);
    };
}

export function onAiStatus(handler) {
    const activeSocket = initializeSocketConnection();
    if (!activeSocket) return () => {};
    activeSocket.on("ai:status", handler);
    return () => {
        activeSocket.off("ai:status", handler);
    };
}

export function onAiStream(handler) {
    const activeSocket = initializeSocketConnection();
    if (!activeSocket) return () => {};
    activeSocket.on("ai:stream", handler);
    return () => {
        activeSocket.off("ai:stream", handler);
    };
}

export function onAiStreamEnd(handler) {
    const activeSocket = initializeSocketConnection();
    if (!activeSocket) return () => {};
    activeSocket.on("ai:stream:end", handler);
    return () => {
        activeSocket.off("ai:stream:end", handler);
    };
}