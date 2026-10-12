
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";

const SHIPPING_FEE = 0;


const API = {
  cart: "/user/cart",
  addresses: "/user/address",
  applyCoupon: "/user/coupon/apply",
  createOrder: "/user/order",
};

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

const Checkout = () => {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [error, setError] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  useEffect(() => {
    const loadCheckout = async () => {
      try {
        setLoading(true);
        setError("");

        const [cartResponse, addressResponse] = await Promise.all([
          api.get(API.cart),
          api.get(API.addresses),
        ]);

        // Supports common response shapes:
        // { items: [...] }, { cart: { items: [...] } }, or { cartItems: [...] }
        const cartData =
          cartResponse.data?.cart?.items ??
          cartResponse.data?.cartItems ??
          cartResponse.data?.items ??
          cartResponse.data?.cart ??
          [];

        const items = Array.isArray(cartData) ? cartData : [];
        setCartItems(items);

        const addressData =
          addressResponse.data?.addresses ??
          addressResponse.data?.data?.addresses ??
          [];

        const savedAddresses = Array.isArray(addressData)
          ? addressData
          : [];

        setAddresses(savedAddresses);

        const defaultAddress = savedAddresses.find(
          (address) => address.isDefault
        );

        setSelectedAddressId(
          getId(defaultAddress) || getId(savedAddresses[0])
        );
      } catch (err) {
        console.error("Checkout loading failed:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load checkout. Please refresh and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCheckout();
  }, []);

  
  const normalizedItems = useMemo(() => {
  return cartItems.map((item) => {
    
    const variant =
      typeof item.variantId === "object"
        ? item.variantId
        : item.variant || {};

   
    const product =
      typeof variant.productId === "object"
        ? variant.productId
        : item.product || {};

    const quantity = Number(item.quantity) || 1;

    const price = Number(
      item.price ?? variant.price ?? product.price ?? 0
    );

    const image =
      variant.images?.[0] ||
      product.images?.[0] ||
      item.image ||
      "";

    return {
      ...item,
      product,
      variant,
      quantity,
      price,
      image,
      name: product.name || item.name || "Luxury Watch",
      brand: product.brand || item.brand || "",
      id: getId(item) || `${getId(product)}-${getId(variant)}`,
    };
  });
}, [cartItems]);

  const subtotal = useMemo(
    () =>
      normalizedItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [normalizedItems]
  );

  const discount = Math.min(
    subtotal,
    Math.max(0, Number(appliedCoupon?.discountAmount) || 0)
  );

  const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const selectedAddress = addresses.find(
    (address) => getId(address) === selectedAddressId
  );

  const handleApplyCoupon = async (event) => {
    event.preventDefault();

    if (!couponCode.trim()) {
      setCouponMessage("Enter a coupon code first.");
      return;
    }

    try {
      setApplyingCoupon(true);
      setCouponMessage("");

      const response = await api.post(API.applyCoupon, {
        code: couponCode.trim(),
        subtotal,
      });

      const result = response.data?.coupon || response.data;

      if (result?.success === false) {
        throw new Error(result.message || "Coupon could not be applied.");
      }

      // Expected response:
      // { discountAmount: 500 } or { coupon: { discountAmount: 500 } }
      const discountAmount = Number(result?.discountAmount);

      if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
        throw new Error(
          result?.message ||
            "The coupon response did not include a valid discount."
        );
      }

      setAppliedCoupon({
        code: result.code || couponCode.trim(),
        discountAmount,
      });

      setCouponMessage("Coupon applied successfully.");
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage(
        err.response?.data?.message ||
          err.message ||
          "Unable to apply this coupon."
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
  };

  const handlePlaceOrder = async () => {
    setError("");

    if (normalizedItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!selectedAddressId) {
      setError("Please select a delivery address.");
      return;
    }

    if (!selectedAddress) {
      setError("The selected address could not be found.");
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await api.post(API.createOrder, {
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: appliedCoupon?.code || null,
      });

      const order =
        response.data?.order ||
        response.data?.data?.order ||
        response.data;

      // For online payment, the backend should return a payment URL
      // or payment-session details. Do not mark it paid on the client.
      if (paymentMethod === "ONLINE") {
        if (order?.paymentUrl) {
          window.location.assign(order.paymentUrl);
          return;
        }

        if (order?.checkoutUrl) {
          window.location.assign(order.checkoutUrl);
          return;
        }

        if (order?.paymentSession?.url) {
          window.location.assign(order.paymentSession.url);
          return;
        }

        throw new Error(
          "The order was submitted, but no payment URL was returned. Check the order before retrying."
        );
      }

      const orderId = getId(order);

      if (orderId) {
        navigate(`/user/orders/${orderId}`);
      } else {
        navigate("/user/orders");
      }
    } catch (err) {
      console.error("Order submission failed:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
        <p className="text-sm text-gray-500">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[#111827]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <button
            type="button"
            onClick={() => navigate("/user/cart")}
            className="mb-4 text-sm text-gray-500 transition hover:text-[#9A7B3F]"
          >
            ← Back to cart
          </button>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#9A7B3F]">
            Secure checkout
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Complete your order
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Confirm your delivery details and review your purchase.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {normalizedItems.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-gray-500">
              Add a watch to your cart before checking out.
            </p>
            <button
              type="button"
              onClick={() => navigate("/collections")}
              className="mt-6 rounded-md bg-[#111827] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#9A7B3F]"
            >
              Explore watches
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_400px]">
            {/* Left column */}
            <div className="space-y-8">
              {/* Delivery address */}
              <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#9A7B3F]">
                      Step 01
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      Delivery address
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/user/address/add", {
                        state: { from: "checkout" },
                      })
                    }
                    className="shrink-0 text-sm font-medium text-[#9A7B3F] hover:underline"
                  >
                    + Add address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                    <p className="text-sm text-gray-500">
                      You have not saved a delivery address yet.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/user/address/add", {
                          state: { from: "checkout" },
                        })
                      }
                      className="mt-4 rounded-md bg-[#111827] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#9A7B3F]"
                    >
                      Add delivery address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => {
                      const addressId = getId(address);
                      const selected = addressId === selectedAddressId;

                      return (
                        <label
                          key={addressId}
                          className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition ${
                            selected
                              ? "border-[#9A7B3F] bg-[#9A7B3F]/5"
                              : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryAddress"
                            value={addressId}
                            checked={selected}
                            onChange={() => setSelectedAddressId(addressId)}
                            className="mt-1 accent-[#9A7B3F]"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold">
                                {address.fullName}
                              </span>

                              {address.addressType && (
                                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                  {address.addressType}
                                </span>
                              )}

                              {address.isDefault && (
                                <span className="text-xs font-medium text-[#9A7B3F]">
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-sm leading-6 text-gray-600">
                              {address.addressLine1}
                              {address.addressLine2
                                ? `, ${address.addressLine2}`
                                : ""}
                              <br />
                              {address.city}, {address.state} -{" "}
                              {address.pincode}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              Phone: {address.phone}
                            </p>
                          </div>

                          <span
                            className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${
                              selected
                                ? "border-[5px] border-[#9A7B3F]"
                                : "border-gray-300"
                            }`}
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Payment method */}
              <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#9A7B3F]">
                  Step 02
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Payment method
                </h2>

                <div className="mt-5 space-y-3">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
                      paymentMethod === "COD"
                        ? "border-[#9A7B3F] bg-[#9A7B3F]/5"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="mt-1 accent-[#9A7B3F]"
                    />
                    <div>
                      <p className="font-medium">Cash on delivery</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Pay when your order is delivered.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
                      paymentMethod === "ONLINE"
                        ? "border-[#9A7B3F] bg-[#9A7B3F]/5"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={paymentMethod === "ONLINE"}
                      onChange={() => setPaymentMethod("ONLINE")}
                      className="mt-1 accent-[#9A7B3F]"
                    />
                    <div>
                      <p className="font-medium">Online payment</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Continue to your payment provider.
                      </p>
                    </div>
                  </label>
                </div>

                <p className="mt-4 text-xs leading-5 text-gray-400">
                  Online payment requires a configured payment gateway and
                  server-side payment verification. Cash on delivery must also
                  be enabled by your backend.
                </p>
              </section>

              {/* Items */}
              <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#9A7B3F]">
                      Step 03
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      Order items
                    </h2>
                  </div>
                  <span className="text-sm text-gray-500">
                    {normalizedItems.length}{" "}
                    {normalizedItems.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {normalizedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-contain mix-blend-multiply"
                          />
                        ) : (
                          <span className="px-2 text-center text-xs text-gray-400">
                            No image
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {item.brand && (
                          <p className="text-xs uppercase tracking-widest text-[#9A7B3F]">
                            {item.brand}
                          </p>
                        )}

                        <h3 className="mt-1 font-medium">{item.name}</h3>

                        {(item.variant?.sku ||
                          item.variant?.strapMaterial ||
                          item.variant?.caseSize) && (
                          <p className="mt-1 text-xs text-gray-500">
                            {[
                              item.variant?.strapMaterial,
                              item.variant?.caseSize
                                ? `${item.variant.caseSize} mm`
                                : "",
                              item.variant?.sku
                                ? `SKU: ${item.variant.sku}`
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}

                        <p className="mt-2 text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>

                      <p className="shrink-0 text-right text-sm font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right column: order summary */}
            <aside className="lg:sticky lg:top-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <h2 className="text-xl font-semibold">Order summary</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review your purchase before placing the order.
                </p>

                {/* Coupon */}
                <form onSubmit={handleApplyCoupon} className="mt-6">
                  <label
                    htmlFor="couponCode"
                    className="mb-2 block text-sm font-medium"
                  >
                    Discount code
                  </label>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#9A7B3F]/40 bg-[#9A7B3F]/5 p-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {appliedCoupon.code}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          You saved {formatPrice(discount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        id="couponCode"
                        type="text"
                        value={couponCode}
                        onChange={(event) =>
                          setCouponCode(event.target.value.toUpperCase())
                        }
                        placeholder="Enter code"
                        className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#9A7B3F] focus:ring-1 focus:ring-[#9A7B3F]"
                      />

                      <button
                        type="submit"
                        disabled={applyingCoupon}
                        className="rounded-md border border-[#111827] px-4 py-2.5 text-sm font-medium transition hover:bg-[#111827] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {applyingCoupon ? "Checking..." : "Apply"}
                      </button>
                    </div>
                  )}

                  {couponMessage && (
                    <p
                      role="status"
                      className={`mt-2 text-xs ${
                        appliedCoupon ? "text-green-700" : "text-gray-500"
                      }`}
                    >
                      {couponMessage}
                    </p>
                  )}
                </form>

                {/* Totals */}
                <div className="mt-6 space-y-4 border-t border-gray-200 pt-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-medium text-green-700">
                      {discount > 0 ? `−${formatPrice(discount)}` : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-4 border-t border-gray-200 pt-5">
                    <div>
                      <p className="font-semibold">Total</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Inclusive of applicable taxes
                      </p>
                    </div>
                    <p className="text-2xl font-semibold tracking-tight">
                      {formatPrice(total)}
                    </p>
                  </div>
                </div>

                {/* Selected address summary */}
                {selectedAddress && (
                  <div className="mt-6 rounded-lg bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#9A7B3F]">
                      Delivering to
                    </p>
                    <p className="mt-2 text-sm font-medium">
                      {selectedAddress.fullName}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-gray-500">
                      {selectedAddress.addressLine1},{" "}
                      {selectedAddress.city} - {selectedAddress.pincode}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={
                    placingOrder ||
                    normalizedItems.length === 0 ||
                    addresses.length === 0 ||
                    !selectedAddressId
                  }
                  className="mt-6 w-full rounded-md bg-[#111827] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#9A7B3F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {placingOrder
                    ? "Processing..."
                    : paymentMethod === "ONLINE"
                      ? "Continue to payment"
                      : "Place order"}
                </button>

                <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                  Your order total and stock availability will be validated
                  by the server before the order is confirmed.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
