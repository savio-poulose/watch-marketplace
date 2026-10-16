
import mongoose from "mongoose";

import Wallet from "../../models/wallet.module.js";
import WalletTransaction from "../../models/walletTransaction.js";
import Order from "../../models/order.module.js";
import User from "../../models/user.model.js";

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const roundMoney = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const parsePagination = (page, limit) => {
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const parsedLimit = Math.min(
    100,
    Math.max(1, Number.parseInt(limit, 10) || 10)
  );

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
};

// Dashboard summary: wallets, transactions, and completed order revenue.
export const getAdminWalletSummaryService = async () => {
  const [
    walletSummary,
    transactionSummary,
    completedOrderSummary,
  ] = await Promise.all([
    Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balance" },
          totalWallets: { $sum: 1 },
          activeWallets: {
            $sum: {
              $cond: [{ $eq: ["$isActive", true] }, 1, 0],
            },
          },
        },
      },
    ]),

    WalletTransaction.aggregate([
      {
        $match: { status: "COMPLETED" },
      },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          orderStatus: "DELIVERED",
          paymentStatus: "PAID",
        },
      },
      {
        $group: {
          _id: null,
          completedOrderRevenue: { $sum: "$totalAmount" },
          completedOrders: { $sum: 1 },
        },
      },
    ]),
  ]);

  const walletData = walletSummary[0] || {};
  const orderData = completedOrderSummary[0] || {};

  const credits = transactionSummary.find(
    (item) => item._id === "CREDIT"
  );

  const debits = transactionSummary.find(
    (item) => item._id === "DEBIT"
  );

  return {
    totalBalance: roundMoney(walletData.totalBalance),
    totalWallets: walletData.totalWallets || 0,
    activeWallets: walletData.activeWallets || 0,

    totalCredits: roundMoney(credits?.totalAmount),
    creditTransactions: credits?.count || 0,

    totalDebits: roundMoney(debits?.totalAmount),
    debitTransactions: debits?.count || 0,

    completedOrderRevenue: roundMoney(
      orderData.completedOrderRevenue
    ),
    completedOrders: orderData.completedOrders || 0,
  };
};

// List customer wallets with search, status filtering, and pagination.
export const getAdminWalletsService = async (query = {}) => {
  const { page, limit, skip } = parsePagination(
    query.page,
    query.limit
  );

  const walletFilter = {};

  if (query.status === "ACTIVE") {
    walletFilter.isActive = true;
  } else if (query.status === "INACTIVE") {
    walletFilter.isActive = false;
  }

  if (query.search?.trim()) {
    const searchRegex = new RegExp(
      query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    const matchingUsers = await User.find({
      $or: [
        { name: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex },
      ],
    })
      .select("_id")
      .lean();

    const userIds = matchingUsers.map((user) => user._id);

    if (!userIds.length) {
      return {
        wallets: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    walletFilter.userId = { $in: userIds };
  }

  const [wallets, total] = await Promise.all([
    Wallet.find(walletFilter)
      .populate("userId", "name fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Wallet.countDocuments(walletFilter),
  ]);

  return {
    wallets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// List transactions across all customer wallets.
export const getAdminWalletTransactionsService = async (
  query = {}
) => {
  const { page, limit, skip } = parsePagination(
    query.page,
    query.limit
  );

  const filter = {};

  if (["CREDIT", "DEBIT"].includes(query.type)) {
    filter.type = query.type;
  }

  if (
    ["PENDING", "COMPLETED", "FAILED"].includes(query.status)
  ) {
    filter.status = query.status;
  }

  if (query.source) {
    filter.source = query.source;
  }

  if (query.userId) {
    if (!mongoose.isValidObjectId(query.userId)) {
      throw createError("Invalid user ID.");
    }

    filter.userId = query.userId;
  }

  if (query.from || query.to) {
    filter.createdAt = {};

    if (query.from) {
      const fromDate = new Date(query.from);

      if (Number.isNaN(fromDate.getTime())) {
        throw createError("Invalid from date.");
      }

      filter.createdAt.$gte = fromDate;
    }

    if (query.to) {
      const toDate = new Date(query.to);

      if (Number.isNaN(toDate.getTime())) {
        throw createError("Invalid to date.");
      }

      toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(filter)
      .populate("userId", "name fullName email")
      .populate("orderId", "orderNumber totalAmount orderStatus")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    WalletTransaction.countDocuments(filter),
  ]);

  return {
    transactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// Credit a customer's wallet from the admin interface.
export const adminCreditWalletService = async (
  userId,
  { amount, reason },
  adminId,
  idempotencyKey
) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw createError("Invalid user ID.");
  }

  if (!mongoose.isValidObjectId(adminId)) {
    throw createError("Authenticated admin ID is missing.", 401);
  }

  const creditAmount = roundMoney(amount);
  const description = String(reason || "").trim();

  if (
    !Number.isFinite(creditAmount) ||
    creditAmount <= 0 ||
    creditAmount > 100000
  ) {
    throw createError(
      "Amount must be greater than ₹0 and at most ₹1,00,000."
    );
  }

  if (description.length < 5 || description.length > 300) {
    throw createError(
      "Reason must contain between 5 and 300 characters."
    );
  }

  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.length < 8 ||
    idempotencyKey.length > 150
  ) {
    throw createError("A valid Idempotency-Key header is required.");
  }

  const reference = `ADMIN_CREDIT_${idempotencyKey}`;

  const existingTransaction = await WalletTransaction.findOne({
    reference,
  }).lean();

  if (existingTransaction) {
    const matches =
      String(existingTransaction.userId) === String(userId) &&
      existingTransaction.type === "CREDIT" &&
      existingTransaction.source === "ADMIN_CREDIT" &&
      existingTransaction.status === "COMPLETED" &&
      Number(existingTransaction.amount) === creditAmount;

    if (!matches) {
      throw createError(
        "This idempotency key was already used for another transaction.",
        409
      );
    }

    return {
      transaction: existingTransaction,
      alreadyProcessed: true,
    };
  }

  const userExists = await User.exists({ _id: userId });

  if (!userExists) {
    throw createError("Customer not found.", 404);
  }

  const session = await mongoose.startSession();

  try {
    let createdTransaction;

    await session.withTransaction(async () => {
      let wallet = await Wallet.findOne({ userId }).session(session);

      if (!wallet) {
        const [createdWallet] = await Wallet.create(
          [{ userId, balance: 0, isActive: true }],
          { session }
        );

        wallet = createdWallet;
      }

      if (wallet.isActive === false) {
        throw createError("This customer's wallet is inactive.", 403);
      }

      const updatedWallet = await Wallet.findOneAndUpdate(
        { _id: wallet._id, isActive: { $ne: false } },
        { $inc: { balance: creditAmount } },
        { new: true, session }
      );

      if (!updatedWallet) {
        throw createError("Could not update the wallet.", 409);
      }

      const [transaction] = await WalletTransaction.create(
        [
          {
            walletId: updatedWallet._id,
            userId,
            type: "CREDIT",
            source: "ADMIN_CREDIT",
            amount: creditAmount,
            balanceAfter: updatedWallet.balance,
            status: "COMPLETED",
            description,
            reference,
            performedBy: adminId,
          },
        ],
        { session }
      );

      createdTransaction = transaction;
    });

    return {
      transaction: createdTransaction,
      alreadyProcessed: false,
    };
  } finally {
    await session.endSession();
  }
};
