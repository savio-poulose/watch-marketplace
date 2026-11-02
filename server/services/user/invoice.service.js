import PDFDocument from "pdfkit";
import Order from "../../models/order.module.js";
import User from "../../models/user.model.js";

const formatINR = (value) => {
  const num = Number(value) || 0;
  return "INR " + num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * Generates a PDF invoice stream for a given order
 * @param {string} orderId 
 * @param {string} userId 
 * @returns {Promise<{ doc: PDFDocument, order: Object }>}
 */
export const generateInvoicePDF = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId }).lean();

  if (!order) {
    const error = new Error("Order not found or access denied.");
    error.statusCode = 404;
    throw error;
  }

  // Ensure invoiceNumber and invoiceDate exist (backwards compatibility for existing orders)
  if (!order.invoiceNumber) {
    order.invoiceNumber = "INV-" + (order.orderNumber ? order.orderNumber.replace(/^(OCE-|ORD-)/, "") : String(order._id).slice(-8).toUpperCase());
    order.invoiceDate = order.createdAt || new Date();
    await Order.updateOne(
      { _id: order._id },
      { $set: { invoiceNumber: order.invoiceNumber, invoiceDate: order.invoiceDate } }
    );
  }

  const user = await User.findById(userId).select("name email phone").lean();

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    info: {
      Title: `Invoice - ${order.invoiceNumber}`,
      Author: "OCEANUS Timepieces",
      Subject: `Tax Invoice for Order ${order.orderNumber}`,
    },
  });

  // Colors
  const darkColor = "#111827";
  const goldColor = "#9A7B3F";
  const lightGray = "#6B7280";
  const borderColor = "#E5E7EB";
  const headerBg = "#F9FAFB";

  let y = 40;

  // 1. BRAND HEADER
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .fillColor(darkColor)
    .text("OCEANUS", 40, y);

  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(goldColor)
    .text("HORAE TIMEPIECE  |  HAUTE HORLOGERIE", 40, y + 25);

  // Company Information (Right aligned)
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(lightGray)
    .text("Oceanus Horology Private Limited", 320, y, { align: "right", width: 235 })
    .text("Level 4, Marine Square, Marine Drive", 320, y + 12, { align: "right", width: 235 })
    .text("Kochi, Kerala, India - 682031", 320, y + 24, { align: "right", width: 235 })
    .text("GSTIN: 32AAFCO2024H1Z6 | CIN: U52100KL2024PTC081234", 320, y + 36, { align: "right", width: 235 })
    .text("Email: support@oceanuswatches.com | Tel: +91 98765 43210", 320, y + 48, { align: "right", width: 235 });

  y += 68;

  // Top Accent Line
  doc
    .strokeColor(goldColor)
    .lineWidth(2)
    .moveTo(40, y)
    .lineTo(555, y)
    .stroke();

  y += 15;

  // 2. TITLE BAR
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor(darkColor)
    .text("TAX INVOICE", 40, y);

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(lightGray)
    .text(`Original for Recipient`, 40, y + 16);

  y += 35;

  // 3. INVOICE & CUSTOMER INFO BOXES
  const boxTop = y;
  const boxHeight = 110;
  const colWidth = 245;

  // Left Box: Bill To / Ship To
  doc
    .rect(40, boxTop, colWidth, boxHeight)
    .fillAndStroke(headerBg, borderColor);

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(goldColor)
    .text("BILLED & SHIPPED TO", 52, boxTop + 10);

  const addr = order.shippingAddress || {};
  const customerName = addr.name || user?.name || "Valued Customer";
  const customerPhone = addr.phone || user?.phone || "N/A";
  const customerEmail = user?.email || "";
  const addressLines = [
    addr.addressLine,
    [addr.city, addr.state].filter(Boolean).join(", "),
    addr.pincode ? `PIN: ${addr.pincode}` : "",
  ].filter(Boolean).join("\n");

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(darkColor)
    .text(customerName, 52, boxTop + 26);

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(darkColor)
    .text(addressLines, 52, boxTop + 40, { width: 220, lineGap: 2 });

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(lightGray)
    .text(`Phone: ${customerPhone} ${customerEmail ? `| Email: ${customerEmail}` : ""}`, 52, boxTop + 88, { width: 220 });

  // Right Box: Invoice & Order Metadata
  const rightBoxX = 310;
  doc
    .rect(rightBoxX, boxTop, colWidth, boxHeight)
    .fillAndStroke(headerBg, borderColor);

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(goldColor)
    .text("INVOICE SUMMARY", rightBoxX + 12, boxTop + 10);

  const metaRows = [
    ["Invoice No:", order.invoiceNumber || "N/A"],
    ["Invoice Date:", formatDate(order.invoiceDate || order.createdAt)],
    ["Order No:", order.orderNumber || "N/A"],
    ["Order Date:", formatDate(order.createdAt)],
    ["Payment Mode:", order.paymentMethod === "COD" ? "Cash on Delivery" : (order.paymentMethod || "Prepaid")],
    ["Payment Status:", String(order.paymentStatus || "PENDING").toUpperCase()],
  ];

  let metaY = boxTop + 26;
  metaRows.forEach(([label, val]) => {
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor(lightGray)
      .text(label, rightBoxX + 12, metaY, { width: 90 });

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text(val, rightBoxX + 102, metaY, { width: 130 });

    metaY += 13;
  });

  y = boxTop + boxHeight + 20;

  // 4. ITEMS TABLE
  const tableTop = y;
  const colX = {
    index: 40,
    desc: 65,
    sku: 230,
    qty: 320,
    unitPrice: 360,
    discount: 435,
    total: 495,
  };

  // Table Header
  doc
    .rect(40, tableTop, 515, 22)
    .fillAndStroke(darkColor, darkColor);

  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor("#FFFFFF")
    .text("#", colX.index + 5, tableTop + 6)
    .text("ITEM DESCRIPTION", colX.desc, tableTop + 6)
    .text("SKU", colX.sku, tableTop + 6)
    .text("QTY", colX.qty, tableTop + 6, { align: "center", width: 30 })
    .text("PRICE", colX.unitPrice, tableTop + 6, { align: "right", width: 65 })
    .text("DISCOUNT", colX.discount, tableTop + 6, { align: "right", width: 50 })
    .text("TOTAL", colX.total, tableTop + 6, { align: "right", width: 55 });

  y = tableTop + 22;

  const items = Array.isArray(order.items) ? order.items : [];

  items.forEach((item, index) => {
    const itemHeight = 24;
    const isOdd = index % 2 === 1;

    if (isOdd) {
      doc
        .rect(40, y, 515, itemHeight)
        .fill(headerBg);
    }

    // Border line bottom
    doc
      .strokeColor(borderColor)
      .lineWidth(0.5)
      .moveTo(40, y + itemHeight)
      .lineTo(555, y + itemHeight)
      .stroke();

    const itemTotal = Number(item.subtotal ?? (Number(item.unitPrice || 0) * Number(item.quantity || 1)));

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(darkColor)
      .text(String(index + 1), colX.index + 5, y + 7)
      .font("Helvetica-Bold")
      .text(item.productName || "Watch Timepiece", colX.desc, y + 7, { width: 160, ellipsis: true })
      .font("Helvetica")
      .fillColor(lightGray)
      .text(item.variantSku || "N/A", colX.sku, y + 7, { width: 85, ellipsis: true })
      .fillColor(darkColor)
      .text(String(item.quantity || 1), colX.qty, y + 7, { align: "center", width: 30 })
      .text(formatINR(item.unitPrice), colX.unitPrice, y + 7, { align: "right", width: 65 })
      .fillColor(Number(item.offerDiscount) > 0 ? "#047857" : lightGray)
      .text(Number(item.offerDiscount) > 0 ? `-${formatINR(item.offerDiscount)}` : "0.00", colX.discount, y + 7, { align: "right", width: 50 })
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text(formatINR(itemTotal), colX.total, y + 7, { align: "right", width: 55 });

    y += itemHeight;
  });

  y += 12;

  // 5. FINANCIAL TOTALS & SUMMARY SECTION
  const summaryBoxWidth = 220;
  const summaryX = 335;
  const summaryTop = y;

  const totals = [
    ["Items Subtotal:", formatINR(order.subtotal)],
  ];

  if (Number(order.offerDiscount) > 0) {
    totals.push(["Promotional Offer:", `-${formatINR(order.offerDiscount)}`]);
  }

  if (Number(order.couponDiscount) > 0) {
    const couponLabel = order.couponCode ? `Coupon (${order.couponCode}):` : "Coupon Discount:";
    totals.push([couponLabel, `-${formatINR(order.couponDiscount)}`]);
  }

  if (Number(order.walletAppliedAmount) > 0) {
    totals.push(["Wallet Balance Used:", `-${formatINR(order.walletAppliedAmount)}`]);
  }

  totals.push([
    "Shipping & Delivery:",
    Number(order.shippingCharge) > 0 ? formatINR(order.shippingCharge) : "FREE",
  ]);

  // Draw Summary Box
  totals.forEach(([label, val]) => {
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor(lightGray)
      .text(label, summaryX, y, { width: 120 });

    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor(darkColor)
      .text(val, summaryX + 120, y, { align: "right", width: 100 });

    y += 15;
  });

  // Grand Total Line
  doc
    .strokeColor(darkColor)
    .lineWidth(1)
    .moveTo(summaryX, y)
    .lineTo(555, y)
    .stroke();

  y += 6;

  doc
    .rect(summaryX, y, summaryBoxWidth, 26)
    .fill(darkColor);

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor("#FFFFFF")
    .text("GRAND TOTAL PAID", summaryX + 10, y + 8)
    .text(formatINR(order.totalAmount), summaryX + 110, y + 8, { align: "right", width: 100 });

  y += 45;

  // Left Note & Terms
  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(darkColor)
    .text("Terms & Conditions:", 40, summaryTop)
    .font("Helvetica")
    .fillColor(lightGray)
    .text("1. All luxury timepieces include 24 months international manufacturer warranty.", 40, summaryTop + 13, { width: 275 })
    .text("2. Eligible returns must be initiated within 7 days of delivery in pristine condition.", 40, summaryTop + 24, { width: 275 })
    .text("3. Any disputes are subject to the exclusive jurisdiction of courts in Ernakulam, Kerala.", 40, summaryTop + 35, { width: 275 });

  // 6. BOTTOM FOOTER
  const footerY = 745;

  doc
    .strokeColor(borderColor)
    .lineWidth(0.5)
    .moveTo(40, footerY)
    .lineTo(555, footerY)
    .stroke();

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(lightGray)
    .text(
      "This is a computer-generated tax invoice. No signature required.",
      40,
      footerY + 8,
      { align: "center", width: 515 }
    );

  doc
    .fontSize(7)
    .font("Helvetica-Oblique")
    .fillColor(goldColor)
    .text(
      "Thank you for choosing OCEANUS Timepieces. Crafted for Eternity.",
      40,
      footerY + 20,
      { align: "center", width: 515 }
    );

  return { doc, order };
};

