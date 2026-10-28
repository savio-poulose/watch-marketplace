import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  getProductReviews,
  getReviewEligibility,
  submitReview,
  deleteMyReview,
} from "../../controllers/user/review.controller.js";

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.get("/product/:productId/eligibility", authMiddleware, getReviewEligibility);
router.post("/", authMiddleware, submitReview);
router.post("/product/:productId", authMiddleware, submitReview);
router.delete("/:reviewId", authMiddleware, deleteMyReview);

export default router;
