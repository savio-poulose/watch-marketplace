import express from "express"
import {
  addAddress,
  getUserAddresses,
  getOneAddress,
  editAddress,
  makeDefaultAddress,
  removeAddress,
} from "../../controllers/user/address.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";


const router = express.Router()

router.use(authMiddleware)

router.post("/", addAddress);
router.get("/", getUserAddresses);
router.get("/:addressId",(req,res,next)=>{
    console.log("route is workign ")
    next()
},getOneAddress);
router.put("/:addressId", editAddress);
router.patch("/:addressId/default", makeDefaultAddress);
router.delete("/:addressId", removeAddress);

export default router;
