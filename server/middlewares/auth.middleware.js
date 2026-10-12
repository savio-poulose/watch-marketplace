import jwt from "jsonwebtoken";
import User from "../models/user.model.js"; // Adjust this path to your actual User model

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const verifyToken = jwt.verify(token, process.env.SECRET_KEY);

    // Fetch the current user status from MongoDB
    const userId =
      verifyToken.id || verifyToken._id || verifyToken.userId;

    const user = await User.findById(userId).select("isBlocked");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    // Reject accounts blocked by the admin
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by the admin.",
      });
    }

    req.user = verifyToken;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    console.error("AUTH MIDDLEWARE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.adminAccessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("ADMIN AUTH ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin session",
    });
  }
};