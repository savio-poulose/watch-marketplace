import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const userRegister = async (req, res) => {
  const saltRounds = 10;
  try {
    const { userName, email, password } = req.body;

    const user = await User.findOne({ email: email });
    console.log(user);
    if (user) {
      res.status(404).json({
        message: "user already exist",
      });
    } else {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const user = await User.create({
        userName: userName,
        email: email,
        password: hashedPassword,
      });
      res.status(201).json({
        message: "user created succesfully",
      });
    }
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName: userName });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: "Invalid username or password.",
      });
    }

    const payload = { id: user._id, email: user.email };

    const token = jwt.sign(payload,process.env.SECRET_KEY,{expiresIn:"1hr"})

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
