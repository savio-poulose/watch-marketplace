
import express from "express";
import { getAdminDashboard } from "../../controllers/admin/dashboard.controller.js";

import { adminAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", adminAuth,getAdminDashboard);

export default router;
