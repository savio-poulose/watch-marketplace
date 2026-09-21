import express from "express"
const router = express.Router()

import {addCategory,getAllCategory} from "../../controllers/admin/category.controller.js"
import { adminAuth } from "../../middlewares/auth.middleware.js"

router.post("/",adminAuth,addCategory)

router.get("/",adminAuth,getAllCategory)

export default router