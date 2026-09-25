import User from "../../models/user.model.js";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";

import { registerUser,LoginUser,googleLoginUser, profileGet } from "../../services/user/user.service.js";

export const userRegister = async (req, res) => {
  try {
    
    const { userName, email, password } = req.body;
    // console.log("userRegister controller req.body"+userName+email+password)
    const user = await registerUser(userName,email,password)
    console.log(user)
    res.status(201).json({
      message:"user registerd succesfully",
      user
    })
    
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    
    const { email, password } = req.body;
  //  console.log(email+password+"req.body")
    const token = await LoginUser(email,password)

    if (!token) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
    
    res.status(200).json({
      message: "login succesfull",
      token
    });

    // console.log(user.password)
  } catch (err) {
    res.status(404).json({
      message: err.message,
    });
  }
};


export const getProfile= async (req,res) =>{
  // console.log(req.params)
  try{
    const user = await profileGet(req.params.id)
    // console.log(user)
    res.status(200).json({
      user:user
    })
  }catch(err){
    res.status(404).json({
      message:err.message
    })
  }


}


export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    const token = await googleLoginUser(credential);

    res.status(200).json({
      message: "Google login successful",
      token
    });

  } catch (err) {
    console.log(err);

    res.status(401).json({
      message: err.message
    });
  }
};