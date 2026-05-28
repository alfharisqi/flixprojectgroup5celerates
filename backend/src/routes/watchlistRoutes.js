import express from "express";
import {
  addToWatchlist,
  getWatchlist,
  getWatchlistItemStatus,
  removeFromWatchlist,
  updateWatchlistStatus,
} from "../controllers/watchlistController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getWatchlist);
router.get("/status/:mediaType/:tmdbId", getWatchlistItemStatus);
router.post("/", addToWatchlist);
router.patch("/:id", updateWatchlistStatus);
router.delete("/:id", removeFromWatchlist);

export default router;
