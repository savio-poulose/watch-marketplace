import express from "express";

import {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed
} from "../../controllers/user/payment.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-order", authMiddleware, createPaymentOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.post("/fail", authMiddleware,markPaymentFailed)

export default router;