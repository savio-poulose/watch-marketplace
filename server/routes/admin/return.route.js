import express from "express";

import {
  getAllReturnRequests,
  getReturnRequestById,
  reviewReturnRequest,
  updateReturnProcessingStatus,
} from "../../controllers/admin/return.controller.js";

// Replace this import with the middleware used in your existing admin routes.
import { adminAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", adminAuth, getAllReturnRequests);

router.get("/:returnId", adminAuth, getReturnRequestById);

router.patch("/:returnId/review", adminAuth, reviewReturnRequest);

router.patch(
  "/:returnId/status",
  adminAuth,
  updateReturnProcessingStatus
);

export default router;