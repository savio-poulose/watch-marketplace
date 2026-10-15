
import mongoose from "mongoose";
import Coupon from "../../models/coupon.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateCouponData = (data, partial = false) => {
  const allowedFields = [
    "code",
    "discountType",
    "discountValue",
    "minOrderAmount",
    "maxDiscount",
    "startDate",
    "endDate",
    "usageLimit",
    "perUserLimit",
    "isActive",
  ];

  for (const key of Object.keys(data)) {
    if (!allowedFields.includes(key)) {
      throw createError(`Field '${key}' cannot be modified.`);
    }
  }

  if (!partial || data.code !== undefined) {
    if (typeof data.code !== "string" || !data.code.trim()) {
      throw createError("Coupon code is required.");
    }
    data.code = data.code.trim().toUpperCase();
  }

  if (!partial || data.discountType !== undefined) {
    if (!["PERCENTAGE", "FIXED"].includes(data.discountType)) {
      throw createError("Discount type must be PERCENTAGE or FIXED.");
    }
  }

  if (!partial || data.discountValue !== undefined) {
    const value = Number(data.discountValue);

    if (!Number.isFinite(value) || value <= 0) {
      throw createError("Discount value must be greater than zero.");
    }

    if (data.discountType === "PERCENTAGE" && value > 100) {
      throw createError("Percentage discount cannot exceed 100%.");
    }

    data.discountValue = value;
  }

  if (data.discountType === "PERCENTAGE" && data.maxDiscount === null) {
    // Null means no maximum discount.
  }

  for (const field of [
    "minOrderAmount",
    "maxDiscount",
    "usageLimit",
    "perUserLimit",
  ]) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      continue;
    }

    const value = Number(data[field]);

    if (!Number.isFinite(value)) {
      throw createError(`${field} must be a valid number.`);
    }

    if (field === "minOrderAmount" && value < 0) {
      throw createError("Minimum order amount cannot be negative.");
    }

    if (field === "maxDiscount" && value < 0) {
      throw createError("Maximum discount cannot be negative.");
    }

    if (
      ["usageLimit", "perUserLimit"].includes(field) &&
      (!Number.isInteger(value) || value < 1)
    ) {
      throw createError(`${field} must be a positive whole number.`);
    }

    data[field] = value;
  }

  if (data.discountType === "FIXED") {
    data.maxDiscount = null;
  }

  for (const field of ["startDate", "endDate"]) {
    if (!partial || data[field] !== undefined) {
      const date = new Date(data[field]);

      if (!data[field] || Number.isNaN(date.getTime())) {
        throw createError(`${field} is required and must be a valid date.`);
      }

      data[field] = date;
    }
  }

  if (
    data.startDate !== undefined &&
    data.endDate !== undefined &&
    data.endDate < data.startDate
  ) {
    throw createError("End date must be on or after the start date.");
  }

  if (data.isActive !== undefined && typeof data.isActive !== "boolean") {
    throw createError("isActive must be a boolean.");
  }

  return data;
};

export const couponsAllGet = async () => {
  return Coupon.find().sort({ createdAt: -1 }).lean();
};

export const couponGetById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid coupon ID.", 400);
  }

  const coupon = await Coupon.findById(id).lean();

  if (!coupon) {
    throw createError("Coupon not found.", 404);
  }

  return coupon;
};

export const couponCreate = async (payload) => {
  const data = validateCouponData({ ...payload });

  try {
    return await Coupon.create(data);
  } catch (error) {
    if (error.code === 11000) {
      throw createError("Coupon code already exists.", 409);
    }

    if (error.name === "ValidationError") {
      throw createError(error.message, 400);
    }

    throw error;
  }
};

export const couponUpdate = async (id, payload) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid coupon ID.", 400);
  }

  const existing = await Coupon.findById(id);

  if (!existing) {
    throw createError("Coupon not found.", 404);
  }

  // Never allow admin edits to reset redemption history.
  const data = validateCouponData({ ...payload }, true);

  if (
    data.discountType === undefined &&
    data.discountValue !== undefined
  ) {
    data.discountType = existing.discountType;
  }

  if (
    data.discountType === "PERCENTAGE" &&
    data.discountValue !== undefined &&
    data.discountValue > 100
  ) {
    throw createError("Percentage discount cannot exceed 100%.");
  }

  // Validate resulting date range, including unchanged values.
  const startDate = data.startDate ?? existing.startDate;
  const endDate = data.endDate ?? existing.endDate;

  if (endDate < startDate) {
    throw createError("End date must be on or after the start date.");
  }

  try {
    const updated = await Coupon.findByIdAndUpdate(
      id,
      { $set: data },
      { returnDocument: "after", runValidators: true }
    );

    return updated;
  } catch (error) {
    if (error.code === 11000) {
      throw createError("Coupon code already exists.", 409);
    }

    throw error;
  }
};

export const couponUpdateStatus = async (id, isActive) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid coupon ID.", 400);
  }

  if (typeof isActive !== "boolean") {
    throw createError("isActive must be true or false.", 400);
  }

  const coupon = await Coupon.findByIdAndUpdate(
    id,
    { $set: { isActive } },
    { returnDocument: "after", runValidators: true }
  );

  if (!coupon) {
    throw createError("Coupon not found.", 404);
  }

  return coupon;
};

export const couponDelete = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid coupon ID.", 400);
  }

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw createError("Coupon not found.", 404);
  }

  if (coupon.usedCount > 0) {
    throw createError(
      "This coupon has been used. Disable it instead of deleting it.",
      409
    );
  }

  await Coupon.findByIdAndDelete(id);

  return { id };
};
