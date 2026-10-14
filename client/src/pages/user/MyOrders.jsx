
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios.js";
import Navbar from "../../components/layout/Navbar.jsx";

const FILTERS = ["ALL", "IN PROGRESS", "DELIVERED", "CANCELLED"];

const STATUS_STYLES = {
  PLACED: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  RETURNED: "bg-gray-100 text-gray-700 border-gray-200",
};

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
};

const getOrderStatus = (order) =>
  String(order.orderStatus || order.status || "PLACED").toUpperCase();

const getStatusLabel = (status) =>
  status.charAt(0) + status.slice(1).toLowerCase();

const getOrderItems = (order) =>
  Array.isArray(order.items) ? order.items : [];

const canCancelOrder = (order) => {
  const status = getOrderStatus(order);

  return (
    ["PLACED", "CONFIRMED", "PROCESSING"].includes(status) &&
    String(order.paymentStatus || "PENDING").toUpperCase() !== "PAID"
  );
};

const getOrdersFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.orders)) return data.data.orders;
  return [];
};

const MyOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/user/order");
      console.log(response)
      setOrders(getOrdersFromResponse(response.data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = getOrderStatus(order);

      if (activeFilter === "ALL") return true;

      if (activeFilter === "IN PROGRESS") {
        return ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(
          status
        );
      }

      if (activeFilter === "DELIVERED") return status === "DELIVERED";
      if (activeFilter === "CANCELLED") return status === "CANCELLED";

      return true;
    });
  }, [orders, activeFilter]);

  const handleCancelOrder = async () => {
    if (!cancelTarget) return;

    const orderId = getId(cancelTarget);
    if (!orderId) {
      setError("Unable to identify this order.");
      setCancelTarget(null);
      return;
    }

    try {
      setCancellingId(orderId);
      setError("");

      
      await api.patch(`/user/order/${orderId}/cancel`, {
        reason: "Cancelled by customer",
      });

      setCancelTarget(null);
      await fetchOrders();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to cancel this order. Please try again."
      );
    } finally {
      setCancellingId("");
    }
  };

  const orderCounts = useMemo(
    () => ({
      ALL: orders.length,
      "IN PROGRESS": orders.filter((order) =>
        ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(
          getOrderStatus(order)
        )
      ).length,
      DELIVERED: orders.filter(
        (order) => getOrderStatus(order) === "DELIVERED"
      ).length,
      CANCELLED: orders.filter(
        (order) => getOrderStatus(order) === "CANCELLED"
      ).length,
    }),
    [orders]
  );

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#111827]">
      {/* Navbar */}
     <Navbar/>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Page heading */}
        <div className="mb-8">
          

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-[#9A7B3F]">
                Your OCEANUS collection
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                My Orders
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                View your purchases and follow their delivery status.
              </p>
            </div>

            <Link
              to="/user/collections"
              className="inline-flex w-fit items-center gap-2 border border-[#111827] px-5 py-3 text-sm font-medium transition hover:bg-[#111827] hover:text-white"
            >
              Continue Shopping <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 overflow-x-auto border-b border-gray-200">
          <div className="flex min-w-max gap-6 sm:gap-8">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`border-b-2 px-1 pb-4 text-sm transition ${
                  activeFilter === filter
                    ? "border-[#9A7B3F] font-semibold text-[#111827]"
                    : "border-transparent text-gray-500 hover:text-[#111827]"
                }`}
              >
                {filter === "ALL"
                  ? "All Orders"
                  : filter
                      .toLowerCase()
                      .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                <span className="ml-2 text-xs text-gray-400">
                  {orderCounts[filter]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col justify-between gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchOrders}
              className="font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse border border-gray-200 bg-white p-5 sm:p-6"
              >
                <div className="mb-5 h-4 w-40 rounded bg-gray-200" />
                <div className="flex gap-4">
                  <div className="h-28 w-28 rounded bg-gray-200" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                    <div className="h-4 w-1/4 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty state */
          <div className="border border-gray-200 bg-white px-5 py-16 text-center sm:py-24">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F8F8F6]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                className="h-7 w-7 text-[#9A7B3F]"
                aria-hidden="true"
              >
                <path d="M6 7h12l1 14H5L6 7Z" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>
            </div>

            <h2 className="text-xl font-medium">
              {orders.length === 0
                ? "No orders yet"
                : "No orders in this category"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {orders.length === 0
                ? "Your next favourite watch could be waiting for you. Explore the collection to get started."
                : "Try another filter to find the order you're looking for."}
            </p>

            <Link
              to="/user/products"
              className="mt-7 inline-flex items-center justify-center bg-[#111827] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#9A7B3F]"
            >
              Explore Watches
            </Link>
          </div>
        ) : (
          /* Order list */
          <div className="space-y-5">
            {filteredOrders.map((order) => {
              const orderId = getId(order);
              const status = getOrderStatus(order);
              const items = getOrderItems(order);
              const firstItem = items[0];
              const extraItems = Math.max(items.length - 1, 0);

              const paymentMethod = String(
                order.paymentMethod || "COD"
              ).toUpperCase();

              const paymentStatus = String(
                order.paymentStatus || "PENDING"
              ).toUpperCase();

              const statusStyle =
                STATUS_STYLES[status] ||
                "border-gray-200 bg-gray-50 text-gray-700";

              return (
                <article
                  key={orderId || order.orderNumber}
                  className="overflow-hidden border border-gray-200 bg-white transition hover:border-gray-300"
                >
                  {/* Order header */}
                  <div className="flex flex-col justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:gap-10">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-400">
                          Order Number
                        </p>
                        <p className="mt-1 text-sm font-medium text-[#111827]">
                          {order.orderNumber || orderId}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-400">
                          Order Date
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center gap-2 border px-3 py-1.5 text-xs font-medium ${statusStyle}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {getStatusLabel(status)}
                    </span>
                  </div>

                  {/* Product and total */}
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 gap-4">
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden bg-[#F8F8F6] sm:h-32 sm:w-32">
                          {firstItem?.image ? (
                            <img
                              src={firstItem.image}
                              alt={firstItem.productName || "Ordered watch"}
                              className="h-full w-full object-contain p-2"
                              loading="lazy"
                            />
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              className="h-9 w-9 text-gray-300"
                              aria-hidden="true"
                            >
                              <circle cx="12" cy="12" r="8" />
                              <path d="M12 7v5l3 2" />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 py-1">
                          <p className="text-xs uppercase tracking-[0.15em] text-[#9A7B3F]">
                            HORAE Timepiece
                          </p>
                          <h2 className="mt-2 line-clamp-2 text-base font-medium text-[#111827] sm:text-lg">
                            {firstItem?.productName || "Watch"}
                          </h2>
                          <p className="mt-1 text-sm text-gray-500">
                            Quantity: {firstItem?.quantity || 0}
                          </p>

                          {extraItems > 0 && (
                            <p className="mt-1 text-sm text-gray-500">
                              + {extraItems} more{" "}
                              {extraItems === 1 ? "item" : "items"}
                            </p>
                          )}

                          {firstItem?.variantSku && (
                            <p className="mt-2 break-all text-xs text-gray-400">
                              SKU: {firstItem.variantSku}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4 sm:min-w-40 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                        <p className="text-xs text-gray-500">Order Total</p>
                        <p className="mt-1 text-xl font-semibold text-[#111827]">
                          {formatPrice(order.totalAmount)}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {paymentMethod === "COD"
                            ? "Cash on Delivery"
                            : paymentMethod}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Payment:{" "}
                          <span className="font-medium text-gray-700">
                            {getStatusLabel(paymentStatus)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Order progress */}
                    {status !== "CANCELLED" && status !== "RETURNED" && (
                      <div className="mt-6 border-t border-gray-100 pt-5">
                        <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                          <span>Order progress</span>
                          <span className="font-medium text-[#111827]">
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center">
                          {[
                            "PLACED",
                            "CONFIRMED",
                            "SHIPPED",
                            "DELIVERED",
                          ].map((step, index, steps) => {
                            const stage = {
                              PLACED: 0,
                              CONFIRMED: 1,
                              PROCESSING: 1,
                              SHIPPED: 2,
                              DELIVERED: 3,
                            };

                            const currentStage = stage[status] ?? 0;
                            const complete = index <= currentStage;

                            return (
                              <div
                                key={step}
                                className="flex flex-1 items-center last:flex-none"
                              >
                                <div
                                  title={getStatusLabel(step)}
                                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                    complete
                                      ? "bg-[#9A7B3F]"
                                      : "bg-gray-200"
                                  }`}
                                />
                                {index < steps.length - 1 && (
                                  <div
                                    className={`h-px flex-1 ${
                                      index < currentStage
                                        ? "bg-[#9A7B3F]"
                                        : "bg-gray-200"
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-2 flex justify-between text-[10px] text-gray-400 sm:text-xs">
                          <span>Placed</span>
                          <span>Confirmed</span>
                          <span>Shipped</span>
                          <span>Delivered</span>
                        </div>
                      </div>
                    )}

                    {status === "CANCELLED" && (
                      <div className="mt-5 border-t border-gray-100 pt-4 text-sm text-red-600">
                        This order has been cancelled.
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/user/order/${orderId}`)
                        }
                        className="bg-[#111827] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#9A7B3F]"
                      >
                        View Details
                      </button>

                      {canCancelOrder(order) && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(order)}
                          disabled={cancellingId === orderId}
                          className="border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingId === orderId
                            ? "Cancelling..."
                            : "Cancel Order"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        {!loading && orders.length > 0 && (
          <p className="mt-8 text-center text-xs leading-5 text-gray-400">
            Need help with an order? Contact our customer support team.
          </p>
        )}
      </main>

      {/* Cancellation confirmation modal */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !cancellingId
            ) {
              setCancelTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
            className="w-full max-w-md border border-gray-200 bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M12 8v5m0 3h.01" />
                <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>

            <h2
              id="cancel-order-title"
              className="text-xl font-semibold text-[#111827]"
            >
              Cancel this order?
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Are you sure you want to cancel order{" "}
              <span className="font-medium text-gray-700">
                {cancelTarget.orderNumber || getId(cancelTarget)}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={Boolean(cancellingId)}
                onClick={() => setCancelTarget(null)}
                className="border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                disabled={Boolean(cancellingId)}
                onClick={handleCancelOrder}
                className="bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancellingId ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
