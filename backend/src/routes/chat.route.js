import { Router } from "express";
import { sendMessage, getChats, getMessages, deleteChat, renameChat } from "../controllers/chat.controller.js";
import { identifyUser } from "../middlewares/auth.middleware.js";

const chatRouter = Router();

chatRouter.post("/message", identifyUser, sendMessage);
chatRouter.get("/", identifyUser, getChats);
chatRouter.get("/:chatId/messages", identifyUser, getMessages);
chatRouter.patch("/:chatId/rename", identifyUser, renameChat);
chatRouter.delete("/delete/:chatId", identifyUser, deleteChat);

export default chatRouter;