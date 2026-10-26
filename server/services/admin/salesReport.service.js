
import Order from "../../models/order.module.js";

const EXCLUDED_STATUSES = ["CANCELLED", "RETURNED"];

const normalizeStatus = (value) =>
  String(value ?? "").trim().toUpperCase();

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
    orders: sales.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      subtotal: Number(order.subtotal) || 0,
      offerDiscount: Number(order.offerDiscount) || 0,
      couponDiscount: Number(order.couponDiscount) || 0,
      shippingCharge: Number(order.shippingCharge) || 0,
      totalAmount: Number(order.totalAmount) || 0,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      itemsCount: sum(
        (order.items ?? []).map(
          (item) => Number(item.quantity) || 0
        )
      ),
    })),
  };
};
