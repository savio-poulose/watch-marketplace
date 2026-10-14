import { useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "../../components/admin/MainLayout";
import api from "../../api/axios.js";
import toast from "react-hot-toast";

const ORDER_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
];

const STATUS_STYLES = {
  PLACED: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  RETURN_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
  RETURNED: "bg-gray-100 text-gray-700 border-gray-200",
};

const PAYMENT_STYLES = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
};

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatStatus = (status) => {
  const value = String(status || "PLACED").toUpperCase();
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

const getOrderId = (order) => String(order?._id || order?.id || "");

const getOrdersFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.data?.orders)) return data.data.orders;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getCustomerName = (order) => {
  const user = order?.userId;
  if (user && typeof user === "object") {
    return user.name || user.fullName || user.email || "Customer";
  }
  return order?.customerName || order?.shippingAddress?.name || "Customer";
};

const getCustomerEmail = (order) => {
  const user = order?.userId;
  if (user && typeof user === "object") return user.email || "";
  return order?.customerEmail || "";
};

const Badge = ({ value, styles }) => (
  <span
    className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
      styles[value] || "bg-gray-50 text-gray-700 border-gray-200"
    }`}
  >
    {formatStatus(value)}
  </span>
);

const AdminOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [nextStatus, setNextStatus] = useState("");

  // Frontend-only overrides. These survive opening/closing the modal and refetching
  // orders during this page session, but intentionally are not saved to MongoDB.
  const [paymentStatusOverrides, setPaymentStatusOverrides] = useState({});

  const getDisplayPaymentStatus = useCallback(
    (order) => {
      const id = getOrderId(order);
      if (paymentStatusOverrides[id]) return paymentStatusOverrides[id];
      // A delivered COD order is treated as paid for this UI preview.
      if (
        String(order?.orderStatus || "").toUpperCase() === "DELIVERED" &&
        String(order?.paymentMethod || "").toUpperCase() === "COD"
      ) {
        return "PAID";
      }
      return String(order?.paymentStatus || "PENDING").toUpperCase();
    },
    [paymentStatusOverrides],
  );

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/admin/orders");
      setOrders(getOrdersFromResponse(response.data));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load orders. Check your admin API route.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const status = String(order.orderStatus || "PLACED").toUpperCase();
      const paymentStatus = getDisplayPaymentStatus(order);
      const paymentMethod = String(order.paymentMethod || "").toUpperCase();
      const matchesSearch =
        !term ||
        String(order.orderNumber || "")
          .toLowerCase()
          .includes(term) ||
        getOrderId(order).toLowerCase().includes(term) ||
        getCustomerName(order).toLowerCase().includes(term) ||
        getCustomerEmail(order).toLowerCase().includes(term);
      const matchesStatus = statusFilter === "ALL" || status === statusFilter;
      const matchesPayment =
        paymentFilter === "ALL" ||
        paymentStatus === paymentFilter ||
        paymentMethod === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, search, statusFilter, paymentFilter, getDisplayPaymentStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, paymentFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) =>
        ["PLACED", "CONFIRMED"].includes(
          String(order.orderStatus || "").toUpperCase(),
        ),
      ).length,
      shipped: orders.filter(
        (order) => String(order.orderStatus || "").toUpperCase() === "SHIPPED",
      ).length,
      delivered: orders.filter(
        (order) =>
          String(order.orderStatus || "").toUpperCase() === "DELIVERED",
      ).length,
    }),
    [orders],
  );

  const openOrderDetails = async (order) => {
    const orderId = getOrderId(order);
    if (!orderId) {
      setError("Order ID is missing.");
      return;
    }

    setSelectedOrder(order);
    setNextStatus(String(order.orderStatus || "PLACED").toUpperCase());
    setDetailsLoading(true);
    setError("");

    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      const detailedOrder =
        response.data?.order || response.data?.data?.order || response.data;
      if (detailedOrder && !detailedOrder.success) {
        setSelectedOrder({
          ...order,
          ...detailedOrder,
          // Preserve this order's frontend-only payment status when details load.
          paymentStatus: getDisplayPaymentStatus({
            ...order,
            ...detailedOrder,
          }),
        });
        setNextStatus(
          String(detailedOrder.orderStatus || "PLACED").toUpperCase(),
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load full order details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder) return;
    const orderId = getOrderId(selectedOrder);
    const currentStatus = String(
      selectedOrder.orderStatus || "PLACED",
    ).toUpperCase();

    if (!ORDER_STATUSES.includes(nextStatus)) {
      setError("Select a valid order status.");
      return;
    }
    if (nextStatus === currentStatus) {
      setError("Select a different status.");
      return;
    }
    if (["DELIVERED", "CANCELLED", "RETURNED"].includes(currentStatus)) {
      setError(
        "This order is in a terminal status and cannot be changed here.",
      );
      return;
    }

    try {
      setUpdatingId(orderId);
      setError("");
      const response = await api.patch(`/admin/orders/${orderId}/status`, {
        orderStatus: nextStatus,
      });
      const updatedOrder =
        response.data?.order || response.data?.data?.order || {};
      const nextPaymentStatus =
        nextStatus === "DELIVERED" &&
        String(selectedOrder.paymentMethod || "").toUpperCase() === "COD"
          ? "PAID"
          : getDisplayPaymentStatus(selectedOrder);

      // Store the UI-only payment override so the table and modal agree.
      if (
        nextStatus === "DELIVERED" &&
        String(selectedOrder.paymentMethod || "").toUpperCase() === "COD"
      ) {
        setPaymentStatusOverrides((previous) => ({
          ...previous,
          [orderId]: "PAID",
        }));
      }

      setOrders((previous) =>
        previous.map((order) =>
          getOrderId(order) === orderId
            ? {
                ...order,
                ...updatedOrder,
                orderStatus: nextStatus,
                paymentStatus: nextPaymentStatus,
              }
            : order,
        ),
      );
      setSelectedOrder((previous) => ({
        ...previous,
        ...updatedOrder,
        orderStatus: nextStatus,
        paymentStatus: nextPaymentStatus,
      }));
      toast.success(
        nextStatus === "DELIVERED" &&
          String(selectedOrder.paymentMethod || "").toUpperCase() === "COD"
          ? "Order delivered. Payment marked PAID in this UI preview."
          : "Order status updated successfully.",
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update order status. Check your admin API.",
      );
      toast.error(
        err.response?.data?.message || "Unable to update order status.",
      );
    } finally {
      setUpdatingId("");
    }
  };

  const updatePaymentStatusUI = (orderId, paymentStatus) => {
    setPaymentStatusOverrides((previous) => ({
      ...previous,
      [orderId]: paymentStatus,
    }));
    setOrders((previous) =>
      previous.map((order) =>
        getOrderId(order) === orderId ? { ...order, paymentStatus } : order,
      ),
    );
    setSelectedOrder((previous) =>
      previous && getOrderId(previous) === orderId
        ? { ...previous, paymentStatus }
        : previous,
    );
    toast.success(
      `Payment status changed to ${formatStatus(
        paymentStatus,
      )} in this UI only.`,
    );
  };

  const exportOrders = () => {
    const headers = [
      "Order Number",
      "Customer",
      "Email",
      "Date",
      "Items",
      "Total",
      "Payment Method",
      "Payment Status",
      "Order Status",
    ];
    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = filteredOrders.map((order) => [
      order.orderNumber || getOrderId(order),
      getCustomerName(order),
      getCustomerEmail(order),
      formatDate(order.createdAt),
      (order.items || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
      ),
      order.totalAmount,
      order.paymentMethod,
      getDisplayPaymentStatus(order),
      order.orderStatus,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "oceanus-orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 px-4 py-6 text-[#111827] sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9A7B3F]">
              OCEANUS Administration
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Orders
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              View customer purchases and manage order fulfilment.
            </p>
          </div>
          <button
            onClick={exportOrders}
            className="border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:border-[#9A7B3F]"
          >
            Export CSV
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Total orders", stats.total],
            ["Pending", stats.pending],
            ["Shipped", stats.shipped],
            ["Delivered", stats.delivered],
          ].map(([label, value]) => (
            <div key={label} className="border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_190px_110px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, customer, email..."
            className="border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"
          >
            <option value="ALL">All order statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            className="border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"
          >
            <option value="ALL">All payment statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
            <option value="COD">Cash on delivery</option>
          </select>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="border border-gray-300 bg-white px-3 py-3 text-sm"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-4">Order</th>
                <th className="px-4 py-4">Customer</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Total</th>
                <th className="px-4 py-4">Payment</th>
                <th className="px-4 py-4">Order status</th>
                <th className="px-4 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const paymentStatus = getDisplayPaymentStatus(order);
                  return (
                    <tr key={getOrderId(order)} className="hover:bg-gray-50/70">
                      <td className="px-4 py-4">
                        <p className="font-semibold">
                          {order.orderNumber ||
                            `#${getOrderId(order).slice(-8).toUpperCase()}`}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {getOrderId(order)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium">{getCustomerName(order)}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {getCustomerEmail(order)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="mb-2 text-xs text-gray-500">
                          {formatStatus(order.paymentMethod || "—")}
                        </p>
                        <Badge value={paymentStatus} styles={PAYMENT_STYLES} />
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          value={order.orderStatus}
                          styles={STATUS_STYLES}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="font-semibold text-[#9A7B3F] hover:underline"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 text-sm text-gray-500 sm:flex-row sm:items-center">
          <p>
            Showing {filteredOrders.length ? (safePage - 1) * pageSize + 1 : 0}–
            {Math.min(safePage * pageSize, filteredOrders.length)} of{" "}
            {filteredOrders.length} orders
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="border border-gray-300 bg-white px-3 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {safePage} of {totalPages}
            </span>
            <button
              disabled={safePage >= totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              className="border border-gray-300 bg-white px-3 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
            <div className="my-6 w-full max-w-3xl bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A7B3F]">
                    Order details
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {selectedOrder.orderNumber ||
                      `#${getOrderId(selectedOrder).slice(-8).toUpperCase()}`}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-2 py-1 text-2xl leading-none text-gray-500 hover:text-gray-900"
                  aria-label="Close details"
                >
                  ×
                </button>
              </div>
              <div className="space-y-6 px-5 py-5 sm:px-6">
                {detailsLoading && (
                  <p className="text-sm text-gray-500">
                    Refreshing order details...
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Customer
                    </p>
                    <p className="mt-2 font-semibold">
                      {getCustomerName(selectedOrder)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {getCustomerEmail(selectedOrder)}
                    </p>
                  </div>
                  <div className="border border-gray-200 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Payment
                    </p>
                    <p className="mt-2 text-sm">
                      Method:{" "}
                      <strong>
                        {formatStatus(selectedOrder.paymentMethod || "—")}
                      </strong>
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm">Status:</span>
                      <Badge
                        value={getDisplayPaymentStatus(selectedOrder)}
                        styles={PAYMENT_STYLES}
                      />
                    </div>
                    <p className="mt-2 text-sm">
                      Total:{" "}
                      <strong>{formatPrice(selectedOrder.totalAmount)}</strong>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold">Items</h3>
                  <div className="divide-y divide-gray-100 border border-gray-200">
                    {(selectedOrder.items || []).map((item, index) => {
                      const product =
                        item.productId && typeof item.productId === "object"
                          ? item.productId
                          : item.product;
                      const variant =
                        item.variantId && typeof item.variantId === "object"
                          ? item.variantId
                          : null;
                      return (
                        <div
                          key={
                            item._id || `${getOrderId(selectedOrder)}-${index}`
                          }
                          className="flex items-start justify-between gap-4 p-3"
                        >
                          <div>
                            <p className="font-medium">
                              {item.productName ||
                                product?.name ||
                                item.name ||
                                "Product"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              SKU: {variant?.sku || item.sku || "—"} · Qty:{" "}
                              {item.quantity || 1}
                            </p>
                          </div>
                          <p className="whitespace-nowrap font-semibold">
                            {formatPrice(item.price || item.unitPrice)}
                          </p>
                        </div>
                      );
                    })}
                    {(!selectedOrder.items ||
                      selectedOrder.items.length === 0) && (
                      <p className="p-4 text-sm text-gray-500">
                        No item details available.
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-5">
                  <h3 className="font-semibold">Update order status</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Marking a COD order as delivered changes its payment badge
                    to Paid in this UI only.
                  </p>
                  {["DELIVERED", "CANCELLED", "RETURNED"].includes(
                    String(selectedOrder.orderStatus || "").toUpperCase(),
                  ) ? (
                    <p className="mt-3 text-sm text-gray-600">
                      This order is in a terminal status. Use a dedicated
                      return/refund workflow if required.
                    </p>
                  ) : (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <select
                        value={nextStatus}
                        onChange={(event) => setNextStatus(event.target.value)}
                        className="flex-1 border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={updateOrderStatus}
                        disabled={
                          Boolean(updatingId) ||
                          nextStatus ===
                            String(
                              selectedOrder.orderStatus || "",
                            ).toUpperCase()
                        }
                        className="bg-[#111827] px-5 py-3 text-sm font-medium text-white hover:bg-[#9A7B3F] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingId ? "Updating..." : "Save status"}
                      </button>
                    </div>
                  )}
                </div>

                  
              </div>
              <div className="flex justify-end border-t border-gray-200 px-5 py-4 sm:px-6">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="border border-gray-300 px-5 py-2.5 text-sm font-medium hover:border-[#9A7B3F]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminOrder;
