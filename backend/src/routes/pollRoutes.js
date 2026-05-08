import express from "express";
import { getPollByPostId, votePoll } from "../controllers/pollController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/post/:postId", getPollByPostId);
router.post("/:pollId/vote", verifyToken, votePoll);

export default router;