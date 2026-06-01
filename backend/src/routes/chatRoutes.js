import express from "express";
import {
  getConversationMessages,
  getMyConversations,
  sendMessage,
  startConversation,
} from "../controllers/chatController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/conversations", verifyToken, getMyConversations);
router.post("/conversations/:userId", verifyToken, startConversation);
router.get("/conversations/:conversationId/messages", verifyToken, getConversationMessages);
router.post("/conversations/:conversationId/messages", verifyToken, sendMessage);

export default router;
