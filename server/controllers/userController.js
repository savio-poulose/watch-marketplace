
import User from "../models/User.js";
import bcrypt from "bcrypt"

export const userRegister = async (req,res)=>{
    const saltRounds = 10;
    try{
        
        const {userName,email,password} = req.body

        const user = await User.findOne({email:email})
        console.log(user)
        if(user){
            res.status(404).json({
                message:"user already exist"
            })
        }else{

            const hashedPassword = await bcrypt.hash(password, saltRounds)
        const user = await User.create({
            userName:userName,
            email:email,
            password:hashedPassword
        })
        res.status(201).json({
            message:"user created succesfully"
        })
        }

         
    }catch(err){
        res.status(400).json({
            message:err.message
        })
    }
}

export const userLogin  = async (req,res) =>{
    try{
        const {userName,password} = req.body
        const user = await User.findOne({userName:userName})

        if(user){
            const isMatch = await bcrypt.compare(password,user.password)

        if(isMatch){
            res.status(200).json({
                message:"login succesfull",
            })
            console.log("login succesfull")
        }else{
            res.status(401).json({
                message:"login failed"
            })
            console.log("login failed");
        }
        }
        else{
            res.status(404).json({
                message:"login failed"
            })
        }
        // console.log(user.password)
        

    }catch(err){
        res.status(404).json({
            message:err.message
        })
    }
}