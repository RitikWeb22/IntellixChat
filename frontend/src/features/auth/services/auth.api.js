import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || ""),
    withCredentials: true,
})

// register
export async function register({ username, email, password }) {
    const response = await api.post("/api/auth/register", {
        username,
        email,
        password
    })
    return response.data;
}

// login
export async function login({ email, password }) {
    const response = await api.post("/api/auth/login", {
        email,
        password
    })
    return response.data;
}

// get-me
export async function getMe() {
    const response = await api.get("/api/auth/get-me");
    return response.data;
}

// logout
export async function logout() {
    const response = await api.post("/api/auth/logout");
    return response.data;
}

// resend verification email
export async function resendVerificationEmail({ email }) {
    const response = await api.post("/api/auth/resend-verification-email", { email });
    return response.data;
}