
import express from "express";

import {
  addProduct,
  getAllProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  toggleStatus,
} from "../../controllers/admin/product.conroller.js";

import { adminAuth } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/", adminAuth, upload.any(), addProduct);

router.get("/", adminAuth, getAllProduct);

router.get("/:id", adminAuth, getProduct);

router.put("/:id", adminAuth, upload.any(), updateProduct);

router.delete("/:id", adminAuth, deleteProduct);

router.patch("/status/:id", adminAuth, toggleStatus);

export default router;
