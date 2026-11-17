import PDFDocument from "pdfkit";
import Order from "../../models/order.module.js";
import "../../models/user.model.js";

const EXCLUDED_STATUSES = ["CANCELLED", "RETURNED"];

const normalizeStatus = (value) =>
  String(value ?? "").trim().toUpperCase();

export const formatINR = (value) => {
  const num = Number(value) || 0;
  return (
    "INR " +
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

export const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatStatus = (status) => {
  const value = String(status || "").toUpperCase();
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

export const getSalesReport = async ({ startDate, endDate }) => {
  if (!startDate || !endDate) {
    const error = new Error("Start date and end date are required");
    error.statusCode = 400;
    throw error;
  }

  // Accept YYYY-MM-DD dates only.
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
    const error = new Error("Dates must use YYYY-MM-DD format");
    error.statusCode = 400;
    throw error;
  }

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const endExclusive = new Date(`${endDate}T00:00:00.000Z`);

  // Reject invalid dates such as 2026-02-30.
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(endExclusive.getTime()) ||
    start.toISOString().slice(0, 10) !== startDate ||
    endExclusive.toISOString().slice(0, 10) !== endDate ||
    start > endExclusive
  ) {
    const error = new Error("Invalid date range");
    error.statusCode = 400;
    throw error;
  }

  // Include the entire end date.
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  const orders = await Order.find({
    createdAt: {
      $gte: start,
      $lt: endExclusive,
    },
  })
    .select(
      [
        "orderNumber",
        "items",
        "shippingAddress",
        "subtotal",
        "offerDiscount",
        "couponDiscount",
        "shippingCharge",
        "totalAmount",
        "paymentMethod",
        "paymentStatus",
        "orderStatus",
        "createdAt",
      ].join(" ")
    )
    .populate("userId", "userName email")
    .sort({ createdAt: -1 })
    .lean();

  // Count recognized sales only:
  // - Online orders with confirmed PAID status
  // - COD orders that have been delivered
  // Cancelled and returned orders are excluded.
  const sales = orders.filter((order) => {
    const status = normalizeStatus(order.orderStatus);
    const paymentStatus = normalizeStatus(order.paymentStatus);
    const paymentMethod = normalizeStatus(order.paymentMethod);

    if (EXCLUDED_STATUSES.includes(status)) {
      return false;
    }

    if (
      status.includes("RETURN") ||
      status.includes("CANCEL")
    ) {
      return false;
    }

    return (
      paymentStatus === "PAID" ||
      (paymentMethod === "COD" && status === "DELIVERED")
    );
  });

  const sum = (values) =>
    values.reduce((total, value) => total + (Number(value) || 0), 0);

  const totalRevenue = sum(
    sales.map((order) => Number(order.totalAmount) || 0)
  );

  const totalSubtotal = sum(
    sales.map((order) => Number(order.subtotal) || 0)
  );

  const totalOfferDiscount = sum(
    sales.map((order) => Number(order.offerDiscount) || 0)
  );

  const totalCouponDiscount = sum(
    sales.map((order) => Number(order.couponDiscount) || 0)
  );

  const totalDiscounts =
    totalOfferDiscount + totalCouponDiscount;

  const totalItemsSold = sum(
    sales.map((order) =>
      sum(
        (order.items ?? []).map(
          (item) => Number(item.quantity) || 0
        )
      )
    )
  );

  return {
    filters: {
      startDate,
      endDate,
    },
    summary: {
      totalRevenue,
      totalOrders: sales.length,
      totalItemsSold,
      totalDiscounts,
      totalOfferDiscount,
      totalCouponDiscount,
      totalSubtotal,
      averageOrderValue: sales.length
        ? totalRevenue / sales.length
        : 0,
    },
    orders: sales.map((order) => {
      const offerDiscount = Number(order.offerDiscount) || 0;
      const couponDiscount = Number(order.couponDiscount) || 0;
      const customerName =
        order.shippingAddress?.name ||
        order.userId?.userName ||
        "Customer";
      const itemsCount = sum(
        (order.items ?? []).map(
          (item) => Number(item.quantity) || 0
        )
      );

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerName,
        subtotal: Number(order.subtotal) || 0,
        offerDiscount,
        couponDiscount,
        totalDiscount: offerDiscount + couponDiscount,
        shippingCharge: Number(order.shippingCharge) || 0,
        totalAmount: Number(order.totalAmount) || 0,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        itemsCount,
      };
    }),
  };
};

export const generateSalesReportPDF = async ({ startDate, endDate }) => {
  const report = await getSalesReport({ startDate, endDate });
  const { summary, orders, filters } = report;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 36,
        bufferPages: true,
        info: {
          Title: `Sales Report - ${filters.startDate} to ${filters.endDate}`,
          Author: "OCEANUS Luxury Timepieces",
          Subject: "Executive Sales Performance Report",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const filename = `oceanus-sales-report-${filters.startDate}-to-${filters.endDate}.pdf`;
        resolve({ buffer, filename, report });
      });
      doc.on("error", (err) => reject(err));

      const darkColor = "#111827";
      const goldColor = "#9A7B3F";
      const lightGray = "#6B7280";
      const borderColor = "#E5E7EB";

      let y = 36;

      // Header branding
      doc.fontSize(20).font("Helvetica-Bold").fillColor(darkColor).text("OCEANUS", 36, y);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(goldColor).text("HAUTE HORLOGERIE  |  EXECUTIVE SALES REPORT", 36, y + 24);

      doc.fontSize(8).font("Helvetica").fillColor(lightGray)
        .text(`Report Period: ${filters.startDate} to ${filters.endDate}`, 500, y, { align: "right", width: 270 })
        .text(`Generated On: ${new Date().toLocaleString("en-IN")}`, 500, y + 12, { align: "right", width: 270 })
        .text(`Total Orders: ${summary.totalOrders}  |  Items Sold: ${summary.totalItemsSold}`, 500, y + 24, { align: "right", width: 270 });

      y += 44;
      doc.strokeColor(goldColor).lineWidth(1.5).moveTo(36, y).lineTo(770, y).stroke();
      y += 14;

      // Summary Metrics Cards (4 cards across 734 pt)
      const cardW = 175;
      const cardH = 42;
      const cardGap = 11;
      const cards = [
        { label: "TOTAL REVENUE", value: formatINR(summary.totalRevenue) },
        { label: "TOTAL ORDERS", value: String(summary.totalOrders) },
        { label: "ITEMS SOLD", value: String(summary.totalItemsSold) },
        { label: "TOTAL DISCOUNTS", value: formatINR(summary.totalDiscounts) },
      ];

      cards.forEach((card, i) => {
        const cx = 36 + i * (cardW + cardGap);
        doc.roundedRect(cx, y, cardW, cardH, 4).fillAndStroke("#F9FAFB", borderColor);
        doc.fontSize(7).font("Helvetica-Bold").fillColor(lightGray).text(card.label, cx + 10, y + 8, { width: cardW - 20 });
        doc.fontSize(11).font("Helvetica-Bold").fillColor(darkColor).text(card.value, cx + 10, y + 21, { width: cardW - 20 });
      });

      y += cardH + 18;

      // Table Column Specifications (Total Width: 734 pt)
      const COLUMNS = [
        { id: "sl", header: "#", x: 36, width: 28, align: "center" },
        { id: "orderId", header: "Order ID", x: 64, width: 140, align: "left" },
        { id: "date", header: "Date", x: 204, width: 75, align: "left" },
        { id: "customer", header: "Customer", x: 279, width: 105, align: "left" },
        { id: "payment", header: "Payment Method", x: 384, width: 95, align: "left" },
        { id: "items", header: "Items", x: 479, width: 40, align: "center" },
        { id: "status", header: "Status", x: 519, width: 75, align: "left" },
        { id: "discount", header: "Discount", x: 594, width: 85, align: "right" },
        { id: "amount", header: "Amount", x: 679, width: 91, align: "right" },
      ];

      const drawTableHeader = (posY) => {
        doc.rect(36, posY, 734, 22).fill("#111827");
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF");
        COLUMNS.forEach((col) => {
          doc.text(col.header, col.x + 4, posY + 6, {
            width: col.width - 8,
            align: col.align,
          });
        });
        return posY + 22;
      };

      y = drawTableHeader(y);

      const rowHeight = 20;

      if (orders.length === 0) {
        doc.fontSize(9).font("Helvetica").fillColor(lightGray).text(
          "No sales records found for this date range.",
          36,
          y + 20,
          { width: 734, align: "center" }
        );
        y += 50;
      } else {
        orders.forEach((order, index) => {
          // If row exceeds printable bottom boundary, add page and re-render header
          if (y + rowHeight > 540) {
            doc.addPage();
            y = 36;
            y = drawTableHeader(y);
          }

          if (index % 2 === 1) {
            doc.rect(36, y, 734, rowHeight).fill("#F9FAFB");
          }

          doc.strokeColor(borderColor).lineWidth(0.5).moveTo(36, y + rowHeight).lineTo(770, y + rowHeight).stroke();

          doc.fontSize(7.5).font("Helvetica").fillColor(darkColor);

          // 1. #
          doc.text(String(index + 1), COLUMNS[0].x + 4, y + 6, { width: COLUMNS[0].width - 8, align: COLUMNS[0].align });
          // 2. Order ID
          doc.font("Helvetica-Bold").text(order.orderNumber || String(order._id || "").slice(-10), COLUMNS[1].x + 4, y + 6, { width: COLUMNS[1].width - 8, align: COLUMNS[1].align });
          // 3. Date
          doc.font("Helvetica").text(formatDate(order.createdAt), COLUMNS[2].x + 4, y + 6, { width: COLUMNS[2].width - 8, align: COLUMNS[2].align });
          // 4. Customer
          doc.text(order.customerName || "Customer", COLUMNS[3].x + 4, y + 6, { width: COLUMNS[3].width - 8, align: COLUMNS[3].align, ellipsis: true });
          // 5. Payment Method
          doc.text(order.paymentMethod || "—", COLUMNS[4].x + 4, y + 6, { width: COLUMNS[4].width - 8, align: COLUMNS[4].align });
          // 6. Items
          doc.text(String(order.itemsCount || 1), COLUMNS[5].x + 4, y + 6, { width: COLUMNS[5].width - 8, align: COLUMNS[5].align });
          // 7. Status
          doc.text(formatStatus(order.orderStatus), COLUMNS[6].x + 4, y + 6, { width: COLUMNS[6].width - 8, align: COLUMNS[6].align });
          // 8. Discount
          const disc = Number(order.totalDiscount) || (Number(order.offerDiscount) || 0) + (Number(order.couponDiscount) || 0);
          doc.text(disc > 0 ? formatINR(disc) : "—", COLUMNS[7].x + 4, y + 6, { width: COLUMNS[7].width - 8, align: COLUMNS[7].align });
          // 9. Amount
          doc.font("Helvetica-Bold").text(formatINR(order.totalAmount), COLUMNS[8].x + 4, y + 6, { width: COLUMNS[8].width - 8, align: COLUMNS[8].align });

          y += rowHeight;
        });

        // Summary Total Row
        if (y + 24 > 540) {
          doc.addPage();
          y = 36;
          y = drawTableHeader(y);
        }

        doc.rect(36, y, 734, 22).fill("#F3F4F6");
        doc.strokeColor(darkColor).lineWidth(1).moveTo(36, y).lineTo(770, y).stroke();
        doc.strokeColor(borderColor).lineWidth(0.5).moveTo(36, y + 22).lineTo(770, y + 22).stroke();

        doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor);
        doc.text(`TOTAL RECOGNIZED REVENUE (${orders.length} orders)`, 36 + 10, y + 7, { width: 500, align: "left" });
        doc.text(formatINR(summary.totalRevenue), COLUMNS[8].x - 50, y + 7, { width: COLUMNS[8].width + 50 - 4, align: "right" });
      }

      // Dynamic Page Numbering in Footers across all buffered pages
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const pageNum = i + 1;
        const totalPages = range.count;

        doc.strokeColor(borderColor).lineWidth(0.5).moveTo(36, 560).lineTo(770, 560).stroke();
        doc.fontSize(7).font("Helvetica").fillColor(lightGray);
        doc.text("CONFIDENTIAL — OCEANUS INTERNAL SALES REPORT", 36, 568, { align: "left", width: 350 });
        doc.text(`Page ${pageNum} of ${totalPages}`, 420, 568, { align: "right", width: 350 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
