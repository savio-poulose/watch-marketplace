import express from "express"
const router = express.Router()

import {adminLogin,getCurrentAdmin} from "../../controllers/admin/admin.controller.js"
import {adminAuth} from "../../middlewares/auth.middleware.js"

router.post("/login",adminLogin)
router.get(
  "/me",
  adminAuth,
  getCurrentAdmin
);

export default router