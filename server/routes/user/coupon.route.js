import express from "express";
import { applyCoupon } from "../../controllers/user/coupon.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/apply", authMiddleware ,applyCoupon);

export default router;
