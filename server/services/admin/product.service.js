import Product from "../../models/product.model.js"

export const productAdd = async (data) =>{
    const product = await Product.create(data)

    return product
    
} 