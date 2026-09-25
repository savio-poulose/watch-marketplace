import express from "express";
const router = express.Router();
import {userRegister,userLogin,getProfile,googleLogin} from "../../controllers/user/user.controller.js"
import {authMiddleware} from "../../middlewares/auth.middleware.js";

router.post("/register",userRegister)

router.post("/login",userLogin)

router.post("/google-login",googleLogin)

router.get("/profile/:id",authMiddleware,getProfile)

export default router