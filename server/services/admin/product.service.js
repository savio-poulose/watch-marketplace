import Product from "../../models/product.model.js"

export const productAdd = async (data) =>{
    const product = await Product.create(data)

    return product
    
} 

export const productGetAll = async () =>{
    const product = await Product.find().populate("categoryId", "name");

    return product
}

export const productGet = async (id) =>{
    const product = await findOne({_id:id})
    return product
}


// export const productEdit = asycn (data,params) =>{


// }