import express from "express";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  requestOrderReturn,
  getUserReturnRequests,
  downloadOrderInvoice,
} from "../../controllers/user/order.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createOrder);

router.get("/", getMyOrders);

router.get("/:orderId", getMyOrderById);

router.patch("/:orderId/cancel", cancelMyOrder);

router.post("/:orderId/return", requestOrderReturn);

router.get("/:orderId/returns", getUserReturnRequests);

router.get("/:orderId/invoice", downloadOrderInvoice);

export default router;
