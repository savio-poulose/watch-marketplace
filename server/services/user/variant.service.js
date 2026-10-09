
import Variant from "../../models/variant.model.js";

export const getActiveVariantsByProductId = async (productId) => {
  return await Variant.find({
    productId,
    isActive: true,
  })
    .sort({ price: 1 })
    .lean();
};
