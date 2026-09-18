import jwt from "jsonwebtoken"

const authMiddleware = async (req,res,next) =>{
    const header = req.headers["authorization"]
    const token = header.split(" ")[1] 
    // console.log(token)
    if(!token){
        return res.status(401).json({
            error:"access denied no token provided"
        })
    }

    try{
        const verifyToken = jwt.verify(token,process.env.SECRET_KEY)
    }catch(err){
        res.status(403).json({
            error:"invalid or expired token"
        })
    }

    next()
}

export default authMiddleware;