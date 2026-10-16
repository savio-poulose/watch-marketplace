
import { useCallback, useEffect, useState } from "react";
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "../../components/layout/Navbar";
import api from "../../api/axios.js";

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const limit = 10;

  const fetchWallet = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const [walletResponse, transactionResponse] = await Promise.all([
        api.get("/user/wallet"),
        api.get(
          `/user/wallet/transactions?page=${page}&limit=${limit}`
        ),
      ]);

      setWallet(
        walletResponse.data.wallet ?? walletResponse.data
      );

      const transactionData = transactionResponse.data;
      setTransactions(transactionData.transactions || []);

      setPagination({
        total: transactionData.total ?? 0,
        totalPages: transactionData.totalPages ?? 1,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to load wallet details."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionTitle = (transaction) => {
    if (transaction.description) return transaction.description;

    const labels = {
      ORDER_REFUND: "Order Refund",
      WALLET_PAYMENT: "Wallet Payment",
      ADMIN_CREDIT: "Wallet Credit",
      ADMIN_DEBIT: "Wallet Debit",
    };

    return labels[transaction.source] || "Wallet Transaction";
  };

  const isCredit = (transaction) => transaction.type === "CREDIT";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#9A7B3F]" />
            <p className="mt-3 text-sm text-gray-500">
              Loading your wallet...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[#111827]">
      <Navbar />

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          {/* Page Header */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9A7B3F]">
                OCEANUS ACCOUNT
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                My Wallet
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Manage your balance and track your wallet transactions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchWallet(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2.5 text-sm transition hover:border-[#9A7B3F] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Wallet Balance */}
          <section className="relative overflow-hidden bg-[#111827] p-6 text-white sm:p-8">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -right-5 -top-5 h-32 w-32 rounded-full border border-white/10" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-300">
                  Available Wallet Balance
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {formatCurrency(wallet?.balance)}
                </h2>

                <div className="mt-5 inline-flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-2 text-xs text-gray-300">
                  <span className="h-2 w-2 rounded-full bg-[#9A7B3F]" />
                  OCEANUS Store Wallet
                </div>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#9A7B3F]/50 bg-white/5">
                <WalletIcon className="h-7 w-7 text-[#C8A96B]" />
              </div>
            </div>

            <p className="relative mt-6 max-w-lg text-xs leading-5 text-gray-400">
              Refunds from eligible cancelled online orders are credited
              here. Your wallet balance can be used according to the
              payment options supported by OCEANUS.
            </p>
          </section>

          {/* Transaction History */}
          <section className="mt-8 border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold">
                  Transaction History
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Your wallet credits and debits.
                </p>
              </div>

              <span className="text-sm text-gray-500">
                {pagination.total} transactions
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>

                <h3 className="mt-4 font-medium">
                  No transactions yet
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Wallet refunds and other transactions will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {transactions.map((transaction) => {
                    const credit = isCredit(transaction);

                    return (
                      <article
                        key={transaction._id}
                        className="flex items-center gap-3 p-4 transition hover:bg-gray-50 sm:gap-4 sm:p-5"
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center ${
                            credit
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {credit ? (
                            <ArrowDownLeft className="h-5 w-5" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-medium text-[#111827]">
                            {getTransactionTitle(transaction)}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </p>

                          {transaction.orderId && (
                            <p className="mt-1 truncate text-xs text-gray-400">
                              Order:{" "}
                              {typeof transaction.orderId === "object"
                                ? transaction.orderId.orderNumber ||
                                  transaction.orderId._id
                                : transaction.orderId}
                            </p>
                          )}

                          {transaction.reference && (
                            <p className="mt-1 truncate text-xs text-gray-400">
                              Ref: {transaction.reference}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className={`text-sm font-semibold ${
                              credit
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            {credit ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </p>

                          <p className="mt-1 text-xs capitalize text-gray-500">
                            {String(
                              transaction.status || "COMPLETED"
                            ).toLowerCase()}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 sm:px-6">
                  <p className="text-xs text-gray-500 sm:text-sm">
                    Page {page} of {pagination.totalPages}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || refreshing}
                      onClick={() =>
                        setPage((current) => current - 1)
                      }
                      className="flex items-center gap-1 border border-gray-300 px-3 py-2 text-sm hover:border-[#9A7B3F] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={
                        page >= pagination.totalPages || refreshing
                      }
                      onClick={() =>
                        setPage((current) => current + 1)
                      }
                      className="flex items-center gap-1 border border-gray-300 px-3 py-2 text-sm hover:border-[#9A7B3F] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Information */}
          <div className="mt-5 border border-[#9A7B3F]/20 bg-[#9A7B3F]/5 p-4">
            <p className="text-sm font-medium text-[#111827]">
              About wallet refunds
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Eligible refunds are added to your OCEANUS wallet after
              successful processing. If a refund does not appear, contact
              customer support with your order number.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Wallet;
