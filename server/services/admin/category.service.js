import Category from "../../models/category.model.js";
import User from "../../models/user.model.js";

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

export const categoryEdit = async (data,query) =>{
    //  console.log(data)
    // console.log(query.id)


    const {name,image,description} = data
    const category = await Category.updateOne({_id:query.id},{
        name:name,
        image:image,
        description:description
    })
    
    return category
}

export const categoryDelete = async (query) =>{
    const category = await Category.deleteOne({_id:query.id})
    return category
}