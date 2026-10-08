import express from "express";
const router = express.Router();
import {
  userRegister,
  userLogin,
  getProfile,
  googleLogin,
  updateProfile,
  updateProfilePhoto,
  changePassword,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  getCurrentUser,
  logoutUser
} from "../../controllers/user/user.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";

router.post("/register", userRegister);

router.post("/login", userLogin);

router.post("/google-login", googleLogin);

// router.get("/profile/:id", authMiddleware, getProfile);
router.get(
  "/profile",
  authMiddleware,
  getProfile
);

router.put("/profile/:id", authMiddleware, updateProfile);

router.put(
  "/profile/:id/photo",
  authMiddleware,
  upload.single("profileImage"),
  updateProfilePhoto,
);

router.put("/change-password", authMiddleware, changePassword);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.put("/reset-password",resetPassword);

router.get("/me", authMiddleware, getCurrentUser);
router.get("/logout",logoutUser)

export default router;
