
import {
  addToWishlistService,
  removeFromWishlistService,
  checkWishlistService,
  getWishlistService,
} from "../../services/user/wishlist.service.js";

const getUserId = (req) => req.user?._id || req.user?.id;

export const addToWishlist = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    const wishlistItem = await addToWishlistService(userId, productId);

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      wishlistItem,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to add product",
    });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    await removeFromWishlistService(userId, productId);

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to remove product",
    });
  }
};

export const checkWishlist = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    const isFavorite = await checkWishlistService(userId, productId);

    return res.status(200).json({
      success: true,
      isFavorite,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to check wishlist",
    });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    const wishlist = await getWishlistService(userId);

    return res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch wishlist",
    });
  }
};
