import { productAdd,productGetAll } from "../../services/admin/product.service.js";
import { variantAdd, variantGetAll } from "../../services/admin/variant.service.js";
import {uploadImages } from "../../services/image.service.js"

export const addProduct = async (req, res) => {
  try {
    
    const { name, brand, gender, categoryId, description, image, variants } =
      req.body;
    //   console.log(name)

    const imageUrls = await uploadImages(req.files)
    console.log(imageUrls)
    const productData = {
      name: name,
      brand: brand,
      gender: gender,
      categoryId: categoryId,
      description: description,
      images: imageUrls,
    };

    // console.log(req.files)
    const product = await productAdd(productData);

    
    const parsedVariants = JSON.parse(variants);

    const variantData = parsedVariants.map((variant)=>({
        ...variant,
        productId:product._id
    }))

    

    const variant = await variantAdd(variantData);

    res.status(201).json({
      message: "product added succesfully",
    });
  } catch (err) {
     console.log("product controller:", err);
    res.status(400).json({
      message: err.message,
    });
  }

  // console.log(req.body)
};

export const getAllProduct = async (req,res) =>{
    try{

        const products = await productGetAll()
        // console.log(products);
        const variants = await variantGetAll()
        // console.log(variants)

        const response = products.map((product)=>{
            
            const productVariants = variants.filter(
                (variant)=>{
                   return  variant.productId.toString() === product._id.toString()
                }
            )

            const prices = productVariants.map(variant => variant.price)

            // console.log(prices)

            const stock = productVariants.reduce((acc,curr)=>{
                      return acc+curr.quantity
            },0)

            

         return {
            name:product.name,
            image:product.images[0],
            category:product.categoryId.name,
            price:`${Math.min(...prices)} - ${Math.max(...prices)}`,
            stock:stock,
            isActive:product.isActive
            
        }})

        
        //response = {img,name,category,price(min-max),stock(qty),isactive}

        // console.log(response)
        res.status(200).json({
            message:"getall users succesfull",
            response
        })

    }catch(err){
        console.log(err)
        res.status(404).json({
            message:err.message
        })
    }
}
