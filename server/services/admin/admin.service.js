import User from "../../models/user.model.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export const loginAdmin = async(email,password) =>{
    const admin = await User.findOne({email:email})

    if(!admin || !(await bcrypt.compare(password,admin.password))){
        return null
    }

    const payload = {
        id: admin._id, email: admin.email
    }

    const token = jwt.sign(payload,process.env.SECRET_KEY,{
        expiresIn:"1hr"
    })

    // console.log(token)

    return token

}