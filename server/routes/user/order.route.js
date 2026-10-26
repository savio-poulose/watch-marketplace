    
import express from "express";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  requestOrderReturn,
  getUserReturnRequests
} from "../../controllers/user/order.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createOrder);

router.get("/", getMyOrders);

router.get("/:orderId", getMyOrderById);

router.patch("/:orderId/cancel", cancelMyOrder);

router.post("/:orderId/return",requestOrderReturn);

router.get("/:orderId/returns", getUserReturnRequests);

export default router;