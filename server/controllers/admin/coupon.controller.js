
import {
  couponsAllGet,
  couponGetById,
  couponCreate,
  couponUpdate,
  couponUpdateStatus,
  couponDelete,
} from "../../services/admin/coupon.service.js";

const handleError = (res, error) => {
  console.error("Coupon controller error:", error);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error.",
  });
};

export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await couponsAllGet();

    return res.status(200).json({
      success: true,
      coupons,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCouponById = async (req, res) => {
  try {
    const coupon = await couponGetById(req.params.id);

    return res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const createCoupon = async (req, res) => {
  try {
    const coupon = await couponCreate(req.body);

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully.",
      coupon,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const editCoupon = async (req, res) => {
  try {
    const coupon = await couponUpdate(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully.",
      coupon,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateCouponStatus = async (req, res) => {
  try {
    const coupon = await couponUpdateStatus(
      req.params.id,
      req.body.isActive
    );

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? "enabled" : "disabled"} successfully.`,
      coupon,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    await couponDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully.",
    });
  } catch (error) {
    return handleError(res, error);
  }
};
