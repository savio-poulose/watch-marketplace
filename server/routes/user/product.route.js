import express from "express"
const router  = express.Router()
import { getAllProducts,collectionFilters,getProductDetails } from "../../controllers/user/product.controller.js"
import { authMiddleware } from "../../middlewares/auth.middleware.js"

router.get("/",getAllProducts)

router.get("/filters",collectionFilters);

router.get("/:id", (req,res,next)=>{
    console.log("product:id route is working")
    next()
},getProductDetails);

export default router