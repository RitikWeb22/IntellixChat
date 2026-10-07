import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "chat",
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ["user", "ai", "assistant"],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const messageModel = mongoose.model("message", messageSchema);

export default messageModel;