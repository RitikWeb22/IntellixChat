import { generateResponse, generateChatTitle } from "../service/ai.service.js";
import chatModel from "../models/chat.model.js"
import messageModel from "../models/message.model.js";
import { getIO } from "../sockets/server.socket.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function streamTextChunks(io, chatId, text) {
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
                message: "Message content is required"
            });
        }

        let chat = null;

        if (chatId) {
            chat = await chatModel.findOne({
                _id: chatId,
                user: req.user.id,
            });

            if (!chat) {
                return res.status(404).json({
                    message: "Chat not found"
                });
            }
        } else {
            const title = await generateChatTitle(message);
            chat = await chatModel.create({
                user: req.user.id,
                title
            });
        }

        const activeChatId = chat._id;

        await messageModel.create({
            chat: activeChatId,
            content: message,
            role: "user"
        });

        const messages = await messageModel.find({ chat: activeChatId });

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

        const result = await generateResponse(messages, {
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
            role: "ai"
        });

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
            aiMessage
        });
    } catch (error) {
        res.status(500).json({
            message: "Error sending message",
            error: error.message
        });
    }
}

export async function getChats(req, res) {
    try {
        const user = req.user;

        const chats = await chatModel.find({ user: user.id });

        res.status(200).json({
            message: "Chats retrieved successfully",
            chats
        });
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving chats",
            error: error.message
        });
    }
}

export async function getMessages(req, res) {
    try {
        const { chatId } = req.params;

        const chat = await chatModel.findOne({
            _id: chatId,
            user: req.user.id
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found"
            });
        }

        const messages = await messageModel.find({
            chat: chatId
        });

        res.status(200).json({
            message: "Messages retrieved successfully",
            messages
        });
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving messages",
            error: error.message
        });
    }
}

export async function deleteChat(req, res) {
    try {
        const { chatId } = req.params;

        const chat = await chatModel.findOneAndDelete({
            _id: chatId,
            user: req.user.id
        });

        if (!chat) {
            return res.status(404).json({
                message: "Chat not found"
            });
        }

        await messageModel.deleteMany({
            chat: chatId
        });

        res.status(200).json({
            message: "Chat deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting chat",
            error: error.message
        });
    }
}