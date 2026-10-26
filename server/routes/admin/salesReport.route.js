import express from "express";
import { salesReportController } from "../../controllers/admin/salesReport.controller.js";
import { adminAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", adminAuth, salesReportController);

export default router;
