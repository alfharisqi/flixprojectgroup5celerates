import express from "express";
import multer from "multer";
import path from "path";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
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
    fileSize: 2 * 1024 * 1024
  }
});

router.post("/editor-image", verifyToken, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Gambar tidak ditemukan"
      });
    }

    return res.json({
      message: "Upload berhasil",
      imageUrl: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal upload gambar editor",
      error: error.message
    });
  }
});

router.post("/profile-image", verifyToken, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Gambar tidak ditemukan"
      });
    }

    return res.json({
      message: "Upload profile berhasil",
      imageUrl: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal upload gambar profile",
      error: error.message
    });
  }
});

export default router;
