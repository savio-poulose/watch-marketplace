
import Coupon from "../../models/coupon.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const applyCouponService = async ({ code, subtotal }) => {
  const normalizedCode = String(code || "").trim().toUpperCase();
  const amount = Number(subtotal);

  if (!normalizedCode) {
    throw createError("Please enter a coupon code.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError("Your cart subtotal is invalid.");
  }

  const coupon = await Coupon.findOne({ code: normalizedCode });

  if (!coupon) {
    throw createError("Invalid coupon code.");
  }

  if (!coupon.isActive) {
    throw createError("This coupon is currently inactive.");
  }

  const now = new Date();

  if (now < new Date(coupon.startDate)) {
    throw createError("This coupon is not active yet.");
  }

  if (now > new Date(coupon.endDate)) {
    throw createError("This coupon has expired.");
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    throw createError("This coupon has reached its usage limit.");
  }

  if (amount < Number(coupon.minOrderAmount || 0)) {
    throw createError(
      `Minimum order amount is ₹${coupon.minOrderAmount}.`
    );
  }

  let discountAmount = 0;

  if (coupon.discountType === "PERCENTAGE") {
    if (
      coupon.discountValue <= 0 ||
      coupon.discountValue > 100
    ) {
      throw createError("This coupon has an invalid discount.");
    }

    discountAmount = (amount * coupon.discountValue) / 100;

    if (coupon.maxDiscount != null) {
      discountAmount = Math.min(
        discountAmount,
        Number(coupon.maxDiscount)
      );
    }
  } else if (coupon.discountType === "FIXED") {
    if (coupon.discountValue <= 0) {
      throw createError("This coupon has an invalid discount.");
    }

    discountAmount = Number(coupon.discountValue);
  } else {
    throw createError("Unsupported coupon type.");
  }

  // A discount cannot exceed the eligible subtotal.
  discountAmount = Math.min(
    amount,
    Math.max(0, discountAmount)
  );

  // Avoid floating-point currency values.
  discountAmount = Math.round((discountAmount + Number.EPSILON) * 100) / 100;

  if (discountAmount <= 0) {
    throw createError("This coupon does not provide a discount.");
  }

  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    subtotal: amount,
    payableAfterCoupon: Math.max(
      0,
      Math.round((amount - discountAmount + Number.EPSILON) * 100) / 100
    ),
  };
};
