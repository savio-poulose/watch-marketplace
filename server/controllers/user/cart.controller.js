import { addItemToCartService,
  getCartService,
  updateCartItemService,
  removeCartItemService, } from "../../services/user/cart.service.js";


const handleError = (res, error) => {
  console.error("Cart error:", error);

  return res.status(error.statusCode || 500).json({
    message:
      error.statusCode
        ? error.message
        : "An unexpected error occurred.",
  });
};

// POST /api/user/cart/items
export const addItemToCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { variantId, quantity } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const cart = await addItemToCartService({
      userId,
      variantId,
      quantity,
    });

    return res.status(200).json({
      message: "Item added to cart successfully.",
      cart,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET /api/user/cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in to view your cart.",
      });
    }

    const cart = await getCartService(userId);

    // console.log(cart)

    return res.status(200).json({
      message: "Cart fetched successfully.",
      cart,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// PATCH /api/user/cart/items/:variantId
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { variantId } = req.params;
    const { quantity } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const cart = await updateCartItemService({
      userId,
      variantId,
      quantity,
    });

    return res.status(200).json({
      message: "Cart quantity updated successfully.",
      cart,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// DELETE /api/user/cart/items/:variantId
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { variantId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    const cart = await removeCartItemService({
      userId,
      variantId,
    });

    return res.status(200).json({
      message: "Item removed from cart successfully.",
      cart,
    });
  } catch (error) {
    return handleError(res, error);
  }
};