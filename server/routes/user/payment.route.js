import express from "express";

import {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
  retryPayment,
} from "../../controllers/user/payment.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-order", authMiddleware, createPaymentOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.post("/fail", authMiddleware, markPaymentFailed);
router.post("/retry/:orderId", authMiddleware, retryPayment);

export default router;