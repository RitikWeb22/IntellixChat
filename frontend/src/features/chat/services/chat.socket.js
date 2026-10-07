import { io } from 'socket.io-client';

let socket;

export function initializeSocketConnection() {
    if (socket) {
        return socket;
    }

    const socketUrl = import.meta.env.DEV
        ? ""
        : (import.meta.env.VITE_API_URL || "https://intellix-chat-bacend.vercel.app");

    socket = io(socketUrl, {
        withCredentials: true,
        transports: ["websocket", "polling"],
    });

    return socket;
}

export function joinChatRoom(chatId) {
    if (!chatId) return;
    const activeSocket = initializeSocketConnection();
    activeSocket.emit('chat:join', { chatId });
}

export function onTypingChange(handler) {
    const activeSocket = initializeSocketConnection();
    activeSocket.on('ai:typing', handler);
    return () => {
        activeSocket.off('ai:typing', handler);
    };
}

export function onAiStatus(handler) {
    const activeSocket = initializeSocketConnection();
    activeSocket.on('ai:status', handler);
    return () => {
        activeSocket.off('ai:status', handler);
    };
}

export function onAiStream(handler) {
    const activeSocket = initializeSocketConnection();
    activeSocket.on('ai:stream', handler);
    return () => {
        activeSocket.off('ai:stream', handler);
    };
}

export function onAiStreamEnd(handler) {
    const activeSocket = initializeSocketConnection();
    activeSocket.on('ai:stream:end', handler);
    return () => {
        activeSocket.off('ai:stream:end', handler);
    };
}