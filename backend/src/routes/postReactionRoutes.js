import express from "express";
import { reactToPost } from "../controllers/postReactionController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:postId", verifyToken, reactToPost);

export default router;