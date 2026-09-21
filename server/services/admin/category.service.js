import Category from "../../models/category.model.js";

export const categoryAdd = async (data) =>{
    const category = await Category.create(data)

    return category
}

export const getCategoryAll = async ()=>{
    const categories = await Category.find({})
    // console.log(categories)

    return categories
} 

// getAllCategory()