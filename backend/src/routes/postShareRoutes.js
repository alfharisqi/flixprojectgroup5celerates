import express from "express";
import { logPostShare } from "../controllers/postShareController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:postId", verifyToken, logPostShare);

export default router;