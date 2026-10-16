
import { useCallback, useEffect, useState } from "react";
import MainLayout from "../../components/admin/MainLayout";
import api from "../../api/axios";

const API = "/admin/wallets";
const PAGE_SIZE = 10;

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  "Something went wrong. Please try again.";

const getResponseData = (response) =>
  response?.data?.data ?? response?.data ?? {};

const getList = (data, keys) => {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
};

const getPagination = (data, itemCount) => {
  const pagination = data?.pagination ?? data ?? {};

  return {
    total: Number(pagination.total ?? itemCount),
    totalPages: Math.max(
      1,
      Number(
        pagination.totalPages ??
          Math.ceil(Number(pagination.total ?? itemCount) / PAGE_SIZE)
      )
    ),
  };
};

const getUser = (value) => {
  if (value && typeof value === "object") return value;
  return {};
};

const getCustomerName = (wallet) => {
  const user = getUser(wallet?.userId);

  return user.name || user.fullName || user.email || "Customer";
};

const getCustomerEmail = (wallet) => {
  const user = getUser(wallet?.userId);
  return user.email || "No email available";
};

const getWalletBalance = (wallet) =>
  Number(wallet?.balance ?? wallet?.availableBalance ?? 0);

const getTransactionCustomer = (transaction) => {
  const user = getUser(transaction?.userId);

  return user.name || user.fullName || user.email || "Customer";
};

const getSourceLabel = (source = "") =>
  String(source)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase()) || "—";

const SummaryCard = ({ label, value, icon, description }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-3 break-words text-2xl font-bold tracking-tight text-[#111827]">
          {value}
        </p>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#9A7B3F]/10 text-lg font-bold text-[#9A7B3F]">
        {icon}
      </div>
    </div>

    <p className="mt-3 text-xs text-gray-400">{description}</p>
  </div>
);

const TableMessage = ({ message, colSpan = 5 }) => (
  <tr>
    <td
      colSpan={colSpan}
      className="px-5 py-12 text-center text-sm text-gray-500"
    >
      {message}
    </td>
  </tr>
);

const AdminWallet = () => {
  const [summary, setSummary] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  const [error, setError] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [transactionsError, setTransactionsError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const [transactionType, setTransactionType] = useState("ALL");

  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditLoading, setCreditLoading] = useState(false);

  const [notice, setNotice] = useState({
    type: "",
    message: "",
  });

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError("");

    try {
      const response = await api.get(`${API}/summary`);
      setSummary(getResponseData(response));
    } catch (error) {
      setSummaryError(getErrorMessage(error));
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: PAGE_SIZE,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (status !== "ALL") {
        params.status = status;
      }

      const response = await api.get(API, { params });
      const data = getResponseData(response);

      const walletList = getList(data, [
        "wallets",
        "items",
        "results",
      ]);

      setWallets(walletList);
      setPagination(getPagination(data, walletList.length));
    } catch (error) {
      setError(getErrorMessage(error));
      setWallets([]);
      setPagination({ total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  const fetchTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    setTransactionsError("");

    try {
      const params = {
        page: 1,
        limit: 8,
      };

      if (transactionType !== "ALL") {
        params.type = transactionType;
      }

      const response = await api.get(`${API}/transactions`, {
        params,
      });

      const data = getResponseData(response);

      setTransactions(
        getList(data, ["transactions", "items", "results"])
      );
    } catch (error) {
      setTransactionsError(getErrorMessage(error));
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  }, [transactionType]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refreshAll = async () => {
    await Promise.all([
      fetchSummary(),
      fetchWallets(),
      fetchTransactions(),
    ]);
  };

  const openCreditModal = (wallet) => {
    setSelectedWallet(wallet);
    setCreditAmount("");
    setCreditReason("");
    setNotice({ type: "", message: "" });
    setShowCreditModal(true);
  };

  const closeCreditModal = () => {
    if (creditLoading) return;

    setShowCreditModal(false);
    setSelectedWallet(null);
    setCreditAmount("");
    setCreditReason("");
  };

  const handleCreditWallet = async (event) => {
    event.preventDefault();

    if (!selectedWallet) return;

    const amount = Number(creditAmount);
    const reason = creditReason.trim();

    if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
      setNotice({
        type: "error",
        message: "Enter an amount greater than ₹0 and at most ₹1,00,000.",
      });
      return;
    }

    if (reason.length < 5 || reason.length > 300) {
      setNotice({
        type: "error",
        message: "The reason must contain between 5 and 300 characters.",
      });
      return;
    }

    // The backend route expects the customer user ID, not the wallet ID.
    const userId =
      typeof selectedWallet.userId === "object"
        ? selectedWallet.userId?._id
        : selectedWallet.userId;

    if (!userId) {
      setNotice({
        type: "error",
        message: "Could not identify this customer's user ID.",
      });
      return;
    }

    setCreditLoading(true);
    setNotice({ type: "", message: "" });

    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      await api.post(
        `${API}/${userId}/credit`,
        {
          amount,
          reason,
        },
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        }
      );

      setShowCreditModal(false);
      setSelectedWallet(null);

      setNotice({
        type: "success",
        message: "Wallet credited successfully.",
      });

      await Promise.all([
        fetchSummary(),
        fetchWallets(),
        fetchTransactions(),
      ]);
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setCreditLoading(false);
    }
  };

  const totalBalance =
    summary?.totalBalance ??
    summary?.totalWalletBalance ??
    summary?.totalBalanceAmount ??
    0;

  const totalWallets =
    summary?.totalWallets ??
    summary?.walletCount ??
    pagination.total;

  const totalCredits =
    summary?.totalCredits ??
    summary?.totalCreditAmount ??
    0;

  const totalDebits =
    summary?.totalDebits ??
    summary?.totalDebitAmount ??
    0;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-7">
          {/* Page header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-[#9A7B3F]">
                FINANCIAL MANAGEMENT
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
                Wallet Management
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Manage customer balances, wallet credits, and transaction history.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              <span aria-hidden="true">↻</span>
              Refresh
            </button>
          </div>

          {/* Page notification */}
          {notice.message && !showCreditModal && (
            <div
              role="status"
              className={`rounded-lg border px-4 py-3 text-sm ${
                notice.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {notice.message}
            </div>
          )}

          {/* Summary cards */}
          {summaryError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Failed to load summary: {summaryError}
              <button
                type="button"
                onClick={fetchSummary}
                className="ml-2 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total Wallet Balance"
              value={
                summaryLoading && !summary
                  ? "Loading..."
                  : formatCurrency(totalBalance)
              }
              icon="₹"
              description="Combined customer wallet balances"
            />

            <SummaryCard
              label="Customer Wallets"
              value={
                summaryLoading && !summary
                  ? "Loading..."
                  : Number(totalWallets).toLocaleString("en-IN")
              }
              icon="◉"
              description="Wallet accounts"
            />

            <SummaryCard
              label="Total Credits"
              value={
                summaryLoading && !summary
                  ? "Loading..."
                  : formatCurrency(totalCredits)
              }
              icon="↙"
              description="Completed credit transactions"
            />

            <SummaryCard
              label="Total Debits"
              value={
                summaryLoading && !summary
                  ? "Loading..."
                  : formatCurrency(totalDebits)
              }
              icon="↗"
              description="Completed debit transactions"
            />
          </div>

          {/* Customer wallets */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#111827]">
                  Customer Wallets
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Search customers and manage wallet credits.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    ⌕
                  </span>

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name or email"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#9A7B3F] focus:ring-2 focus:ring-[#9A7B3F]/15 sm:w-64"
                  />
                </div>

                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9A7B3F]"
                >
                  <option value="ALL">All wallets</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
                <button
                  type="button"
                  onClick={fetchWallets}
                  className="ml-3 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Customer</th>
                    <th className="px-5 py-4 font-semibold">Wallet Balance</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Created</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <TableMessage message="Loading wallets..." />
                  ) : wallets.length === 0 ? (
                    <TableMessage message="No wallets found." />
                  ) : (
                    wallets.map((wallet) => {
                      const isActive = wallet.isActive !== false;

                      return (
                        <tr
                          key={wallet._id}
                          className="transition hover:bg-gray-50/80"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111827] text-sm font-bold text-white">
                                {getCustomerName(wallet)
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-semibold text-gray-900">
                                  {getCustomerName(wallet)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {getCustomerEmail(wallet)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-bold tabular-nums text-[#111827]">
                            {formatCurrency(getWalletBalance(wallet))}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isActive
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-gray-500">
                            {formatDate(wallet.createdAt)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              disabled={!isActive}
                              onClick={() => openCreditModal(wallet)}
                              className="rounded-lg bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Add credit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                {pagination.total} wallet
                {pagination.total === 1 ? "" : "s"} found
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="px-2 text-sm text-gray-600">
                  Page {page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          {/* Recent transactions */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#111827]">
                  Recent Transactions
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Review credits and debits across customer wallets.
                </p>
              </div>

              <select
                value={transactionType}
                onChange={(event) => setTransactionType(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9A7B3F]"
              >
                <option value="ALL">All transactions</option>
                <option value="CREDIT">Credits</option>
                <option value="DEBIT">Debits</option>
              </select>
            </div>

            {transactionsError && (
              <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {transactionsError}
                <button
                  type="button"
                  onClick={fetchTransactions}
                  className="ml-3 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Customer</th>
                    <th className="px-5 py-4 font-semibold">Type</th>
                    <th className="px-5 py-4 font-semibold">Source</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {transactionsLoading ? (
                    <TableMessage message="Loading transactions..." />
                  ) : transactions.length === 0 ? (
                    <TableMessage message="No transactions found." />
                  ) : (
                    transactions.map((transaction) => {
                      const isCredit = transaction.type === "CREDIT";

                      return (
                        <tr
                          key={transaction._id}
                          className="transition hover:bg-gray-50/80"
                        >
                          <td className="px-5 py-4 font-medium text-gray-800">
                            {getTransactionCustomer(transaction)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isCredit
                                  ? "bg-green-50 text-green-700"
                                  : "bg-orange-50 text-orange-700"
                              }`}
                            >
                              {transaction.type || "—"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-gray-500">
                            {getSourceLabel(transaction.source)}
                          </td>

                          <td
                            className={`px-5 py-4 font-bold tabular-nums ${
                              isCredit ? "text-green-700" : "text-gray-900"
                            }`}
                          >
                            {isCredit ? "+" : "−"}
                            {formatCurrency(transaction.amount)}
                          </td>

                          <td className="px-5 py-4 text-gray-500">
                            {formatDate(
                              transaction.createdAt || transaction.updatedAt
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Add wallet credit modal */}
      {showCreditModal && selectedWallet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !creditLoading
            ) {
              closeCreditModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="credit-wallet-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9A7B3F]">
                  Wallet adjustment
                </p>

                <h2
                  id="credit-wallet-title"
                  className="mt-1 text-xl font-bold text-[#111827]"
                >
                  Add wallet credit
                </h2>
              </div>

              <button
                type="button"
                disabled={creditLoading}
                onClick={closeCreditModal}
                aria-label="Close modal"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              >
                ✕
              </button>
            </div>

            <div className="mb-5 rounded-xl bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {getCustomerName(selectedWallet)}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {getCustomerEmail(selectedWallet)}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="text-sm text-gray-500">
                  Current balance
                </span>

                <span className="font-bold text-[#111827]">
                  {formatCurrency(getWalletBalance(selectedWallet))}
                </span>
              </div>
            </div>

            <form onSubmit={handleCreditWallet} className="space-y-4">
              <div>
                <label
                  htmlFor="credit-amount"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Amount (₹)
                </label>

                <input
                  id="credit-amount"
                  type="number"
                  min="0.01"
                  max="100000"
                  step="0.01"
                  required
                  value={creditAmount}
                  onChange={(event) => setCreditAmount(event.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-3 outline-none focus:border-[#9A7B3F] focus:ring-2 focus:ring-[#9A7B3F]/15"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Maximum credit: ₹1,00,000 per transaction.
                </p>
              </div>

              <div>
                <label
                  htmlFor="credit-reason"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Reason for credit
                </label>

                <textarea
                  id="credit-reason"
                  rows={3}
                  minLength={5}
                  maxLength={300}
                  required
                  value={creditReason}
                  onChange={(event) => setCreditReason(event.target.value)}
                  placeholder="Explain why this wallet is being credited"
                  className="w-full resize-none rounded-lg border border-gray-200 px-3.5 py-3 outline-none focus:border-[#9A7B3F] focus:ring-2 focus:ring-[#9A7B3F]/15"
                />
              </div>

              {notice.message && showCreditModal && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {notice.message}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={creditLoading}
                  onClick={closeCreditModal}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creditLoading}
                  className="flex-1 rounded-lg bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creditLoading ? "Processing..." : "Confirm credit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AdminWallet;
