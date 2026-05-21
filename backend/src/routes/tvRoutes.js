import express from "express";
import {
  discoverTvSeries,
  getOnTheAirTvSeries,
  getPopularTvSeries,
  getTopRatedTvSeries,
  getTrendingTvSeries,
  getTvGenres,
  getTvSeriesVideos,
  getTvSeriesWatchProviders,
  searchTvSeries,
} from "../controllers/tvController.js";

const router = express.Router();

router.get("/search", searchTvSeries);
router.get("/popular", getPopularTvSeries);
router.get("/top-rated", getTopRatedTvSeries);
router.get("/on-the-air", getOnTheAirTvSeries);
router.get("/trending", getTrendingTvSeries);
router.get("/genres", getTvGenres);
router.get("/discover", discoverTvSeries);
router.get("/:id/videos", getTvSeriesVideos);
router.get("/:id/watch-providers", getTvSeriesWatchProviders);

export default router;
