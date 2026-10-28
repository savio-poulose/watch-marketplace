import { useCallback, useEffect, useState } from "react";
import {
  FaStar,
  FaCheckCircle,
  FaEdit,
  FaTrashAlt,
  FaTimes,
  FaPen,
  FaSortAmountDown,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../../../api/axios.js";
import { useAuth } from "../../../context/useAuth.jsx";

const formatReviewDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ReviewsSection = ({ productId, productName }) => {
  const { user } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    },
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    totalReviews: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  // User review & eligibility state
  const [userReview, setUserReview] = useState(null);
  const [isVerifiedPurchase, setIsVerifiedPurchase] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch reviews list and aggregated stats
  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const response = await api.get(`/user/reviews/product/${productId}`, {
        params: { page, limit: 5, sort: sortBy },
      });

      if (response.data.success) {
        setReviews(response.data.reviews || []);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
        if (response.data.currentUserReview) {
          setUserReview(response.data.currentUserReview);
        }
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [productId, page, sortBy]);

  // Fetch logged-in user's eligibility and existing review
  const fetchEligibility = useCallback(async () => {
    if (!productId || !user) {
      setUserReview(null);
      setIsVerifiedPurchase(false);
      return;
    }
    try {
      const response = await api.get(
        `/user/reviews/product/${productId}/eligibility`
      );
      if (response.data.success) {
        setIsVerifiedPurchase(response.data.isVerifiedPurchase || false);
        if (response.data.existingReview) {
          setUserReview(response.data.existingReview);
        }
      }
    } catch {
      // Unauthenticated or blocked
    }
  }, [productId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  const handleOpenWriteModal = () => {
    if (!user) {
      toast.error("Please log in to write a review.");
      return;
    }

    if (userReview) {
      setRating(userReview.rating || 5);
      setTitle(userReview.title || "");
      setComment(userReview.comment || "");
    } else {
      setRating(5);
      setTitle("");
      setComment("");
    }
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setFormError("Please select a rating between 1 and 5 stars.");
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      setFormError("Please write at least 5 characters for your review.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      const response = await api.post(`/user/reviews/product/${productId}`, {
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });

      if (response.data.success) {
        toast.success(
          userReview ? "Review updated successfully!" : "Review posted successfully!"
        );
        setUserReview(response.data.review);
        setIsModalOpen(false);
        fetchReviews();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit review.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview?._id) return;
    try {
      setSubmitting(true);
      const response = await api.delete(`/user/reviews/${userReview._id}`);
      if (response.data.success) {
        toast.success("Review deleted successfully.");
        setUserReview(null);
        setDeleteConfirmOpen(false);
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-14 border-t border-gray-200 pt-10">
      {/* Header and Summary Rating Cards */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-[#9A7B3F] uppercase">
            Customer Feedback
          </p>
          <h2 className="mt-1 text-2xl font-serif font-light text-gray-900 tracking-wide">
            Reviews & Ratings
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Real feedback from verified connoisseurs of {productName || "this timepiece"}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenWriteModal}
            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium tracking-wider uppercase transition bg-[#111827] text-white hover:bg-[#9A7B3F]"
          >
            <FaPen className="text-[10px]" />
            {userReview ? "Edit Your Review" : "Write a Review"}
          </button>
        </div>
      </div>

      {/* Ratings Overview Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#faf9f6] border border-gray-200 p-6">
        {/* Average Score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-6">
          <span className="text-5xl font-light text-gray-900 tracking-tight">
            {stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"}
          </span>
          <div className="mt-2 flex gap-1 text-[#9A7B3F]">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={
                  star <= Math.round(stats.averageRating || 0)
                    ? "text-[#9A7B3F]"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Based on {stats.totalReviews} customer {stats.totalReviews === 1 ? "review" : "reviews"}
          </p>
          {isVerifiedPurchase && (
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              <FaCheckCircle className="text-[10px]" /> Verified Buyer
            </span>
          )}
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-8 flex flex-col justify-center gap-2">
          {[5, 4, 3, 2, 1].map((num) => {
            const row = stats.distribution?.[num] || { count: 0, percentage: 0 };
            return (
              <div key={num} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-gray-600 flex items-center gap-1 font-medium">
                  {num} <FaStar className="text-[10px] text-[#9A7B3F]" />
                </span>
                <div className="flex-1 h-2 bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-[#9A7B3F] transition-all duration-500"
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-gray-400 font-mono text-[11px]">
                  {row.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* User's Own Review Highlight (if submitted) */}
      {userReview && (
        <div className="mt-8 border border-[#9A7B3F]/40 bg-[#fdfbf7] p-5">
          <div className="flex items-center justify-between">
            <span className="inline-block text-[10px] tracking-wider uppercase font-semibold text-[#9A7B3F] bg-white border border-[#9A7B3F]/30 px-2 py-0.5">
              Your Review
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenWriteModal}
                className="cursor-pointer text-xs text-gray-600 hover:text-[#9A7B3F] flex items-center gap-1 transition"
                title="Edit review"
              >
                <FaEdit /> Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="cursor-pointer text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition ml-2"
                title="Delete review"
              >
                <FaTrashAlt /> Delete
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              {userReview.title || "My Review"}
            </h4>
            <span className="text-[11px] text-gray-400">
              {formatReviewDate(userReview.updatedAt || userReview.createdAt)}
            </span>
          </div>

          <div className="mt-1 flex gap-1 text-[#9A7B3F] text-xs">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={
                  star <= userReview.rating ? "text-[#9A7B3F]" : "text-gray-300"
                }
              />
            ))}
          </div>

          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            {userReview.comment}
          </p>
        </div>
      )}

      {/* Sorting & Filter Bar */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <h3 className="text-sm font-semibold tracking-wide text-gray-800 uppercase text-[11px]">
          Customer Reviews ({stats.totalReviews})
        </h3>

        <div className="flex items-center gap-2 text-xs">
          <FaSortAmountDown className="text-gray-400" />
          <span className="text-gray-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="cursor-pointer bg-white border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-[#9A7B3F]"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">
          Loading authentic customer reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-14 text-center border border-dashed border-gray-200 mt-6 bg-white">
          <p className="text-sm text-gray-600 font-medium">
            No reviews yet for this timepiece.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Be the first to share your experience with the community.
          </p>
          <button
            type="button"
            onClick={handleOpenWriteModal}
            className="cursor-pointer mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs tracking-wider uppercase text-white bg-[#111827] hover:bg-[#9A7B3F] transition"
          >
            <FaPen className="text-[10px]" /> Write First Review
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {reviews.map((rev) => {
            const isAuthor = user && (user._id === rev.userId?._id || user.id === rev.userId?._id);
            return (
              <article key={rev._id} className="py-6 transition hover:bg-gray-50/50 px-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    {rev.title && (
                      <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                        {rev.title}
                      </h4>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex gap-1 text-xs text-[#9A7B3F]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={
                              star <= rev.rating
                                ? "text-[#9A7B3F]"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-gray-700">
                        {rev.rating}.0
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-gray-400 font-mono">
                    {formatReviewDate(rev.createdAt)}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {rev.comment}
                </p>

                <div className="mt-4 flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] font-semibold uppercase">
                    {(rev.userId?.userName || "C")[0]}
                  </div>
                  <span className="font-medium text-gray-900">
                    {rev.userId?.userName || "Verified Customer"}
                  </span>
                  {isAuthor && (
                    <span className="text-[10px] text-[#9A7B3F] font-semibold ml-1">
                      (You)
                    </span>
                  )}
                  {rev.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                      <FaCheckCircle className="text-[9px]" /> Verified Purchase
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4 text-xs">
          <p className="text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className={`cursor-pointer px-3 py-1.5 border text-xs uppercase tracking-wider transition ${
                page <= 1
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:border-[#9A7B3F] hover:text-[#9A7B3F]"
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              className={`cursor-pointer px-3 py-1.5 border text-xs uppercase tracking-wider transition ${
                page >= pagination.totalPages
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:border-[#9A7B3F] hover:text-[#9A7B3F]"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Write / Edit Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-gray-200 p-6 shadow-2xl relative animate-fadeIn">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition"
            >
              <FaTimes />
            </button>

            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#9A7B3F] uppercase">
              {userReview ? "Modify Review" : "Your Evaluation"}
            </p>
            <h3 className="mt-1 text-xl font-serif text-gray-900">
              {userReview ? "Edit Your Review" : "Rate & Review Timepiece"}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Share details of your experience with {productName || "this product"}.
            </p>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Overall Rating *
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 text-2xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                      >
                        <FaStar
                          className={
                            star <= (hoverRating || rating)
                              ? "text-[#9A7B3F]"
                              : "text-gray-200"
                          }
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-gray-500 ml-2">
                    {hoverRating || rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Exceptional craftsmanship and timeless design"
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#9A7B3F]"
                />
              </div>

              {/* Comment text area */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Review Details *
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {comment.length}/1000 characters
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike? How does it wear on the wrist? Share details for other collectors..."
                  className="w-full border border-gray-300 p-3 text-sm text-gray-900 focus:outline-none focus:border-[#9A7B3F]"
                />
              </div>

              {isVerifiedPurchase && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <FaCheckCircle className="text-emerald-600" />
                  <span>
                    Your purchase has been verified! This review will display a <strong>Verified Buyer</strong> badge.
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="cursor-pointer px-4 py-2 text-xs uppercase tracking-wider text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer px-6 py-2.5 text-xs font-medium tracking-wider uppercase bg-[#111827] text-white hover:bg-[#9A7B3F] transition disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : userReview
                    ? "Save Changes"
                    : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white p-6 shadow-xl border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900">
              Delete Your Review?
            </h4>
            <p className="mt-2 text-xs text-gray-600">
              Are you sure you want to remove your review for this product? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="cursor-pointer px-3 py-1.5 text-xs uppercase tracking-wider text-gray-600 hover:text-gray-900"
              >
                Keep Review
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteReview}
                className="cursor-pointer px-4 py-1.5 text-xs uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition"
              >
                {submitting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReviewsSection;