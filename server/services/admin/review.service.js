import mongoose from "mongoose";
import Review from "../../models/review.model.js";
import User from "../../models/user.model.js";
import Product from "../../models/product.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getAllReviewsAdminService = async ({
  page = 1,
  limit = 10,
  rating = "ALL",
  status = "ALL",
  search = "",
} = {}) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.max(1, Math.min(100, Number(limit) || 10));
  const skip = (page - 1) * limit;

  const filter = {};

  // Status filter
  if (status && status !== "ALL") {
    if (["APPROVED", "HIDDEN"].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }
  }

  // Rating filter
  if (rating && rating !== "ALL") {
    const numRating = Number(rating);
    if ([1, 2, 3, 4, 5].includes(numRating)) {
      filter.rating = numRating;
    }
  }

  // Search filter
  if (search && search.trim()) {
    const term = search.trim();
    const regex = new RegExp(term, "i");

    // Find matching users and products
    const [matchingUsers, matchingProducts] = await Promise.all([
      User.find({
        $or: [{ userName: regex }, { email: regex }],
      }).select("_id"),
      Product.find({ name: regex }).select("_id"),
    ]);

    const userIds = matchingUsers.map((u) => u._id);
    const productIds = matchingProducts.map((p) => p._id);

    filter.$or = [
      { title: regex },
      { comment: regex },
      { userId: { $in: userIds } },
      { productId: { $in: productIds } },
    ];
  }

  // Fetch paginated reviews and stats
  const [reviews, totalCount, statsAgg] = await Promise.all([
    Review.find(filter)
      .populate("userId", "userName email profileImage")
      .populate("productId", "name brand images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Review.countDocuments(filter),

    // Platform-wide metrics for review management overview
    Review.aggregate([
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          ratingCounts: [
            {
              $group: {
                _id: "$rating",
                count: { $sum: 1 },
              },
            },
          ],
          totalAndAvg: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                avgRating: { $avg: "$rating" },
                verifiedCount: {
                  $sum: { $cond: ["$isVerifiedPurchase", 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]),
  ]);

  // Parse overall KPI statistics
  const facetResult = statsAgg[0] || {};
  const totalAndAvg = facetResult.totalAndAvg?.[0] || {
    total: 0,
    avgRating: 0,
    verifiedCount: 0,
  };

  const statusMap = { APPROVED: 0, HIDDEN: 0 };
  (facetResult.statusCounts || []).forEach((item) => {
    if (statusMap[item._id] !== undefined) {
      statusMap[item._id] = item.count;
    }
  });

  const ratingMap = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  (facetResult.ratingCounts || []).forEach((item) => {
    if (ratingMap[item._id] !== undefined) {
      ratingMap[item._id] = item.count;
    }
  });

  const stats = {
    totalReviews: totalAndAvg.total,
    averageRating: totalAndAvg.avgRating ? Number(totalAndAvg.avgRating.toFixed(1)) : 0,
    approvedCount: statusMap.APPROVED,
    hiddenCount: statusMap.HIDDEN,
    verifiedCount: totalAndAvg.verifiedCount,
    ratingDistribution: ratingMap,
  };

  return {
    reviews,
    stats,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
};

export const toggleReviewStatusAdminService = async ({ reviewId, status }) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw createError("Invalid review ID", 400);
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw createError("Review not found", 404);
  }

  if (status && ["APPROVED", "HIDDEN"].includes(status.toUpperCase())) {
    review.status = status.toUpperCase();
  } else {
    review.status = review.status === "APPROVED" ? "HIDDEN" : "APPROVED";
  }

  await review.save();

  const updatedReview = await Review.findById(review._id)
    .populate("userId", "userName email profileImage")
    .populate("productId", "name brand images")
    .lean();

  return updatedReview;
};

export const deleteReviewAdminService = async ({ reviewId }) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw createError("Invalid review ID", 400);
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    throw createError("Review not found", 404);
  }

  await Review.deleteOne({ _id: reviewId });

  return { message: "Review deleted successfully by admin." };
};
