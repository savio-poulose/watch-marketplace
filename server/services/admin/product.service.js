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
    const product = await Product.findOne({_id:id})
    return product
}


export const productUpdate = async (id, data) => {
  return await Product.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
};

export const ProductDelete = async(id)=>{
    
    return await Product.deleteOne({_id:id})
    
}



export const statusToggle = async (id) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new Error("Product not found");
  }

  product.isActive = !product.isActive;

  await product.save();

  return product;
};