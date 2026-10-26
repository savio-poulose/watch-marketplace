import { useCallback, useEffect, useState } from "react";
import MainLayout from "../../components/admin/MainLayout";
import api from "../../api/axios.js";

const PAGE_LIMIT = 10;

const STATUS_STYLES = {
  REQUESTED: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  ITEM_RECEIVED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  REFUND_PENDING: "bg-purple-50 text-purple-700 border-purple-200",
  REFUNDED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const STATUS_LABELS = {
  REQUESTED: "Waiting for Admin",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ITEM_RECEIVED: "Item Received",
  REFUND_PENDING: "Refund Pending",
  REFUNDED: "Refunded",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "REQUESTED", label: "Waiting for Admin" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ITEM_RECEIVED", label: "Item Received" },
  { value: "REFUND_PENDING", label: "Refund Pending" },
  { value: "REFUNDED", label: "Refunded" },
];

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const getId = (value) => value?._id || value || "";

const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [selectedReturn, setSelectedReturn] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit: PAGE_LIMIT,
      };

      if (statusFilter) params.status = statusFilter;

      const response = await api.get("/admin/returns", { params });

      const data = response.data;

      setReturns(data.returns || []);
      setPagination(
        data.pagination || {
          page,
          limit: PAGE_LIMIT,
          total: (data.returns || []).length,
          totalPages: 1,
        }
      );
    } catch (err) {
      console.error(
        "Failed to fetch return requests:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load return requests. Check the admin returns API route."
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const updateReturn = async (returnId, status, extra = {}) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      if (status === "APPROVED" || status === "REJECTED") {
        await api.patch(`/admin/returns/${returnId}/review`, {
          status,
          ...extra,
        });
      } else {
        await api.patch(`/admin/returns/${returnId}/status`, {
          status,
        });
      }

      setSelectedReturn(null);
      setShowRejectForm(false);
      setRejectionReason("");

      setSuccess(
        `Return request ${
          STATUS_LABELS[status]?.toLowerCase() || "updated"
        } successfully.`
      );

      await fetchReturns();
    } catch (err) {
      console.error(
        "Failed to update return request:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to update the return request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (event) => {
    event.preventDefault();

    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejecting this return.");
      return;
    }

    if (!selectedReturn) return;

    await updateReturn(selectedReturn._id, "REJECTED", {
      rejectionReason: rejectionReason.trim(),
    });
  };

  const openRejectForm = (returnRequest) => {
    setSelectedReturn(returnRequest);
    setRejectionReason("");
    setShowRejectForm(true);
    setError("");
    setSuccess("");
  };

  const closeRejectForm = () => {
    if (actionLoading) return;

    setSelectedReturn(null);
    setShowRejectForm(false);
    setRejectionReason("");
    setError("");
  };

  const getCustomerName = (request) =>
    request.userId?.name || request.userId?.email || "Unknown customer";

  const getProductName = (request) =>
    request.productId?.name ||
    request.productName ||
    "Product details unavailable";

  const getOrderNumber = (request) => {
    const order = request.orderId;

    if (!order) return "—";

    return order.orderNumber || order._id || "—";
  };

  const getAllowedAction = (status) => {
    switch (status) {
      case "REQUESTED":
        return ["APPROVE", "REJECT"];

      case "APPROVED":
        return ["RECEIVED"];

      case "ITEM_RECEIVED":
        return ["REFUND_PENDING"];

      case "REFUND_PENDING":
        return ["REFUNDED"];

      default:
        return [];
    }
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    setPage(nextPage);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-6 lg:p-8">
        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A7B3F]">
              HORAE Administration
            </p>

            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Return Management
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Review customer return requests and manage their progress.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchReturns}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            <span aria-hidden="true">↻</span>
            Refresh
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Requests in this view</p>
            <p className="mt-2 text-2xl font-semibold">
              {pagination.total}
            </p>
          </div>

          <div className="border border-amber-200 bg-white p-5">
            <p className="text-sm text-gray-500">Waiting for Admin</p>
            <p className="mt-2 text-2xl font-semibold text-amber-700">
              {returns.filter((item) => item.status === "REQUESTED").length}
            </p>
          </div>

          <div className="border border-blue-200 bg-white p-5">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="mt-2 text-2xl font-semibold text-blue-700">
              {returns.filter((item) => item.status === "APPROVED").length}
            </p>
          </div>

          <div className="border border-emerald-200 bg-white p-5">
            <p className="text-sm text-gray-500">Refunded</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">
              {returns.filter((item) => item.status === "REFUNDED").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Customer return requests</h2>
            <p className="mt-1 text-xs text-gray-500">
              Filter requests by their current status.
            </p>
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9A7B3F] sm:w-64"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start justify-between gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="font-semibold"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {/* Return request table */}
        <div className="overflow-hidden border border-gray-200 bg-white">
          {loading ? (
            <div className="space-y-4 p-8">
              <div className="h-5 w-48 animate-pulse bg-gray-200" />
              <div className="h-12 animate-pulse bg-gray-100" />
              <div className="h-12 animate-pulse bg-gray-100" />
              <div className="h-12 animate-pulse bg-gray-100" />
            </div>
          ) : returns.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                ↩
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No return requests found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {statusFilter
                  ? "There are no requests with this status."
                  : "Customer return requests will appear here."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Product / Order</th>
                      <th className="px-5 py-4 font-medium">Customer</th>
                      <th className="px-5 py-4 font-medium">Return reason</th>
                      <th className="px-5 py-4 font-medium">Requested</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {returns.map((request) => {
                      const actions = getAllowedAction(request.status);

                      return (
                        <tr
                          key={request._id}
                          className="align-top transition hover:bg-gray-50"
                        >
                          <td className="px-5 py-5">
                            <p className="font-medium text-gray-900">
                              {getProductName(request)}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Order: {getOrderNumber(request)}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Quantity: {request.quantity}
                            </p>

                            {request.variantId?.sku && (
                              <p className="mt-1 text-xs text-gray-400">
                                SKU: {request.variantId.sku}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-5">
                            <p className="font-medium">
                              {getCustomerName(request)}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {request.userId?.email || "No email available"}
                            </p>
                          </td>

                          <td className="max-w-xs whitespace-normal px-5 py-5">
                            <p className="line-clamp-4 text-gray-600">
                              {request.reason || "No reason provided"}
                            </p>

                            {request.rejectionReason && (
                              <p className="mt-2 text-xs text-red-600">
                                Rejection: {request.rejectionReason}
                              </p>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-5 text-gray-500">
                            {formatDate(
                              request.requestedAt || request.createdAt
                            )}
                          </td>

                          <td className="px-5 py-5">
                            <span
                              className={`inline-flex whitespace-nowrap border px-3 py-1.5 text-xs font-medium ${
                                STATUS_STYLES[request.status] ||
                                "border-gray-200 bg-gray-50 text-gray-600"
                              }`}
                            >
                              {STATUS_LABELS[request.status] ||
                                request.status}
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex min-w-36 flex-col items-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedReturn(request)}
                                className="w-full border border-gray-300 px-3 py-2 text-xs font-medium hover:bg-gray-100"
                              >
                                View Details
                              </button>

                              {actions.includes("APPROVE") && (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    updateReturn(request._id, "APPROVED")
                                  }
                                  className="w-full bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              )}

                              {actions.includes("REJECT") && (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => openRejectForm(request)}
                                  className="w-full border border-red-300 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              )}

                              {actions.includes("RECEIVED") && (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    updateReturn(request._id, "ITEM_RECEIVED")
                                  }
                                  className="w-full bg-indigo-700 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
                                >
                                  Mark Item Received
                                </button>
                              )}

                              {actions.includes("REFUND_PENDING") && (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    updateReturn(request._id, "REFUND_PENDING")
                                  }
                                  className="w-full bg-purple-700 px-3 py-2 text-xs font-medium text-white hover:bg-purple-800 disabled:opacity-50"
                                >
                                  Start Refund
                                </button>
                              )}

                              {actions.includes("REFUNDED") && (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    updateReturn(request._id, "REFUNDED")
                                  }
                                  className="w-full bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                                >
                                  Mark Refunded
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  {pagination.total === 0
                    ? "No requests"
                    : `Showing ${(page - 1) * PAGE_LIMIT + 1}–${Math.min(
                        page * PAGE_LIMIT,
                        pagination.total
                      )} of ${pagination.total} requests`}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => handlePageChange(page - 1)}
                    className="border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-2 text-sm text-gray-600">
                    {page} / {Math.max(1, pagination.totalPages)}
                  </span>

                  <button
                    type="button"
                    disabled={page >= pagination.totalPages || loading}
                    onClick={() => handlePageChange(page + 1)}
                    className="border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Return details modal */}
        {selectedReturn && !showRejectForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedReturn(null);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="return-details-title"
              className="my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white shadow-xl"
            >
              <div className="flex items-start justify-between border-b border-gray-200 p-6">
                <div>
                  <h2
                    id="return-details-title"
                    className="text-xl font-semibold"
                  >
                    Return Request Details
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Request ID: {selectedReturn._id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReturn(null)}
                  className="text-2xl text-gray-400 hover:text-gray-900"
                  aria-label="Close details"
                >
                  ×
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Product
                    </p>
                    <p className="mt-1 font-medium">
                      {getProductName(selectedReturn)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Order ID
                    </p>
                    <p className="mt-1 break-all font-medium">
                      {getOrderNumber(selectedReturn)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Customer
                    </p>
                    <p className="mt-1 font-medium">
                      {getCustomerName(selectedReturn)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedReturn.userId?.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Quantity
                    </p>
                    <p className="mt-1 font-medium">
                      {selectedReturn.quantity}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Request Date
                    </p>
                    <p className="mt-1 font-medium">
                      {formatDate(
                        selectedReturn.requestedAt || selectedReturn.createdAt
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Current Status
                    </p>
                    <span
                      className={`mt-2 inline-flex border px-3 py-1.5 text-xs font-medium ${
                        STATUS_STYLES[selectedReturn.status] ||
                        "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                    >
                      {STATUS_LABELS[selectedReturn.status] ||
                        selectedReturn.status}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Customer's Reason
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {selectedReturn.reason || "No reason provided"}
                  </p>
                </div>

                {selectedReturn.rejectionReason && (
                  <div className="border-t border-gray-100 pt-5">
                    <p className="text-xs uppercase tracking-wide text-red-600">
                      Rejection Reason
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                      {selectedReturn.rejectionReason}
                    </p>
                  </div>
                )}

                <div className="flex justify-end border-t border-gray-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setSelectedReturn(null)}
                    className="border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject return modal */}
        {showRejectForm && selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reject-return-title"
              className="w-full max-w-lg bg-white shadow-xl"
            >
              <form onSubmit={handleReject}>
                <div className="border-b border-gray-200 p-6">
                  <h2
                    id="reject-return-title"
                    className="text-xl font-semibold"
                  >
                    Reject Return Request
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Provide a clear reason. The customer can see this reason.
                  </p>
                </div>

                <div className="p-6">
                  <label
                    htmlFor="rejectionReason"
                    className="block text-sm font-medium"
                  >
                    Rejection reason
                  </label>

                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(event) =>
                      setRejectionReason(event.target.value)
                    }
                    rows={4}
                    maxLength={1000}
                    required
                    placeholder="Explain why this return is rejected..."
                    className="mt-2 w-full border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                  />

                  {error && (
                    <p className="mt-3 text-sm text-red-600">{error}</p>
                  )}

                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeRejectForm}
                      disabled={actionLoading}
                      className="border border-gray-300 px-5 py-2.5 text-sm hover:bg-gray-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
                    >
                      {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminReturns;