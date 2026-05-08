import express from "express";
import { toggleLikePost } from "../controllers/postLikeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:postId", verifyToken, toggleLikePost);

export default router;