
import express from "express";

import {
  addItemToCart,
  getCart,
  updateCartItem,
  removeCartItem,
} from "../../controllers/user/cart.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getCart);
router.post("/", addItemToCart);
router.patch("/items/:variantId", updateCartItem);
router.delete("/items/:variantId", removeCartItem);

export default router;
