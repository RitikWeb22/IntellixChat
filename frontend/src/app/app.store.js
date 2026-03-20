import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/auth.slice';
import chatReducer from '../features/chat/chat.slice';
import themeReducer from './theme.slice';
export const store = configureStore({
    reducer: {
        // Add your reducers here
        auth: authReducer,
        chat: chatReducer,
        theme: themeReducer,
    },
});