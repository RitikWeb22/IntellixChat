import { useDispatch } from "react-redux";
import { useCallback } from "react";
import { register, login, getMe } from "../services/auth.api";
import { setUser, setLoading, setError } from "../auth.slice";

export function useAuth() {
    const dispatch = useDispatch();

    // handle register
    const handleRegister = useCallback(async ({ username, email, password }) => {
        dispatch(setLoading(true));
        dispatch(setError(null));
        try {
            await register({ username, email, password });
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Registration failed";
            dispatch(setError(message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    // handle login
    const handleLogin = useCallback(async ({ email, password }) => {
        dispatch(setLoading(true));
        dispatch(setError(null));
        try {
            const data = await login({ email, password });
            dispatch(setUser(data.user));
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Login failed";
            dispatch(setError(message));
            throw error;
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    // handle get-me
    const handleGetMe = useCallback(async () => {
        try {
            dispatch(setLoading(true));
            const data = await getMe();
            dispatch(setUser(data.user));
        } catch (error) {
            dispatch(setError(error.response?.data?.message || error.message || "Failed to fetch user data"));
        } finally {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    return {
        handleRegister,
        handleLogin,
        handleGetMe,
    };
}