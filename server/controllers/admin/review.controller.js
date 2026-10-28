import {
  getAllReviewsAdminService,
  toggleReviewStatusAdminService,
  deleteReviewAdminService,
} from "../../services/admin/review.service.js";

export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const { page, limit, rating, status, search } = req.query;

    const result = await getAllReviewsAdminService({
      page,
      limit,
      rating,
      status,
      search,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleReviewStatusAdmin = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    const review = await toggleReviewStatusAdminService({
      reviewId,
      status,
    });

    return res.status(200).json({
      success: true,
      message: `Review status updated to ${review.status}.`,
      review,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReviewAdmin = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const result = await deleteReviewAdminService({ reviewId });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
