import express from "express";
import multer from "multer";
import path from "path";
import {
  addCustomerServiceMessage,
  createCustomerServiceTicket,
  getCustomerServiceTicketDetail,
  getMyCustomerServiceTickets,
} from "../controllers/customerServiceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

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

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("File harus berupa gambar, PDF, DOC, atau DOCX"), false);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 4,
  },
});

router.get("/tickets", verifyToken, getMyCustomerServiceTickets);
router.post("/tickets", verifyToken, upload.array("attachments", 4), createCustomerServiceTicket);
router.get("/tickets/:id", verifyToken, getCustomerServiceTicketDetail);
router.post("/tickets/:id/messages", verifyToken, upload.array("attachments", 4), addCustomerServiceMessage);

export default router;
