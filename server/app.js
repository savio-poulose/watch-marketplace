import express, { json, urlencoded } from "express";
import dotenv from "dotenv";
import dbConnect from "./config/db.js";
import userRouter from "./routes/user.route.js"
const app = express();

dotenv.config()

app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.use("/api/user/",userRouter)




const port = process.env.PORT;

app.listen(port,()=>{
    console.log(`server running in port ${port}...`)
    dbConnect()
})
