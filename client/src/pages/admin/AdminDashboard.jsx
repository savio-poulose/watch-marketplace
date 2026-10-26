import { useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "../../components/admin/MainLayout";
import api from "../../api/axios.js";

const CURRENCY = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactCurrency = (value = 0) => {
  const amount = Number(value) || 0;
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return CURRENCY.format(amount);
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusClass = (status = "") => {
  const value = String(status).toLowerCase();
  if (["delivered", "completed", "paid", "success", "successful"].includes(value)) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (["cancelled", "canceled", "failed", "returned", "refunded"].includes(value)) {
    return "bg-red-50 text-red-700";
  }
  if (["pending", "processing", "confirmed", "shipped", "created"].includes(value)) {
    return "bg-amber-50 text-amber-800";
  }
  return "bg-gray-100 text-gray-700";
};

function RevenueChart({ data = [] }) {
  const points = useMemo(() => {
    const safeData = Array.isArray(data) ? data.slice(-12) : [];
    if (!safeData.length) return [];

    const values = safeData.map((item) => Math.max(0, Number(item.revenue) || 0));
    const max = Math.max(...values, 1);
    const width = 640;
    const height = 210;
    const left = 38;
    const right = 12;
    const top = 14;
    const bottom = 32;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    return safeData.map((item, index) => ({
      label: item.label || item.date || "",
      revenue: values[index],
      x: safeData.length === 1
        ? left + plotWidth / 2
        : left + (index / (safeData.length - 1)) * plotWidth,
      y: top + plotHeight - (values[index] / max) * plotHeight,
    }));
  }, [data]);

  if (!points.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-gray-500">
        No sales data available for this period.
      </div>
    );
  }

  const width = 640;
  const height = 210;
  const bottom = 32;
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${points[0].x},${height - bottom} ${line} ${points[points.length - 1].x},${height - bottom}`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Revenue over time chart"
        className="h-56 w-full overflow-visible"
      >
        {[0, 1, 2, 3].map((lineIndex) => {
          const y = 14 + (lineIndex * 164) / 3;
          return (
            <line
              key={lineIndex}
              x1="38"
              y1={y}
              x2="628"
              y2={y}
              stroke="#E5E7EB"
              strokeDasharray="4 5"
            />
          );
        })}
        <polygon points={area} fill="#9A7B3F" opacity="0.12" />
        <polyline
          points={line}
          fill="none"
          stroke="#9A7B3F"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="4" fill="#9A7B3F" />
            <title>{`${point.label}: ${CURRENCY.format(point.revenue)}`}</title>
            {(points.length <= 7 || index === 0 || index === points.length - 1 || index === Math.floor(points.length / 2)) && (
              <text
                x={point.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#6B7280"
              >
                {String(point.label).slice(0, 10)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatCard({ label, value, note, icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9A7B3F]/10 text-sm font-semibold text-[#9A7B3F]">
          {icon}
        </span>
      </div>
      <p className="mt-4 break-words text-2xl font-semibold text-[#111827]">
        {value}
      </p>
      {note && <p className="mt-2 text-xs text-gray-500">{note}</p>}
    </div>
  );
}

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [period, setPeriod] = useState("30days");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (selectedPeriod = period, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      // Expected endpoint: GET /admin/dashboard?period=30days
      const response = await api.get("/admin/dashboard", {
        params: { period: selectedPeriod },
      });

      const payload = response?.data;
      const result = payload?.data ?? payload;

      if (payload?.success === false) {
        throw new Error(payload.message || "Unable to load dashboard data.");
      }

      if (!result || typeof result !== "object") {
        throw new Error("The dashboard API returned an invalid response.");
      }

      setDashboard(result);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load dashboard. Check the backend endpoint."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboard(period);
  }, [period, fetchDashboard]);

  const summary = dashboard?.summary ?? {};
  const recentOrders = Array.isArray(dashboard?.recentOrders)
    ? dashboard.recentOrders
    : [];
  const sales = Array.isArray(dashboard?.sales) ? dashboard.sales : [];
  const topProducts = Array.isArray(dashboard?.topProducts)
    ? dashboard.topProducts
    : [];
  const lowStock = Array.isArray(dashboard?.lowStock) ? dashboard.lowStock : [];
  const orderStatuses = Array.isArray(dashboard?.orderStatuses)
    ? dashboard.orderStatuses
    : [];

  const totalStatusOrders = orderStatuses.reduce(
    (total, item) => total + (Number(item.count) || 0),
    0
  );

  const stats = [
    {
      label: "Total Revenue",
      value: compactCurrency(summary.totalRevenue),
      note: "For the selected period",
      icon: "₹",
    },
    {
      label: "Total Orders",
      value: Number(summary.totalOrders || 0).toLocaleString("en-IN"),
      note: "Orders in the selected period",
      icon: "#",
    },
    {
      label: "Total Customers",
      value: Number(summary.totalUsers || 0).toLocaleString("en-IN"),
      note: "Registered users",
      icon: "U",
    },
    {
      label: "Active Products",
      value: Number(summary.totalProducts || 0).toLocaleString("en-IN"),
      note: "Active catalogue products",
      icon: "W",
    },
  ];

  return (
    <MainLayout>
      <div className="min-w-0 space-y-6 p-4 md:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9A7B3F]">
              Oceanus / Overview
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#111827] md:text-3xl">
              Store Performance
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor revenue, orders, products, and inventory.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9A7B3F]"
              aria-label="Dashboard date range"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="12months">Last 12 months</option>
            </select>
            <button
              type="button"
              onClick={() => fetchDashboard(period, true)}
              disabled={loading || refreshing}
              className="rounded-lg bg-[#111827] px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p className="font-semibold">Dashboard data could not be loaded.</p>
            <p className="mt-1">{error}</p>
            
            <button
              type="button"
              onClick={() => fetchDashboard(period, true)}
              className="mt-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading && !dashboard ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            Loading Oceanus dashboard...
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-[#111827]">Revenue overview</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {period === "7days"
                        ? "Daily revenue for the last 7 days"
                        : period === "12months"
                        ? "Monthly revenue for the last 12 months"
                        : "Daily revenue for the last 30 days"}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-[#9A7B3F]">
                    {compactCurrency(summary.totalRevenue)}
                  </p>
                </div>
                <div className="mt-4">
                  <RevenueChart data={sales} />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-[#111827]">Order status</h2>
                <p className="mt-1 text-sm text-gray-500">Orders grouped by status</p>

                {orderStatuses.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-gray-500">
                    No order status data available.
                  </div>
                ) : (
                  <div className="mt-6 space-y-5">
                    {orderStatuses.map((item) => {
                      const count = Number(item.count) || 0;
                      const percentage = totalStatusOrders
                        ? Math.round((count / totalStatusOrders) * 100)
                        : 0;

                      return (
                        <div key={item.status}>
                          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                            <span className="capitalize text-gray-600">
                              {String(item.status || "Unknown").replaceAll("_", " ")}
                            </span>
                            <span className="font-semibold text-[#111827]">{count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-[#9A7B3F]"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5">
                  <h2 className="font-semibold text-[#111827]">Recent orders</h2>
                  <p className="mt-1 text-sm text-gray-500">Latest customer orders</p>
                </div>
                {recentOrders.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-500">No recent orders found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-5 py-3 font-medium">Order</th>
                          <th className="px-5 py-3 font-medium">Date</th>
                          <th className="px-5 py-3 font-medium">Amount</th>
                          <th className="px-5 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentOrders.map((order, index) => (
                          <tr key={order._id || order.id || index}>
                            <td className="whitespace-nowrap px-5 py-4 font-medium text-[#111827]">
                              {order.orderNumber || (order._id ? `#${String(order._id).slice(-8)}` : "—")}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-gray-800">
                              {CURRENCY.format(Number(order.totalAmount) || 0)}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(order.orderStatus)}`}>
                                {order.orderStatus || "Unknown"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5">
                  <h2 className="font-semibold text-[#111827]">Top-selling products</h2>
                  <p className="mt-1 text-sm text-gray-500">Ranked by quantity sold</p>
                </div>
                {topProducts.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-500">No product sales data available.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {topProducts.slice(0, 5).map((product, index) => (
                      <div key={product.productId || product._id || product.name || index} className="flex items-center justify-between gap-4 p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-semibold text-gray-600">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#111827]">
                              {product.name || product.productName || "Unnamed product"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {Number(product.quantitySold || product.unitsSold || 0)} sold
                            </p>
                          </div>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-[#111827]">
                          {compactCurrency(product.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
                <div>
                  <h2 className="font-semibold text-[#111827]">Low-stock alerts</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Variants that may need restocking
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  {lowStock.length} alerts
                </span>
              </div>
              {lowStock.length === 0 ? (
                <p className="p-8 text-center text-sm text-gray-500">
                  No low-stock items reported by the backend.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-5 py-3 font-medium">Product</th>
                        <th className="px-5 py-3 font-medium">SKU</th>
                        <th className="px-5 py-3 font-medium">Stock</th>
                        <th className="px-5 py-3 font-medium">Alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lowStock.map((item, index) => {
                        const stock = Number(item.stock ?? item.quantity ?? 0);
                        return (
                          <tr key={item.variantId || item._id || item.sku || index}>
                            <td className="px-5 py-4 font-medium text-[#111827]">
                              {item.productName || item.name || "Unnamed product"}
                            </td>
                            <td className="px-5 py-4 text-gray-600">{item.sku || "—"}</td>
                            <td className="px-5 py-4 font-semibold">{stock}</td>
                            <td className="px-5 py-4">
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                                Restock soon
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
