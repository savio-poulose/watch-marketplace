
import { categoryAdd ,getCategoryAll,categoryEdit,categoryDelete} from "../../services/admin/category.service.js";


export const addCategory = async (req, res) => {
  try {
    const category = await categoryAdd(
      req.body,
      req.file
    );

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (err) {
    console.log("ADD CATEGORY ERROR:", err);

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

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

export const editCategory = async (req, res) => {
  try {
    await categoryEdit(
      req.body,
      req.params,
      req.file
    );

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (err) {
    console.log("EDIT CATEGORY ERROR:", err);

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const deleteCategory = async (req,res)=>{
    try{
        // console.log(req.params)
        const category = await categoryDelete(req.params)
        res.status(200).json({
            message:"succesfully deleted"
        })
    }catch(err){
        res.status(404).json({
            message:err.message
        })
    }
}