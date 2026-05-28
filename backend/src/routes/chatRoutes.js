import express from "express";
import {
  getConversations,
  getMessagesWithUser,
  sendMessageToUser,
} from "../controllers/chatController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/conversations", getConversations);
router.get("/:userId/messages", getMessagesWithUser);
router.post("/:userId/messages", sendMessageToUser);

export default router;
