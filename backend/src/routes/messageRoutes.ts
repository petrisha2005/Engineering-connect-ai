import { Router } from "express";
import { blockUser, createOrGetConversation, listConversations, listMessages, reportUser, sendMessage } from "../controllers/messageController.js";
import { requireAuth } from "../middleware/auth.js";

export const messageRoutes = Router();

messageRoutes.use(requireAuth);
messageRoutes.post("/conversation/:userId", createOrGetConversation);
messageRoutes.get("/conversations", listConversations);
messageRoutes.post("/report/:userId", reportUser);
messageRoutes.post("/block/:userId", blockUser);
messageRoutes.get("/:conversationId", listMessages);
messageRoutes.post("/:conversationId", sendMessage);
