
import { categoryAdd ,getCategoryAll,categoryEdit,categoryDelete} from "../../services/admin/category.service.js";

export const addCategory = async (req,res) =>{
    try{
        const category = await categoryAdd(req.body)

        res.status(201).json({
            message:"category created"
        })
    }catch(err){
        res.status(400).json({
            message:err.message
        })
    }

}

export const getAllCategory = async(req,res)=>{
    try{
        const categories = await getCategoryAll()
        res.status(200).json({
            categories
        })
    }catch(error){
        res.status(404).json({
            message:error.message
        })
    }
}

export const editCategory = async (req,res)=>{
    try{
        
        const category = categoryEdit(req.body,req.params)
        res.status(200).json({
            message:"category updated succesfully"
        })

    }catch(err){
        res.status(404).json({
            message:err.message
        })
    }
}

export const deleteCategory = async (req,res)=>{
    try{
        const category = await categoryDelete(req.params)
    }catch(err){
        res.status(404).json({
            message:err.message
        })
    }
}