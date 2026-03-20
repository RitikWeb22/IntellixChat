import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        chats: {},
        currentChatId: null,
        typingByChatId: {},
        statusByChatId: {},
        streamByChatId: {},
        isLoading: false,
        isMessagesLoading: false,
        error: null,
    },
    reducers: {
        createNewChat: (state, action) => {
            const { chatId, title } = action.payload;
            const existingChat = state.chats[chatId];
            state.chats[chatId] = {
                id: chatId,
                title: title || existingChat?.title || "New Conversation",
                messages: Array.isArray(existingChat?.messages) ? existingChat.messages : [],
                lastUpdated: new Date().toISOString(),
            };
        },

        addNewMessage: (state, action) => {
            const { chatId, content, role } = action.payload
            if (!state.chats[chatId]) {
                state.chats[chatId] = {
                    id: chatId,
                    title: "New Conversation",
                    messages: [],
                    lastUpdated: new Date().toISOString(),
                }
            }
            if (!Array.isArray(state.chats[chatId].messages)) {
                state.chats[chatId].messages = []
            }
            state.chats[chatId].messages.push({ content, role })
        },
        addMessages: (state, action) => {
            const { chatId, messages } = action.payload
            if (!state.chats[chatId]) {
                state.chats[chatId] = {
                    id: chatId,
                    title: "New Conversation",
                    messages: [],
                    lastUpdated: new Date().toISOString(),
                }
            }
            if (!Array.isArray(state.chats[chatId].messages)) {
                state.chats[chatId].messages = []
            }
            state.chats[chatId].messages.push(...messages)
        },
        setChatMessages: (state, action) => {
            const { chatId, messages } = action.payload
            if (!state.chats[chatId]) {
                state.chats[chatId] = {
                    id: chatId,
                    title: "New Conversation",
                    messages: [],
                    lastUpdated: new Date().toISOString(),
                }
            }
            state.chats[chatId].messages = Array.isArray(messages) ? messages : []
        },
        setChats: (state, action) => {
            state.chats = action.payload;
        },
        setCurrentChatId: (state, action) => {
            state.currentChatId = action.payload;
        },
        setTyping: (state, action) => {
            const { chatId, isTyping } = action.payload;
            if (!chatId) return;
            state.typingByChatId[chatId] = Boolean(isTyping);
        },
        setAiStatus: (state, action) => {
            const { chatId, status } = action.payload;
            if (!chatId) return;
            state.statusByChatId[chatId] = String(status || "");
        },
        appendAiStreamChunk: (state, action) => {
            const { chatId, chunk } = action.payload;
            if (!chatId || !chunk) return;
            state.streamByChatId[chatId] = `${state.streamByChatId[chatId] || ""}${chunk}`;
        },
        clearAiStream: (state, action) => {
            const { chatId } = action.payload;
            if (!chatId) return;
            state.streamByChatId[chatId] = "";
        },
        removeChat: (state, action) => {
            const { chatId } = action.payload;
            if (!chatId) return;
            delete state.chats[chatId];
            delete state.typingByChatId[chatId];
            delete state.statusByChatId[chatId];
            delete state.streamByChatId[chatId];
            if (state.currentChatId === chatId) {
                state.currentChatId = Object.keys(state.chats)[0] || null;
            }
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setMessagesLoading: (state, action) => {
            state.isMessagesLoading = Boolean(action.payload);
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});


export const {
    setChats,
    setCurrentChatId,
    setTyping,
    setAiStatus,
    appendAiStreamChunk,
    clearAiStream,
    removeChat,
    setLoading,
    setMessagesLoading,
    setError,
    createNewChat,
    addMessages,
    addNewMessage,
    setChatMessages,
} = chatSlice.actions;
export default chatSlice.reducer;


