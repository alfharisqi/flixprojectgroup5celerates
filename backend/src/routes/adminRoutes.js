import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  verifyToken,
  allowRoles("admin"),
  (req, res) => {
    res.json({
      message: "Selamat datang di dashboard admin",
      user: req.user
    });
  }
);

export default router;