import express from "express";
import {
  salesReportController,
  salesReportPdfController,
} from "../../controllers/admin/salesReport.controller.js";
import { adminAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/pdf", adminAuth, salesReportPdfController);
router.get("/", adminAuth, salesReportController);

export default router;
