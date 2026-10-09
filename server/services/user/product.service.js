import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";
import Offer from "../../models/offer.model.js";

export const productsGetAll = async () => {
  const products = await Product.find({ isActive: true }).lean();

  const productIds = products.map((product) => product._id);

  const [variants, offers] = await Promise.all([
    Variant.find({
      productId: { $in: productIds },
      isActive: true,
    }).lean(),

    Offer.find({
      productId: { $in: productIds },
      isActive: true,
    }).lean(),
  ]);

  const now = new Date();

  return products.map((product) => {
    const productVariants = variants.filter(
      (variant) => variant.productId.toString() === product._id.toString(),
    );

    // Default variant: cheapest active variant
    const defaultVariant = [...productVariants].sort(
      (a, b) => a.price - b.price,
    )[0];

    const originalPrice = defaultVariant?.price ?? 0;

    // Find the currently valid offer for this product
    const offer = offers.find(
      (item) =>
        item.productId.toString() === product._id.toString() &&
        new Date(item.startDate) <= now &&
        new Date(item.endDate) >= now,
    );

    let discountAmount = 0;
    let discountPercentage = 0;

    if (offer && originalPrice > 0) {
      if (offer.discountType === "percentage") {
        discountPercentage = Math.min(Math.max(offer.discountValue, 0), 100);

        discountAmount = (originalPrice * discountPercentage) / 100;
      } else if (offer.discountType === "fixed") {
        discountAmount = Math.min(
          Math.max(offer.discountValue, 0),
          originalPrice,
        );

        discountPercentage = Math.round((discountAmount / originalPrice) * 100);
      }
    }

    const finalPrice = Math.round((originalPrice - discountAmount) * 100) / 100;

    return {
      id: product._id,
      name: product.name,
      brand: product.brand,

      image: defaultVariant?.images?.[0] || product.images?.[0] || "",

      // Original price, displayed as the crossed-out price
      oldPrice: offer ? originalPrice : null,

      // Final discounted price
      price: finalPrice,

      // Discount badge, e.g. "15% OFF"
      discount: discountPercentage,

      // Temporary dummy review data
      rating: 4.5,
      reviews: Math.floor(Math.random() * 90) + 10,
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
  return await Product.findOne({
    _id: id,
    isActive: true,
  })
    .populate("categoryId")
    .lean();
};