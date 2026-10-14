
import mongoose from "mongoose";

import Cart from "../../models/cart.module.js";
import Variant from "../../models/variant.model.js";
import Product from "../../models/product.model.js";
import Offer from "../../models/offer.model.js";

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

// --------------------------------------------------
// Calculate the current offer price for each cart item
// --------------------------------------------------


const getPopulatedCart = async (userId) => {
  const cart = await Cart.findOne({ userId }).populate({
    path: "items.variantId",
    model: Variant,
    populate: {
      path: "productId",
      model: Product,
    },
  });

  if (!cart) return null;

  const cartData = cart.toObject();
  const now = new Date();

  const getId = (value) => {
    if (!value) return null;

    if (typeof value === "object" && value._id) {
      return value._id.toString();
    }

    return value.toString();
  };

  const products = cartData.items
    .map((item) => item.variantId?.productId)
    .filter(Boolean);

  const productIds = [
    ...new Set(products.map((product) => getId(product._id))),
  ];

  const categoryIds = [
    ...new Set(
      products
        .map((product) => getId(product.categoryId))
        .filter(Boolean)
    ),
  ];

  // Fetch both product and category offers.
  const offerConditions = [];

  if (productIds.length) {
    offerConditions.push({
      productId: { $in: productIds },
    });
  }

  if (categoryIds.length) {
    offerConditions.push({
      categoryId: { $in: categoryIds },
    });
  }

  const offers = offerConditions.length
    ? await Offer.find({
        $or: offerConditions,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gt: now },
      }).lean()
    : [];

  const items = cartData.items.map((item) => {
    const variant = item.variantId;
    const product = variant?.productId;

    const originalPrice = Math.max(
      0,
      Number(variant?.price ?? 0)
    );

    const productId = getId(product?._id);
    const categoryId = getId(product?.categoryId);

    // Find the highest valid product/category discount.
    const applicableOffers = offers.filter((offer) => {
      const matchesProduct =
        productId && getId(offer.productId) === productId;

      const matchesCategory =
        categoryId && getId(offer.categoryId) === categoryId;

      return matchesProduct || matchesCategory;
    });

    const getDiscount = (offer) => {
      const value = Number(offer.discountValue);

      if (!Number.isFinite(value) || value <= 0) return 0;

      const type = String(offer.discountType).toLowerCase();

      let discount = 0;

      if (type === "percentage") {
        if (value > 100) return 0;
        discount = (originalPrice * value) / 100;
      } else if (type === "fixed") {
        discount = value;
      }

      return Math.min(originalPrice, Math.max(0, discount));
    };

    let winningOffer = null;
    let winningDiscount = 0;

    for (const offer of applicableOffers) {
      const discount = getDiscount(offer);

      if (discount > winningDiscount) {
        winningDiscount = discount;
        winningOffer = offer;
      }
    }

    const discountedPrice = Number(
      (originalPrice - winningDiscount).toFixed(2)
    );

    const offerSavings = Number(
      (originalPrice - discountedPrice).toFixed(2)
    );

    return {
      ...item,

      originalPrice,
      discountedPrice,
      price: discountedPrice,
      offerSavings,

      offer: winningOffer
        ? {
            _id: winningOffer._id,
            name: winningOffer.name,
            discountType: winningOffer.discountType,
            discountValue: winningOffer.discountValue,
            offerFor: getId(winningOffer.productId)
              ? "PRODUCT"
              : "CATEGORY",
            startDate: winningOffer.startDate,
            endDate: winningOffer.endDate,
          }
        : null,
    };
  });

  const subtotal = Number(
    items
      .reduce(
        (total, item) =>
          total +
          item.discountedPrice * Number(item.quantity || 0),
        0
      )
      .toFixed(2)
  );

  const originalSubtotal = Number(
    items
      .reduce(
        (total, item) =>
          total +
          item.originalPrice * Number(item.quantity || 0),
        0
      )
      .toFixed(2)
  );

  return {
    ...cartData,
    items,
    subtotal,
    originalSubtotal,
    offerSavings: Number(
      (originalSubtotal - subtotal).toFixed(2)
    ),
  };
};



// --------------------------------------------------

export const addItemToCartService = async ({
  userId,
  variantId,
  quantity,
}) => {
  validateId(userId, "user ID");
  validateId(variantId, "variant ID");

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw createError("Quantity must be a positive integer.", 400);
  }

  const variant = await Variant.findById(variantId);

  if (!variant || !variant.isActive) {
    throw createError("Product variant is unavailable.", 404);
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


// --------------------------------------------------

export const getCartService = async (userId) => {
  validateId(userId, "user ID");

  const cart = await getPopulatedCart(userId);

  if (!cart) {
    return {
      userId,
      items: [],
      subtotal: 0,
      originalSubtotal: 0,
      offerSavings: 0,
    };
  }

  return cart;
};


// --------------------------------------------------

export const updateCartItemService = async ({
  userId,
  variantId,
  quantity,
}) => {
  validateId(userId, "user ID");
  validateId(variantId, "variant ID");

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw createError("Quantity must be a positive integer.", 400);
  }

  const variant = await Variant.findById(variantId);

  if (!variant || !variant.isActive) {
    throw createError("Product variant is unavailable.", 404);
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

//  --------------------------------------------------

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
