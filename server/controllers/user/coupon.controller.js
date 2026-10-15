
import { applyCouponService } from "../../services/user/coupon.service.js";

export const applyCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    const coupon = await applyCouponService({
      code,
      subtotal,
    });

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully.",
      coupon,
    });
  } catch (error) {
    console.error("Apply coupon error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to apply coupon.",
    });
  }
};
