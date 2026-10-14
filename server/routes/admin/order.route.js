
import express from "express";
import {
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
} from "../../controllers/admin/order.controller.js";

import { adminAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(adminAuth);

router.get("/", getAllOrders);
router.get("/:orderId", getAdminOrderById);
router.patch("/:orderId/status", updateOrderStatus);

export default router;
