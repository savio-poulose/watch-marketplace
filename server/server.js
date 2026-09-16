import express from "express";
import dotenv from "dotenv";
import dbConnect from "./config/db.js";

dotenv.config()

const app = express();

const port = process.env.PORT;

app.listen(port,()=>{
    console.log(`server running in port ${port}...`)
    dbConnect()
})
