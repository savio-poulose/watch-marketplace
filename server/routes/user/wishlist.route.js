
import express from "express";
import {
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  getWishlist,
} from "../../controllers/user/wishlist.controller.js";
import {authMiddleware} from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getWishlist);
router.post("/", authMiddleware, addToWishlist);
router.get("/:productId/status", authMiddleware, checkWishlist);
router.delete("/:productId", authMiddleware, removeFromWishlist);

export default router;
