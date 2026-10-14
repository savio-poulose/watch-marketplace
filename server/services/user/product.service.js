
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";
import Offer from "../../models/offer.model.js";

export const productsGetAll = async () => {
  const products = await Product.find({ isActive: true }).lean();

  if (products.length === 0) {
    return [];
  }

  const productIds = products.map((product) => product._id);
  const now = new Date();

  const [variants, offers] = await Promise.all([
    Variant.find({
      productId: { $in: productIds },
      isActive: true,
    }).lean(),

    Offer.find({
      productId: { $in: productIds },
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean(),
  ]);

  return products.map((product) => {
    const productId = product._id.toString();

    const productVariants = variants.filter(
      (variant) => variant.productId.toString() === productId
    );

    // Use the cheapest active variant for collection listing.
    const defaultVariant = [...productVariants].sort(
      (a, b) => Number(a.price) - Number(b.price)
    )[0];

    const originalPrice = Number(defaultVariant?.price ?? 0);

    const offer = offers.find(
      (item) => item.productId.toString() === productId
    );

    let discountAmount = 0;

    if (offer && originalPrice > 0) {
      if (offer.discountType === "percentage") {
        const percentage = Math.min(
          100,
          Math.max(0, Number(offer.discountValue) || 0)
        );

        discountAmount = (originalPrice * percentage) / 100;
      } else if (offer.discountType === "fixed") {
        discountAmount = Math.min(
          originalPrice,
          Math.max(0, Number(offer.discountValue) || 0)
        );
      }
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    const finalPrice = Math.round(
      (originalPrice - discountAmount) * 100
    ) / 100;

    const hasOffer = discountAmount > 0;

    const discountPercentage =
      originalPrice > 0
        ? Math.round((discountAmount / originalPrice) * 100)
        : 0;

    return {
      id: product._id,
      name: product.name,
      brand: product.brand,

      image:
        defaultVariant?.images?.[0] ||
        product.images?.[0] ||
        "",

      // Price before discount.
      oldPrice: hasOffer ? originalPrice : null,

      // Price after discount.
      price: finalPrice,

      // Percentage saved, including fixed-amount offers.
      discount: hasOffer ? discountPercentage : 0,

      // Useful for showing offer information in the UI.
      hasOffer,
      offerType: hasOffer ? offer.discountType : null,
      discountAmount: hasOffer ? discountAmount : 0,

      // Existing temporary review data.
      rating: 4.5,
      reviews: 20,

      dialColor: defaultVariant?.dialColor ?? "",
      strapMaterial: defaultVariant?.strapMaterial ?? "",
    };
  });
};

export const getCollectionFilters = async () => {
  const [brands, dialShades, strapMaterials] = await Promise.all([
    Product.distinct("brand", { isActive: true }),
    Variant.distinct("dialColor", { isActive: true }),
    Variant.distinct("strapMaterial", { isActive: true }),
  ]);

  return {
    brands: brands.filter(Boolean).sort(),
    dialShades: dialShades.filter(Boolean).sort(),
    strapMaterials: strapMaterials.filter(Boolean).sort(),
  };
};

export const getActiveProductById = async (id) => {
  return Product.findOne({
    _id: id,
    isActive: true,
  })
    .populate("categoryId")
    .lean();
};
