import express from "express";
import {
  createMovieReview,
  getMovieReviews,
  toggleLikeMovieReview,
} from "../controllers/movieReviewController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:movieId", getMovieReviews);
router.post("/:movieId", verifyToken, createMovieReview);
router.post("/likes/:reviewId", verifyToken, toggleLikeMovieReview);

export default router;
