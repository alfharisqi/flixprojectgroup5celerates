import express from "express";
import {
  createTvSeriesReview,
  getTvSeriesReviews,
  toggleLikeTvSeriesReview,
} from "../controllers/tvSeriesReviewController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:seriesId", getTvSeriesReviews);
router.post("/:seriesId", verifyToken, createTvSeriesReview);
router.post("/likes/:reviewId", verifyToken, toggleLikeTvSeriesReview);

export default router;
