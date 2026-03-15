import { useDispatch } from 'react-redux';
import { register, login, getMe } from "../services/auth.api"
import { setUser, setLoading, setError } from "../auth.slice"


export function useAuth() {

    const dispatch = useDispatch();

    // handle register
    async function handleRegister({ username, email, password }) {
        try {
            dispatch(setLoading(true));
            const data = await register({ username, email, password });

        } catch (error) {
            dispatch(setError(error.response.data.message || "Registration failed"));
        } finally {
            dispatch(setLoading(false));
        }
    }

    // handle login
    async function handleLogin({ email, password }) {
        try {
            dispatch(setLoading(true));
            const data = await login({ email, password });
            dispatch(setUser(data.user));
        } catch (error) {
            dispatch(setError(error.response?.data?.message || "Login failed"));
        } finally {
            dispatch(setLoading(false));
        }
    }

    // handle get-me
    async function handleGetMe() {
        try {
            dispatch(setLoading(true));
            const data = await getMe();
            dispatch(setUser(data.user));
        } catch (error) {
            dispatch(setError(error.response?.data?.message || "Failed to fetch user data"));
        } finally {
            dispatch(setLoading(false));
        }
    }

    return {
        handleRegister,
        handleLogin,
        handleGetMe
    }

}