import { useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "../../components/admin/MainLayout.jsx";
import api from "../../api/axios.js";
import {
  FaTicketAlt,
  FaPlus,
  FaSearch,
  FaEdit,
  FaPowerOff,
  FaPercent,
  FaTimes,
  FaCalendarAlt,
  FaTag,
  FaTrash,
  FaSpinner,
  FaSyncAlt,
} from "react-icons/fa";

const emptyForm = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderAmount: "0",
  maxDiscount: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
};

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Something went wrong. Please try again.";

const normalizeCoupon = (coupon) => ({
  ...coupon,
  code: String(coupon.code || "").toUpperCase(),
  discountType: coupon.discountType,
  discountValue: Number(coupon.discountValue),
  minOrderAmount: Number(coupon.minOrderAmount ?? 0),
  maxDiscount:
    coupon.maxDiscount == null ? null : Number(coupon.maxDiscount),
  usageLimit: coupon.usageLimit == null ? null : Number(coupon.usageLimit),
  usedCount: Number(coupon.usedCount ?? 0),
  isActive: Boolean(coupon.isActive),
});

const getCouponArray = (response) => {
  const body = response?.data;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.coupons)) return body.coupons;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.coupons)) return body.data.coupons;

  return [];
};

const toDateInput = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const AdminCoupon = () => {
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // GET: Fetch coupons from backend
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/coupons");
      const couponList = getCouponArray(response);

      setCoupons(couponList.map(normalizeCoupon));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const matchesSearch = coupon.code
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && coupon.isActive) ||
        (statusFilter === "INACTIVE" && !coupon.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, statusFilter]);

  const activeCount = coupons.filter((coupon) => coupon.isActive).length;

  const totalRedemptions = coupons.reduce(
    (total, coupon) => total + coupon.usedCount,
    0
  );

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingCoupon(null);
    setForm(emptyForm);
    setError("");
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);

    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: String(coupon.minOrderAmount ?? 0),
      maxDiscount:
        coupon.maxDiscount == null ? "" : String(coupon.maxDiscount),
      startDate: toDateInput(coupon.startDate),
      endDate: toDateInput(coupon.endDate),
      usageLimit:
        coupon.usageLimit == null ? "" : String(coupon.usageLimit),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // POST: Create coupon
  // PATCH: Edit existing coupon
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const code = form.code.trim().toUpperCase();
    const discountValue = Number(form.discountValue);
    const minOrderAmount = Number(form.minOrderAmount);

    const maxDiscount =
      form.discountType === "PERCENTAGE" && form.maxDiscount !== ""
        ? Number(form.maxDiscount)
        : null;

    const usageLimit =
      form.usageLimit === "" ? null : Number(form.usageLimit);

    if (!code || !form.startDate || !form.endDate) {
      setError("Please complete all required fields.");
      return;
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setError("Discount value must be greater than zero.");
      return;
    }

    if (
      form.discountType === "PERCENTAGE" &&
      discountValue > 100
    ) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }

    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
      setError("Minimum order amount cannot be negative.");
      return;
    }

    if (
      maxDiscount !== null &&
      (!Number.isFinite(maxDiscount) || maxDiscount <= 0)
    ) {
      setError("Maximum discount must be greater than zero.");
      return;
    }

    if (
      usageLimit !== null &&
      (!Number.isInteger(usageLimit) || usageLimit < 1)
    ) {
      setError("Usage limit must be a positive whole number.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date must be on or after the start date.");
      return;
    }

    const couponData = {
      code,
      discountType: form.discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate: form.startDate,
      endDate: form.endDate,
      usageLimit,
    };

    setSaving(true);

    try {
      if (editingCoupon) {
        await api.patch(
          `/admin/coupons/${editingCoupon._id}`,
          couponData
        );

        setSuccess("Coupon updated successfully.");
      } else {
        await api.post("/admin/coupons", couponData);

        setSuccess("Coupon created successfully.");
      }

      setShowModal(false);
      setEditingCoupon(null);
      setForm(emptyForm);

      await fetchCoupons();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // PATCH: Enable or disable coupon
  const toggleStatus = async (coupon) => {
    const nextStatus = !coupon.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "enable" : "disable"
      } coupon "${coupon.code}"?`
    );

    if (!confirmed) return;

    setActionId(coupon._id);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/admin/coupons/${coupon._id}/status`, {
        isActive: nextStatus,
      });

      setSuccess(
        `Coupon ${coupon.code} ${
          nextStatus ? "enabled" : "disabled"
        } successfully.`
      );

      await fetchCoupons();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  // DELETE: Delete coupon
  const deleteCoupon = async (coupon) => {
    const confirmed = window.confirm(
      `Delete coupon "${coupon.code}"? This action may be irreversible.`
    );

    if (!confirmed) return;

    setActionId(coupon._id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/admin/coupons/${coupon._id}`);

      setSuccess(`Coupon ${coupon.code} deleted successfully.`);

      await fetchCoupons();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-[#111827] p-3 text-[#C5A15D]">
                <FaTicketAlt className="text-xl" />
              </div>

              <h1 className="text-2xl font-bold text-[#111827] sm:text-3xl">
                Coupon Management
              </h1>
            </div>

            <p className="text-sm text-gray-500">
              Create and manage promotional discounts for OCEANUS customers.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchCoupons}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#111827] px-5 py-3 font-medium text-white transition hover:bg-gray-800"
            >
              <FaPlus />
              Create Coupon
            </button>
          </div>
        </div>

        {/* Feedback */}
        {error && !showModal && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <span>{success}</span>
            <button
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Total Coupons</p>
              <FaTicketAlt className="text-lg text-[#9A7B3F]" />
            </div>

            <p className="mt-3 text-3xl font-bold text-[#111827]">
              {coupons.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Active Coupons</p>
              <FaTag className="text-lg text-green-600" />
            </div>

            <p className="mt-3 text-3xl font-bold text-[#111827]">
              {activeCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Total Redemptions</p>
              <FaPercent className="text-lg text-[#9A7B3F]" />
            </div>

            <p className="mt-3 text-3xl font-bold text-[#111827]">
              {totalRedemptions}
            </p>
          </div>
        </div>

        {/* Coupon Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">
                All Coupons
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Review discount rules and redemption status.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  placeholder="Search coupon code..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#9A7B3F] sm:w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#9A7B3F]"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Coupon</th>
                  <th className="px-5 py-4 font-semibold">Discount</th>
                  <th className="px-5 py-4 font-semibold">Min. Order</th>
                  <th className="px-5 py-4 font-semibold">Validity</th>
                  <th className="px-5 py-4 font-semibold">Usage</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <FaSpinner className="mx-auto mb-3 animate-spin text-2xl text-[#9A7B3F]" />
                      <p className="text-gray-500">Loading coupons...</p>
                    </td>
                  </tr>
                ) : filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <FaTicketAlt className="mx-auto mb-3 text-3xl text-gray-300" />
                      <p className="font-medium text-gray-600">
                        No coupons found
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Try a different search or create a new coupon.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <tr
                      key={coupon._id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-[#F5F0E6] p-2.5 text-[#9A7B3F]">
                            <FaTicketAlt />
                          </div>

                          <div>
                            <p className="font-bold tracking-wide text-[#111827]">
                              {coupon.code}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {coupon.discountType === "PERCENTAGE"
                                ? "Percentage coupon"
                                : "Fixed amount coupon"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-[#111827]">
                        {coupon.discountType === "PERCENTAGE"
                          ? `${coupon.discountValue}%`
                          : formatPrice(coupon.discountValue)}

                        {coupon.maxDiscount != null &&
                          coupon.discountType === "PERCENTAGE" && (
                            <p className="mt-1 text-xs font-normal text-gray-500">
                              Max {formatPrice(coupon.maxDiscount)}
                            </p>
                          )}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatPrice(coupon.minOrderAmount)}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          <div>
                            <p>{toDateInput(coupon.startDate) || "—"}</p>
                            <p className="mt-1 text-xs text-gray-400">
                              to {toDateInput(coupon.endDate) || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        <p className="font-medium text-[#111827]">
                          {coupon.usedCount} / {coupon.usageLimit ?? "∞"}
                        </p>

                        {coupon.usageLimit != null && (
                          <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-[#9A7B3F]"
                              style={{
                                width: `${
                                  coupon.usageLimit > 0
                                    ? Math.min(
                                        (coupon.usedCount /
                                          coupon.usageLimit) *
                                          100,
                                        100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            coupon.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(coupon)}
                            title="Edit coupon"
                            disabled={actionId === coupon._id}
                            className="rounded-lg border border-gray-200 p-2.5 text-gray-600 transition hover:border-[#9A7B3F] hover:text-[#9A7B3F] disabled:opacity-50"
                          >
                            <FaEdit />
                          </button>

                          <button
                            onClick={() => toggleStatus(coupon)}
                            title={
                              coupon.isActive
                                ? "Disable coupon"
                                : "Enable coupon"
                            }
                            disabled={actionId === coupon._id}
                            className={`rounded-lg border border-gray-200 p-2.5 transition disabled:opacity-50 ${
                              coupon.isActive
                                ? "text-red-500 hover:border-red-300 hover:bg-red-50"
                                : "text-green-600 hover:border-green-300 hover:bg-green-50"
                            }`}
                          >
                            {actionId === coupon._id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaPowerOff />
                            )}
                          </button>

                          <button
                            onClick={() => deleteCoupon(coupon)}
                            title="Delete coupon"
                            disabled={actionId === coupon._id}
                            className="rounded-lg border border-gray-200 p-2.5 text-red-500 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-5 py-4 text-sm text-gray-500">
            Showing {loading ? 0 : filteredCoupons.length} of {coupons.length} coupons
          </div>
        </div>

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold text-[#111827]">
                    {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure the discount and validity rules.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Coupon Code *
                  </label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleFormChange}
                    placeholder="e.g. OCEANUS10"
                    maxLength={40}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 uppercase outline-none focus:border-[#9A7B3F]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Discount Type *
                    </label>
                    <select
                      name="discountType"
                      value={form.discountType}
                      onChange={handleFormChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#9A7B3F]"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Discount Value *
                    </label>
                    <input
                      type="number"
                      name="discountValue"
                      value={form.discountValue}
                      onChange={handleFormChange}
                      min="0.01"
                      max={
                        form.discountType === "PERCENTAGE" ? 100 : undefined
                      }
                      step="0.01"
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#9A7B3F]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Minimum Order Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="minOrderAmount"
                      value={form.minOrderAmount}
                      onChange={handleFormChange}
                      min="0"
                      step="0.01"
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#9A7B3F]"
                    />
                  </div>

                  {form.discountType === "PERCENTAGE" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Maximum Discount (₹)
                      </label>
                      <input
                        type="number"
                        name="maxDiscount"
                        value={form.maxDiscount}
                        onChange={handleFormChange}
                        min="0.01"
                        step="0.01"
                        placeholder="No limit"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#9A7B3F]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#9A7B3F]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      End Date *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleFormChange}
                      min={form.startDate || undefined}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#9A7B3F]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Total Usage Limit
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={form.usageLimit}
                      onChange={handleFormChange}
                      min="1"
                      step="1"
                      placeholder="Unlimited"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#9A7B3F]"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#111827] px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && <FaSpinner className="animate-spin" />}
                    {saving
                      ? "Saving..."
                      : editingCoupon
                        ? "Save Changes"
                        : "Create Coupon"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminCoupon;