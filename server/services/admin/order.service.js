import mongoose from "mongoose";
import Order from "../../models/order.module.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

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

const allowedTransitions = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: [],
  CANCELLED: [],
};

export const getAllOrdersService = async ({
  page = 1,
  limit = 10,
  status,
  payment,
  search,
} = {}) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 10));

  const filter = {};

  if (status && status !== "ALL") {
    if (ORDER_STATUSES.includes(status)) {
      filter.orderStatus = status;
    }
  }

  if (payment && payment !== "ALL") {
    if (payment === "COD") {
      filter.paymentMethod = "COD";
    } else if (["PENDING", "PAID", "FAILED", "REFUNDED"].includes(payment)) {
      filter.paymentStatus = payment;
    }
  }

  if (search && search.trim()) {
    const term = search.trim();
    const searchConditions = [
      { orderNumber: { $regex: term, $options: "i" } },
      { "shippingAddress.name": { $regex: term, $options: "i" } },
      { "shippingAddress.phone": { $regex: term, $options: "i" } },
    ];

    if (mongoose.isValidObjectId(term)) {
      searchConditions.push({ _id: term });
    }

    try {
      const User = mongoose.model("User");
      const matchedUsers = await User.find({
        $or: [
          { userName: { $regex: term, $options: "i" } },
          { email: { $regex: term, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      if (matchedUsers.length > 0) {
        searchConditions.push({
          userId: { $in: matchedUsers.map((u) => u._id) },
        });
      }
    } catch (userSearchError) {
      console.error("User search in orders error:", userSearchError);
    }

    filter.$or = searchConditions;
  }

  const [orders, total, totalOrdersCount, pendingCount, shippedCount, deliveredCount] =
    await Promise.all([
      Order.find(filter)
        .populate("userId", "userName email profileImage")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Order.countDocuments(filter),

      Order.countDocuments({}),
      Order.countDocuments({ orderStatus: { $in: ["PLACED", "CONFIRMED"] } }),
      Order.countDocuments({ orderStatus: "SHIPPED" }),
      Order.countDocuments({ orderStatus: "DELIVERED" }),
    ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    stats: {
      total: totalOrdersCount,
      pending: pendingCount,
      shipped: shippedCount,
      delivered: deliveredCount,
    },
  };
};

export const getAdminOrderByIdService = async (orderId) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw createError("Invalid order ID.", 400);
  }

  const order = await Order.findById(orderId)
    .populate("userId", "userName email profileImage")
    .lean();

  if (!order) {
    throw createError("Order not found.", 404);
  }

  return order;
};

export const updateOrderStatusService = async (orderId, nextStatus) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw createError("Invalid order ID.", 400);
  }

  if (!ORDER_STATUSES.includes(nextStatus)) {
    throw createError("Invalid order status.", 400);
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw createError("Order not found.", 404);
  }

  if (!allowedTransitions[order.orderStatus]?.includes(nextStatus)) {
    throw createError(
      `Cannot move order from ${order.orderStatus} to ${nextStatus}.`,
      400
    );
  }

  if (nextStatus === "CANCELLED") {
    if (order.paymentStatus === "PAID") {
      throw createError(
        "Paid orders must go through the refund workflow.",
        400
      );
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const latest = await Order.findOne({
          _id: orderId,
          orderStatus: order.orderStatus,
          paymentStatus: { $ne: "PAID" },
        }).session(session);

        if (!latest) {
          throw createError("Order was updated concurrently.", 409);
        }

        const Variant = mongoose.model("Variant");

        for (const item of latest.items) {
          const result = await Variant.updateOne(
            { _id: item.variantId },
            { $inc: { quantity: item.quantity } },
            { session }
          );

          if (result.matchedCount !== 1) {
            throw createError(
              "A product variant was not found. Cancellation rolled back.",
              409
            );
          }
        }

        latest.orderStatus = "CANCELLED";
        latest.cancelledAt = new Date();
        latest.cancellationReason = "Cancelled by admin";

        await latest.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return Order.findById(orderId).lean();
  }

  order.orderStatus = nextStatus;
  if (nextStatus === "DELIVERED" && order.paymentMethod === "COD") {
    order.paymentStatus = "PAID";
  }
  await order.save();

  return order.toObject();
};