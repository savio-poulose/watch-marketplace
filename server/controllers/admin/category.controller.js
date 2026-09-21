
import { categoryAdd } from "../../services/admin/category.service.js";

export const addCategory = async (req,res) =>{
    try{
        const category = categoryAdd(req.body)

        res.status(201).json({
            message:"category created"
        })
    }catch(err){
        res.status(400).json({
            message:err.message
        })
    }

}