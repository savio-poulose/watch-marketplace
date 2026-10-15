import crypto from "crypto";
import mongoose from "mongoose";

import razorpay, { keyId } from "../../config/razorpay.js";

import Cart from "../../models/cart.module.js";
import Variant from "../../models/variant.model.js";
import Product from "../../models/product.model.js";
import Order from "../../models/order.module.js";
import Address from "../../models/address.module.js";

// --------------------------------------------------
// 1. Calculate cart items using database prices
// --------------------------------------------------

const calculateCart = async (userId) => {
  const cart = await Cart.findOne({ userId }).populate({
    path: "items.variantId",
    populate: {
      path: "productId",
      model: Product,
    },
  });

  if (!cart || !cart.items?.length) {
    throw new Error("Your cart is empty.");
  }

  const items = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const variant = cartItem.variantId;
    const quantity = Number(cartItem.quantity);

    if (!variant) {
      throw new Error("A cart variant could not be found.");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Invalid cart quantity.");
    }

    if (variant.isActive === false) {
      throw new Error("One of your selected variants is unavailable.");
    }

    if (Number(variant.quantity) < quantity) {
      throw new Error("Insufficient stock for one of your items.");
    }

    const product = variant.productId;

    if (!product || product.isActive === false) {
      throw new Error("One of your products is unavailable.");
    }

    const unitPrice = Number(variant.price);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error("Invalid product price.");
    }

    const originalPrice = unitPrice;
    const lineTotal = unitPrice * quantity;

    subtotal += lineTotal;

    const rawImage = variant.images?.[0] || product.images?.[0] || "";

    const image =
      typeof rawImage === "string"
        ? rawImage
        : rawImage?.secure_url || rawImage?.url || rawImage?.imageUrl || "";

    items.push({
      productId: product._id,
      variantId: variant._id,
      productName: product.name,
      variantSku: `VAR-${variant._id}`,
      image,
      quantity,
      originalPrice: unitPrice,
      unitPrice,
      offerDiscount: 0,
      subtotal: lineTotal,
    });
  }

  return {
    cart,
    items,
    subtotal,
  };
};

// --------------------------------------------------
// 2. Get the user's shipping address
// --------------------------------------------------

const getShippingAddress = async (userId, addressId) => {
  if (!addressId || !mongoose.isValidObjectId(addressId)) {
    throw new Error("Please select a valid shipping address.");
  }

  const address = await Address.findOne({
    _id: addressId,
    userId,
  }).lean();

  if (!address) {
    throw new Error("Shipping address not found.");
  }

  return {
    name: address.fullName,
    phone: address.phone,

    // Match your actual Address schema
    addressLine: [address.addressLine1, address.addressLine2]
      .filter(Boolean)
      .join(", "),

    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: "India",
  };
};

// --------------------------------------------------
// 3. Create Razorpay order and save pending order
// --------------------------------------------------

export const createPaymentOrderService = async (userId, payload) => {
  const { addressId } = payload;

  const { items, subtotal } = await calculateCart(userId);

  const shippingAddress = await getShippingAddress(userId, addressId);

  // Keep these consistent with your existing checkout calculation.
  // Offer and coupon discounts are not applied in this baseline.
  const offerDiscount = 0;
  const couponDiscount = 0;
  const shippingCharge = 0;

  const totalAmount =
    subtotal - offerDiscount - couponDiscount + shippingCharge;

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error("The payment amount must be greater than zero.");
  }

  // Razorpay requires the amount in paise.
  const amountInPaise = Math.round(totalAmount * 100);

  const receipt = `pay_${new mongoose.Types.ObjectId()}`;

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt,
    notes: {
      userId: String(userId),
    },
  });

  const orderNumber = `ORD-${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;

  const order = await Order.create({
    orderNumber,
    userId,

    items,
    shippingAddress,

    subtotal,
    offerDiscount,
    couponDiscount,
    shippingCharge,
    totalAmount,

    paymentMethod: "RAZORPAY",
    paymentStatus: "PENDING",
    orderStatus: "PLACED",

    razorpayOrderId: razorpayOrder.id,
    paymentExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  return {
    keyId,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    razorpayOrderId: razorpayOrder.id,
    orderId: String(order._id),
    orderNumber: order.orderNumber,
  };
};

// --------------------------------------------------
// 4. Verify Razorpay payment
// --------------------------------------------------

export const verifyPaymentService = async (userId, payload) => {
  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = payload;

  if (
    !orderId ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    throw new Error("Missing payment verification details.");
  }

  if (!mongoose.isValidObjectId(orderId)) {
    throw new Error("Invalid order ID.");
  }

  const order = await Order.findOne({
    _id: orderId,
    userId,
    paymentMethod: "RAZORPAY",
  });

  if (!order) {
    throw new Error("Payment order not found.");
  }

  // Allow retries when this exact payment was already verified.
  if (
    order.paymentStatus === "PAID" &&
    order.razorpayPaymentId === razorpay_payment_id
  ) {
    return {
      success: true,
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      paymentStatus: "PAID",
    };
  }

  if (order.paymentStatus === "PAID") {
    throw new Error("This order has already been paid.");
  }

  if (order.razorpayOrderId !== razorpay_order_id) {
    throw new Error("Razorpay order does not match your order.");
  }

  if (order.paymentExpiresAt && order.paymentExpiresAt.getTime() < Date.now()) {
    throw new Error(
      "This payment session has expired. Please try checkout again.",
    );
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay secret is not configured.");
  }

  // Verify the signature using the server-side secret.
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (!/^[a-f0-9]+$/i.test(razorpay_signature)) {
    throw new Error("Invalid payment signature format.");
  }

  const suppliedBuffer = Buffer.from(razorpay_signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    throw new Error("Payment signature verification failed.");
  }

  // Verify payment details directly with Razorpay.
  const payment = await razorpay.payments.fetch(razorpay_payment_id);

  if (payment.order_id !== razorpay_order_id) {
    throw new Error("Payment is linked to a different Razorpay order.");
  }

  const expectedAmount = Math.round(Number(order.totalAmount) * 100);

  if (payment.amount !== expectedAmount || payment.currency !== "INR") {
    throw new Error("Payment amount or currency does not match the order.");
  }

  // This flow expects automatic capture to be enabled.
  if (payment.status !== "captured") {
    throw new Error(
      `Payment is not captured. Current status: ${payment.status}.`,
    );
  }

  // Update stock, order status and cart atomically.
  // MongoDB must support transactions for this to work.
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const freshOrder = await Order.findOne({
        _id: order._id,
        userId,
      }).session(session);

      if (!freshOrder) {
        throw new Error("Order not found.");
      }

      // Prevent duplicate stock deduction on verification retries.
      if (freshOrder.paymentStatus === "PAID") {
        if (freshOrder.razorpayPaymentId === razorpay_payment_id) {
          return;
        }

        throw new Error("This order has already been paid.");
      }

      for (const item of freshOrder.items) {
        const result = await Variant.updateOne(
          {
            _id: item.variantId,
            quantity: { $gte: item.quantity },
            isActive: true,
          },
          {
            $inc: {
              quantity: -item.quantity,
            },
          },
          { session },
        );

        if (result.modifiedCount !== 1) {
          throw new Error(
            "Insufficient stock to complete this order. Contact support before retrying.",
          );
        }
      }

      freshOrder.paymentStatus = "PAID";
      freshOrder.razorpayPaymentId = razorpay_payment_id;
      freshOrder.razorpaySignature = razorpay_signature;
      freshOrder.orderStatus = "CONFIRMED";

      await freshOrder.save({ session });

      // Remove purchased variants from the cart.
      const cart = await Cart.findOne({ userId }).session(session);

      if (cart) {
        const purchasedVariantIds = freshOrder.items.map((item) =>
          String(item.variantId),
        );

        cart.items = cart.items.filter((cartItem) => {
          const variantId = cartItem.variantId?._id
            ? cartItem.variantId._id
            : cartItem.variantId;

          return !purchasedVariantIds.includes(String(variantId));
        });

        await cart.save({ session });
      }
    });
  } finally {
    await session.endSession();
  }

  // Read the final status in case the transaction was a safe retry.
  const updatedOrder = await Order.findById(order._id);

  return {
    success: updatedOrder?.paymentStatus === "PAID",
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    paymentStatus: updatedOrder?.paymentStatus,
  };
};

export const markPaymentFailedService = async (
  userId,
  orderId,
  reason = "Payment failed or checkout was closed",
) => {
  if (!orderId || !mongoose.isValidObjectId(orderId)) {
    throw new Error("Invalid order ID.");
  }

  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      userId,
      paymentMethod: "RAZORPAY",
      paymentStatus: "PENDING",
    },
    {
      $set: {
        paymentStatus: "FAILED",
        orderStatus: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    },
    { new: true },
  );

  // A payment may already have been verified successfully.
  if (!order) {
    const existingOrder = await Order.findOne({
      _id: orderId,
      userId,
    });

    if (!existingOrder) {
      throw new Error("Payment order not found.");
    }

    if (existingOrder.paymentStatus === "PAID") {
      return {
        success: true,
        alreadyPaid: true,
        message: "Payment was already successful.",
      };
    }

    return {
      success: true,
      alreadyProcessed: true,
      paymentStatus: existingOrder.paymentStatus,
    };
  }

  // Do not clear the cart or deduct stock here.
  return {
    success: true,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
  };
};
