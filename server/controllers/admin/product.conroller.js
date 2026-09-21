import { productAdd } from "../../services/admin/product.service.js"

export const addProduct = async (req,res)=>{
    try{
        

        const product = await productAdd(req.body)

        res.status(201).json({ 
            message:"product added"
        })
    }catch(err){
        res.status(400).json({
            message:err.message
        })
    }
}