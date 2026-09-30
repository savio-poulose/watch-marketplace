import {
  productAdd,
  productGetAll,
  productGet,
  productUpdate,
  ProductDelete,
  statusToggle
} from "../../services/admin/product.service.js";
import {
  variantAdd,
  variantGetAll,
  variantGetByProductId,
  variantDeleteByProductId
} from "../../services/admin/variant.service.js";
import { uploadImages } from "../../services/image.service.js";
import { offerAdd,offerGetByProductId,offerDelete,offerUpdate } from "../../services/admin/offer.service.js";

export const addProduct = async (req, res) => {
  try {
    const { name, brand, gender, categoryId, description, image, variants,offer } =
      req.body;
    //   console.log(name)

    const imageUrls = await uploadImages(req.files);
    console.log(imageUrls);
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

    const variantData = parsedVariants.map((variant) => ({
      ...variant,
      productId: product._id,
    }));

    const variant = await variantAdd(variantData);

    if (offer) {
      const parsedOffer = JSON.parse(offer);

      if (parsedOffer.isActive) {
        await offerAdd({
          ...parsedOffer,
          productId: product._id,
        });
      }
    }

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

export const getAllProduct = async (req, res) => {
  try {
    const products = await productGetAll();
    // console.log(products);
    const variants = await variantGetAll();
    // console.log(variants)

    const response = products.map((product) => {
      const productVariants = variants.filter((variant) => {
        return variant.productId.toString() === product._id.toString();
      });

      const prices = productVariants.map((variant) => variant.price);

      // console.log(prices)

      const stock = productVariants.reduce((acc, curr) => {
        return acc + curr.quantity;
      }, 0);

      return {
        id: product._id,
        name: product.name,
        image: product.images[0],
        category: product.categoryId?.name || "Uncategorized",
        price: `${Math.min(...prices)} - ${Math.max(...prices)}`,
        stock: stock,
        isActive: product.isActive,
      };
    });

    //response = {img,name,category,price(min-max),stock(qty),isactive}

    // console.log(response)
    res.status(200).json({
      message: "getall users succesfull",
      response,
    });
  } catch (err) {
    console.log(err);
    res.status(404).json({
      message: err.message,
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productGet(id);
    const variants = await variantGetByProductId(id);
    const offer = await offerGetByProductId(id);

    // console.log("product:"+product)
    // console.log("variants:"+variants)
    // console.log("offer:"+offer)

    res.status(200).json({
      product,
      variants,
      offer,
    });
  } catch (err) {
    console.log("get product controller:", err);

    res.status(404).json({
      message: err.message,
    });
  }
};



export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      brand,
      gender,
      categoryId,
      description,
      variants,
      offer,
      existingImages,
    } = req.body;

    // Parse JSON data from FormData
    const parsedVariants = JSON.parse(variants || "[]");
    const parsedOffer = JSON.parse(offer || "{}");
    const parsedExistingImages = JSON.parse(existingImages || "[]");

   
    let newImageUrls = [];

    if (req.files && req.files.length > 0) {
      newImageUrls = await uploadImages(req.files);
    }

    // Keep old images + add new images
    const finalImages = [
      ...parsedExistingImages,
      ...newImageUrls,
    ];

    // Update product
    await productUpdate(id, {
      name,
      brand,
      gender,
      categoryId,
      description,
      images: finalImages,
    });

    // Replace old variants
    await variantDeleteByProductId(id);

    const variantData = parsedVariants.map((variant) => ({
      ...variant,
      productId: id,
    }));

    await variantAdd(variantData);

    // Update / create / delete offer
    if (parsedOffer.isActive) {
      await offerUpdate(id, parsedOffer);
    } else {
      await offerDelete(id);
    }

    res.status(200).json({
      message: "Product updated successfully",
    });

  } catch (err) {
    console.log("Update Product Error:", err);

    res.status(400).json({
      message: err.message,
    });
  }
};



export const deleteProduct = async(req,res)=>{
  
  try{
    const {id} = req.params
    await ProductDelete(id)
    await variantDeleteByProductId(id); 
    await offerDelete(id);

    res.status(200).json({
      message:"product deleted succesfully"
    })
  }catch(err){
    res.status(404).json({
      message:err.message
    })
}


}

export const toggleStatus = async (req, res) => {
  try {
    const id = req.params.id;

    // console.log("ID:", id);

    const status = await statusToggle(id);

    res.status(200).json({
      message: "isActive toggled successfully",
      product: status,
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};