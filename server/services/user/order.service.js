import mongoose from "mongoose";
import Order from "../../models/order.module.js";
import Cart from "../../models/cart.module.js";
import Variant from "../../models/variant.model.js";
import Address from "../../models/address.module.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const money = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

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

// Replace this with the same shared pricing function used by
// your cart service so checkout and orders calculate identical offers.
const getCurrentUnitPrice = async (variant) => {
  return Number(variant.price);
};

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

  // Use a transaction to prevent partial stock updates or orders.
  const session = await mongoose.startSession();

  try {
    let createdOrder;

    await session.withTransaction(async () => {
      const variants = await Variant.find({
        _id: { $in: variantIds },
        isActive: true,
      }).session(session);

      const variantMap = new Map(
        variants.map((variant) => [String(variant._id), variant]),
      );

      const orderItems = [];
      let subtotal = 0;
      let offerDiscount = 0;

      for (const cartItem of cart.items) {
        const variant = variantMap.get(String(cartItem.variantId));

        if (!variant) {
          throw createError(
            "A product in your cart is no longer available.",
            400,
          );
        }

        const quantity = Number(cartItem.quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
          throw createError("Invalid cart quantity.", 400);
        }

        // Atomically reserve stock. A concurrent order cannot
        // successfully decrement stock below zero.
        const stockUpdate = await Variant.updateOne(
          {
            _id: variant._id,
            isActive: true,
            quantity: { $gte: quantity },
          },
          {
            $inc: { quantity: -quantity },
          },
          { session },
        );

        if (stockUpdate.modifiedCount !== 1) {
          throw createError(
            `Insufficient stock for variant ${variant._id}. Requested: ${quantity}.`,
            409,
          );
        }

        const product = await mongoose
          .model("Product")
          .findById(variant.productId)
          .session(session)
          .lean();

        if (!product || product.isActive === false) {
          throw createError("A product in your cart is unavailable.", 400);
        }

        const originalPrice = Number(variant.price);
        const unitPrice = await getCurrentUnitPrice(variant);

        // Offer pricing must be integrated into getCurrentUnitPrice.
        const lineSubtotal = money(unitPrice * quantity);
        const lineOfferDiscount = money(
          Math.max(0, originalPrice - unitPrice) * quantity,
        );

        subtotal += money(originalPrice * quantity);
        offerDiscount += lineOfferDiscount;

        const sku = variant.sku || `HOR-${variant._id}`;

        console.log("Variant data:", {
          variantId: String(variant._id),
          sku: variant.sku,
          productId: String(variant.productId),
          productName: product.name,
        });

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

      // Coupon validation is intentionally not guessed here.
      // Connect your actual coupon service before accepting couponCode.
      if (couponCode) {
        throw createError(
          "Coupon checkout integration is not configured yet.",
          501,
        );
      }

      const couponDiscount = 0;
      const shippingCharge = 0;
      const totalAmount = money(
        subtotal - offerDiscount - couponDiscount + shippingCharge,
      );

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
            couponCode: null,
            paymentMethod,
            paymentStatus: "PENDING",
            orderStatus: "PLACED",
          },
        ],
        { session },
      );

      const cartDelete = await Cart.deleteOne({ userId }, { session });

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

export const getMyOrdersService = async (userId) => {
  return Order.find({ userId }).sort({ createdAt: -1 }).select("-__v").lean();
};

export const getMyOrderByIdService = async (userId, orderId) => {
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

export const cancelMyOrderService = async (userId, orderId, reason = "") => {
  if (!mongoose.isValidObjectId(orderId)) {
    throw createError("Invalid order ID.", 400);
  }

  const order = await Order.findOne({
    _id: orderId,
    userId,
  });

  if (!order) {
    throw createError("Order not found.", 404);
  }

  // Once shipped or delivered, use a return workflow instead.
  if (!["PLACED", "CONFIRMED", "PROCESSING"].includes(order.orderStatus)) {
    throw createError("This order can no longer be cancelled.", 400);
  }

  if (order.paymentStatus === "PAID") {
    throw createError(
      "A paid order needs the refund workflow before cancellation.",
      400,
    );
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const latestOrder = await Order.findOne({
        _id: orderId,
        userId,
        orderStatus: { $in: ["PLACED", "CONFIRMED", "PROCESSING"] },
        paymentStatus: { $ne: "PAID" },
      }).session(session);

      if (!latestOrder) {
        throw createError("Order can no longer be cancelled.", 409);
      }

      for (const item of latestOrder.items) {
        await Variant.updateOne(
          { _id: item.variantId },
          { $inc: { quantity: item.quantity } },
          { session },
        );
      }

      latestOrder.orderStatus = "CANCELLED";
      latestOrder.cancelledAt = new Date();
      latestOrder.cancellationReason = String(reason).slice(0, 500);
      await latestOrder.save({ session });
    });

    return Order.findOne({ _id: orderId, userId }).lean();
  } finally {
    await session.endSession();
  }
};
