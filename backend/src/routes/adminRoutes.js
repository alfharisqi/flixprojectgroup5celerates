import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import {
  createAdminMovie,
  getAdminCommunity,
  getAdminDashboard,
  getAdminMovies,
  getAdminReviews,
  getAdminUserDetail,
  getAdminUsers,
  updateAdminMovie
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

router.post(
  "/movies",
  verifyToken,
  allowRoles("admin"),
  createAdminMovie
);

router.put(
  "/movies/:id",
  verifyToken,
  allowRoles("admin"),
  updateAdminMovie
);

router.get(
  "/reviews",
  verifyToken,
  allowRoles("admin"),
  getAdminReviews
);

router.get(
  "/community",
  verifyToken,
  allowRoles("admin"),
  getAdminCommunity
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
