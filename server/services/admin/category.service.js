import Category from "../../models/category.model.js";
import Offer from "../../models/offer.model.js";
import { uploadToCloudinary } from "../../config/cloudinary.js";

const parseBoolean = (value) =>
  value === true || value === "true" || value === "on" || value === "1";

const parseOfferData = (data) => {
  const isActive =
    data.offerIsActive === true ||
    data.offerIsActive === "true" ||
    data.offerIsActive === "on" ||
    data.offerIsActive === "1";

  if (!isActive) return null;

  const discountType = String(
    data.offerDiscountType || "percentage",
  ).toLowerCase();

  const discountValue = Number(data.offerDiscountValue);

  const startDate = new Date(data.offerStartDate);
  const endDate = new Date(data.offerEndDate);

  if (!["percentage", "fixed"].includes(discountType)) {
    throw new Error("Invalid category offer discount type.");
  }

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new Error("Offer discount must be greater than zero.");
  }

  if (discountType === "percentage" && discountValue > 100) {
    throw new Error("Percentage discount cannot exceed 100%.");
  }

  if (
    !data.offerStartDate ||
    !data.offerEndDate ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime())
  ) {
    throw new Error("Please enter valid offer start and end dates.");
  }

  if (endDate <= startDate) {
    throw new Error("Offer end date must be later than its start date.");
  }

  return {
    offerType: "category",
    discountType,
    discountValue,
    startDate,
    endDate,
    isActive: true,
  };
};

const saveCategoryOffer = async (categoryId, data) => {
  const offerData = parseOfferData(data);

  if (!offerData) {
    await Offer.deleteOne({
      offerType: "category",
      categoryId,
    });
    return;
  }
  console.log("CATEGORY OFFER DATES:", {
    startDate: offerData.startDate,
    endDate: offerData.endDate,
    startTime: offerData.startDate?.getTime(),
    endTime: offerData.endDate?.getTime(),
  });

  const existingOffer = await Offer.findOne({
    offerType: "category",
    categoryId,
  });

  if (existingOffer) {
    existingOffer.categoryId = categoryId;
    existingOffer.productId = undefined;
    existingOffer.offerType = "category";

    existingOffer.discountType = offerData.discountType;
    existingOffer.discountValue = offerData.discountValue;
    existingOffer.startDate = offerData.startDate;
    existingOffer.endDate = offerData.endDate;
    existingOffer.isActive = true;

    await existingOffer.save();
  } else {
    await Offer.create({
      ...offerData,
      categoryId,
    });
  }
};

export const categoryAdd = async (data, file) => {
  if (!file) {
    throw new Error("Category image is required");
  }

  if (!data.name?.trim() || !data.description?.trim()) {
    throw new Error("Category name and description are required.");
  }

  const existingCategory = await Category.findOne({
    name: { $regex: `^${data.name.trim()}$`, $options: "i" },
  });

  if (existingCategory) {
    throw new Error("Category already exists");
  }

  const result = await uploadToCloudinary(file.buffer, "watchstore/categories");

  const category = await Category.create({
    name: data.name.trim(),
    description: data.description.trim(),
    image: result.secure_url,
  });

  try {
    await saveCategoryOffer(category._id, data);
  } catch (error) {
    // Avoid leaving an incomplete category if its offer is invalid.
    await Category.deleteOne({ _id: category._id });
    throw error;
  }

  return Category.findById(category._id).lean();
};

export const getCategoryAll = async () => {
  const categories = await Category.find({}).lean();

  const offers = await Offer.find({
    offerType: "category",
    categoryId: { $in: categories.map((category) => category._id) },
  }).lean();

  const offerByCategory = new Map(
    offers.map((offer) => [String(offer.categoryId), offer]),
  );

  return categories.map((category) => {
    const offer = offerByCategory.get(String(category._id));

    return {
      ...category,
      offer: offer
        ? {
            isActive: offer.isActive,
            discountType: offer.discountType,
            discountValue: offer.discountValue,
            startDate: offer.startDate,
            endDate: offer.endDate,
          }
        : null,
    };
  });
};

export const categoryEdit = async (data, params, file) => {
  const category = await Category.findById(params.id);

  if (!category) {
    throw new Error("Category not found.");
  }

  if (data.name?.trim()) category.name = data.name.trim();
  if (data.description?.trim()) {
    category.description = data.description.trim();
  }

  if (file) {
    const result = await uploadToCloudinary(
      file.buffer,
      "watchstore/categories",
    );
    category.image = result.secure_url;
  } else if (typeof data.image === "string" && data.image.trim()) {
    category.image = data.image.trim();
  }

  await category.save();
  await saveCategoryOffer(category._id, data);

  return Category.findById(category._id).lean();
};

export const categoryDelete = async (params) => {
  const category = await Category.findById(params.id);

  if (!category) {
    throw new Error("Category not found.");
  }

  await Offer.deleteOne({
    offerType: "category",
    categoryId: category._id,
  });

  await Category.deleteOne({ _id: category._id });

  return { success: true };
};
