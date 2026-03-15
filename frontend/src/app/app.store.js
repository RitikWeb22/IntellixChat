import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/auth.slice';
export const store = configureStore({
    reducer: {
        // Add your reducers here
        auth: authReducer,
    },
});