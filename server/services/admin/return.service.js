
import mongoose from "mongoose";

import ReturnRequest from "../../models/returnRequest.model.js";
import Order from "../../models/order.module.js";
import Wallet from "../../models/wallet.module.js";
import WalletTransaction from "../../models/walletTransaction.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const RETURN_STATUSES = [
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "ITEM_RECEIVED",
  "REFUND_PENDING",
  "REFUNDED",
];

const PROCESSING_TRANSITIONS = {
  APPROVED: ["ITEM_RECEIVED"],
  ITEM_RECEIVED: ["REFUND_PENDING"],
  REFUND_PENDING: ["REFUNDED"],
};

// GET /api/admin/returns
export const getAllReturnRequestsService = async ({
  page = 1,
  limit = 10,
  status,
} = {}) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(50, Math.max(1, Number(limit) || 10));

  const filter = {};

  if (status) {
    if (!RETURN_STATUSES.includes(status)) {
      throw createError("Invalid return status.");
    }
    filter.status = status;
  }

  const [returns, total] = await Promise.all([
    ReturnRequest.find(filter)
      .populate("userId", "name email")
      .populate(
        "orderId",
        "orderNumber totalAmount paymentMethod paymentStatus"
      )
      .populate("productId", "name images")
      .populate("variantId", "sku")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    ReturnRequest.countDocuments(filter),
  ]);

  return {
    returns,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// GET /api/admin/returns/:returnId
export const getReturnRequestByIdService = async (returnId) => {
  if (!mongoose.isValidObjectId(returnId)) {
    throw createError("Invalid return request ID.");
  }

  const returnRequest = await ReturnRequest.findById(returnId)
    .populate("userId", "name email")
    .populate(
      "orderId",
      "orderNumber totalAmount paymentMethod paymentStatus"
    )
    .populate("productId", "name images")
    .populate("variantId", "sku")
    .lean();

  if (!returnRequest) {
    throw createError("Return request not found.", 404);
  }

  return returnRequest;
};

// PATCH /api/admin/returns/:returnId/review
export const reviewReturnRequestService = async ({
  returnId,
  status,
  rejectionReason,
}) => {
  if (!mongoose.isValidObjectId(returnId)) {
    throw createError("Invalid return request ID.");
  }

  if (!["APPROVED", "REJECTED"].includes(status)) {
    throw createError("Status must be APPROVED or REJECTED.");
  }

  if (status === "REJECTED" && !rejectionReason?.trim()) {
    throw createError("A rejection reason is required.");
  }

  const returnRequest = await ReturnRequest.findById(returnId);

  if (!returnRequest) {
    throw createError("Return request not found.", 404);
  }

  if (returnRequest.status !== "REQUESTED") {
    throw createError("This return request has already been reviewed.");
  }

  returnRequest.status = status;
  returnRequest.reviewedAt = new Date();

  returnRequest.rejectionReason =
    status === "REJECTED" ? rejectionReason.trim() : null;

  await returnRequest.save();

  return returnRequest;
};

// PATCH /api/admin/returns/:returnId/status
export const updateReturnProcessingStatusService = async ({
  returnId,
  status,
}) => {
  if (!mongoose.isValidObjectId(returnId)) {
    throw createError("Invalid return request ID.");
  }

  if (!["ITEM_RECEIVED", "REFUND_PENDING", "REFUNDED"].includes(status)) {
    throw createError("Invalid return processing status.");
  }

  const session = await mongoose.startSession();

  try {
    let updatedReturnId;

    await session.withTransaction(async () => {
      const returnRequest = await ReturnRequest.findById(returnId).session(
        session
      );

      if (!returnRequest) {
        throw createError("Return request not found.", 404);
      }

      const allowedNextStatuses =
        PROCESSING_TRANSITIONS[returnRequest.status] || [];

      if (!allowedNextStatuses.includes(status)) {
        throw createError(
          `Cannot move return from ${returnRequest.status} to ${status}.`
        );
      }

      // Step 1: Mark the returned item as received.
      if (status === "ITEM_RECEIVED") {
        returnRequest.status = "ITEM_RECEIVED";
        returnRequest.itemReceivedAt = new Date();

        await returnRequest.save({ session });
        updatedReturnId = returnRequest._id;
        return;
      }

      // Step 2: Mark the request as waiting for a refund.
      if (status === "REFUND_PENDING") {
        returnRequest.status = "REFUND_PENDING";

        await returnRequest.save({ session });
        updatedReturnId = returnRequest._id;
        return;
      }

      // Step 3: Credit the refund to the customer's wallet.
      const order = await Order.findOne({
        _id: returnRequest.orderId,
        userId: returnRequest.userId,
      }).session(session);

      if (!order) {
        throw createError("Associated order not found.", 404);
      }

      // Find the exact item in the original order.
      const item = order.items.find(
        (entry) =>
          String(entry.productId) === String(returnRequest.productId) &&
          String(entry.variantId) === String(returnRequest.variantId)
      );

      if (!item) {
        throw createError("Returned item was not found in the order.");
      }

      if (
        !Number.isInteger(returnRequest.quantity) ||
        returnRequest.quantity < 1 ||
        returnRequest.quantity > item.quantity
      ) {
        throw createError("Invalid return quantity.");
      }

      // Calculate the item price after product offers.
      const lineSubtotal = Number(item.subtotal);
      const lineOfferDiscount = Number(item.offerDiscount || 0);

      const lineAfterOffer = Math.max(
        0,
        lineSubtotal - lineOfferDiscount
      );

      // Allocate the order coupon discount proportionally.
      const orderNetBeforeCoupon = order.items.reduce(
        (total, entry) =>
          total +
          Math.max(
            0,
            Number(entry.subtotal) - Number(entry.offerDiscount || 0)
          ),
        0
      );

      const couponShare =
        orderNetBeforeCoupon > 0
          ? (Number(order.couponDiscount || 0) * lineAfterOffer) /
            orderNetBeforeCoupon
          : 0;

      const lineAfterDiscounts = Math.max(
        0,
        lineAfterOffer - couponShare
      );

      const unitRefund = lineAfterDiscounts / item.quantity;

      const refundAmount =
        Math.round(unitRefund * returnRequest.quantity * 100) / 100;

      if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        throw createError("Calculated refund amount is invalid.");
      }

      // Prevent refunding more units than were purchased.
      const previousRefunds = await ReturnRequest.find({
        orderId: order._id,
        productId: returnRequest.productId,
        variantId: returnRequest.variantId,
        status: "REFUNDED",
      }).session(session);

      const alreadyRefundedQuantity = previousRefunds.reduce(
        (total, request) => total + request.quantity,
        0
      );

      if (
        alreadyRefundedQuantity + returnRequest.quantity >
        item.quantity
      ) {
        throw createError(
          "The refunded quantity would exceed the purchased quantity."
        );
      }

      // Find or create the customer's wallet.
      let wallet = await Wallet.findOne({
        userId: returnRequest.userId,
      }).session(session);

      if (!wallet) {
        [wallet] = await Wallet.create(
          [
            {
              userId: returnRequest.userId,
              balance: 0,
              isActive: true,
            },
          ],
          { session }
        );
      }

      if (!wallet.isActive) {
        throw createError("The customer's wallet is inactive.");
      }

      // Each return can only be refunded once.
      const reference = `RETURN_REFUND_${returnRequest._id}`;

      const existingTransaction = await WalletTransaction.findOne({
        reference,
      }).session(session);

      if (existingTransaction) {
        throw createError(
          "A wallet transaction already exists for this return."
        );
      }

      // Credit the wallet.
      wallet.balance =
        Math.round((Number(wallet.balance) + refundAmount) * 100) / 100;

      await wallet.save({ session });

      // Record the wallet transaction.
      await WalletTransaction.create(
        [
          {
            walletId: wallet._id,
            userId: returnRequest.userId,
            orderId: order._id,
            type: "CREDIT",
            source: "ORDER_REFUND",
            amount: refundAmount,
            balanceAfter: wallet.balance,
            status: "COMPLETED",
            description: `Wallet refund for order ${order.orderNumber}`,
            reference,
          },
        ],
        { session }
      );

      // Update the return request.
      returnRequest.status = "REFUNDED";
      returnRequest.refundAmount = refundAmount;
      returnRequest.refundedAt = new Date();

      await returnRequest.save({ session });

      // Update the order only when all units have been returned.
      const allRefunds = await ReturnRequest.find({
        orderId: order._id,
        status: "REFUNDED",
      }).session(session);

      const refundedQuantities = new Map();

      for (const request of allRefunds) {
        const key = `${request.productId}:${request.variantId}`;

        refundedQuantities.set(
          key,
          (refundedQuantities.get(key) || 0) + request.quantity
        );
      }

      const entireOrderReturned = order.items.every((entry) => {
        const key = `${entry.productId}:${entry.variantId}`;

        return (
          (refundedQuantities.get(key) || 0) >= entry.quantity
        );
      });

      if (entireOrderReturned) {
        order.orderStatus = "RETURNED";
        order.paymentStatus = "REFUNDED";
        await order.save({ session });
      }

      updatedReturnId = returnRequest._id;
    });

    return await ReturnRequest.findById(updatedReturnId);
  } finally {
    await session.endSession();
  }
};
