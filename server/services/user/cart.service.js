import mongoose from "mongoose";
import Cart from "../../models/cart.module.js";
import Variant from "../../models/variant.model.js";
import Product from "../../models/product.model.js"

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateId = (id, label = "ID") => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError(`Invalid ${label}.`, 400);
  }
};

const getPopulatedCart = async (userId) => {
  return Cart.findOne({ userId })
    .populate({
      path: "items.variantId",
      model: Variant,
    })
    .populate({
      path: "items.variantId",
      populate: {
        path: "productId",
        model: Product,
      },
    });
};

// ADD ITEM
export const addItemToCartService = async ({
  userId,
  variantId,
  quantity,
}) => {
  validateId(userId, "user ID");
  validateId(variantId, "variant ID");

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw createError(
      "Quantity must be a positive integer.",
      400
    );
  }

  const variant = await Variant.findById(variantId);

  if (!variant || !variant.isActive) {
    throw createError(
      "Product variant is unavailable.",
      404
    );
  }

  const product = await Product.findById(variant.productId);

  if (!product || !product.isActive) {
    throw createError("Product is unavailable.", 404);
  }

  if (variant.quantity < 1) {
    throw createError("This variant is out of stock.", 400);
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({
      userId,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (item) =>
      item.variantId.toString() === variantId.toString()
  );

  const newQuantity = existingItem
    ? existingItem.quantity + quantity
    : quantity;

  if (newQuantity > variant.quantity) {
    throw createError(
      `Only ${variant.quantity} item(s) are available.`,
      400
    );
  }

  if (existingItem) {
    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({
      variantId: variant._id,
      quantity,
    });
  }

  await cart.save();

  return getPopulatedCart(userId);
};

// GET CART
export const getCartService = async (userId) => {
  validateId(userId, "user ID");

  const cart = await getPopulatedCart(userId);

  if (!cart) {
    return {
      userId,
      items: [],
    };
  }

  return cart;
};

// UPDATE QUANTITY
export const updateCartItemService = async ({
  userId,
  variantId,
  quantity,
}) => {
  validateId(userId, "user ID");
  validateId(variantId, "variant ID");

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw createError(
      "Quantity must be a positive integer.",
      400
    );
  }

  const variant = await Variant.findById(variantId);

  if (!variant || !variant.isActive) {
    throw createError(
      "Product variant is unavailable.",
      404
    );
  }

  const product = await Product.findById(variant.productId);

  if (!product || !product.isActive) {
    throw createError("Product is unavailable.", 404);
  }

  if (quantity > variant.quantity) {
    throw createError(
      `Only ${variant.quantity} item(s) are available.`,
      400
    );
  }

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw createError("Cart not found.", 404);
  }

  const item = cart.items.find(
    (entry) =>
      entry.variantId.toString() === variantId.toString()
  );

  if (!item) {
    throw createError("Item not found in cart.", 404);
  }

  item.quantity = quantity;

  await cart.save();

  return getPopulatedCart(userId);
};

// REMOVE ITEM
export const removeCartItemService = async ({
  userId,
  variantId,
}) => {
  validateId(userId, "user ID");
  validateId(variantId, "variant ID");

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw createError("Cart not found.", 404);
  }

  const originalLength = cart.items.length;

  cart.items = cart.items.filter(
    (item) =>
      item.variantId.toString() !== variantId.toString()
  );

  if (cart.items.length === originalLength) {
    throw createError("Item not found in cart.", 404);
  }

  await cart.save();

  return getPopulatedCart(userId);
};