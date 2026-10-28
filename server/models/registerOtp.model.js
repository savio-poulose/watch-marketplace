import mongoose from "mongoose";

const registerOtpSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

registerOtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

const RegisterOtp = mongoose.model("RegisterOtp", registerOtpSchema);

export default RegisterOtp;
