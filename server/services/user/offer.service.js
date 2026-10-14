
import Offer from "../../models/offer.model.js";

export const getActiveOfferByProductId = async (productId) => {
  const now = new Date();

  return Offer.findOne({
    productId,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).lean();
};
