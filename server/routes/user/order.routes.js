
import express from "express";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
} from "../../controllers/user/order.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createOrder);
router.get("/", getMyOrders);
router.get("/:orderId", getMyOrderById);
router.patch("/:orderId/cancel", cancelMyOrder);

export default router;
