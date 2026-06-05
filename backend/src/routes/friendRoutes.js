import express from "express";
import {
  acceptFriendRequest,
  addFriend,
  declineFriendRequest,
  getMyFriendIds,
  getMyFriends,
  getPendingFriendRequests,
  removeFriend,
  searchUsersForFriend,
} from "../controllers/friendController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getMyFriends);
router.get("/ids", verifyToken, getMyFriendIds);
router.get("/requests", verifyToken, getPendingFriendRequests);
router.get("/search", verifyToken, searchUsersForFriend);
router.put("/requests/:friendId/accept", verifyToken, acceptFriendRequest);
router.delete("/requests/:friendId/decline", verifyToken, declineFriendRequest);
router.post("/:userId", verifyToken, addFriend);
router.delete("/:userId", verifyToken, removeFriend);

export default router;
