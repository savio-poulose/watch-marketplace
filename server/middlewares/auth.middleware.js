import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
  try {

    // console.log("COOKIES:", req.cookies);
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const verifyToken = jwt.verify(
      token,
      process.env.SECRET_KEY
    );

    // console.log("verifyToken:"+verifyToken)

    req.user = verifyToken;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
};


export const adminAuth = async (req, res, next) => {
  try {
    // console.log("ADMIN COOKIES:", req.cookies);

    const token = req.cookies.adminAccessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.SECRET_KEY
    );

    // console.log("ADMIN DECODED:", decoded);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.user = decoded;

    next();

  } catch (error) {
    console.log("ADMIN AUTH ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin session",
    });
  }
};


