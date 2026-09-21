import express, { json, urlencoded } from "express";
import dotenv from "dotenv";
import dbConnect from "./config/db.js";
import userRouter from "./routes/user/user.route.js"
import adminRouter from "./routes/admin/admin.route.js"

import cors from "cors"

const app = express();

dotenv.config()

app.use(cors())
app.use(express.urlencoded({extended:true}))
app.use(express.json()) 


app.use("/api/user/",userRouter)
app.use("/api/admin/",adminRouter) 
//admin@watchstore.com



const port = process.env.PORT;

app.listen(port,()=>{
    console.log(`server running in port ${port}...`)
    dbConnect()
})
