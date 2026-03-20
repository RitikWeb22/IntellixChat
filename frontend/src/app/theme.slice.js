import { createSlice } from "@reduxjs/toolkit";

const readInitialTheme = () => {
    if (typeof window === "undefined") return "dark";
    const savedTheme = window.localStorage.getItem("intellix-theme");
    return savedTheme === "light" ? "light" : "dark";
};

const themeSlice = createSlice({
    name: "theme",
    initialState: {
        mode: readInitialTheme(),
    },
    reducers: {
        toggleTheme: (state) => {
            state.mode = state.mode === "dark" ? "light" : "dark";
        },
        setTheme: (state, action) => {
            state.mode = action.payload === "light" ? "light" : "dark";
        },
    },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
