import express from "express"
const router = express.Router()

import {addCategory,getAllCategory,editCategory,deleteCategory} from "../../controllers/admin/category.controller.js"
import { adminAuth } from "../../middlewares/auth.middleware.js"

router.post("/",adminAuth,addCategory)

router.get("/",adminAuth,getAllCategory)

router.put("/:id",adminAuth,editCategory)

router.delete("/:id",adminAuth,deleteCategory)

export default router