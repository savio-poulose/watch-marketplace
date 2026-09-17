import express from "express";
const router = express.Router();
import {userRegister,userLogin,getProfile} from "../controllers/user.controller.js"
import authMiddleware from "../middlewares/auth.middleware.js";

router.post("/register",userRegister)

router.post("/login",userLogin)

router.get("/profile",authMiddleware,getProfile)

export default router