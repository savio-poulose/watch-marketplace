import User from "../../models/user.model.js";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";

import {
  registerUser,
  LoginUser,
  googleLoginUser,
  profileGet,
  ProfileUpdate,
  ProfilePhotoUpdate,
  changeUserPassword,
  forgotPasswordService,
  verifyResetOTPService,
  resetPasswordService,
} from "../../services/user/user.service.js";

export const userRegister = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    // console.log("userRegister controller req.body"+userName+email+password)
    const user = await registerUser(userName, email, password);
    console.log(user);
    res.status(201).json({
      message: "user registerd succesfully",
      user,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    //  console.log(email+password+"req.body")
    const token = await LoginUser(email, password);

    if (!token) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    } else if (token == "blocked") {
      return res.status(403).json({
        message: "Your account has been blocked by the administrator",
      });
    }

    res.status(200).json({
      message: "login succesfull",
      token,
    });

    // console.log(user.password)
  } catch (err) {
    res.status(404).json({
      message: err.message,
    });
  }
};

export const getProfile = async (req, res) => {
  // console.log(req.params)
  try {
    const user = await profileGet(req.params.id);
    // console.log(user)
    res.status(200).json({
      user: user,
    });
  } catch (err) {
    res.status(404).json({
      message: err.message,
    });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    const token = await googleLoginUser(credential);

    if (token == "blocked") {
      return res.status(403).json({
        message: "Your account has been blocked by the administrator",
      });
    }

    res.status(200).json({
      message: "Google login successful",
      token,
    });
  } catch (err) {
    console.log(err);

    res.status(401).json({
      message: err.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userName } = req.body;

    const id = req.params.id;

    const user = await ProfileUpdate(id, userName);

    res.status(201).json({
      message: "user Updated succesfully",
      user,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

export const updateProfilePhoto = async (req, res) => {
  try {
    const id = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        message: "Profile image is required",
      });
    }

    const user = await ProfilePhotoUpdate(id, req.file);

    res.status(200).json({
      message: "Profile photo updated successfully",
      user,
    });
  } catch (err) {
    console.log("PROFILE PHOTO ERROR:", err);

    res.status(400).json({
      message: err.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const userId = req.user.id;

    await changeUserPassword(userId, currentPassword, newPassword);

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    await forgotPasswordService(email);

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.log("FORGOT PASSWORD ERROR:", err);

    res.status(400).json({
      message: err.message,
    });
  }
};

export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyResetOTPService(email, otp);

    res.status(200).json(result);
  } catch (err) {
    console.log("VERIFY OTP ERROR:", err);

    res.status(400).json({
      message: err.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const result = await resetPasswordService(email, newPassword);

    res.status(200).json(result);
  } catch (err) {
    console.log("RESET PASSWORD ERROR:", err);

    res.status(400).json({
      message: err.message,
    });
  }
};
