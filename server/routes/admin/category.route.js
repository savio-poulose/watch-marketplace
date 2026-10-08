import express from "express";
import upload from "../../middlewares/upload.middleware.js";

const router = express.Router();

import {
  addCategory,
  getAllCategory,
  editCategory,
  deleteCategory,
} from "../../controllers/admin/category.controller.js";

import { adminAuth } from "../../middlewares/auth.middleware.js";

router.post(
  "/",
  adminAuth,
  upload.single("image"),
  addCategory
);

router.get(
  "/",
  adminAuth,
  getAllCategory
);

router.put(
  "/:id",
  adminAuth,
  upload.single("image"),
  editCategory
);

router.delete(
  "/:id",
  adminAuth,
  deleteCategory
);

export default router;