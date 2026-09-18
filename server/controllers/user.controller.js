import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { registerUser,LoginUser } from "../services/user.service.js";

export const userRegister = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    const user = await registerUser(userName,email,password)

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
   
    const token = await LoginUser(email,password)

    
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
  const name = "spiderman"
  const user = await User.findOne({userName:name})
  res.json({
    user:user
  })
}
