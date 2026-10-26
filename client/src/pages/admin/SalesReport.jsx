
import { useCallback, useEffect, useState } from "react";
import MainLayout from "../../components/admin/MainLayout";
import api from "../../api/axios.js";

const getLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getMonthStart = () => {
  const date = new Date();
  date.setDate(1);
  return getLocalDate(date);
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SalesReport = () => {
  const [startDate, setStartDate] = useState(getMonthStart);
  const [endDate, setEndDate] = useState(getLocalDate);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appliedDates, setAppliedDates] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchReport = useCallback(async (start, end) => {
    if (!start || !end) {
      setError("Please select both dates.");
      return;
    }

    if (start > end) {
      setError("Start date cannot be after end date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get("admin/reports/sales", {
        params: {
          startDate: start,
          endDate: end,
        },
      });

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to load sales report.");
      }

      setReport(data);
      setAppliedDates({
        startDate: start,
        endDate: end,
      });

      // Start from the first page for every new report.
      setCurrentPage(1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load sales report."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(startDate, endDate);
  }, [fetchReport]);

  const handleFilter = (event) => {
    event.preventDefault();
    fetchReport(startDate, endDate);
  };

  const handleQuickFilter = (type) => {
    const today = getLocalDate();
    let start = today;

    if (type === "week") {
      const date = new Date();
      date.setDate(date.getDate() - 6);
      start = getLocalDate(date);
    } else if (type === "month") {
      start = getMonthStart();
    }

    setStartDate(start);
    setEndDate(today);
    fetchReport(start, today);
  };

  const handlePrint = () => {
    if (report && !loading) {
      window.print();
    }
  };

  const summary = report?.summary;
  const orders = report?.orders || [];

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));

  const paginatedOrders = orders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const firstRecord =
    orders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const lastRecord = Math.min(currentPage * pageSize, orders.length);

  // Show a compact set of page numbers.
  const getPageNumbers = () => {
    const pages = new Set([
      1,
      totalPages,
      currentPage - 1,
      currentPage,
      currentPage + 1,
    ]);

    return [...pages]
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);
  };

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(summary?.totalRevenue),
      description: "Recognized sales",
      icon: "₹",
    },
    {
      label: "Total Orders",
      value: summary?.totalOrders ?? 0,
      description: "Orders included in report",
      icon: "#",
    },
    {
      label: "Items Sold",
      value: summary?.totalItemsSold ?? 0,
      description: "Total quantity sold",
      icon: "↗",
    },
    {
      label: "Total Discounts",
      value: formatCurrency(summary?.totalDiscounts),
      description: "Offers and coupons",
      icon: "%",
    },
  ];

  return (
    <MainLayout>
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 12mm;
          }

          body * {
            visibility: hidden !important;
          }

          .sales-print-area,
          .sales-print-area * {
            visibility: visible !important;
          }

          .sales-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            color: black !important;
            background: white !important;
          }

          .sales-no-print {
            display: none !important;
          }

          .sales-print-heading {
            display: block !important;
          }

          .sales-screen-table {
            display: none !important;
          }

          .sales-print-only {
            display: block !important;
          }

          .sales-print-area table {
            width: 100%;
            border-collapse: collapse;
          }

          .sales-print-area th,
          .sales-print-area td {
            border: 1px solid #aaa !important;
            padding: 7px !important;
            color: black !important;
            font-size: 10px !important;
          }

          .sales-print-area thead {
            display: table-header-group;
          }

          .sales-print-area tr {
            break-inside: avoid;
          }

          .sales-stat-card {
            background: white !important;
            box-shadow: none !important;
          }
        }

        .sales-print-heading,
        .sales-print-only {
          display: none;
        }
      `}</style>

      <div className="sales-print-area space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9A7B3F]">
              HORAE / ANALYTICS
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
              Sales Report
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review sales performance for a selected period.
            </p>
          </div>

          <div className="sales-no-print flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchReport(startDate, endDate)}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!report || loading}
              className="rounded-lg bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Date filters */}
        <section className="sales-no-print rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">
            Filter by date
          </h2>

          <form
            onSubmit={handleFilter}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]"
          >
            <div>
              <label
                htmlFor="startDate"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Start date
              </label>

              <input
                id="startDate"
                type="date"
                value={startDate}
                max={endDate || getLocalDate()}
                onChange={(event) => setStartDate(event.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#9A7B3F]"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                End date
              </label>

              <input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate}
                max={getLocalDate()}
                onChange={(event) => setEndDate(event.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#9A7B3F]"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#9A7B3F] px-6 py-2.5 font-semibold text-white hover:bg-[#806532] disabled:opacity-50 lg:w-auto"
              >
                Apply Filter
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "Today", value: "today" },
              { label: "Last 7 days", value: "week" },
              { label: "This month", value: "month" },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => handleQuickFilter(filter.value)}
                disabled={loading}
                className="rounded-full border border-gray-300 px-4 py-1.5 text-sm hover:border-[#9A7B3F] hover:text-[#9A7B3F] disabled:opacity-50"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {/* Print heading */}
        {appliedDates && (
          <div className="sales-print-heading">
            <h2 className="text-xl font-bold">HORAE Sales Report</h2>
            <p className="mt-1 text-sm">
              Period: {appliedDates.startDate} to {appliedDates.endDate}
            </p>
            <p className="mb-4 text-sm">
              Generated: {new Date().toLocaleString("en-IN")}
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading && !report && (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            Loading sales report...
          </div>
        )}

        {report && (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="sales-stat-card rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">
                      {stat.label}
                    </p>

                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9A7B3F]/10 font-bold text-[#9A7B3F]">
                      {stat.icon}
                    </span>
                  </div>

                  <p className="mt-3 break-words text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    {stat.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Revenue breakdown */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Revenue breakdown
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500">Subtotal</p>
                  <p className="mt-1 font-semibold">
                    {formatCurrency(summary?.totalSubtotal)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Offer discounts</p>
                  <p className="mt-1 font-semibold">
                    {formatCurrency(summary?.totalOfferDiscount)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Coupon discounts</p>
                  <p className="mt-1 font-semibold">
                    {formatCurrency(summary?.totalCouponDiscount)}
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">Average order value</p>
                <p className="mt-1 text-xl font-bold text-[#9A7B3F]">
                  {formatCurrency(summary?.averageOrderValue)}
                </p>
              </div>
            </section>

            {/* Sales details */}
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Sales details
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {appliedDates?.startDate} — {appliedDates?.endDate}
                  </p>
                </div>

                <p className="text-sm text-gray-500">
                  {orders.length} sales records
                </p>
              </div>

              {/* Screen table: only current page */}
              <div className="sales-screen-table overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-4">Order ID</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Items</th>
                      <th className="px-5 py-4">Payment</th>
                      <th className="px-5 py-4">Discount</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Revenue</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {paginatedOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {order.orderNumber || order._id}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-4">{order.itemsCount}</td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {order.paymentMethod || "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {formatCurrency(
                            (Number(order.offerDiscount) || 0) +
                              (Number(order.couponDiscount) || 0)
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {order.orderStatus || "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">
                          {formatCurrency(order.totalAmount)}
                        </td>
                      </tr>
                    ))}

                    {orders.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-12 text-center text-gray-500"
                        >
                          No sales found for this date range.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {orders.length > 0 && (
                    <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-4 text-right font-bold"
                        >
                          Total revenue
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-[#9A7B3F]">
                          {formatCurrency(summary?.totalRevenue)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Print table: all orders, regardless of current page */}
              <div className="sales-print-only">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Payment</th>
                      <th>Discount</th>
                      <th>Status</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.orderNumber || order._id}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>{order.itemsCount}</td>
                        <td>{order.paymentMethod || "—"}</td>
                        <td>
                          {formatCurrency(
                            (Number(order.offerDiscount) || 0) +
                              (Number(order.couponDiscount) || 0)
                          )}
                        </td>
                        <td>{order.orderStatus || "—"}</td>
                        <td>{formatCurrency(order.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>

                  {orders.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={6} className="text-right font-bold">
                          Total revenue
                        </td>
                        <td className="font-bold">
                          {formatCurrency(summary?.totalRevenue)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Pagination controls */}
              <div className="sales-no-print flex flex-col gap-4 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span>
                    Showing {firstRecord}–{lastRecord} of {orders.length}
                  </span>

                  <label
                    htmlFor="pageSize"
                    className="flex items-center gap-2"
                  >
                    Rows:
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-lg border border-gray-300 px-2 py-1.5"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1 || orders.length === 0}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {getPageNumbers().map((page, index, pages) => (
                    <span key={page} className="flex items-center gap-2">
                      {index > 0 && page - pages[index - 1] > 1 && (
                        <span className="px-1 text-gray-400">...</span>
                      )}

                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-current={
                          currentPage === page ? "page" : undefined
                        }
                        className={`min-w-9 rounded-lg border px-3 py-2 text-sm ${
                          currentPage === page
                            ? "border-[#9A7B3F] bg-[#9A7B3F] text-white"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    </span>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1)
                      )
                    }
                    disabled={
                      currentPage === totalPages || orders.length === 0
                    }
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default SalesReport;
