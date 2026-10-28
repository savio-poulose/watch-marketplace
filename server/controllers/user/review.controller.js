import jwt from "jsonwebtoken";
import {
  getProductReviewsService,
  getReviewEligibilityService,
  createOrUpdateReviewService,
  deleteUserReviewService,
} from "../../services/user/review.service.js";

// Helper to optionally extract user ID from cookie without throwing 401
const getOptionalUserId = (req) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    return decoded?.id || decoded?._id || decoded?.userId || null;
  } catch {
    return null;
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page, limit, sort } = req.query;
    const currentUserId = getOptionalUserId(req);

    const result = await getProductReviewsService({
      productId,
      page,
      limit,
      sort,
      currentUserId,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewEligibility = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const { productId } = req.params;

    const result = await getReviewEligibilityService({
      userId,
      productId,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const submitReview = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const productId = req.params.productId || req.body.productId;
    const { rating, title, comment, orderId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required for review.",
      });
    }

    const review = await createOrUpdateReviewService({
      userId,
      productId,
      rating,
      title,
      comment,
      orderId,
    });

    return res.status(200).json({
      success: true,
      message: "Review submitted successfully.",
      review,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMyReview = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const { reviewId } = req.params;

    const result = await deleteUserReviewService({
      userId,
      reviewId,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
