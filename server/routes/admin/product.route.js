import express from "express"
const router = express.Router()
import { addProduct } from "../../controllers/admin/product.conroller.js"
import { adminAuth } from "../../middlewares/auth.middleware.js"

router.post("/",adminAuth,addProduct)

export default router