
import mongoose from "mongoose";
import Wishlist from "../../models/wishlist.model.js";
import Product from "../../models/product.model.js";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateObjectId = (id, label) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError(`Invalid ${label}`, 400);
  }
};

export const addToWishlistService = async (userId, productId) => {
  validateObjectId(userId, "user ID");
  validateObjectId(productId, "product ID");

  const product = await Product.findById(productId);

  if (!product) {
    throw createError("Product not found", 404);
  }

  const existingItem = await Wishlist.findOne({
    userId,
    productId,
  });

  if (existingItem) {
    throw createError("Product is already in your wishlist", 409);
  }

  try {
    return await Wishlist.create({ userId, productId });
  } catch (error) {
    // Handles simultaneous requests against the unique index.
    if (error.code === 11000) {
      throw createError("Product is already in your wishlist", 409);
    }

    throw error;
  }
};

export const removeFromWishlistService = async (userId, productId) => {
  validateObjectId(userId, "user ID");
  validateObjectId(productId, "product ID");

  const deletedItem = await Wishlist.findOneAndDelete({
    userId,
    productId,
  });

  if (!deletedItem) {
    throw createError("Product is not in your wishlist", 404);
  }

  return deletedItem;
};

export const checkWishlistService = async (userId, productId) => {
  validateObjectId(userId, "user ID");
  validateObjectId(productId, "product ID");

  const item = await Wishlist.exists({
    userId,
    productId,
  });

  return Boolean(item);
};

export const getWishlistService = async (userId) => {
  validateObjectId(userId, "user ID");

  return Wishlist.find({ userId })
    .populate("productId")
    .sort({ createdAt: -1 });
};
