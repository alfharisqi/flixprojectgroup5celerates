import express from "express";
import multer from "multer";
import {
  addCustomerServiceMessage,
  createCustomerServiceTicket,
  getCustomerServiceTicketDetail,
  getMyCustomerServiceTickets,
} from "../controllers/customerServiceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

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
  storage: multer.memoryStorage(),
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
