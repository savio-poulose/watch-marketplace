import {
  createPaymentOrderService,
  verifyPaymentService,
  markPaymentFailedService,
  retryPaymentService,
} from "../../services/user/payment.service.js";

export const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue.",
      });
    }

    const paymentOrder = await createPaymentOrderService(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully.",
      paymentOrder,
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Could not create payment order.",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue.",
      });
    }

    const result = await verifyPaymentService(userId, req.body);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Payment verification failed.",
    });
  }
};

export const markPaymentFailed = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue.",
      });
    }

    const { orderId, reason } = req.body;

    const result = await markPaymentFailedService(
      userId,
      orderId,
      reason
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Mark payment failed error:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Could not update payment status.",
    });
  }
};

export const retryPayment = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue.",
      });
    }

    const paymentOrder = await retryPaymentService(
      userId,
      req.params.orderId
    );

    return res.status(200).json({
      success: true,
      message: "Retry payment created successfully.",
      paymentOrder,
    });
  } catch (error) {
    console.error("Retry payment error:", error);

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Could not retry payment.",
    });
  }
};