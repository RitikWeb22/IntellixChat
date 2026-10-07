import {
    initializeSocketConnection,
    joinChatRoom,
    onTypingChange,
    onAiStatus,
    onAiStream,
    onAiStreamEnd,
} from "../services/chat.socket";
import {
    sendMessage,
    getChats,
    getMessages,
    deleteChat,
    renameChat,
} from "../services/chat.api";
import {
    setChats,
    setCurrentChatId,
    setTyping,
    setAiStatus,
    appendAiStreamChunk,
    clearAiStream,
    removeChat,
    setError,
    setLoading,
    setMessagesLoading,
    createNewChat,
    updateChatTitle,
    addNewMessage,
    setChatMessages,
} from "../chat.slice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useCallback } from "react";

export const useChat = () => {
    const dispatch = useDispatch();
    const currentChatId = useSelector((state) => state.chat.currentChatId);
    const chats = useSelector((state) => state.chat.chats || {});
    const lastActiveChatIdRef = useRef(currentChatId);

    useEffect(() => {
        if (currentChatId) {
            lastActiveChatIdRef.current = currentChatId;
            joinChatRoom(currentChatId);
        }
    }, [currentChatId]);

    useEffect(() => {
        initializeSocketConnection();
        const cleanupTyping = onTypingChange(({ chatId, isTyping }) => {
            dispatch(setTyping({ chatId, isTyping }));
        });
        const cleanupStatus = onAiStatus(({ chatId, status }) => {
            dispatch(setAiStatus({ chatId, status }));
        });
        const cleanupStream = onAiStream(({ chatId, chunk }) => {
            dispatch(appendAiStreamChunk({ chatId, chunk }));
        });
        const cleanupStreamEnd = onAiStreamEnd(({ chatId }) => {
            dispatch(clearAiStream({ chatId }));
        });

        return () => {
            cleanupTyping?.();
            cleanupStatus?.();
            cleanupStream?.();
            cleanupStreamEnd?.();
        };
    }, [dispatch]);

    function normalizeRole(role) {
        if (role === "user") return "user";
        if (role === "assistant" || role === "ai" || role === "model") {
            return "assistant";
        }
        return "assistant";
    }

    const handleSendMessage = useCallback(async ({ message, chatId }) => {
        try {
            const effectiveChatId = chatId || currentChatId;
            const payload = effectiveChatId
                ? { message, chatId: effectiveChatId }
                : { message };

            if (effectiveChatId) {
                dispatch(
                    addNewMessage({
                        chatId: effectiveChatId,
                        content: message,
                        role: "user",
                    })
                );
                dispatch(setTyping({ chatId: effectiveChatId, isTyping: true }));
                dispatch(setAiStatus({ chatId: effectiveChatId, status: "Thinking..." }));
                dispatch(clearAiStream({ chatId: effectiveChatId }));
            }

            const data = await sendMessage(payload);
            const { chat, aiMessage } = data;
            const finalAiContent = String(aiMessage?.content || "");

            dispatch(
                createNewChat({
                    chatId: chat._id,
                    title: chat.title,
                })
            );
            dispatch(setCurrentChatId(chat._id));
            lastActiveChatIdRef.current = chat._id;
            joinChatRoom(chat._id);

            if (!effectiveChatId || effectiveChatId !== chat._id) {
                dispatch(
                    addNewMessage({
                        chatId: chat._id,
                        content: message,
                        role: "user",
                    })
                );
            }

            dispatch(setTyping({ chatId: chat._id, isTyping: false }));
            dispatch(setAiStatus({ chatId: chat._id, status: "" }));
            dispatch(clearAiStream({ chatId: chat._id }));

            dispatch(
                addNewMessage({
                    chatId: chat._id,
                    content: finalAiContent,
                    role: normalizeRole(aiMessage?.role),
                })
            );

            return chat._id;
        } catch (error) {
            const activeId = chatId || currentChatId;
            if (activeId) {
                dispatch(setTyping({ chatId: activeId, isTyping: false }));
                dispatch(setAiStatus({ chatId: activeId, status: "" }));
                dispatch(clearAiStream({ chatId: activeId }));
            }
            dispatch(
                setError(error.response?.data?.message || "Failed to send message")
            );
            return null;
        }
    }, [currentChatId, dispatch]);

    const handleGetChats = useCallback(async () => {
        dispatch(setLoading(true));
        try {
            const data = await getChats();
            const { chats: fetchedChats } = data;
            dispatch(
                setChats(
                    fetchedChats.reduce((acc, c) => {
                        acc[c._id] = {
                            id: c._id,
                            title: c.title,
                            messages: [],
                            lastUpdated: c.updatedAt || c.createdAt,
                        };
                        return acc;
                    }, {})
                )
            );
        } catch (error) {
            dispatch(
                setError(error.response?.data?.message || "Failed to fetch chats")
            );
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const handleOpenChat = useCallback(async (chatId) => {
        if (!chatId) return;

        if (chatId === currentChatId && Array.isArray(chats[chatId]?.messages) && chats[chatId].messages.length > 0) {
            return;
        }

        dispatch(setMessagesLoading(true));
        try {
            const data = await getMessages(chatId);
            const { messages: fetchedMessages } = data;

            const formattedMessages = fetchedMessages.map((msg) => ({
                content: msg.content,
                role: normalizeRole(msg.role),
            }));

            dispatch(
                setChatMessages({
                    chatId,
                    messages: formattedMessages,
                })
            );
            dispatch(setTyping({ chatId, isTyping: false }));
            dispatch(setCurrentChatId(chatId));
            joinChatRoom(chatId);
        } catch (error) {
            dispatch(setError(error.response?.data?.message || "Failed to load chat"));
        } finally {
            dispatch(setMessagesLoading(false));
        }
    }, [chats, currentChatId, dispatch]);

    const handleRenameChat = useCallback(async (chatId, newTitle) => {
        if (!chatId || !newTitle?.trim()) return;
        try {
            await renameChat(chatId, newTitle.trim());
            dispatch(updateChatTitle({ chatId, title: newTitle.trim() }));
        } catch (error) {
            dispatch(setError(error.response?.data?.message || "Failed to rename chat"));
        }
    }, [dispatch]);

    const handleDeleteChat = useCallback(async (chatId) => {
        if (!chatId) return;
        try {
            await deleteChat(chatId);
            dispatch(removeChat({ chatId }));
        } catch (error) {
            dispatch(
                setError(error.response?.data?.message || "Failed to delete chat")
            );
        }
    }, [dispatch]);

    return {
        initializeSocketConnection,
        handleSendMessage,
        handleGetChats,
        handleOpenChat,
        handleRenameChat,
        handleDeleteChat,
    };
};
