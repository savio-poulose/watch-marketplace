import mongoose from "mongoose";
import Review from "../../models/review.model.js";
import Order from "../../models/order.module.js";
import Product from "../../models/product.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getProductReviewsService = async ({
  productId,
  page = 1,
  limit = 5,
  sort = "newest",
  currentUserId = null,
} = {}) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw createError("Invalid product ID", 400);
  }

  const prodObjectId = new mongoose.Types.ObjectId(productId);
  page = Math.max(1, Number(page) || 1);
  limit = Math.max(1, Math.min(50, Number(limit) || 5));
  const skip = (page - 1) * limit;

  // Sorting condition
  let sortOption = { createdAt: -1 };
  if (sort === "highest") {
    sortOption = { rating: -1, createdAt: -1 };
  } else if (sort === "lowest") {
    sortOption = { rating: 1, createdAt: -1 };
  }

  const query = {
    productId: prodObjectId,
    status: "APPROVED",
  };

  const [reviews, totalCount, statsAgg] = await Promise.all([
    Review.find(query)
      .populate("userId", "userName profileImage")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),

    Review.countDocuments(query),

    // Aggregate rating statistics for this product
    Review.aggregate([
      { $match: { productId: prodObjectId, status: "APPROVED" } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Calculate detailed rating distribution and average
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRatingSum = 0;

  statsAgg.forEach((item) => {
    const star = item._id;
    if (distribution[star] !== undefined) {
      distribution[star] = item.count;
      totalRatingSum += star * item.count;
    }
  });

  const averageRating = totalCount > 0 ? Number((totalRatingSum / totalCount).toFixed(1)) : 0;

  // Percentage per star
  const breakdown = {};
  for (let s = 1; s <= 5; s++) {
    breakdown[s] = {
      count: distribution[s],
      percentage: totalCount > 0 ? Math.round((distribution[s] / totalCount) * 100) : 0,
    };
  }

  // Check if current user has already written a review
  let currentUserReview = null;
  if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
    currentUserReview = await Review.findOne({
      productId: prodObjectId,
      userId: currentUserId,
    })
      .populate("userId", "userName profileImage")
      .lean();
  }

  return {
    reviews,
    currentUserReview,
    stats: {
      averageRating,
      totalReviews: totalCount,
      distribution: breakdown,
    },
    pagination: {
      page,
      limit,
      totalReviews: totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
};

export const getReviewEligibilityService = async ({ userId, productId }) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw createError("Invalid product ID", 400);
  }

  const prodObjectId = new mongoose.Types.ObjectId(productId);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Check if user already reviewed
  const existingReview = await Review.findOne({
    productId: prodObjectId,
    userId: userObjectId,
  })
    .populate("userId", "userName profileImage")
    .lean();

  // Check if user has purchased the item and it has been delivered
  const deliveredOrder = await Order.findOne({
    userId: userObjectId,
    "items.productId": prodObjectId,
    orderStatus: { $in: ["DELIVERED", "RETURN_REQUESTED", "RETURNED"] },
  }).lean();

  const isVerifiedPurchase = Boolean(deliveredOrder);

  return {
    hasReviewed: Boolean(existingReview),
    existingReview: existingReview || null,
    isVerifiedPurchase,
    canReview: true,
  };
};

export const createOrUpdateReviewService = async ({
  userId,
  productId,
  rating,
  title = "",
  comment,
  orderId = null,
}) => {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw createError("Invalid product ID", 400);
  }

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    throw createError("Rating must be between 1 and 5", 400);
  }

  const cleanComment = (comment || "").trim();
  if (!cleanComment) {
    throw createError("Review comment is required", 400);
  }

  if (cleanComment.length > 2000) {
    throw createError("Review comment cannot exceed 2000 characters", 400);
  }

  const cleanTitle = (title || "").trim();
  if (cleanTitle.length > 120) {
    throw createError("Title cannot exceed 120 characters", 400);
  }

  // Ensure product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw createError("Product not found", 404);
  }

  // Check if verified purchaser
  let isVerifiedPurchase = false;
  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    const order = await Order.findOne({
      _id: orderId,
      userId,
      "items.productId": productId,
    }).lean();
    if (order) {
      isVerifiedPurchase = true;
    }
  }

  if (!isVerifiedPurchase) {
    const deliveredOrder = await Order.findOne({
      userId,
      "items.productId": productId,
      orderStatus: { $in: ["DELIVERED", "RETURN_REQUESTED", "RETURNED"] },
    }).lean();
    isVerifiedPurchase = Boolean(deliveredOrder);
  }

  // Check if review already exists for this user and product
  let review = await Review.findOne({ userId, productId });

  if (review) {
    // Update existing review
    review.rating = numRating;
    if (cleanTitle) review.title = cleanTitle;
    review.comment = cleanComment;
    if (isVerifiedPurchase) review.isVerifiedPurchase = true;
    if (orderId) review.orderId = orderId;
    review.status = "APPROVED"; // Reset to approved on update
    await review.save();
  } else {
    // Create new review
    review = await Review.create({
      productId,
      userId,
      orderId: orderId || null,
      rating: numRating,
      title: cleanTitle,
      comment: cleanComment,
      isVerifiedPurchase,
      status: "APPROVED",
    });
  }

  const populatedReview = await Review.findById(review._id)
    .populate("userId", "userName profileImage")
    .lean();

  return populatedReview;
};

export const deleteUserReviewService = async ({ userId, reviewId }) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw createError("Invalid review ID", 400);
  }

  const review = await Review.findOne({ _id: reviewId, userId });
  if (!review) {
    throw createError("Review not found or unauthorized to delete", 404);
  }

  await Review.deleteOne({ _id: reviewId });

  return { message: "Review deleted successfully" };
};
