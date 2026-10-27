
import {
  getAllOrdersService,
  getAdminOrderByIdService,
  updateOrderStatusService,
} from "../../services/admin/order.service.js";

export const getAllOrders = async (req, res, next) => {
  try {
    const result = await getAllOrdersService({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
      search: req.query.search,
      payment: req.query.payment || req.query.paymentStatus,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOrderById = async (req, res, next) => {
  try {
    const order = await getAdminOrderByIdService(req.params.orderId);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;

    const order = await updateOrderStatusService(
      req.params.orderId,
      orderStatus
    );

    res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    next(error);
  }
};
