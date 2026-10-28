import User from "../../models/user.model.js";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";

import {
  registerUser,
  initiateRegisterService,
  verifyRegisterOTPService,
  resendRegisterOTPService,
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
    const result = await initiateRegisterService(userName, email, password);
    res.status(200).json({
      success: true,
      message: result.message || "OTP sent to your email. Please verify to complete registration.",
      email: result.email,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const verifyRegisterOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyRegisterOTPService(email, otp);
    res.status(201).json({
      success: true,
      message: result.message || "User registered successfully",
      user: result.user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const resendRegisterOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await resendRegisterOTPService(email);
    res.status(200).json({
      success: true,
      message: result.message || "New OTP sent successfully",
      email: result.email,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
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

    // res.status(200).json({
    //   message: "login succesfull",
    //   token,
    // });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
    });

    // console.log(user.password)
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await profileGet(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    // console.log("GET PROFILE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load profile",
    });
  }
};


export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    const token = await googleLoginUser(credential);

    if (token === "blocked") {
      return res.status(403).json({
        message: "Your account has been blocked by the administrator",
      });
    }

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Google login successful",
    });
  } catch (err) {
    console.log(err);

    return res.status(401).json({
      success: false,
      message: "Google authentication failed",
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


export const getCurrentUser = async(req,res)=>{
   return res.status(200).json({
    success: true,
    user: req.user,
  });
}


export const logoutUser = (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};