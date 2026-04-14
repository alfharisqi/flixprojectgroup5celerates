import express from "express";
import {
  getCommentsByPost,
  createComment
} from "../controllers/commentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:postId", getCommentsByPost);
router.post("/:postId", verifyToken, createComment);

export default router;