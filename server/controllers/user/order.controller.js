
import {
  createOrderService,
  getMyOrdersService,
  getMyOrderByIdService,
  cancelMyOrderService,
  requestOrderReturnService,
  getUserReturnRequestsService
} from "../../services/user/order.service.js";

export const createOrder = async (req, res, next) => {
  try {
    const order = await createOrderService(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await getMyOrdersService(req.user.id);

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrderById = async (req, res, next) => {
  try {
    const order = await getMyOrderByIdService(
      req.user.id,
      req.params.orderId
    );

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelMyOrder = async (req, res, next) => {
  try {
    const order = await cancelMyOrderService(
      req.user.id,
      req.params.orderId,
      req.body.reason
    );

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      order,
    });
  } catch (error) {
    next(error);
  }
};



export const requestOrderReturn = async (req, res, next) => {
  try {
    const result = await requestOrderReturnService({
      orderId: req.params.orderId,
      userId: req.user.id, // Match this to your auth middleware's user field.
      reason: req.body.reason,
      productId: req.body.productId,
      variantId: req.body.variantId,
      quantity: req.body.quantity,
    });

    res.status(201).json({
      success: true,
      message: "Return request submitted successfully.",
      returnRequest: result,
    });
  } catch (error) {
    console.log("requrest error :"+error)
    next(error);
  }
};



export const getUserReturnRequests = async (req, res, next) => {
  try {
    const returns = await getUserReturnRequestsService({
      orderId: req.params.orderId,
      userId: req.user.id || req.user._id,
    });

    res.status(200).json({
      success: true,
      returns,
    });
  } catch (error) {
    next(error);
  }
};