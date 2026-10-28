import { useCallback, useEffect, useState } from "react";
import {
  FaSearch,
  FaStar,
  FaEye,
  FaTrashAlt,
  FaCheckCircle,
  FaTimes,
  FaEyeSlash,
  FaRedo,
} from "react-icons/fa";
import toast from "react-hot-toast";
import MainLayout from "../../components/admin/MainLayout";
import api from "../../api/axios.js";

const PAGE_LIMIT = 10;

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminReview = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    approvedCount: 0,
    hiddenCount: 0,
    verifiedCount: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });

  // Modals & Action States
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/reviews", {
        params: {
          page,
          limit: PAGE_LIMIT,
          status: statusFilter,
          rating: ratingFilter,
          search: searchTerm.trim(),
        },
      });

      if (response.data.success) {
        setReviews(response.data.reviews || []);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, ratingFilter, searchTerm]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setRatingFilter("ALL");
    setPage(1);
  };

  // Toggle Visibility (Approved <-> Hidden)
  const handleToggleStatus = async (review) => {
    try {
      setActionLoading(true);
      const newStatus = review.status === "APPROVED" ? "HIDDEN" : "APPROVED";
      const response = await api.patch(`/admin/reviews/${review._id}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        toast.success(
          newStatus === "APPROVED"
            ? "Review is now visible to customers."
            : "Review is now hidden from customers."
        );
        // Update local state directly
        setReviews((prev) =>
          prev.map((r) =>
            r._id === review._id ? { ...r, status: newStatus } : r
          )
        );
        if (selectedReview && selectedReview._id === review._id) {
          setSelectedReview((prev) => ({ ...prev, status: newStatus }));
        }
        // Update stats
        setStats((prev) => ({
          ...prev,
          approvedCount:
            newStatus === "APPROVED"
              ? prev.approvedCount + 1
              : Math.max(0, prev.approvedCount - 1),
          hiddenCount:
            newStatus === "HIDDEN"
              ? prev.hiddenCount + 1
              : Math.max(0, prev.hiddenCount - 1),
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update review status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete review
  const handleDeleteConfirm = async () => {
    if (!reviewToDelete?._id) return;
    try {
      setActionLoading(true);
      const response = await api.delete(`/admin/reviews/${reviewToDelete._id}`);
      if (response.data.success) {
        toast.success("Review permanently removed.");
        setDeleteModalOpen(false);
        setReviewToDelete(null);
        fetchReviews();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete review.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#9A7B3F] uppercase">
            MODERATION & FEEDBACK
          </p>
          <h1 className="text-2xl font-light tracking-wide text-gray-900 mt-1">
            Review Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitor customer reviews, ratings, and moderate public feedback.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReviews}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:border-[#9A7B3F] hover:text-[#9A7B3F] transition shadow-xs"
        >
          <FaRedo className={`text-xs ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Reviews */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Reviews
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-light text-gray-900">
              {stats.totalReviews}
            </span>
            <span className="text-xs text-gray-400">Storewide</span>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Average Rating
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-3xl font-light text-gray-900">
              {stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"}
            </span>
            <div className="flex gap-1 text-[#9A7B3F] text-xs">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={
                    star <= Math.round(stats.averageRating || 0)
                      ? "text-[#9A7B3F]"
                      : "text-gray-200"
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Visible / Approved */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Publicly Approved
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-light text-emerald-700">
              {stats.approvedCount}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              Active
            </span>
          </div>
        </div>

        {/* Hidden / Moderated */}
        <div className="bg-white border border-gray-200 p-5 shadow-xs">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Hidden / Moderated
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-light text-rose-600">
              {stats.hiddenCount}
            </span>
            <span className="text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 border border-rose-200">
              Restricted
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 p-4 mb-6 shadow-xs">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row md:items-center gap-4"
        >
          {/* Search box */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, product name, or review comment..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 focus:outline-none focus:border-[#9A7B3F] bg-[#fafafa]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="cursor-pointer border border-gray-300 py-2 px-3 text-xs bg-white focus:outline-none focus:border-[#9A7B3F]"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved (Visible)</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
              Rating:
            </span>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="cursor-pointer border border-gray-300 py-2 px-3 text-xs bg-white focus:outline-none focus:border-[#9A7B3F]"
            >
              <option value="ALL">All Stars</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          {/* Reset button */}
          {(searchTerm || statusFilter !== "ALL" || ratingFilter !== "ALL") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="cursor-pointer px-3 py-2 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-[#fafafa] text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Review Content</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    Loading reviews...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    No customer reviews match your filters.
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => {
                  const productImage =
                    rev.productId?.images?.[0] ||
                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100";
                  return (
                    <tr
                      key={rev._id}
                      className="hover:bg-gray-50/80 transition"
                    >
                      {/* Product */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={productImage}
                            alt={rev.productId?.name || "Product"}
                            className="w-10 h-10 object-cover border border-gray-200 shrink-0"
                          />
                          <div className="max-w-[180px]">
                            <p className="font-medium text-gray-900 truncate">
                              {rev.productId?.name || "Product"}
                            </p>
                            <p className="text-[10px] text-[#9A7B3F] tracking-wider uppercase">
                              {rev.productId?.brand || "Oceanus"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {rev.userId?.userName || "Anonymous"}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {rev.userId?.email || ""}
                          </p>
                          {rev.isVerifiedPurchase && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 border border-emerald-200">
                              <FaCheckCircle className="text-[8px]" /> Verified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-800">
                            {rev.rating}.0
                          </span>
                          <div className="flex text-[#9A7B3F] text-[10px]">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar
                                key={star}
                                className={
                                  star <= rev.rating
                                    ? "text-[#9A7B3F]"
                                    : "text-gray-200"
                                }
                              />
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Review Comment Snippet */}
                      <td className="py-3 px-4 max-w-xs">
                        {rev.title && (
                          <p className="font-semibold text-gray-900 truncate">
                            {rev.title}
                          </p>
                        )}
                        <p className="text-gray-500 line-clamp-2 mt-0.5">
                          {rev.comment}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-gray-400 whitespace-nowrap text-[11px]">
                        {formatDate(rev.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {rev.status === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-emerald-700 bg-emerald-50 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-rose-700 bg-rose-50 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Hidden
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {/* Toggle Status (Hide / Unhide) */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(rev)}
                            disabled={actionLoading}
                            title={
                              rev.status === "APPROVED"
                                ? "Hide Review from storefront"
                                : "Make Review visible"
                            }
                            className={`cursor-pointer p-1.5 border text-xs transition ${
                              rev.status === "APPROVED"
                                ? "text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100"
                                : "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                            }`}
                          >
                            {rev.status === "APPROVED" ? (
                              <FaEyeSlash />
                            ) : (
                              <FaCheckCircle />
                            )}
                          </button>

                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReview(rev);
                              setDetailModalOpen(true);
                            }}
                            title="View full review"
                            className="cursor-pointer p-1.5 border border-gray-300 text-gray-600 hover:text-[#9A7B3F] hover:border-[#9A7B3F] bg-white transition"
                          >
                            <FaEye />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setReviewToDelete(rev);
                              setDeleteModalOpen(true);
                            }}
                            title="Delete review"
                            className="cursor-pointer p-1.5 border border-red-200 text-red-600 hover:bg-red-50 bg-white transition"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#fafafa] border-t border-gray-200 text-xs">
            <span className="text-gray-500">
              Showing page {pagination.page} of {pagination.totalPages} (Total:{" "}
              {pagination.total})
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`cursor-pointer px-3 py-1 border text-xs transition ${
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
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className={`cursor-pointer px-3 py-1 border text-xs transition ${
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
      </div>

      {/* Detail Modal */}
      {detailModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-white border border-gray-200 p-6 shadow-2xl relative animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setDetailModalOpen(false);
                setSelectedReview(null);
              }}
              className="cursor-pointer absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition"
            >
              <FaTimes />
            </button>

            <p className="text-[10px] font-semibold tracking-[0.25em] text-[#9A7B3F] uppercase">
              REVIEW INSPECTION
            </p>
            <h3 className="text-lg font-medium text-gray-900 mt-1">
              Customer Feedback Details
            </h3>

            {/* Product & User Header */}
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 flex items-center gap-3">
              <img
                src={
                  selectedReview.productId?.images?.[0] ||
                  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100"
                }
                alt=""
                className="w-12 h-12 object-cover border border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {selectedReview.productId?.name}
                </p>
                <p className="text-[11px] text-[#9A7B3F]">
                  {selectedReview.productId?.brand}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium text-gray-900">
                  {selectedReview.userId?.userName} ({selectedReview.userId?.email})
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Verified Buyer:</span>
                <span
                  className={`font-semibold ${
                    selectedReview.isVerifiedPurchase
                      ? "text-emerald-700"
                      : "text-gray-500"
                  }`}
                >
                  {selectedReview.isVerifiedPurchase ? "Yes (Delivered Order)" : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Score:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-800">
                    {selectedReview.rating} / 5
                  </span>
                  <div className="flex text-[#9A7B3F]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={
                          star <= selectedReview.rating
                            ? "text-[#9A7B3F]"
                            : "text-gray-200"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Submitted:</span>
                <span className="text-gray-700">
                  {formatDate(selectedReview.createdAt)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Public Status:</span>
                <span
                  className={`font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 border ${
                    selectedReview.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {selectedReview.status}
                </span>
              </div>

              {selectedReview.title && (
                <div className="pt-2">
                  <span className="text-gray-500 font-semibold block mb-1">
                    Headline:
                  </span>
                  <p className="text-gray-900 font-medium">
                    {selectedReview.title}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <span className="text-gray-500 font-semibold block mb-1">
                  Full Comment:
                </span>
                <div className="p-3 bg-gray-50 border border-gray-200 text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedReview.comment}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-between items-center pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedReview)}
                className={`cursor-pointer px-4 py-2 text-xs uppercase tracking-wider font-medium border transition ${
                  selectedReview.status === "APPROVED"
                    ? "border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                    : "border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                }`}
              >
                {selectedReview.status === "APPROVED"
                  ? "Hide From Storefront"
                  : "Approve for Storefront"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedReview(null);
                }}
                className="cursor-pointer px-4 py-2 text-xs uppercase tracking-wider bg-gray-900 text-white hover:bg-black transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && reviewToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white p-6 shadow-2xl border border-gray-200">
            <h4 className="text-base font-semibold text-gray-900">
              Permanently Delete Review?
            </h4>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete this customer review for{" "}
              <strong>{reviewToDelete.productId?.name || "this product"}</strong>? This
              action cannot be reversed.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setReviewToDelete(null);
                }}
                className="cursor-pointer px-3 py-1.5 text-xs uppercase tracking-wider text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteConfirm}
                className="cursor-pointer px-4 py-1.5 text-xs uppercase tracking-wider bg-red-600 text-white hover:bg-red-700 transition"
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AdminReview;