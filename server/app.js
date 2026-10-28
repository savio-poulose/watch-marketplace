import express, { json, urlencoded } from "express";
import dotenv from "dotenv";
import dbConnect from "./config/db.js";
import userRouter from "./routes/user/user.route.js"
import adminRouter from "./routes/admin/admin.route.js"
import productRouter from "./routes/admin/product.route.js"
import categoryRouter from "./routes/admin/category.route.js"
import adminUsersRouter from "./routes/admin/users.route.js"
import cookieParser from "cookie-parser";
import userProductRouter from "./routes/user/product.route.js"
import cartRouter from "./routes/user/cart.route.js"
import addressRouter from "./routes/user/address.route.js"
import orderRouter from "./routes/user/order.route.js"
import adminOrderRouter from "./routes/admin/order.route.js"
import paymentRouter from "./routes/user/payment.route.js"
import couponRouter from "./routes/admin/coupon.route.js"
import userCouponRouter from "./routes/user/coupon.route.js"
import wishlistRouter from "./routes/user/wishlist.route.js"
import walletRouter from "./routes/user/wallet.route.js"
import adminWalletRouter from "./routes/admin/adminWallet.route.js"
import salesReportRouter from "./routes/admin/salesReport.route.js"
import adminReturnRouter from "./routes/admin/return.route.js";
import adminDashboardRouter from './routes/admin/dashboard.route.js'
import userReviewRouter from "./routes/user/review.route.js";
import adminReviewRouter from "./routes/admin/review.route.js";


import cors from "cors"

dotenv.config();

const app = express();


app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.CLIENT_URL?.replace(/\/$/, ""),
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.urlencoded({extended:true}))
app.use(express.json()) 
app.use(cookieParser())


app.use("/api/user/", userRouter);


app.use("/api/admin/product", productRouter);
app.use("/api/admin/category", categoryRouter);
app.use("/api/admin/users",adminUsersRouter)
app.use("/api/admin/", adminRouter);
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/coupons",couponRouter)
app.use("/api/admin/wallets", adminWalletRouter);
app.use("/api/admin/reports/sales",salesReportRouter)
app.use("/api/admin/returns", adminReturnRouter);
app.use("/api/admin/dashboard",adminDashboardRouter)
app.use("/api/admin/reviews", adminReviewRouter);

app.use("/api/user/products",userProductRouter)
app.use("/api/user/cart",cartRouter)
app.use("/api/user/address",addressRouter)
app.use("/api/user/order",orderRouter)
app.use("/api/user/payment",paymentRouter)
app.use("/api/user/coupon", userCouponRouter);
app.use("/api/user/wishlist",wishlistRouter)
app.use("/api/user/wallet", walletRouter);
app.use("/api/user/reviews", userReviewRouter);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("SERVER ERROR:", err);
  res.status(statusCode).json({
    success: false,
    message,
  });
});



//admin@watchstore.com



const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`server running in port ${port}...`);
  dbConnect();
});
