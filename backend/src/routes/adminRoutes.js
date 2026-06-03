import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import { getAdminDashboard } from "../controllers/adminController.js";

const router = express.Router();

router.get(
  "/dashboard",
  verifyToken,
  allowRoles("admin"),
  getAdminDashboard
);

export default router;
