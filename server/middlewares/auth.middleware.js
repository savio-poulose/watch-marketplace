import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
  const header = req.headers["authorization"];
  const token = header.split(" ")[1];
  // console.log(token)
  if (!token) {
    return res.status(401).json({
      error: "access denied no token provided",
    });
  }

  try {
    const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    res.status(403).json({
      error: "invalid or expired token",
    });
  }

  next();
};

export const adminAuth = async (req, res, next) => {
  const authHeader = req.header.uthorization;
  console.log(authHeader)
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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


