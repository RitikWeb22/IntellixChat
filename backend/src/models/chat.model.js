import mongoose from "mongoose";
import { de } from "zod/v4/locales";

const chatSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        title: {
            type: String,
            default: "New Chat",
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const chatModel = mongoose.model("chat", chatSchema);

export default chatModel;