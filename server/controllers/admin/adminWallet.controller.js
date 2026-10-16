
import {
  getAdminWalletSummaryService,
  getAdminWalletsService,
  getAdminWalletTransactionsService,
  adminCreditWalletService,
} from "../../services/admin/adminWallet.service.js";

const getAdminWalletSummary = async (req, res, next) => {
  try {
    const summary = await getAdminWalletSummaryService();

    return res.status(200).json({
      success: true,
      message: "Wallet summary fetched successfully.",
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminWallets = async (req, res, next) => {
  try {
    const result = await getAdminWalletsService(req.query);

    return res.status(200).json({
      success: true,
      message: "Customer wallets fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminWalletTransactions = async (req, res, next) => {
  try {
    const result = await getAdminWalletTransactionsService(req.query);

    return res.status(200).json({
      success: true,
      message: "Wallet transactions fetched successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const creditCustomerWallet = async (req, res, next) => {
  try {
    const adminId = req.admin?._id || req.user?._id || req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }

    const result = await adminCreditWalletService(
      req.params.userId,
      {
        amount: req.body.amount,
        reason: req.body.reason,
      },
      adminId,
      req.get("Idempotency-Key")
    );

    return res.status(result.alreadyProcessed ? 200 : 201).json({
      success: true,
      message: result.alreadyProcessed
        ? "This wallet credit was already processed."
        : "Customer wallet credited successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getAdminWalletSummary,
  getAdminWallets,
  getAdminWalletTransactions,
  creditCustomerWallet,
};
