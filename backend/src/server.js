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

dotenv.config();

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

transporter.verify()
  .then(() => {
    console.log("SMTP Mailtrap siap digunakan");
  })
  .catch((error) => {
    console.error("SMTP Mailtrap gagal:", error.message);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

app.use("/api/post-reactions", postReactionRoutes);

app.use("/api/post-likes", postLikeRoutes);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/polls", pollRoutes);

app.use("/api/post-insights", postInsightRoutes);

app.use("/api/post-shares", postShareRoutes);