import express from "express";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";
import {
  createAdminMovie,
  getAdminCommunity,
  getAdminDashboard,
  getAdminMovies,
  getAdminPaymentSettings,
  getAdminReviews,
  getAdminTransactions,
  getAdminUserDetail,
  getAdminUsers,
  updateAdminTransactionStatus,
  updateAdminCommunityReportStatus,
  updateAdminPaymentSettings,
  updateAdminReviewReportStatus,
  updateAdminUserStatus,
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

router.patch(
  "/reviews/reports/:reportId/status",
  verifyToken,
  allowRoles("admin"),
  updateAdminReviewReportStatus
);

router.get(
  "/community",
  verifyToken,
  allowRoles("admin"),
  getAdminCommunity
);

router.get(
  "/transactions",
  verifyToken,
  allowRoles("admin"),
  getAdminTransactions
);

router.patch(
  "/transactions/:id/status",
  verifyToken,
  allowRoles("admin"),
  updateAdminTransactionStatus
);

router.get(
  "/payment-settings",
  verifyToken,
  allowRoles("admin"),
  getAdminPaymentSettings
);

router.put(
  "/payment-settings",
  verifyToken,
  allowRoles("admin"),
  updateAdminPaymentSettings
);

router.patch(
  "/community/reports/:reportId/status",
  verifyToken,
  allowRoles("admin"),
  updateAdminCommunityReportStatus
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

router.patch(
  "/users/:id/status",
  verifyToken,
  allowRoles("admin"),
  updateAdminUserStatus
);

export default router;
