import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"Oceanus Watches" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset OTP",
    text: `Your password reset OTP is ${otp}. This OTP will expire in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Password Reset</h2>

        <p>You requested to reset your password.</p>

        <p>Your OTP is:</p>

        <h1 style="letter-spacing: 5px;">
          ${otp}
        </h1>

        <p>This OTP will expire in 5 minutes.</p>

        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
};

export const sendRegisterOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"Oceanus  Watches" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - Oceanus Watches Registration",
    text: `Your registration verification code is ${otp}. This OTP will expire in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #111827; text-align: center; margin-bottom: 6px; font-weight: 700; letter-spacing: 1px;">LUXURY WATCHES</h2>
        <p style="color: #6b7280; text-align: center; font-size: 14px; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">Account Verification</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #374151; font-size: 15px; margin-bottom: 12px;">Welcome to Luxury Watches,</p>
        <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Please use the one-time verification code below to verify your email address and activate your account:</p>
        <div style="background-color: #f9fafb; padding: 18px; border-radius: 6px; text-align: center; margin: 24px 0; border: 1px dashed #d1d5db;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">This code will expire in <strong>5 minutes</strong>. For security reasons, do not share this code with anyone.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">If you did not initiate this request, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">&copy; ${new Date().getFullYear()} Luxury Watches. All rights reserved.</p>
      </div>
    `,
  });
};