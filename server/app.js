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

import cors from "cors"

const app = express();

dotenv.config()


app.use(cors(
    {
    origin: "http://localhost:5173",
    credentials: true,
  }
))
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

app.use("/api/user/products",userProductRouter)
app.use("/api/user/cart",cartRouter)
app.use("/api/user/address",addressRouter)
app.use("/api/user/order",orderRouter)
app.use("/api/user/payment",paymentRouter)
app.use("/api/user/coupon", userCouponRouter);
app.use("/api/user/wishlist",wishlistRouter)



//admin@watchstore.com



const port = process.env.PORT;

app.listen(port,()=>{
    console.log(`server running in port ${port}...`)
    dbConnect()
})
