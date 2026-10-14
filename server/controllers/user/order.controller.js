
import {
  createOrderService,
  getMyOrdersService,
  getMyOrderByIdService,
  cancelMyOrderService,
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
