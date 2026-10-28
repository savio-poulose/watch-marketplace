import express from "express";
import { adminAuth } from "../../middlewares/auth.middleware.js";
import {
  getAllReviewsAdmin,
  toggleReviewStatusAdmin,
  deleteReviewAdmin,
} from "../../controllers/admin/review.controller.js";

const router = express.Router();

router.use(adminAuth);

router.get("/", getAllReviewsAdmin);
router.patch("/:reviewId/status", toggleReviewStatusAdmin);
router.delete("/:reviewId", deleteReviewAdmin);

export default router;
