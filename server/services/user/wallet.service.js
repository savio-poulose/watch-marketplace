
import mongoose from "mongoose";
import Wallet from "../../models/wallet.module.js";
import WalletTransaction from "../../models/walletTransaction.js";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toPaise = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw createError("Amount must be greater than zero", 400);
  }

  return Math.round(value * 100);
};

const toRupees = (paise) => paise / 100;

const getOrCreateWallet = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw createError("Invalid user ID", 400);
  }

  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    try {
      wallet = await Wallet.create({ userId });
    } catch (error) {
      // Another request may have created this user's wallet.
      if (error.code !== 11000) throw error;

      wallet = await Wallet.findOne({ userId });
    }
  }

  if (!wallet) {
    throw createError("Unable to create wallet", 500);
  }

  if (!wallet.isActive) {
    throw createError("Wallet is inactive", 403);
  }

  return wallet;
};

const getWalletBalance = async (userId) => {
  const wallet = await getOrCreateWallet(userId);

  return {
    walletId: wallet._id,
    balance: wallet.balance,
    currency: wallet.currency,
  };
};

const getWalletTransactions = async (
  userId,
  page = 1,
  limit = 10
) => {
  const wallet = await getOrCreateWallet(userId);

  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number(limit) || 10)
  );

  const filter = {
    walletId: wallet._id,
    status: "COMPLETED",
  };

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .select(
        "type source amount balanceAfter orderId description reference createdAt"
      )
      .lean(),

    WalletTransaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

const creditWallet = async ({
  userId,
  amount,
  source = "ORDER_REFUND",
  orderId = null,
  reference,
  description = "",
}) => {
  const amountPaise = toPaise(amount);
  const allowedSources = ["ORDER_REFUND", "ADMIN_CREDIT"];

  if (!allowedSources.includes(source)) {
    throw createError("Invalid wallet credit source", 400);
  }

  if (!reference || typeof reference !== "string") {
    throw createError("A unique transaction reference is required", 400);
  }

  if (orderId && !mongoose.isValidObjectId(orderId)) {
    throw createError("Invalid order ID", 400);
  }

  const wallet = await getOrCreateWallet(userId);
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const existing = await WalletTransaction.findOne({
        reference,
      }).session(session);

      if (existing) {
        if (
          String(existing.userId) !== String(userId) ||
          existing.type !== "CREDIT" ||
          existing.status !== "COMPLETED"
        ) {
          throw createError(
            "Transaction reference already used",
            409
          );
        }

        result = {
          walletId: wallet._id,
          balance: existing.balanceAfter,
          transaction: existing,
          alreadyProcessed: true,
        };

        return;
      }

      const updatedWallet = await Wallet.findOneAndUpdate(
        {
          _id: wallet._id,
          isActive: true,
        },
        {
          $inc: {
            balance: toRupees(amountPaise),
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedWallet) {
        throw createError("Wallet is inactive", 403);
      }

      const [transaction] = await WalletTransaction.create(
        [
          {
            walletId: wallet._id,
            userId,
            orderId,
            type: "CREDIT",
            source,
            amount: toRupees(amountPaise),
            balanceAfter: updatedWallet.balance,
            status: "COMPLETED",
            description,
            reference,
          },
        ],
        { session }
      );

      result = {
        walletId: updatedWallet._id,
        balance: updatedWallet.balance,
        transaction,
        alreadyProcessed: false,
      };
    });

    return result;
  } catch (error) {
    if (error.code === 11000) {
      const existing = await WalletTransaction.findOne({
        reference,
      });

      if (
        existing &&
        String(existing.userId) === String(userId) &&
        existing.type === "CREDIT" &&
        existing.status === "COMPLETED"
      ) {
        return {
          walletId: existing.walletId,
          balance: existing.balanceAfter,
          transaction: existing,
          alreadyProcessed: true,
        };
      }

      throw createError(
        "Transaction reference already used",
        409
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

const debitWallet = async ({
  userId,
  amount,
  source = "WALLET_PAYMENT",
  orderId = null,
  reference,
  description = "",
}) => {
  const amountPaise = toPaise(amount);
  const allowedSources = ["WALLET_PAYMENT", "ADMIN_DEBIT"];

  if (!allowedSources.includes(source)) {
    throw createError("Invalid wallet debit source", 400);
  }

  if (!reference || typeof reference !== "string") {
    throw createError("A unique transaction reference is required", 400);
  }

  if (orderId && !mongoose.isValidObjectId(orderId)) {
    throw createError("Invalid order ID", 400);
  }

  const wallet = await getOrCreateWallet(userId);
  const amountInRupees = toRupees(amountPaise);
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const existing = await WalletTransaction.findOne({
        reference,
      }).session(session);

      if (existing) {
        if (
          String(existing.userId) !== String(userId) ||
          existing.type !== "DEBIT" ||
          existing.status !== "COMPLETED"
        ) {
          throw createError(
            "Transaction reference already used",
            409
          );
        }

        result = {
          walletId: wallet._id,
          balance: existing.balanceAfter,
          transaction: existing,
          alreadyProcessed: true,
        };

        return;
      }

      const updatedWallet = await Wallet.findOneAndUpdate(
        {
          _id: wallet._id,
          isActive: true,
          balance: { $gte: amountInRupees },
        },
        {
          $inc: {
            balance: -amountInRupees,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedWallet) {
        throw createError(
          "Insufficient wallet balance or inactive wallet",
          400
        );
      }

      const [transaction] = await WalletTransaction.create(
        [
          {
            walletId: wallet._id,
            userId,
            orderId,
            type: "DEBIT",
            source,
            amount: amountInRupees,
            balanceAfter: updatedWallet.balance,
            status: "COMPLETED",
            description,
            reference,
          },
        ],
        { session }
      );

      result = {
        walletId: updatedWallet._id,
        balance: updatedWallet.balance,
        transaction,
        alreadyProcessed: false,
      };
    });

    return result;
  } catch (error) {
    if (error.code === 11000) {
      const existing = await WalletTransaction.findOne({
        reference,
      });

      if (
        existing &&
        String(existing.userId) === String(userId) &&
        existing.type === "DEBIT" &&
        existing.status === "COMPLETED"
      ) {
        return {
          walletId: existing.walletId,
          balance: existing.balanceAfter,
          transaction: existing,
          alreadyProcessed: true,
        };
      }

      throw createError(
        "Transaction reference already used",
        409
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export {
  getOrCreateWallet,
  getWalletBalance,
  getWalletTransactions,
  creditWallet,
  debitWallet,
};
