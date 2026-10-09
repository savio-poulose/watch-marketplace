import { productsGetAll,getCollectionFilters,getActiveProductById } from "../../services/user/product.service.js"
import {getActiveVariantsByProductId} from "../../services/user/variant.service.js"
import mongoose from "mongoose";

export const getAllProducts = async (req,res)=>{
    try{

        const products = await productsGetAll()

        // console.log(products)

        res.status(200).json({
            products:products
        })
        
    }catch(err){
        res.status(404).json({
            message:err.message
        })
    }
}




export const collectionFilters = async (req, res) => {
  try {
    const filters = await getCollectionFilters();

    return res.status(200).json({
      success: true,
      filters,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await getActiveProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const variants = await getActiveVariantsByProductId(product._id);

    return res.status(200).json({
      success: true,
      product,
      variants,
    });
  } catch (error) {
    console.error("getProductDetails:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch product details",
    });
  }
};
