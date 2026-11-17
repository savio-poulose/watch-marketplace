import { useCallback, useEffect, useMemo, useState } from "react";
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

const escapeCsvCell = (value) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const SalesReport = () => {
  const [startDate, setStartDate] = useState(getMonthStart);
  const [endDate, setEndDate] = useState(getLocalDate);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState("");
  const [appliedDates, setAppliedDates] = useState(null);
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
      const response = await api.get("/admin/reports/sales", {
        params: { startDate: start, endDate: end },
      });
      const data = response?.data;
      if (!data || data.success === false) {
        throw new Error(data?.message || "Failed to load sales report.");
      }
      // Supports either { success, summary, orders } or { data: { summary, orders } } responses.
      const payload = data.data && !data.summary && !data.orders ? data.data : data;
      setReport({
        ...payload,
        summary: payload.summary || {},
        orders: Array.isArray(payload.orders) ? payload.orders : [],
      });
      setAppliedDates({ startDate: start, endDate: end });
      setCurrentPage(1);
    } catch (err) {
      setReport(null);
      setError(
        err?.response?.data?.message || err?.message || "Failed to load sales report."
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

  const handleExportCsv = () => {
    if (!report || loading) return;
    const summary = report.summary || {};
    const orders = report.orders || [];
    const rows = [
      ["OCEANUS Sales Report"],
      ["Period", appliedDates?.startDate || startDate, appliedDates?.endDate || endDate],
      ["Generated", new Date().toLocaleString("en-IN")],
      [],
      ["Summary", "Value"],
      ["Total Revenue (INR)", Number(summary.totalRevenue) || 0],
      ["Total Orders", Number(summary.totalOrders) || 0],
      ["Items Sold", Number(summary.totalItemsSold) || 0],
      ["Total Discounts (INR)", Number(summary.totalDiscounts) || 0],
      ["Subtotal (INR)", Number(summary.totalSubtotal) || 0],
      ["Offer Discounts (INR)", Number(summary.totalOfferDiscount) || 0],
      ["Coupon Discounts (INR)", Number(summary.totalCouponDiscount) || 0],
      ["Average Order Value (INR)", Number(summary.averageOrderValue) || 0],
      [],
      [
        "Order ID",
        "Date",
        "Customer",
        "Items",
        "Payment Method",
        "Offer Discount (INR)",
        "Coupon Discount (INR)",
        "Total Discount (INR)",
        "Order Status",
        "Revenue (INR)",
      ],
      ...orders.map((order) => {
        const offerDiscount = Number(order.offerDiscount) || 0;
        const couponDiscount = Number(order.couponDiscount) || 0;
        return [
          order.orderNumber || order._id || "",
          order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "",
          order.customerName || "Customer",
          Number(order.itemsCount) || 0,
          order.paymentMethod || "",
          offerDiscount,
          couponDiscount,
          offerDiscount + couponDiscount,
          order.orderStatus || "",
          Number(order.totalAmount) || 0,
        ];
      }),
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `oceanus-sales-report-${appliedDates?.startDate || startDate}-to-${appliedDates?.endDate || endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!report || loading || downloadingPdf) return;
    setDownloadingPdf(true);
    setError("");
    try {
      const response = await api.get("/admin/reports/sales/pdf", {
        params: {
          startDate: appliedDates?.startDate || startDate,
          endDate: appliedDates?.endDate || endDate,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `oceanus-sales-report-${appliedDates?.startDate || startDate}-to-${appliedDates?.endDate || endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          setError(json.message || "Failed to download PDF report.");
        } catch {
          setError("Failed to download PDF report.");
        }
      } else {
        setError(
          err?.response?.data?.message || err?.message || "Failed to download PDF report."
        );
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    if (report && !loading) window.print();
  };

  const summary = report?.summary || {};
  const orders = report?.orders || [];
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = useMemo(
    () => orders.slice((safePage - 1) * pageSize, safePage * pageSize),
    [orders, safePage, pageSize]
  );
  const firstRecord = orders.length ? (safePage - 1) * pageSize + 1 : 0;
  const lastRecord = Math.min(safePage * pageSize, orders.length);

  const stats = [
    { label: "Total Revenue", value: formatCurrency(summary.totalRevenue), description: "Recognized sales", icon: "₹" },
    { label: "Total Orders", value: summary.totalOrders ?? orders.length, description: "Orders included in report", icon: "#" },
    { label: "Items Sold", value: summary.totalItemsSold ?? 0, description: "Total quantity sold", icon: "↗" },
    { label: "Total Discounts", value: formatCurrency(summary.totalDiscounts), description: "Offers and coupons", icon: "%" },
  ];

  return (
    <MainLayout>
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden !important; }
          .sales-print-area, .sales-print-area * { visibility: visible !important; }
          .sales-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            color: #111827 !important;
            background: #ffffff !important;
          }
          .sales-no-print { display: none !important; }
          .sales-screen-only { display: none !important; }
          .sales-print-only { display: block !important; }
          .sales-print-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .sales-print-table th, .sales-print-table td {
            border: 1px solid #d1d5db !important;
            padding: 5px 8px !important;
            font-size: 8.5pt !important;
            color: #111827 !important;
          }
          .sales-print-table th {
            background-color: #111827 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .sales-print-table tr:nth-child(even) td {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .sales-print-table tr { break-inside: avoid !important; }
          .sales-stat-card {
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="sales-print-area space-y-6 p-4 md:p-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9A7B3F]">OCEANUS / ANALYTICS</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">Sales Report</h1>
            <p className="mt-1 text-sm text-gray-500">Review sales performance for a selected period.</p>
          </div>
          <div className="sales-no-print flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fetchReport(startDate, endDate)}
              disabled={loading || downloadingPdf}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!report || loading || downloadingPdf}
              className="rounded-lg border border-[#9A7B3F] px-5 py-2.5 text-sm font-semibold text-[#806532] hover:bg-[#9A7B3F]/10 disabled:opacity-50"
            >
              Export CSV (Excel)
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={!report || loading || downloadingPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-[#9A7B3F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#806532] disabled:opacity-50"
            >
              {downloadingPdf ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!report || loading || downloadingPdf}
              className="rounded-lg bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Print / Save PDF
            </button>
          </div>
        </header>

        <section className="sales-no-print rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Filter by date</h2>
          <form onSubmit={handleFilter} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
            <div>
              <label htmlFor="startDate" className="mb-2 block text-sm font-medium text-gray-700">Start date</label>
              <input id="startDate" type="date" value={startDate} max={endDate || getLocalDate()} onChange={(event) => setStartDate(event.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#9A7B3F]" />
            </div>
            <div>
              <label htmlFor="endDate" className="mb-2 block text-sm font-medium text-gray-700">End date</label>
              <input id="endDate" type="date" value={endDate} min={startDate} max={getLocalDate()} onChange={(event) => setEndDate(event.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-[#9A7B3F]" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading || downloadingPdf} className="w-full rounded-lg bg-[#9A7B3F] px-6 py-2.5 font-semibold text-white hover:bg-[#806532] disabled:opacity-50 lg:w-auto">Apply Filter</button>
            </div>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {[{ label: "Today", value: "today" }, { label: "Last 7 days", value: "week" }, { label: "This month", value: "month" }].map((filter) => (
              <button key={filter.value} type="button" onClick={() => handleQuickFilter(filter.value)} disabled={loading || downloadingPdf} className="rounded-full border border-gray-300 px-4 py-1.5 text-sm hover:border-[#9A7B3F] hover:text-[#9A7B3F] disabled:opacity-50">{filter.label}</button>
            ))}
          </div>
        </section>

        {appliedDates && (
          <div className="hidden print:block border-b border-gray-200 pb-4 mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A7B3F]">OCEANUS LUXURY TIMEPIECES</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">Executive Sales Performance Report</h2>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
              <p>Period: <span className="font-semibold text-gray-900">{appliedDates.startDate}</span> to <span className="font-semibold text-gray-900">{appliedDates.endDate}</span></p>
              <p>Generated: <span className="font-semibold text-gray-900">{new Date().toLocaleString("en-IN")}</span></p>
            </div>
          </div>
        )}

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {loading && !report && <div className="rounded-xl border bg-white p-10 text-center text-gray-500">Loading sales report...</div>}

        {report && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="sales-stat-card rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#9A7B3F]/10 font-bold text-[#9A7B3F]">{stat.icon}</span>
                  </div>
                  <p className="mt-3 break-words text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-2 text-xs text-gray-500">{stat.description}</p>
                </div>
              ))}
            </div>

            <section className="sales-no-print rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Revenue breakdown</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div><p className="text-sm text-gray-500">Subtotal</p><p className="mt-1 font-semibold">{formatCurrency(summary.totalSubtotal)}</p></div>
                <div><p className="text-sm text-gray-500">Offer discounts</p><p className="mt-1 font-semibold">{formatCurrency(summary.totalOfferDiscount)}</p></div>
                <div><p className="text-sm text-gray-500">Coupon discounts</p><p className="mt-1 font-semibold">{formatCurrency(summary.totalCouponDiscount)}</p></div>
              </div>
              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">Average order value</p>
                <p className="mt-1 text-xl font-bold text-[#9A7B3F]">{formatCurrency(summary.averageOrderValue)}</p>
              </div>
            </section>

            {/* SCREEN TABLE (Paginated) */}
            <section className="sales-screen-only overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm print:hidden">
              <div className="flex flex-col gap-2 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Sales details</h2>
                  <p className="mt-1 text-sm text-gray-500">{appliedDates?.startDate} — {appliedDates?.endDate}</p>
                </div>
                <p className="text-sm text-gray-500">{orders.length} sales records</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3.5">#</th>
                      <th className="px-4 py-3.5">Order ID</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Customer</th>
                      <th className="px-4 py-3.5">Payment</th>
                      <th className="px-4 py-3.5 text-center">Items</th>
                      <th className="px-4 py-3.5 text-right">Discount</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedOrders.map((order, index) => (
                      <tr key={order._id || order.orderNumber || `${order.createdAt || "order"}-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{(safePage - 1) * pageSize + index + 1}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-gray-900">{order.orderNumber || order._id || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-gray-600">{formatDate(order.createdAt)}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-gray-800">{order.customerName || "Customer"}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-gray-600">{order.paymentMethod || "—"}</td>
                        <td className="px-4 py-3.5 text-center text-gray-700">{Number(order.itemsCount) || 0}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-gray-600">
                          {formatCurrency(Number(order.totalDiscount) || (Number(order.offerDiscount) || 0) + (Number(order.couponDiscount) || 0))}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            order.orderStatus === "DELIVERED"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {order.orderStatus || "—"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-5 py-12 text-center text-gray-500">No sales found for this date range.</td>
                      </tr>
                    )}
                  </tbody>
                  {orders.length > 0 && (
                    <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                      <tr>
                        <td colSpan={8} className="px-4 py-3.5 text-right font-bold text-gray-700">Total recognized revenue</td>
                        <td className="px-4 py-3.5 text-right font-bold text-[#9A7B3F]">{formatCurrency(summary.totalRevenue)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span>Showing {firstRecord}–{lastRecord} of {orders.length}</span>
                  <label htmlFor="pageSize" className="flex items-center gap-2">Rows:
                    <select id="pageSize" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); }} className="rounded-lg border border-gray-300 px-2 py-1.5">
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage === 1 || orders.length === 0} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                  <span className="px-2 text-sm text-gray-600">Page {safePage} of {totalPages}</span>
                  <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safePage === totalPages || orders.length === 0} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">Next</button>
                </div>
              </div>
            </section>

            {/* PRINT ONLY TABLE (Renders ALL orders for browser printing) */}
            <section className="sales-print-only hidden print:block mt-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-800">Sales Transactions ({orders.length} records)</h3>
              <table className="sales-print-table">
                <thead>
                  <tr>
                    <th style={{ width: "30px", textAlign: "center" }}>#</th>
                    <th style={{ width: "135px", textAlign: "left" }}>Order ID</th>
                    <th style={{ width: "75px", textAlign: "left" }}>Date</th>
                    <th style={{ width: "100px", textAlign: "left" }}>Customer</th>
                    <th style={{ width: "85px", textAlign: "left" }}>Payment</th>
                    <th style={{ width: "45px", textAlign: "center" }}>Items</th>
                    <th style={{ width: "75px", textAlign: "left" }}>Status</th>
                    <th style={{ width: "80px", textAlign: "right" }}>Discount</th>
                    <th style={{ width: "95px", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => {
                    const discount = Number(order.totalDiscount) || (Number(order.offerDiscount) || 0) + (Number(order.couponDiscount) || 0);
                    return (
                      <tr key={order._id || order.orderNumber || index}>
                        <td style={{ textAlign: "center" }}>{index + 1}</td>
                        <td style={{ fontWeight: 600 }}>{order.orderNumber || order._id || "—"}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>{order.customerName || "Customer"}</td>
                        <td>{order.paymentMethod || "—"}</td>
                        <td style={{ textAlign: "center" }}>{Number(order.itemsCount) || 0}</td>
                        <td>{order.orderStatus || "—"}</td>
                        <td style={{ textAlign: "right" }}>{discount > 0 ? formatCurrency(discount) : "—"}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "20px" }}>No sales records found for this period.</td>
                    </tr>
                  )}
                </tbody>
                {orders.length > 0 && (
                  <tfoot>
                    <tr style={{ fontWeight: "bold", backgroundColor: "#f3f4f6" }}>
                      <td colSpan={8} style={{ textAlign: "right" }}>TOTAL RECOGNIZED REVENUE ({orders.length} orders):</td>
                      <td style={{ textAlign: "right", color: "#9A7B3F" }}>{formatCurrency(summary.totalRevenue)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
              <div className="mt-4 flex justify-between text-[8pt] text-gray-500">
                <span>CONFIDENTIAL — OCEANUS INTERNAL SALES REPORT</span>
                <span>Generated via OCEANUS Management Portal</span>
              </div>
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default SalesReport;
