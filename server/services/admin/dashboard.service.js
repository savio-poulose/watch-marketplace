
import Order from "../../models/order.module.js";
import Product from "../../models/product.model.js";
import Variant from "../../models/variant.model.js";
import User from "../../models/user.model.js";

const LOW_STOCK_LIMIT = 5;

const REVENUE_ORDER_FILTER = {
  paymentStatus: "PAID",
  orderStatus: { $nin: ["CANCELLED", "RETURNED"] },
};

function getPeriodRange(period) {
  const now = new Date();
  const end = new Date(now);
  let start;
  let bucketCount;
  let bucketType;

  if (period === "7days") {
    start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 6);
    bucketCount = 7;
    bucketType = "day";
  } else if (period === "12months") {
    start = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - 11,
      1
    ));
    bucketCount = 12;
    bucketType = "month";
  } else {
    // Default period: 30 days
    start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 29);
    bucketCount = 30;
    bucketType = "day";
  }

  return { start, end, bucketCount, bucketType };
}

function getBucketKey(date, bucketType) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  if (bucketType === "month") {
    return `${year}-${month}`;
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getBucketLabel(date, bucketType) {
  if (bucketType === "month") {
    return date.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function buildSalesBuckets(start, bucketCount, bucketType) {
  const buckets = [];

  for (let i = 0; i < bucketCount; i += 1) {
    const date = new Date(start);

    if (bucketType === "month") {
      date.setUTCMonth(date.getUTCMonth() + i);
    } else {
      date.setUTCDate(date.getUTCDate() + i);
    }

    buckets.push({
      key: getBucketKey(date, bucketType),
      label: getBucketLabel(date, bucketType),
      revenue: 0,
    });
  }

  return buckets;
}

export async function getAdminDashboardData(period = "30days") {
  const validPeriods = ["7days", "30days", "12months"];

  if (!validPeriods.includes(period)) {
    period = "30days";
  }

  const { start, end, bucketCount, bucketType } =
    getPeriodRange(period);

  const dateFormat = bucketType === "month" ? "%Y-%m" : "%Y-%m-%d";

  const [
    totalOrders,
    totalUsers,
    totalProducts,
    totalRevenueResult,
    salesResult,
    orderStatusesResult,
    recentOrdersResult,
    topProductsResult,
    lowStockResult,
  ] = await Promise.all([
    // All orders, regardless of payment status.
    Order.countDocuments(),

    User.countDocuments({ role: "user" }),

    Product.countDocuments({ isActive: true }),

    // Revenue from paid, non-cancelled, non-returned orders.
    Order.aggregate([
      { $match: REVENUE_ORDER_FILTER },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),

    // Revenue grouped by day or month.
    Order.aggregate([
      {
        $match: {
          ...REVENUE_ORDER_FILTER,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: "$createdAt",
              timezone: "UTC",
            },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Count orders in each status, including statuses with no orders.
    Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Latest orders and customer details.
    Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select(
        "orderNumber userId totalAmount paymentMethod paymentStatus orderStatus createdAt"
      )
      .populate("userId", "userName email")
      .lean(),

    // Top-selling products, based on paid orders.
    Order.aggregate([
      { $match: REVENUE_ORDER_FILTER },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.productName" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { quantitySold: -1, revenue: -1 } },
      { $limit: 5 },
    ]),

    // Low-stock active variants.
    Variant.find({
      isActive: true,
      quantity: { $lte: LOW_STOCK_LIMIT },
    })
      .sort({ quantity: 1 })
      .limit(10)
      .select("productId quantity price size strapMaterial caseMaterial")
      .populate("productId", "name images isActive")
      .lean(),
  ]);

  const salesBuckets = buildSalesBuckets(
    start,
    bucketCount,
    bucketType
  );

  const revenueByBucket = new Map(
    salesResult.map((item) => [item._id, item.revenue])
  );

  const sales = salesBuckets.map((bucket) => ({
    label: bucket.label,
    revenue: revenueByBucket.get(bucket.key) ?? 0,
  }));

  const recentOrders = recentOrdersResult.map((order) => ({
    _id: order._id,
    orderNumber: order.orderNumber,
    customerName: order.userId?.userName ?? "Unknown customer",
    customerEmail: order.userId?.email ?? "",
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
  }));

  const topProducts = topProductsResult.map((item) => ({
    productId: item._id,
    name: item.name ?? "Unknown product",
    quantitySold: item.quantitySold,
    revenue: item.revenue,
  }));

  const lowStock = lowStockResult
    .filter((variant) => variant.productId?.isActive !== false)
    .map((variant) => ({
      variantId: variant._id,
      productId: variant.productId?._id ?? null,
      productName: variant.productId?.name ?? "Unknown product",
      image: variant.productId?.images?.[0] ?? "",
      stock: variant.quantity,
      price: variant.price,
      size: variant.size,
      strapMaterial: variant.strapMaterial,
      caseMaterial: variant.caseMaterial,
    }));

  return {
    summary: {
      totalRevenue: totalRevenueResult[0]?.totalRevenue ?? 0,
      totalOrders,
      totalUsers,
      totalProducts,
    },
    sales,
    orderStatuses: orderStatusesResult.map((item) => ({
      status: item._id,
      count: item.count,
    })),
    recentOrders,
    topProducts,
    lowStock,
  };
}
