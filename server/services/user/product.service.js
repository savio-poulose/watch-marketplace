
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";
import Offer from "../../models/offer.model.js";

const money = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const discountFor = (offer, price) => {
  if (!offer || price <= 0) return 0;

  const value = Number(offer.discountValue);

  if (!Number.isFinite(value) || value <= 0) return 0;

  if (offer.discountType === "percentage") {
    if (value > 100) return 0;
    return money((price * value) / 100);
  }

  if (offer.discountType === "fixed") {
    return money(Math.min(price, value));
  }

  return 0;
};

export const productsGetAll = async () => {
  const products = await Product.find({ isActive: true }).lean();

  if (!products.length) return [];

  const productIds = products.map((product) => product._id);
  const categoryIds = [
    ...new Set(
      products.map((product) => product.categoryId?.toString()).filter(Boolean)
    ),
  ];

  const now = new Date();

  const conditions = [];

  if (productIds.length) {
    conditions.push({
      offerType: "product",
      productId: { $in: productIds },
    });
  }

  if (categoryIds.length) {
    conditions.push({
      offerType: "category",
      categoryId: { $in: categoryIds },
    });
  }

  const [variants, offers] = await Promise.all([
    Variant.find({
      productId: { $in: productIds },
      isActive: true,
    }).lean(),

    Offer.find({
      $or: conditions,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean(),
  ]);

  const offersByProduct = new Map();
  const offersByCategory = new Map();

  for (const offer of offers) {
    if (offer.offerType === "product" && offer.productId) {
      offersByProduct.set(String(offer.productId), offer);
    }

    if (offer.offerType === "category" && offer.categoryId) {
      offersByCategory.set(String(offer.categoryId), offer);
    }
  }

  return products.map((product) => {
    const productId = String(product._id);
    const categoryId = product.categoryId
      ? String(product.categoryId)
      : null;

    const productVariants = variants
      .filter((variant) => String(variant.productId) === productId)
      .sort((a, b) => Number(a.price) - Number(b.price));

    const defaultVariant = productVariants[0];
    const originalPrice = Math.max(0, Number(defaultVariant?.price ?? 0));

    const productOffer = offersByProduct.get(productId);
    const categoryOffer = categoryId
      ? offersByCategory.get(categoryId)
      : null;

    const productDiscount = discountFor(productOffer, originalPrice);
    const categoryDiscount = discountFor(categoryOffer, originalPrice);

    const useCategoryOffer = categoryDiscount > productDiscount;
    const winningOffer = useCategoryOffer ? categoryOffer : productOffer;
    const discountAmount = Math.max(productDiscount, categoryDiscount);
    const finalPrice = money(Math.max(0, originalPrice - discountAmount));
    const hasOffer = discountAmount > 0;

    return {
      id: product._id,
      name: product.name,
      brand: product.brand,
      image:
        defaultVariant?.images?.[0] ||
        product.images?.[0] ||
        "",

      oldPrice: hasOffer ? originalPrice : null,
      price: finalPrice,
      discount: originalPrice > 0
        ? Math.round((discountAmount / originalPrice) * 100)
        : 0,

      hasOffer,
      offerType: hasOffer ? winningOffer.discountType : null,
      discountAmount: hasOffer ? money(discountAmount) : 0,
      offerSource: hasOffer
        ? useCategoryOffer
          ? "category"
          : "product"
        : null,

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
