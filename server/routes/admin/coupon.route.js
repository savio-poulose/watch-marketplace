
import express from "express";
import { adminAuth } from "../../middlewares/auth.middleware.js";

import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  editCoupon,
  updateCouponStatus,
  deleteCoupon,
} from "../../controllers/admin/coupon.controller.js";

const router = express.Router();

router.use(adminAuth);

router.get("/", getAllCoupons);
router.get("/:id", getCouponById);
router.post("/", createCoupon);
router.patch("/:id", editCoupon);
router.patch("/:id/status", updateCouponStatus);
router.delete("/:id", deleteCoupon);

export default router;
