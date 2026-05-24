import express from "express";
import multer from "multer";
import path from "path";
import {
  getPosts,
  getPostById,
  createPost,
  deletePost,
} from "../controllers/postController.js";
import { optionalToken, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File harus berupa gambar JPG, PNG, atau WEBP"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

router.get("/", optionalToken, getPosts);
router.get("/:id", optionalToken, getPostById);
router.post("/", verifyToken, upload.single("image"), createPost);
router.delete("/:id", verifyToken, deletePost);

export default router;
