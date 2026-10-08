import Category from "../../models/category.model.js";
import User from "../../models/user.model.js";
import { uploadToCloudinary } from "../../config/cloudinary.js";


export const categoryAdd = async (data, file) => {
  if (!file) {
    throw new Error("Category image is required");
  }

  const result = await uploadToCloudinary(
    file.buffer,
    "watchstore/categories"
  );

  const category = await Category.create({
    name: data.name,
    description: data.description,
    image: result.secure_url,
  });

  return category;
};

export const getCategoryAll = async ()=>{
    const categories = await Category.find({})
    // console.log(categories)

    return categories
} 

// getAllCategory()

export const categoryEdit = async (data,params) =>{
    //  console.log(data)
    // console.log(query.id)


    const {name,image,description} = data
    const category = await Category.updateOne({_id:params.id},{
        name:name,
        image:image,
        description:description
    })
    
    return category
}

export const categoryDelete = async (params) =>{
    const category = await Category.deleteOne({_id:params.id})
    
    return category
}