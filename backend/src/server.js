import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import moderatorRoutes from "./routes/moderatorRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import transporter from "./config/mail.js";
import profileRoutes from "./routes/profileRoutes.js";
import postReactionRoutes from "./routes/postReactionRoutes.js";
import postLikeRoutes from "./routes/postLikeRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import pollRoutes from "./routes/pollRoutes.js";
import postInsightRoutes from "./routes/postInsightRoutes.js";
import postShareRoutes from "./routes/postShareRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import postViewRoutes from "./routes/postViewRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import tvRoutes from "./routes/tvRoutes.js";
import movieReviewRoutes from "./routes/movieReviewRoutes.js";
import tvSeriesReviewRoutes from "./routes/tvSeriesReviewRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import { initializePostViewsTable } from "./config/initPostViews.js";
import { initializePasswordResetTable } from "./config/initPasswordReset.js";
import { initializeMovieReviewsTable } from "./config/initMovieReviews.js";
import { initializeTvSeriesReviewsTable } from "./config/initTvSeriesReviews.js";
import { initializeDatabaseSchema } from "./config/initDatabase.js";
import { initializeWatchlistTable } from "./config/initWatchlist.js";

dotenv.config({ quiet: true });

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use("/api/profile", profileRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API Flix berjalan" });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/moderator", moderatorRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/post-reactions", postReactionRoutes);
app.use("/api/post-likes", postLikeRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/post-insights", postInsightRoutes);
app.use("/api/post-shares", postShareRoutes);
app.use("/api/post-views", postViewRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/tmdb", movieRoutes);
app.use("/api/tv-series", tvRoutes);
app.use("/api/tv", tvRoutes);
app.use("/api/movie-reviews", movieReviewRoutes);
app.use("/api/tv-series-reviews", tvSeriesReviewRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

transporter.verify()
  .then(() => {
    console.log("SMTP Mailtrap siap digunakan");
  })
  .catch((error) => {
    console.error("SMTP Mailtrap gagal:", error.message);
  });

const PORT = process.env.PORT || 5000;

const getErrorMessage = (error) => {
  if (error?.code === "ECONNREFUSED") {
    return `Tidak bisa konek ke PostgreSQL di ${process.env.DB_HOST}:${process.env.DB_PORT}. Pastikan service PostgreSQL berjalan dan DB_PORT sesuai port di pgAdmin.`;
  }

  if (error?.code === "28P01") {
    return `Password PostgreSQL untuk user "${process.env.DB_USER}" tidak cocok. Samakan DB_PASSWORD di backend/.env dengan password user PostgreSQL di pgAdmin.`;
  }

  if (error?.code === "3D000") {
    return `Database "${process.env.DB_NAME}" tidak ditemukan. Buat database ini di pgAdmin atau perbaiki DB_NAME di backend/.env.`;
  }

  if (error?.errors?.length) {
    return error.errors.map((item) => item.message).join("; ");
  }

  return error?.message || String(error);
};

initializeDatabaseSchema()
  .then(() => Promise.all([
    initializePostViewsTable(),
    initializePasswordResetTable(),
    initializeMovieReviewsTable(),
    initializeTvSeriesReviewsTable(),
    initializeWatchlistTable(),
  ]))
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Gagal menyiapkan tabel database:", getErrorMessage(error));
    process.exit(1);
  });
