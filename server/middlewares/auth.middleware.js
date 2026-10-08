import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
  try {

    console.log("COOKIES:", req.cookies);
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

    console.log("verifyToken:"+verifyToken)

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
  const authHeader = req.headers.authorization;
  // console.log("AUTH HEADER:", authHeader);
  if (!authHeader) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Authentication required", 
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required",
      });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      message: err.message,
    });
  }
};


