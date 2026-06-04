import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import { getAdminDashboard, getAdminMovies } from "../controllers/adminController.js";

const router = express.Router();

router.get(
  "/dashboard",
  verifyToken,
  allowRoles("admin"),
  getAdminDashboard
);

router.get(
  "/movies",
  verifyToken,
  allowRoles("admin"),
  getAdminMovies
);

export default router;
