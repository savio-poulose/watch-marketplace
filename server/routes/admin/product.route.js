import express from "express";
const router = express.Router();
import {
  addProduct,
  getAllProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  toggleStatus,
} from "../../controllers/admin/product.conroller.js";
import { adminAuth, authMiddleware } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";

router.post("/", adminAuth, upload.array("images", 3), addProduct);

router.get("/", adminAuth, getAllProduct);

router.get("/:id", adminAuth, getProduct);

router.put("/:id", adminAuth, upload.array("images", 3), updateProduct);

router.delete("/:id", adminAuth, deleteProduct);

router.patch("/status/:id",authMiddleware,toggleStatus)

export default router;
