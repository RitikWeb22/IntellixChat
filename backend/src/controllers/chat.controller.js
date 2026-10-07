import mongoose from "mongoose";
import { generateResponse, generateChatTitle } from "../service/ai.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import { getIO } from "../sockets/server.socket.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function streamTextChunks(io, chatId, text) {
    if (!io) return;
    const chunkSize = 24;
    for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        io.to(String(chatId)).emit("ai:stream", {
            chatId: String(chatId),
            chunk,
        });
        await delay(20);
    }
    io.to(String(chatId)).emit("ai:stream:end", {
        chatId: String(chatId),
    });
}

export async function sendMessage(req, res) {
    try {
        const { message, chatId: requestChatId, chat: legacyChatId } = req.body;
        const chatId = requestChatId || legacyChatId;

        // Validate input
        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "Message content is required",
            });
        }

        let chat = null;
        const userId = req.user?.id || req.user?.userId;

        // Find existing chat only if a valid ObjectId is provided
        if (chatId && mongoose.isValidObjectId(chatId)) {
            chat = await chatModel.findOne({
                _id: chatId,
                user: userId,
            });
        }

        // If chat not found or no valid ID provided, automatically create a new chat!
        if (!chat) {
            const title = await generateChatTitle(message);
            chat = await chatModel.create({
                user: userId,
                title,
            });
        }

        const activeChatId = chat._id;

        await messageModel.create({
            chat: activeChatId,
            content: message,
            role: "user",
        });

        const messages = await messageModel.find({ chat: activeChatId }).sort({ createdAt: 1 });

        try {
            const io = getIO();
            io.to(String(activeChatId)).emit("ai:typing", {
                chatId: String(activeChatId),
                isTyping: true,
            });
            io.to(String(activeChatId)).emit("ai:status", {
                chatId: String(activeChatId),
                status: "Thinking...",
            });
        } catch (socketError) {
            console.error("Socket emit error (typing start):", socketError?.message || socketError);
        }

        let result = "";
        try {
            result = await generateResponse(messages, {
                onStatus: (status) => {
                    try {
                        const io = getIO();
                        io.to(String(activeChatId)).emit("ai:status", {
                            chatId: String(activeChatId),
                            status,
                        });
                    } catch (socketError) {
                        console.error("Socket emit error (status):", socketError?.message || socketError);
                    }
                },
            });
        } catch (aiError) {
            console.error("AI error during generation:", aiError?.message || aiError);
            result = `I encountered an issue processing your request: ${aiError.message || "Unknown error"}. Please check your AI API key in the backend configuration.`;
        }

        try {
            const io = getIO();
            io.to(String(activeChatId)).emit("ai:status", {
                chatId: String(activeChatId),
                status: "Streaming response...",
            });
            await streamTextChunks(io, activeChatId, String(result || ""));
        } catch (socketError) {
            console.error("Socket emit error (stream):", socketError?.message || socketError);
        }

        const aiMessage = await messageModel.create({
            chat: activeChatId,
            content: result,
            role: "ai",
        });

        // Update chat updatedAt timestamp
        await chatModel.findByIdAndUpdate(activeChatId, { updatedAt: new Date() });

        try {
            const io = getIO();
            io.to(String(activeChatId)).emit("ai:typing", {
                chatId: String(activeChatId),
                isTyping: false,
            });
            io.to(String(activeChatId)).emit("ai:status", {
                chatId: String(activeChatId),
                status: "",
            });
        } catch (socketError) {
            console.error("Socket emit error (typing end):", socketError?.message || socketError);
        }

        res.status(201).json({
            chat,
            aiMessage,
        });
    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({
            message: "Error sending message",
            error: error.message,
        });
    }
}

export async function getChats(req, res) {
    try {
        const userId = req.user.id || req.user.userId;

        const chats = await chatModel.find({ user: userId }).sort({ updatedAt: -1 });

        res.status(200).json({
            message: "Chats retrieved successfully",
            chats,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving chats",
            error: error.message,
        });
    }
}

export async function getMessages(req, res) {
    try {
        const { chatId } = req.params;
        const userId = req.user?.id || req.user?.userId;

        if (!chatId || !mongoose.isValidObjectId(chatId)) {
            return res.status(200).json({
                message: "No messages",
                messages: [],
            });
        }

        const chat = await chatModel.findOne({
            _id: chatId,
            user: userId,
        });

        if (!chat) {
            return res.status(200).json({
                message: "Chat not found",
                messages: [],
            });
        }

        const messages = await messageModel.find({
            chat: chatId,
        }).sort({ createdAt: 1 });

        return res.status(200).json({
            message: "Messages retrieved successfully",
            messages,
        });
    } catch (error) {
        console.warn("getMessages error:", error?.message || error);
        return res.status(200).json({
            message: "Messages retrieved",
            messages: [],
        });
    }
}

export async function renameChat(req, res) {
    try {
        const { chatId } = req.params;
        const { title } = req.body;
        const userId = req.user?.id || req.user?.userId;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Chat title is required" });
        }

        if (!chatId || !mongoose.isValidObjectId(chatId)) {
            return res.status(404).json({ message: "Chat not found" });
        }

        const chat = await chatModel.findOneAndUpdate(
            { _id: chatId, user: userId },
            { title: title.trim(), updatedAt: new Date() },
            { new: true }
        );

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        return res.status(200).json({
            message: "Chat renamed successfully",
            chat,
        });
    } catch (error) {
        console.warn("renameChat error:", error?.message || error);
        return res.status(500).json({
            message: "Error renaming chat",
            error: error.message,
        });
    }
}

export async function deleteChat(req, res) {
    try {
        const { chatId } = req.params;
        const userId = req.user?.id || req.user?.userId;

        if (!chatId || !mongoose.isValidObjectId(chatId)) {
            return res.status(200).json({
                message: "Chat deleted successfully",
            });
        }

        const chat = await chatModel.findOneAndDelete({
            _id: chatId,
            user: userId,
        });

        if (!chat) {
            return res.status(200).json({
                message: "Chat already removed",
            });
        }

        await messageModel.deleteMany({
            chat: chatId,
        });

        return res.status(200).json({
            message: "Chat deleted successfully",
        });
    } catch (error) {
        console.warn("deleteChat error:", error?.message || error);
        return res.status(500).json({
            message: "Error deleting chat",
            error: error.message,
        });
    }
}