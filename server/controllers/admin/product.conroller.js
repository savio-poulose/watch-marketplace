import { productAdd } from "../../services/admin/product.service.js";
import { variantAdd } from "../../services/admin/variant.service.js";
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
      image: imageUrls,
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
