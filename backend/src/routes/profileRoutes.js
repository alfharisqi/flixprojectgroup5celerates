import express from "express";
import {
  getMyProfile,
  getMyReviews,
  updateMyProfile,
} from "../controllers/profileController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", verifyToken, getMyProfile);
router.get("/me/reviews", verifyToken, getMyReviews);
router.put("/me", verifyToken, updateMyProfile);

export default router;
