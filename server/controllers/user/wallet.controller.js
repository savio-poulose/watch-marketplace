
import {
  getWalletBalance,
  getWalletTransactions,
} from "../../services/user/wallet.service.js";

const getMyWallet = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const wallet = await getWalletBalance(userId);

    return res.status(200).json({
      success: true,
      message: "Wallet fetched successfully",
      wallet,
    });
  } catch (error) {
    next(error);
  }
};

const getMyWalletTransactions = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { page = 1, limit = 10 } = req.query;

    const result = await getWalletTransactions(
      userId,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      message: "Wallet transactions fetched successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getMyWallet,
  getMyWalletTransactions,
};
