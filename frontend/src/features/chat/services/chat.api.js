import axios from "axios";

const getApiBaseUrl = () => {
    if (import.meta.env.DEV) return "";
    return import.meta.env.VITE_API_URL || "https://intellix-chat-bacend.vercel.app";
};

const api = axios.create({
    baseURL: getApiBaseUrl(),
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("intellix_token") : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const sendMessage = async ({ message, chatId }) => {
    const response = await api.post("/api/chats/message", { message, chatId });
    return response.data;
};

export const getChats = async () => {
    const response = await api.get("/api/chats");
    return response.data;
};

export const getMessages = async (chatId) => {
    const response = await api.get(`/api/chats/${chatId}/messages`);
    return response.data;
};

export const renameChat = async (chatId, title) => {
    const response = await api.patch(`/api/chats/${chatId}/rename`, { title });
    return response.data;
};

export const deleteChat = async (chatId) => {
    const response = await api.delete(`/api/chats/delete/${chatId}`);
    return response.data;
};