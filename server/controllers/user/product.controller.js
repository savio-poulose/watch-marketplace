
import mongoose from "mongoose";

import {
  productsGetAll,
  getCollectionFilters,
  getActiveProductById,
} from "../../services/user/product.service.js";

import {
  getActiveVariantsByProductId,
} from "../../services/user/variant.service.js";

import {
  getActiveOfferByProductId,
} from "../../services/user/offer.service.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await productsGetAll();

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (err) {
    console.error("getAllProducts:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch products",
    });
  }
};

export const collectionFilters = async (req, res) => {
  try {
    const filters = await getCollectionFilters();

    return res.status(200).json({
      success: true,
      filters,
    });
  } catch (error) {
    console.error("collectionFilters:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch collection filters",
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

    const [variants, offer] = await Promise.all([
      getActiveVariantsByProductId(product._id),
      getActiveOfferByProductId(product._id),
    ]);

    return res.status(200).json({
      success: true,
      product,
      variants,
      offer,
    });
  } catch (error) {
    console.error("getProductDetails:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch product details",
    });
  }
};
