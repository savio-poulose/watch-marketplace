import User from "../../models/user.model.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

export const registerUser  = async (userName, email, password) => {
  const saltRounds = 10;
  
    const user = await User.findOne({ email: email });
    console.log(user);
    if (user) {
      throw new Error("user already exist ")
    } 
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = await User.create({
        userName: userName,
        email: email,
        password: hashedPassword,
      });
      
    
   return newUser
};


export const LoginUser = async (email,password) => {
  
    
    const user = await User.findOne({ email: email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return null
    }

    const payload = { id: user._id, email: user.email };

    const token = jwt.sign(payload,process.env.SECRET_KEY,{expiresIn:"1hr"})

    return token

    // console.log(user.password)
  
};