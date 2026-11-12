import express from "express"
const router = express.Router()

import {adminLogin,getCurrentAdmin,adminLogout} from "../../controllers/admin/admin.controller.js"
import {adminAuth} from "../../middlewares/auth.middleware.js"

router.post("/login",adminLogin)
router.get(
  "/me",
  adminAuth,
  getCurrentAdmin
);
router.post("/logout",adminLogout)

export default router