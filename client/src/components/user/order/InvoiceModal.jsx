import React, { useRef } from "react";
import { Printer, Download, X, FileText, CheckCircle2 } from "lucide-react";

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "Unavailable";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Unavailable";
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const InvoiceModal = ({
  isOpen,
  onClose,
  order,
  onDownload,
  downloading = false,
}) => {
  const printAreaRef = useRef(null);

  if (!isOpen || !order) return null;

  const address = order.shippingAddress || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const invoiceNumber =
    order.invoiceNumber ||
    (order.orderNumber ? `INV-${order.orderNumber.replace(/^(OCE-|ORD-)/, "")}` : `INV-${String(order._id).slice(-8).toUpperCase()}`);
  const invoiceDate = order.invoiceDate || order.createdAt || new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-canvas,
          #printable-invoice-canvas * {
            visibility: visible !important;
          }
          #printable-invoice-canvas {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 30px !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Dialog */}
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl">
        {/* Header Bar (Not printed) */}
        <div className="no-print flex items-center justify-between border-b border-gray-200 bg-[#FBFBFA] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9A7B3F]/10 text-[#9A7B3F]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111827]">
                Tax Invoice Preview
              </h2>
              <p className="text-xs text-gray-500">
                Invoice #{invoiceNumber} · Order #{order.orderNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-[#111827] shadow-xs transition hover:bg-gray-50 hover:border-[#9A7B3F]"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded bg-[#111827] px-3.5 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-[#9A7B3F] disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloading ? "Preparing PDF..." : "Download PDF"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="overflow-y-auto p-6 sm:p-10">
          <div
            id="printable-invoice-canvas"
            ref={printAreaRef}
            className="border border-gray-200 bg-white p-8 text-[#111827] shadow-xs"
          >
            {/* Header: Brand & Company Details */}
            <div className="flex flex-col justify-between gap-6 border-b-2 border-[#9A7B3F] pb-6 sm:flex-row sm:items-start">
              <div>
                <span className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
                  OCEANUS
                </span>
                <p className="mt-1 text-[10px] font-semibold tracking-[0.25em] text-[#9A7B3F] uppercase">
                  HORAE TIMEPIECE · HAUTE HORLOGERIE
                </p>
              </div>

              <div className="text-left text-xs leading-5 text-gray-500 sm:text-right">
                <p className="font-semibold text-[#111827]">
                  Oceanus Horology Private Limited
                </p>
                <p>Level 4, Marine Square, Marine Drive</p>
                <p>Kochi, Kerala, India - 682031</p>
                <p className="text-[11px] text-gray-400">
                  GSTIN: 32AAFCO2024H1Z6 | CIN: U52100KL2024PTC081234
                </p>
                <p className="text-[11px] text-gray-400">
                  support@oceanuswatches.com | +91 98765 43210
                </p>
              </div>
            </div>

            {/* Title Bar */}
            <div className="mt-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-lg font-bold tracking-wider text-[#111827] uppercase">
                  TAX INVOICE
                </h1>
                <p className="text-xs text-gray-500">Original for Recipient</p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  {order.paymentStatus === "PAID"
                    ? "Payment Completed"
                    : order.paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : "Payment Pending"}
                </span>
              </div>
            </div>

            {/* Address & Meta Information Grid */}
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Left Column: Billed & Shipped To */}
              <div className="rounded border border-gray-200 bg-[#FAFAF8] p-4 text-xs leading-5">
                <p className="font-semibold tracking-wider text-[#9A7B3F] uppercase">
                  BILLED & SHIPPED TO
                </p>
                <p className="mt-2 text-sm font-semibold text-[#111827]">
                  {address.name || "Customer"}
                </p>
                {address.phone && (
                  <p className="text-gray-600">Phone: {address.phone}</p>
                )}
                {address.addressLine && (
                  <p className="text-gray-600">{address.addressLine}</p>
                )}
                <p className="text-gray-600">
                  {[address.city, address.state].filter(Boolean).join(", ")}
                  {address.pincode && ` - ${address.pincode}`}
                </p>
                {address.landmark && (
                  <p className="text-gray-400">Landmark: {address.landmark}</p>
                )}
              </div>

              {/* Right Column: Invoice Metadata */}
              <div className="rounded border border-gray-200 bg-[#FAFAF8] p-4 text-xs">
                <p className="font-semibold tracking-wider text-[#9A7B3F] uppercase">
                  INVOICE DETAILS
                </p>
                <dl className="mt-2 space-y-1.5">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Invoice Number:</dt>
                    <dd className="font-semibold text-[#111827]">{invoiceNumber}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Invoice Date:</dt>
                    <dd className="font-medium text-[#111827]">
                      {formatDate(invoiceDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Order Reference:</dt>
                    <dd className="font-semibold text-[#111827]">
                      #{order.orderNumber}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Order Date:</dt>
                    <dd className="text-[#111827]">{formatDate(order.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Payment Mode:</dt>
                    <dd className="font-medium text-[#111827]">
                      {order.paymentMethod === "COD"
                        ? "Cash on Delivery (COD)"
                        : order.paymentMethod || "Prepaid"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-8 overflow-hidden rounded border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-[#111827] text-white">
                  <tr>
                    <th className="py-2.5 pl-4 pr-2 font-semibold">#</th>
                    <th className="px-3 py-2.5 font-semibold">ITEM DESCRIPTION</th>
                    <th className="px-3 py-2.5 font-semibold">SKU</th>
                    <th className="px-3 py-2.5 text-center font-semibold">QTY</th>
                    <th className="px-3 py-2.5 text-right font-semibold">UNIT PRICE</th>
                    <th className="px-3 py-2.5 text-right font-semibold">DISCOUNT</th>
                    <th className="py-2.5 pl-3 pr-4 text-right font-semibold">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const itemTotal =
                      item.subtotal ??
                      Number(item.unitPrice || 0) * Number(item.quantity || 1);
                    return (
                      <tr
                        key={idx}
                        className={idx % 2 === 1 ? "bg-[#FAFAF8]" : "bg-white"}
                      >
                        <td className="py-3 pl-4 pr-2 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-[#111827]">
                            {item.productName || "Watch Timepiece"}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {item.variantSku || "N/A"}
                        </td>
                        <td className="px-3 py-3 text-center font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatPrice(item.unitPrice)}
                        </td>
                        <td className="px-3 py-3 text-right text-emerald-700">
                          {Number(item.offerDiscount) > 0
                            ? `−${formatPrice(item.offerDiscount)}`
                            : "—"}
                        </td>
                        <td className="py-3 pl-3 pr-4 text-right font-semibold text-[#111827]">
                          {formatPrice(itemTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals */}
            <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row">
              {/* Terms and Notes */}
              <div className="max-w-xs text-[11px] leading-4.5 text-gray-500">
                <p className="font-semibold text-[#111827]">Terms & Conditions:</p>
                <p className="mt-1">
                  1. All OCEANUS timepieces carry an authentic 24-month warranty.
                </p>
                <p className="mt-0.5">
                  2. Returns must be requested within 7 days of delivery in pristine condition.
                </p>
                <p className="mt-0.5">
                  3. This document is a computer-generated tax invoice.
                </p>
              </div>

              {/* Totals Breakdown */}
              <div className="w-full sm:max-w-xs space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>

                {Number(order.offerDiscount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promotional Offer</span>
                    <span>−{formatPrice(order.offerDiscount)}</span>
                  </div>
                )}

                {Number(order.couponDiscount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>
                      Coupon Discount{" "}
                      {order.couponCode ? `(${order.couponCode})` : ""}
                    </span>
                    <span>−{formatPrice(order.couponDiscount)}</span>
                  </div>
                )}

                {Number(order.walletAppliedAmount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Wallet Applied</span>
                    <span>−{formatPrice(order.walletAppliedAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Shipping & Delivery</span>
                  <span>
                    {Number(order.shippingCharge) > 0
                      ? formatPrice(order.shippingCharge)
                      : "FREE"}
                  </span>
                </div>

                <div className="border-t-2 border-[#111827] pt-2">
                  <div className="flex items-center justify-between text-sm font-bold text-[#111827]">
                    <span>Grand Total Paid</span>
                    <span className="text-base text-[#9A7B3F]">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 border-t border-gray-100 pt-4 text-center text-[10px] text-gray-400">
              <p>
                Thank you for choosing OCEANUS Timepieces. Crafted with distinction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;

