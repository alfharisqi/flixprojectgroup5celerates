import express from "express";
import { upgradeToPremium } from "../controllers/paymentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rute ini dilindungi middleware verifyToken agar hanya user yang sudah login yang bisa bayar
router.post("/checkout", verifyToken, upgradeToPremium);

export default router;
