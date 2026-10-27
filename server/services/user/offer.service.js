
import Offer from "../../models/offer.model.js";

export const getActiveOffersByProductId = async (
  productId,
  categoryId
) => {
  const now = new Date();
  const conditions = [
    {
      offerType: "product",
      productId,
    },
  ];

  if (categoryId) {
    conditions.push({
      offerType: "category",
      categoryId,
    });
  }

  return Offer.find({
    $or: conditions,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).lean();
};
