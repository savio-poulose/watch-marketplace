import User from "../../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {uploadToCloudinary} from "../../config/cloudinary.js"
import PasswordReset from "../../models/passwordReset.model.js";
import RegisterOtp from "../../models/registerOtp.model.js";
import { sendOTPEmail, sendRegisterOTPEmail } from "../../utils/sendEmail.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const initiateRegisterService = async (userName, email, password) => {
  if (!userName || !email || !password) {
    throw new Error("All fields are required");
  }

  const trimmedName = userName.trim();
  const trimmedEmail = email.toLowerCase().trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error("Invalid email address format");
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new Error(
      "Password must be at least 8 characters and contain uppercase, lowercase, number and special character."
    );
  }

  const existingUser = await User.findOne({ email: trimmedEmail });
  if (existingUser) {
    throw new Error("User already exists with this email address");
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = await bcrypt.hash(otp, saltRounds);
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  // Upsert pending registration record for this email
  await RegisterOtp.findOneAndUpdate(
    { email: trimmedEmail },
    {
      userName: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      otp: hashedOTP,
      otpExpiry,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`[REGISTER OTP] Generated OTP for ${trimmedEmail}: ${otp}`);

  try {
    await sendRegisterOTPEmail(trimmedEmail, otp);
  } catch (emailErr) {
    console.error("Failed to send verification email:", emailErr);
    throw new Error("Failed to send verification email. Please check your email or try again later.");
  }

  return {
    email: trimmedEmail,
    message: "OTP sent successfully to your email",
  };
};

export const verifyRegisterOTPService = async (email, otp) => {
  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  const trimmedEmail = email.toLowerCase().trim();
  const trimmedOTP = otp.toString().trim();

  const existingUser = await User.findOne({ email: trimmedEmail });
  if (existingUser) {
    throw new Error("User already exists with this email address");
  }

  const pending = await RegisterOtp.findOne({ email: trimmedEmail });
  if (!pending) {
    throw new Error("Verification session not found or expired. Please register again.");
  }

  if (pending.otpExpiry < new Date()) {
    await RegisterOtp.deleteOne({ _id: pending._id });
    throw new Error("OTP has expired. Please request a new code.");
  }

  const isOTPValid = await bcrypt.compare(trimmedOTP, pending.otp);
  if (!isOTPValid) {
    throw new Error("Invalid verification code. Please check and try again.");
  }

  const newUser = await User.create({
    userName: pending.userName,
    email: pending.email,
    password: pending.password,
  });

  await RegisterOtp.deleteOne({ _id: pending._id });

  return {
    user: newUser,
    message: "Registration successful!",
  };
};

export const resendRegisterOTPService = async (email) => {
  if (!email) {
    throw new Error("Email is required");
  }

  const trimmedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: trimmedEmail });
  if (existingUser) {
    throw new Error("User is already registered. Please sign in.");
  }

  const pending = await RegisterOtp.findOne({ email: trimmedEmail });
  if (!pending) {
    throw new Error("No pending registration found for this email. Please register again.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOTP = await bcrypt.hash(otp, 10);
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  pending.otp = hashedOTP;
  pending.otpExpiry = otpExpiry;
  await pending.save();

  console.log(`[REGISTER OTP RESEND] New OTP for ${trimmedEmail}: ${otp}`);

  try {
    await sendRegisterOTPEmail(trimmedEmail, otp);
  } catch (emailErr) {
    console.error("Failed to resend verification email:", emailErr);
    throw new Error("Failed to send verification email. Please try again later.");
  }

  return {
    email: trimmedEmail,
    message: "New verification code sent successfully",
  };
};

export const registerUser = initiateRegisterService;

export const LoginUser = async (email, password) => {
  const user = await User.findOne({ email: email });

  

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return null;
  }

  if (user.isBlocked) {
  return "blocked"
}

  const payload = { id: user._id, email: user.email };

  const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "1d" });

  return token;

  // console.log(user.password)
};

export const googleLoginUser = async (credential) => {

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const email = payload.email;
  const userName = payload.name;
  const googleId = payload.sub;

  let user = await User.findOne({ email });

  if (user && user.isBlocked) {
  return "blocked"
}

  if (!user) {
    user = await User.create({
      userName,
      email,
      googleId,
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.SECRET_KEY,
    {
      expiresIn: "1hr",
    }
  );

  return token;
};





export const profileGet = async (id) => {
  const user = await User.findById(id).select("-password");

  return user;
};



export const ProfileUpdate = async (id,userName)=>{

  if (!userName || !userName.trim()) {
      throw new Error("Username is required");
    }

  const userr = await User.findOne({_id:id})

  if(userr.isBlocked){
    throw new Error("Your account has been blocked by the administrator")
  }

  await User.updateOne({_id:id},{$set:{userName:userName}})

  const user = await User.findOne({_id:id})
  
    if (!user) {
    throw new Error("User not found");
  }

  return user

}




export const ProfilePhotoUpdate = async (id, file) => {
  if (!file) {
    throw new Error("Profile image is required");
  }

  const result = await uploadToCloudinary(file.buffer);

  const imageUrl = result.secure_url;
  await User.updateOne(
    { _id: id },
    {
      $set: {
        profileImage: imageUrl,
      },
    }
  );

  const user = await User.findOne({ _id: id }).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};





export const changeUserPassword = async (
  userId,
  currentPassword,
  newPassword
) => {

  if (!currentPassword || !newPassword) {
    throw new Error("All password fields are required");
  }

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.password) {
    throw new Error(
      "Password change is not available for this account"
    );
  }

  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    10
  );

  user.password = hashedPassword;

  await user.save();
};



//reset password 
export const forgotPasswordService = async (email) => {
  if (!email) {
    throw new Error("Email is required");
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user) {
    throw new Error("No account found with this email");
  }

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const hashedOTP = await bcrypt.hash(otp, 10);

  const otpExpiry = new Date(
    Date.now() + 5 * 60 * 1000
  );

  await PasswordReset.deleteMany({
    userId: user._id,
  });

  await PasswordReset.create({
    userId: user._id,
    email: user.email,
    otp: hashedOTP,
    otpExpiry,
  });

  await sendOTPEmail(user.email, otp);

  return {
    message: "OTP sent successfully",
  };
};


export const verifyResetOTPService = async (email, otp) => {
  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const resetData = await PasswordReset.findOne({
    userId: user._id,
  });

  if (!resetData) {
    throw new Error("OTP not found or expired");
  }

  if (resetData.otpExpiry < new Date()) {
    await PasswordReset.deleteOne({
      _id: resetData._id,
    });

    throw new Error("OTP has expired");
  }

  const isOTPValid = await bcrypt.compare(
    otp,
    resetData.otp
  );

  if (!isOTPValid) {
    throw new Error("Invalid OTP");
  }

  return {
    message: "OTP verified successfully",
  };
};


export const resetPasswordService = async (
  email,
  newPassword
) => {
  if (!email || !newPassword) {
    throw new Error("Email and new password are required");
  }

  if (newPassword.length < 8) {
    throw new Error(
      "Password must be at least 8 characters"
    );
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const resetData = await PasswordReset.findOne({
    userId: user._id,
  });

  if (!resetData) {
    throw new Error("Password reset session not found");
  }

  if (resetData.otpExpiry < new Date()) {
    await PasswordReset.deleteOne({
      _id: resetData._id,
    });

    throw new Error("Password reset session has expired");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    10
  );

  user.password = hashedPassword;

  await user.save();

  // OTP must not be reusable
  await PasswordReset.deleteOne({
    _id: resetData._id,
  });

  return {
    message: "Password reset successfully",
  };
};