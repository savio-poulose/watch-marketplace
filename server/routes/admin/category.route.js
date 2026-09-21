import express from "express"
const router = express.Router()

import {addCategory} from "../../controllers/admin/category.controller.js"
import { adminAuth } from "../../middlewares/auth.middleware.js"

router.post("/",addCategory)

export default router