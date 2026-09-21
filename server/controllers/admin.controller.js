import {loginAdmin} from "../services/admin.service.js"

export const adminLogin = async(req,res)=>{
    
    try{
        const {email,password} = req.body
    console.log(email+password+"req.body")

    const token = await loginAdmin(email,password)
    
    if(!token){
        res.status(401).json({
            message:"invalid email or password"
        })
    }

    res.status(200).json({
        message:"login succesfull"
    })
    console.log("login succesfull")

    }catch(error){
        res.status(404).json({
            message:error.message
        })
    }

}