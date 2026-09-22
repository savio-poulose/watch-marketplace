import express from "express"
const router = express.Router()
import { addProduct,getAllProduct } from "../../controllers/admin/product.conroller.js"
import { adminAuth } from "../../middlewares/auth.middleware.js"
import upload from "../../middlewares/upload.middleware.js"


router.post("/",adminAuth,upload.array("images", 3),addProduct)

router.get("/",adminAuth,getAllProduct)

export default router