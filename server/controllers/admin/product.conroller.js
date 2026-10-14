
import mongoose from "mongoose";

import {
  productAdd,
  productGetAll,
  productGet,
  productUpdate,
  ProductDelete,
  statusToggle,
} from "../../services/admin/product.service.js";

import {
  variantAdd,
  variantGetAll,
  variantGetByProductId,
  variantDeleteByProductId,
} from "../../services/admin/variant.service.js";

import { uploadImages } from "../../services/image.service.js";

import {
  offerAdd,
  offerGetByProductId,
  offerDelete,
  offerUpdate,
} from "../../services/admin/offer.service.js";

import User from "../../models/user.model.js";

const parseJSON = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Invalid JSON submitted");
  }
};

const validateProductFields = ({
  name,
  brand,
  gender,
  categoryId,
  description,
}) => {
  if (!name?.trim()) throw new Error("Product name is required");
  if (!brand?.trim()) throw new Error("Brand is required");
  if (!description?.trim()) throw new Error("Description is required");

  if (!["Men", "Women", "Unisex"].includes(gender)) {
    throw new Error("Select a valid gender");
  }

  if (!mongoose.isValidObjectId(categoryId)) {
    throw new Error("Select a valid category");
  }
};

const validateOffer = (offer) => {
  if (!offer?.isActive) return null;

  const discountValue = Number(offer.discountValue);
  const startDate = new Date(offer.startDate);
  const endDate = new Date(offer.endDate);

  if (!["percentage", "fixed"].includes(offer.discountType)) {
    throw new Error("Invalid discount type");
  }

  if (
    !Number.isFinite(discountValue) ||
    discountValue <= 0 ||
    (offer.discountType === "percentage" && discountValue > 100)
  ) {
    throw new Error("Invalid discount value");
  }

  if (
    !offer.startDate ||
    !offer.endDate ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    startDate >= endDate
  ) {
    throw new Error("Invalid offer dates");
  }

  return {
    discountType: offer.discountType,
    discountValue,
    startDate,
    endDate,
    isActive: true,
  };
};

const prepareVariants = async (variants, files = []) => {
  if (!Array.isArray(variants) || variants.length === 0) {
    throw new Error("At least one variant is required");
  }

  if (variants.length > 50) {
    throw new Error("Maximum 50 variants allowed per product");
  }

  const allowedFields = new Set(
    variants.map((_, index) => `variantImages_${index}`)
  );

  for (const file of files) {
    if (!allowedFields.has(file.fieldname)) {
      throw new Error(`Unexpected image field: ${file.fieldname}`);
    }
  }

  const prepared = [];

  for (let index = 0; index < variants.length; index++) {
    const variant = variants[index];

    const filesForVariant = files.filter(
      (file) => file.fieldname === `variantImages_${index}`
    );

    if (filesForVariant.length > 3) {
      throw new Error(
        `Variant ${index + 1} can have at most 3 new images`
      );
    }

    const existingImages = Array.isArray(variant.images)
      ? variant.images
      : [];

    if (
      existingImages.length > 3 ||
      existingImages.some(
        (image) =>
          typeof image !== "string" ||
          !/^https?:\/\//i.test(image)
      )
    ) {
      throw new Error(`Invalid images for variant ${index + 1}`);
    }

    const newImages = filesForVariant.length
      ? await uploadImages(filesForVariant)
      : [];

    const images = [...existingImages, ...newImages];

    if (images.length > 3) {
      throw new Error(
        `Variant ${index + 1} can have at most 3 images in total`
      );
    }

    const preparedVariant = {
      size: String(variant.size || "").trim(),
      strapMaterial: String(variant.strapMaterial || "").trim(),
      caseMaterial: String(variant.caseMaterial || "").trim(),
      dialColor: String(variant.dialColor || "").trim(),
      strapColor: String(variant.strapColor || "").trim(),
      price: Number(variant.price),
      quantity: Number(variant.quantity),
      images,
    };

    if (
      !preparedVariant.size ||
      !preparedVariant.strapMaterial ||
      !preparedVariant.caseMaterial ||
      !preparedVariant.dialColor ||
      !preparedVariant.strapColor
    ) {
      throw new Error(
        `Variant ${index + 1}: size, strap material, case material, dial color and strap color are required`
      );
    }

    if (
      !Number.isFinite(preparedVariant.price) ||
      preparedVariant.price < 0
    ) {
      throw new Error(`Invalid price for variant ${index + 1}`);
    }

    if (
      !Number.isInteger(preparedVariant.quantity) ||
      preparedVariant.quantity < 0
    ) {
      throw new Error(`Invalid quantity for variant ${index + 1}`);
    }

    prepared.push(preparedVariant);
  }

  return prepared;
};

const saveOffer = async (productId, offer) => {
  const validOffer = validateOffer(offer);

  if (!validOffer) {
    await offerDelete(productId);
    return;
  }

  const existingOffer = await offerGetByProductId(productId);

  if (existingOffer) {
    await offerUpdate(productId, validOffer);
  } else {
    await offerAdd({
      ...validOffer,
      productId,
    });
  }
};

export const addProduct = async (req, res) => {
  let createdProductId = null;

  try {
    const {
      name,
      brand,
      gender,
      categoryId,
      description,
    } = req.body;

    validateProductFields({
      name,
      brand,
      gender,
      categoryId,
      description,
    });

    const variants = parseJSON(req.body.variants, []);
    const offer = parseJSON(req.body.offer, {
      isActive: false,
    });

    validateOffer(offer);

    const preparedVariants = await prepareVariants(
      variants,
      req.files || []
    );

    // The first variant supplies the default product images.
    const product = await productAdd({
      name: name.trim(),
      brand: brand.trim(),
      gender,
      categoryId,
      description: description.trim(),
      images: preparedVariants[0].images,
    });

    createdProductId = product._id;

    await variantAdd(
      preparedVariants.map((variant) => ({
        ...variant,
        productId: product._id,
      }))
    );

    if (offer.isActive) {
      await saveOffer(product._id, offer);
    }

    return res.status(201).json({
      message: "Product added successfully",
      productId: product._id,
    });
  } catch (error) {
    console.error("Add product error:", error);

    if (createdProductId) {
      try {
        await variantDeleteByProductId(createdProductId);
        await offerDelete(createdProductId);
        await ProductDelete(createdProductId);
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    return res.status(400).json({
      message: error.message,
    });
  }
};

export const getAllProduct = async (req, res) => {
  try {
    const products = await productGetAll();
    const variants = await variantGetAll();

    const response = products.map((product) => {
      const productVariants = variants.filter(
        (variant) =>
          variant.productId.toString() === product._id.toString()
      );

      const activeVariants = productVariants.filter(
        (variant) => variant.isActive
      );

      const prices = activeVariants.map((variant) => variant.price);

      const stock = activeVariants.reduce(
        (total, variant) => total + variant.quantity,
        0
      );

      const price =
        prices.length > 0
          ? `${Math.min(...prices).toLocaleString("en-IN")} - ${Math.max(
              ...prices
            ).toLocaleString("en-IN")}`
          : "N/A";

      return {
        id: product._id.toString(),
        name: product.name,
        brand: product.brand,
        image: product.images?.[0] || "",
        category: product.categoryId?.name || "Uncategorized",
        price,
        stock,
        isActive: product.isActive,
      };
    });

    return res.status(200).json({
      message: "Products fetched successfully",
      response,
    });
  } catch (error) {
    console.error("Get all products error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await productGet(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const variants = await variantGetByProductId(id);
    const offer = await offerGetByProductId(id);

    return res.status(200).json({
      product,
      variants,
      offer,
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const {
      name,
      brand,
      gender,
      categoryId,
      description,
    } = req.body;

    validateProductFields({
      name,
      brand,
      gender,
      categoryId,
      description,
    });

    const product = await productGet(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const variants = parseJSON(req.body.variants, []);
    const offer = parseJSON(req.body.offer, {
      isActive: false,
    });

    validateOffer(offer);

    const preparedVariants = await prepareVariants(
      variants,
      req.files || []
    );

    await productUpdate(id, {
      name: name.trim(),
      brand: brand.trim(),
      gender,
      categoryId,
      description: description.trim(),
      images: preparedVariants[0].images,
    });

    // Retains your existing variant replacement strategy.
    await variantDeleteByProductId(id);

    await variantAdd(
      preparedVariants.map((variant) => ({
        ...variant,
        productId: id,
      }))
    );

    await saveOffer(id, offer);

    return res.status(200).json({
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await productGet(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await variantDeleteByProductId(id);
    await offerDelete(id);
    await ProductDelete(id);

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await statusToggle(id);

    return res.status(200).json({
      message: "Product status updated successfully",
      product,
    });
  } catch (error) {
    console.error("Toggle product status error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};


export const getAllBlokedUsers = async(req,res)=>{
  try{

    const BlockedUsers = await User.find({isBlocked:true})

    console.log(BlockedUsers)

  }catch(err){
    res.status(err).json({
      message:err.message
    })
  }
} 