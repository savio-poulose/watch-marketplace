import mongoose from "mongoose";
import Order from "../../models/order.module.js";
import Cart from "../../models/cart.module.js";
import Variant from "../../models/variant.model.js";
import Address from "../../models/address.module.js";
import Wallet from "../../models/wallet.module.js";
import WalletTransaction from "../../models/walletTransaction.js";
import ReturnRequest from "../../models/returnRequest.model.js";
import Coupon from "../../models/coupon.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const money = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const generateOrderNumber = () =>
  `OCE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

const getOwnedAddress = async (addressId, userId) => {
  if (!mongoose.isValidObjectId(addressId)) {
    throw createError("Invalid address ID.", 400);
  }

  const address = await Address.findOne({
    _id: addressId,
    userId,
  }).lean();

  if (!address) {
    throw createError("Address not found.", 404);
  }

  return {
    name: address.fullName || address.name,
    phone: address.phone,
    addressLine: address.addressLine1 || address.addressLine,
    city: address.city,
    state: address.state,
    pincode: String(address.pincode),
    landmark: address.landmark || "",
  };
};

// IMPORTANT: Integrate your existing product-offer pricing logic here.
// This currently uses the variant price without additional offer calculation.
const getCurrentUnitPrice = async (variant) => {
  return Number(variant.price);
};

// =====================================================
// CREATE ORDER
// =====================================================

export const createOrderService = async (userId, payload) => {
  const { addressId, paymentMethod, couponCode } = payload;

  if (!mongoose.isValidObjectId(userId)) {
    throw createError("Invalid user.", 401);
  }

  if (!["COD", "RAZORPAY"].includes(paymentMethod)) {
    throw createError("Unsupported payment method.", 400);
  }

  const address = await getOwnedAddress(addressId, userId);

  const cart = await Cart.findOne({ userId }).lean();

  if (!cart?.items?.length) {
    throw createError("Your cart is empty.", 400);
  }

  const variantIds = cart.items.map((item) => item.variantId);

  if (variantIds.some((id) => !mongoose.isValidObjectId(id))) {
    throw createError("Your cart contains an invalid variant.", 400);
  }

  const session = await mongoose.startSession();

  try {
    let createdOrder;

    await session.withTransaction(async () => {
      const variants = await Variant.find({
        _id: { $in: variantIds },
        isActive: true,
      }).session(session);

      const variantMap = new Map(
        variants.map((variant) => [String(variant._id), variant])
      );

      const orderItems = [];

      let subtotal = 0;
      let offerDiscount = 0;

      // -----------------------------------------------
      // VALIDATE PRODUCTS AND RESERVE STOCK
      // -----------------------------------------------

      for (const cartItem of cart.items) {
        const variant = variantMap.get(String(cartItem.variantId));

        if (!variant) {
          throw createError(
            "A product in your cart is no longer available.",
            400
          );
        }

        const quantity = Number(cartItem.quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
          throw createError("Invalid cart quantity.", 400);
        }

        const stockUpdate = await Variant.updateOne(
          {
            _id: variant._id,
            isActive: true,
            quantity: { $gte: quantity },
          },
          {
            $inc: { quantity: -quantity },
          },
          { session }
        );

        if (stockUpdate.modifiedCount !== 1) {
          throw createError(
            `Insufficient stock for variant ${variant._id}.`,
            409
          );
        }

        const product = await mongoose
          .model("Product")
          .findById(variant.productId)
          .session(session)
          .lean();

        if (!product || product.isActive === false) {
          throw createError(
            "A product in your cart is unavailable.",
            400
          );
        }

        const originalPrice = Number(variant.price);
        const unitPrice = await getCurrentUnitPrice(variant);

        const lineSubtotal = money(unitPrice * quantity);

        const lineOfferDiscount = money(
          Math.max(0, originalPrice - unitPrice) * quantity
        );

        subtotal += money(originalPrice * quantity);
        offerDiscount += lineOfferDiscount;

        const sku = variant.sku || `HOR-${variant._id}`;

        orderItems.push({
          productId: product._id,
          variantId: variant._id,
          productName: product.name,
          variantSku: sku,
          image: variant.images?.[0] || product.images?.[0] || "",
          quantity,
          originalPrice,
          unitPrice,
          offerDiscount: lineOfferDiscount,
          subtotal: lineSubtotal,
        });
      }

      subtotal = money(subtotal);
      offerDiscount = money(offerDiscount);

      // -----------------------------------------------
      // COUPON VALIDATION AND DISCOUNT CALCULATION
      // -----------------------------------------------

      // Coupon applies after product offers.
      const amountAfterOffers = money(subtotal - offerDiscount);

      let couponDiscount = 0;
      let appliedCouponCode = null;

      if (typeof couponCode === "string" && couponCode.trim()) {
        const normalizedCode = couponCode.trim();

        // Escape special regex characters in the user-supplied code.
        const escapedCode = normalizedCode.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        const now = new Date();

        const coupon = await Coupon.findOne({
          code: {
            $regex: `^${escapedCode}$`,
            $options: "i",
          },
          isActive: true,
          startDate: { $lte: now },
          endDate: { $gte: now },
        }).session(session);

        if (!coupon) {
          throw createError(
            "Invalid, inactive, or expired coupon.",
            400
          );
        }

        // Check the minimum order amount.
        const minimumOrderAmount = Number(
          coupon.minOrderAmount || 0
        );

        if (amountAfterOffers < minimumOrderAmount) {
          throw createError(
            `Minimum order amount for this coupon is ₹${minimumOrderAmount}.`,
            400
          );
        }

        const discountValue = Number(coupon.discountValue);

        if (
          !Number.isFinite(discountValue) ||
          discountValue <= 0
        ) {
          throw createError(
            "This coupon has an invalid discount configuration.",
            400
          );
        }

        // Percentage coupon.
        if (coupon.discountType === "PERCENTAGE") {
          if (discountValue > 100) {
            throw createError(
              "This coupon has an invalid percentage discount.",
              400
            );
          }

          couponDiscount =
            amountAfterOffers * (discountValue / 100);

          // Enforce the maximum discount when configured.
          if (
            coupon.maxDiscount !== undefined &&
            coupon.maxDiscount !== null
          ) {
            const maxDiscount = Number(coupon.maxDiscount);

            if (
              !Number.isFinite(maxDiscount) ||
              maxDiscount < 0
            ) {
              throw createError(
                "This coupon has an invalid maximum discount.",
                400
              );
            }

            couponDiscount = Math.min(
              couponDiscount,
              maxDiscount
            );
          }
        } else if (coupon.discountType === "FIXED") {
          // Fixed-value coupon.
          couponDiscount = discountValue;
        } else {
          throw createError(
            "This coupon has an unsupported discount type.",
            400
          );
        }

        // Never allow the coupon to discount more than
        // the remaining amount after product offers.
        couponDiscount = money(
          Math.min(
            Math.max(couponDiscount, 0),
            amountAfterOffers
          )
        );

        appliedCouponCode = coupon.code;
      }

      // -----------------------------------------------
      // FINAL ORDER AMOUNT
      // -----------------------------------------------

      const shippingCharge = 0;

      const totalAmount = money(
        amountAfterOffers -
          couponDiscount +
          shippingCharge
      );

      // -----------------------------------------------
      // CREATE ORDER
      // -----------------------------------------------

      const [order] = await Order.create(
        [
          {
            orderNumber: generateOrderNumber(),
            userId,
            items: orderItems,
            shippingAddress: address,
            subtotal,
            offerDiscount,
            couponDiscount,
            shippingCharge,
            totalAmount,
            couponCode: appliedCouponCode,
            paymentMethod,
            paymentStatus: "PENDING",
            orderStatus: "PLACED",
            stockReserved: true,
          },
        ],
        { session }
      );

      // Clear the cart only after the order is created.
      const cartDelete = await Cart.deleteOne(
        { userId },
        { session }
      );

      if (cartDelete.deletedCount !== 1) {
        throw createError("Could not clear the cart.", 500);
      }

      createdOrder = order;
    });

    return createdOrder;
  } finally {
    await session.endSession();
  }
};

// =====================================================
// GET USER ORDERS
// =====================================================

export const getMyOrdersService = async (userId) => {
  return Order.find({ userId })
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();
};

// =====================================================
// GET SINGLE USER ORDER
// =====================================================

export const getMyOrderByIdService = async (
  userId,
  orderId
) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw createError("Invalid order ID.", 400);
  }

  const order = await Order.findOne({
    _id: orderId,
    userId,
  }).lean();

  if (!order) {
    throw createError("Order not found.", 404);
  }

  return order;
};

// =====================================================
// CANCEL ORDER
// =====================================================

export const cancelMyOrderService = async (
  userId,
  orderId,
  reason = ""
) => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw createError("Invalid order ID.", 400);
  }

  const allowedStatuses = [
    "PAYMENT_PENDING",
    "PLACED",
    "CONFIRMED",
    "PROCESSING",
  ];

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: orderId,
        userId,
      }).session(session);

      if (!order) {
        throw createError("Order not found.", 404);
      }

      if (order.orderStatus === "CANCELLED") {
        throw createError(
          "This order is already cancelled.",
          409
        );
      }

      if (!allowedStatuses.includes(order.orderStatus)) {
        throw createError(
          "This order can no longer be cancelled. Use the return workflow if applicable.",
          400
        );
      }

      if (order.paymentStatus === "REFUNDED") {
        throw createError(
          "This order has already been refunded.",
          409
        );
      }

      const wasPaid = order.paymentStatus === "PAID";

      if (wasPaid && order.paymentMethod !== "RAZORPAY") {
        throw createError(
          "This paid order requires manual refund review.",
          409
        );
      }

      const shouldCreditWallet =
        order.paymentMethod === "RAZORPAY" && wasPaid;

      const refundAmount = money(Number(order.totalAmount));

      if (
        shouldCreditWallet &&
        (!Number.isFinite(refundAmount) || refundAmount <= 0)
      ) {
        throw createError("Invalid refund amount.", 400);
      }

      // Restore stock for cancelled orders when required.
      const shouldRestoreStock =
        order.stockReserved === true ||
        order.paymentMethod === "COD" ||
        wasPaid;

      if (shouldRestoreStock) {
        for (const item of order.items) {
          const result = await Variant.updateOne(
            { _id: item.variantId },
            { $inc: { quantity: item.quantity } },
            { session }
          );

          if (result.modifiedCount !== 1) {
            throw createError(
              `Could not restore stock for ${item.productName}.`,
              409
            );
          }
        }

        order.stockReserved = false;
      }

      // Refund successfully paid Razorpay orders to the wallet.
      if (shouldCreditWallet) {
        const reference = `ORDER_REFUND_${order._id}`;

        let wallet = await Wallet.findOne({
          userId: order.userId,
        }).session(session);

        if (!wallet) {
          const [createdWallet] = await Wallet.create(
            [{ userId: order.userId, balance: 0 }],
            { session }
          );

          wallet = createdWallet;
        }

        if (!wallet.isActive) {
          throw createError(
            "Your wallet is inactive. Please contact support.",
            403
          );
        }

        // Prevent duplicate refund credits.
        const existingTransaction =
          await WalletTransaction.findOne({
            reference,
          }).session(session);

        if (existingTransaction) {
          if (
            String(existingTransaction.userId) !==
              String(order.userId) ||
            String(existingTransaction.orderId) !==
              String(order._id) ||
            existingTransaction.type !== "CREDIT" ||
            existingTransaction.status !== "COMPLETED" ||
            Number(existingTransaction.amount) !== refundAmount
          ) {
            throw createError(
              "Refund transaction conflict. Please contact support.",
              409
            );
          }
        } else {
          const updatedWallet = await Wallet.findOneAndUpdate(
            {
              _id: wallet._id,
              isActive: true,
            },
            {
              $inc: { balance: refundAmount },
            },
            {
              new: true,
              session,
            }
          );

          if (!updatedWallet) {
            throw createError(
              "Could not credit your wallet.",
              500
            );
          }

          await WalletTransaction.create(
            [
              {
                walletId: updatedWallet._id,
                userId: order.userId,
                orderId: order._id,
                type: "CREDIT",
                source: "ORDER_REFUND",
                amount: refundAmount,
                balanceAfter: updatedWallet.balance,
                status: "COMPLETED",
                description: `Wallet refund for order ${order.orderNumber}`,
                reference,
              },
            ],
            { session }
          );
        }

        order.paymentStatus = "REFUNDED";
      }

      order.orderStatus = "CANCELLED";
      order.cancelledAt = new Date();
      order.cancellationReason = String(reason || "").slice(
        0,
        500
      );

      await order.save({ session });
    });

    return await Order.findOne({
      _id: orderId,
      userId,
    }).lean();
  } finally {
    await session.endSession();
  }
};

// =====================================================
// REQUEST ORDER RETURN
// =====================================================

export const requestOrderReturnService = async ({
  orderId,
  userId,
  productId,
  variantId,
  quantity,
  reason,
}) => {
  if (
    !mongoose.isValidObjectId(orderId) ||
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(productId) ||
    !mongoose.isValidObjectId(variantId)
  ) {
    throw createError(
      "Invalid order, product, or variant ID."
    );
  }

  quantity = Number(quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw createError(
      "Return quantity must be a positive integer."
    );
  }

  if (!reason?.trim()) {
    throw createError("Return reason is required.");
  }

  const order = await Order.findOne({
    _id: orderId,
    userId,
  });

  if (!order) {
    throw createError("Order not found.", 404);
  }

  if (order.orderStatus !== "DELIVERED") {
    throw createError(
      "Only delivered orders can be returned."
    );
  }

  const orderItem = order.items.find(
    (item) =>
      String(item.productId) === String(productId) &&
      String(item.variantId) === String(variantId)
  );

  if (!orderItem) {
    throw createError(
      "This product does not belong to the order."
    );
  }

  if (quantity > orderItem.quantity) {
    throw createError(
      "Return quantity exceeds the purchased quantity."
    );
  }

  // Check quantities already requested for return.
  const previousRequests = await ReturnRequest.find({
    orderId,
    productId,
    variantId,
    status: {
      $in: [
        "REQUESTED",
        "APPROVED",
        "ITEM_RECEIVED",
        "REFUND_PENDING",
        "REFUNDED",
      ],
    },
  }).lean();

  const alreadyRequested = previousRequests.reduce(
    (total, request) => total + request.quantity,
    0
  );

  if (alreadyRequested + quantity > orderItem.quantity) {
    throw createError(
      "The requested return quantity exceeds the remaining eligible quantity."
    );
  }

  const returnRequest = await ReturnRequest.create({
    orderId,
    userId,
    productId,
    variantId,
    quantity,
    reason: reason.trim(),
    status: "REQUESTED",
    requestedAt: new Date(),
  });

  return returnRequest;
};

// =====================================================
// GET USER RETURN REQUESTS
// =====================================================

export const getUserReturnRequestsService = async ({
  orderId,
  userId,
}) => {
  if (
    !mongoose.isValidObjectId(orderId) ||
    !mongoose.isValidObjectId(userId)
  ) {
    throw createError("Invalid order ID.", 400);
  }

  const order = await Order.findOne({
    _id: orderId,
    userId,
  }).select("_id");

  if (!order) {
    throw createError("Order not found.", 404);
  }

  return ReturnRequest.find({ orderId, userId })
    .sort({ createdAt: -1 })
    .lean();
};