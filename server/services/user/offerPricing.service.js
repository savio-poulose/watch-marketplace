
import Offer from "../../models/offer.model.js";

const money = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getDiscountAmount = (offer, originalPrice) => {
  if (!offer || originalPrice <= 0) return 0;

  const value = Number(offer.discountValue);

  if (!Number.isFinite(value) || value <= 0) return 0;

  if (offer.discountType === "percentage") {
    if (value > 100) return 0;
    return money((originalPrice * value) / 100);
  }

  if (offer.discountType === "fixed") {
    return money(Math.min(originalPrice, value));
  }

  return 0;
};

export const getBestOfferPrice = async ({
  productId,
  categoryId,
  originalPrice,
  session = null,
}) => {
  const price = Math.max(0, Number(originalPrice) || 0);
  const now = new Date();

  const conditions = [];

  if (productId) {
    conditions.push({
      offerType: "product",
      productId,
    });
  }

  if (categoryId) {
    conditions.push({
      offerType: "category",
      categoryId,
    });
  }

  if (!conditions.length || price <= 0) {
    return {
      originalPrice: money(price),
      unitPrice: money(price),
      discountAmount: 0,
      winningOffer: null,
    };
  }

  let query = Offer.find({
    $or: conditions,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).lean();

  if (session) {
    query = query.session(session);
  }

  const offers = await query;

  let winningOffer = null;
  let winningDiscount = 0;

  for (const offer of offers) {
    const discount = getDiscountAmount(offer, price);

    if (discount > winningDiscount) {
      winningDiscount = discount;
      winningOffer = offer;
    }
  }

  return {
    originalPrice: money(price),
    unitPrice: money(Math.max(0, price - winningDiscount)),
    discountAmount: money(winningDiscount),
    winningOffer,
  };
};
