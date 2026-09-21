import Product from "../../models/product.model.js"

export const productAdd = async (data) =>{
    const product = Product.create(data)

    return product
    
} 