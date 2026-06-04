import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import {
  getAdminDashboard,
  getAdminMovies,
  getAdminReviews,
  getAdminUserDetail,
  getAdminUsers
} from "../controllers/adminController.js";

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

router.get(
  "/reviews",
  verifyToken,
  allowRoles("admin"),
  getAdminReviews
);

router.get(
  "/users",
  verifyToken,
  allowRoles("admin"),
  getAdminUsers
);

router.get(
  "/users/:id",
  verifyToken,
  allowRoles("admin"),
  getAdminUserDetail
);

export default router;
