import express from "express";
import { askFlixChatbot } from "../controllers/chatbotController.js";

const router = express.Router();

router.post("/", askFlixChatbot);

export default router;
