import User from "../../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const loginAdmin = async (email, password) => {
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return null;
  }

  const admin = await User.findOne({
    email: email.trim().toLowerCase(),
    role: "admin",
  }).select("+password");

  if (!admin || typeof admin.password !== "string" || !admin.password) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    admin.password
  );

  if (!isPasswordValid) {
    return null;
  }

  const payload = {
    id: admin._id,
    email: admin.email,
    role: admin.role,
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });

  return token;
};