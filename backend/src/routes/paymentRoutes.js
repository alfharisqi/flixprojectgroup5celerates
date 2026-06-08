import express from "express";
import multer from "multer";
import path from "path";
import { getPaymentSettings, upgradeToPremium } from "../controllers/paymentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. Konfigurasi media penyimpanan (diskStorage) Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Gambar akan disimpan di folder backend/uploads
  },
  filename: (req, file, cb) => {
    // nama unik dengan timestamp agar tidak bentrok
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 2. Filter file agar hanya menerima gambar (JPEG, PNG, WEBP)
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
    fileSize: 2 * 1024 * 1024 // Batasi ukuran file maksimal 2 MB
  }
});

router.get("/settings", getPaymentSettings);

// 3. Tambahkan middleware upload.single("payment_proof") pada rute checkout
router.post("/checkout", verifyToken, upload.single("payment_proof"), upgradeToPremium);

export default router;
