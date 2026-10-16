import { useCallback, useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import api from "../../api/axios.js";

import loadRazorpay from "../../utils/loadRazorpay.js";

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

    maximumFractionDigits: 2,

  }).format(Number(amount) || 0);

const getId = (value) => {

  if (!value) return "";

  if (typeof value === "string") return value;

  return value._id || value.id || "";

};

const getCartItems = (data) => {

  const items =

    data?.cart?.items ??

    data?.cartItems ??

    data?.items ??

    (Array.isArray(data?.cart) ? data.cart : []);

  return Array.isArray(items) ? items : [];

};

const getImageUrl = (image) => {

  if (!image) return "";

  if (typeof image === "string") {

    const value = image.trim();

    return value.startsWith("http\://") || value.startsWith("https\://") || value.startsWith("/")

      ? value

      : "";

  }

  if (Array.isArray(image)) {

    for (const candidate of image) {

      const url = getImageUrl(candidate);

      if (url) return url;

    }

    return "";

  }

  if (typeof image === "object") {

    const directUrl =

      image.secure_url ||

      image.url ||

      image.imageUrl ||

      image.imageURL ||

      image.src ||

      image.path ||

      image.location ||

      image.downloadURL ||

      image.publicUrl;

    if (typeof directUrl === "string" && directUrl.trim()) {

      return directUrl.trim();

    }

    // Handle APIs that nest the actual image object.
    return (

      getImageUrl(image.image) ||

      getImageUrl(image.thumbnail) ||

      getImageUrl(image.file) ||

      getImageUrl(image.images) ||

      ""

    );

  }

  return "";

};

const Checkout = () => {

  const navigate = useNavigate();

  const location = useLocation();

  const [cartItems, setCartItems] = useState([]);

  const [addresses, setAddresses] = useState([]);

  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState(
  location.state?.retryOrderId ? "ONLINE" : "COD"
);


  const [couponCode, setCouponCode] = useState(

    location.state?.couponCode || "",

  );

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [loading, setLoading] = useState(true);

  const [placingOrder, setPlacingOrder] = useState(false);

  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [error, setError] = useState("");

  const [couponMessage, setCouponMessage] = useState("");

  const [orderError, setOrderError] = useState("");
  const [retryOrderId, setRetryOrderId] = useState(
  location.state?.retryOrderId || ""
);

  // Fetch cart and saved addresses.
  const loadCheckout = useCallback(async () => {

    try {

      setLoading(true);

      setError("");

      const [cartResponse, addressResponse] = await Promise.all([

        api.get(API.cart),

        api.get(API.addresses),

      ]);

      setCartItems(getCartItems(cartResponse.data));

      const addressData =

        addressResponse.data?.addresses ??

        addressResponse.data?.data?.addresses ??

        addressResponse.data?.data ??

        [];

      const savedAddresses = Array.isArray(addressData)

        ? addressData

        : [];

      setAddresses(savedAddresses);

      const defaultAddress = savedAddresses.find(

        (address) => address.isDefault,

      );

      setSelectedAddressId(

        getId(defaultAddress) || getId(savedAddresses[0]),

      );

    } catch (err) {

      console.error("Checkout loading failed:", err);

      setError(

        err.response?.data?.message ||

          "Unable to load checkout. Please refresh and try again.",

      );

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {

    loadCheckout();

  }, [loadCheckout]);

  // Normalize cart response for display.
  const normalizedItems = useMemo(() => {

    return cartItems.map((item, index) => {

      const variant =

        item.variantId && typeof item.variantId === "object"

          ? item.variantId

          : item.variant || {};

      const product =

        variant.productId && typeof variant.productId === "object"

          ? variant.productId

          : item.productId && typeof item.productId === "object"

            ? item.productId

            : item.product || {};

      const quantity = Math.max(

        1,

        Math.floor(Number(item.quantity) || 1),

      );

      const originalPrice = Math.max(

        0,

        Number(

          item.originalPrice ??

            variant.price ??

            item.price ??

            product.price ??

            0,

        ) || 0,

      );

      const finalPrice = Math.max(

        0,

        Number(

          item.discountedPrice ??

            item.finalPrice ??

            item.pricing?.finalPrice ??

            item.price ??

            originalPrice,

        ) || 0,

      );

      const offerSavings = Math.max(

        0,

        originalPrice - finalPrice,

      );

      const backendOffer =

        item.offer ||

        item.appliedOffer ||

        item.pricing?.offer ||

        null;

      // Search all image locations; an empty variant.images array must not block fallback images.
      const image =

        getImageUrl(variant.images) ||

        getImageUrl(variant.image) ||

        getImageUrl(product.images) ||

        getImageUrl(product.image) ||

        getImageUrl(product.thumbnail) ||

        getImageUrl(item.images) ||

        getImageUrl(item.image) ||

        getImageUrl(item.thumbnail) ||

        "";

      return {

        ...item,

        product,

        variant,

        quantity,

        originalPrice,

        finalPrice,

        offerSavings,

        offer: {

          name: backendOffer?.name || "",

          discountType: backendOffer?.discountType || "",

          discountValue:

            Number(backendOffer?.discountValue) || 0,

        },

        image,

        name: product.name || item.name || "Luxury Watch",

        brand: product.brand || item.brand || "",

        id:

          getId(item) ||

          `${getId(product)}-${getId(variant)}` ||

          `cart-item-${index}`,

      };

    });

  }, [cartItems]);

  // Original subtotal before offers.
  const subtotal = useMemo(

    () =>

      normalizedItems.reduce(

        (sum, item) =>

          sum + item.originalPrice * item.quantity,

        0,

      ),

    [normalizedItems],

  );

  // Total product offer savings.
  const offerSavings = useMemo(

    () =>

      normalizedItems.reduce(

        (sum, item) =>

          sum + item.offerSavings * item.quantity,

        0,

      ),

    [normalizedItems],

  );

  // Subtotal after automatic offers.
  const discountedSubtotal = useMemo(

    () =>

      normalizedItems.reduce(

        (sum, item) =>

          sum + item.finalPrice * item.quantity,

        0,

      ),

    [normalizedItems],

  );

  const discount = Math.min(

    discountedSubtotal,

    Math.max(0, Number(appliedCoupon?.discountAmount) || 0),

  );

  const shipping =

    discountedSubtotal > 0 ? SHIPPING_FEE : 0;

  const total = Math.max(

    0,

    discountedSubtotal - discount + shipping,

  );

  const selectedAddress = addresses.find(

    (address) => getId(address) === selectedAddressId,

  );

  // Apply coupon using the existing backend endpoint.
  const handleApplyCoupon = async (event) => {

    event.preventDefault();

    const code = couponCode.trim().toUpperCase();

    if (!code) {

      setCouponMessage("Enter a coupon code first.");

      return;

    }

    if (normalizedItems.length === 0) {

      setCouponMessage("Your cart is empty.");

      return;

    }

    try {

      setApplyingCoupon(true);

      setCouponMessage("");

      setOrderError("");

      const response = await api.post(API.applyCoupon, {

        code,

        subtotal: discountedSubtotal,

      });

      const result =

        response.data?.coupon ||

        response.data?.data?.coupon ||

        response.data;

      if (result?.success === false) {

        throw new Error(

          result.message || "Coupon could not be applied.",

        );

      }

      const discountAmount = Number(result?.discountAmount);

      if (

        !Number.isFinite(discountAmount) ||

        discountAmount <= 0

      ) {

        throw new Error(

          result?.message ||

            "The server did not return a valid coupon discount.",

        );

      }

      const normalizedCode = String(

        result.code || result.coupon?.code || code,

      ).toUpperCase();

      setAppliedCoupon({

        code: normalizedCode,

        discountAmount: Math.min(

          discountedSubtotal,

          discountAmount,

        ),

      });

      setCouponCode(normalizedCode);

      setCouponMessage("Coupon applied successfully.");

    } catch (err) {

      console.error("Coupon application failed:", err);

      setAppliedCoupon(null);

      setCouponMessage(

        err.response?.data?.message ||

          err.message ||

          "Unable to apply this coupon.",

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

  // Razorpay Test Mode payment flow.
  const handleOnlinePayment = async (existingOrderId = "") => {

    if (placingOrder) return;

    try {

      setPlacingOrder(true);

      setOrderError("");

      if (!existingOrderId && !selectedAddressId) {

        setOrderError("Please select a delivery address.");

        setPlacingOrder(false);

        return;

      }

      if (!existingOrderId && normalizedItems.length === 0) {

        setOrderError("Your cart is empty.");

        setPlacingOrder(false);

        return;

      }

      const loaded = await loadRazorpay();

      if (!loaded) {

        setOrderError(

          "Unable to load Razorpay. Please try again.",

        );

        setPlacingOrder(false);

        return;

      }

      // Server recalculates current offers and the applied coupon.
      const response = existingOrderId
        ? await api.post(`/user/payment/retry/${existingOrderId}`)
        : await api.post("/user/payment/create-order", {
            addressId: selectedAddressId,
            couponCode: appliedCoupon?.code || undefined,
          });

      const paymentOrder =

        response.data?.paymentOrder ??

        response.data?.data ??

        response.data;

      if (

        !paymentOrder?.keyId ||

        !paymentOrder?.razorpayOrderId ||

        !paymentOrder?.orderId ||

        !Number.isFinite(Number(paymentOrder.amount))

      ) {

        throw new Error(

          "The server response is missing Razorpay order details.",

        );

      }

      let verificationStarted = false;

      const options = {

        key: paymentOrder.keyId,

        amount: paymentOrder.amount,

        currency: paymentOrder.currency || "INR",

        name: "OCEANUS",

        description: "Luxury Watch Purchase",

        order_id: paymentOrder.razorpayOrderId,

        handler: async (paymentResponse) => {

          verificationStarted = true;

          try {

            const verification = await api.post(

              "/user/payment/verify",

              {

                orderId: paymentOrder.orderId,

                razorpay_order_id:

                  paymentResponse.razorpay_order_id,

                razorpay_payment_id:

                  paymentResponse.razorpay_payment_id,

                razorpay_signature:

                  paymentResponse.razorpay_signature,

              },

            );

            if (verification.data?.success) {

              navigate(

                `/user/order-success/${paymentOrder.orderId}`,

                { replace: true },

              );

              return;

            }

            setOrderError(

              "Payment verification was unsuccessful. Check your order status before trying again.",

            );

          } catch (verifyError) {

            console.error(

              "Payment verification error:",

              verifyError.response?.data || verifyError,

            );

            setOrderError(

              verifyError.response?.data?.message ||

                "We couldn't confirm your payment. Check your order status before retrying.",

            );

          } finally {

            setPlacingOrder(false);

          }

        },

        modal: {

          ondismiss: async () => {

            if (!verificationStarted) {

              try {

                const failureResponse = await api.post("/user/payment/fail", {

                  orderId: paymentOrder.orderId,

                  reason: "Customer closed the payment window",

                });
                if (
                  !failureResponse.data?.alreadyPaid &&
                  failureResponse.data?.paymentStatus !== "PAID"
                ) {
                  setRetryOrderId(paymentOrder.orderId);
                  setPaymentMethod("ONLINE");
                }

              } catch (failError) {

                console.error(

                  "Could not update abandoned payment status:",

                  failError.response?.data || failError,

                );

              }

            }

            setPlacingOrder(false);

            setOrderError(

              "Payment window closed. Your items are still in your cart. If you completed payment, check your order status before trying again.",

            );

          },

        },

        theme: {

          color: "#9A7B3F",

        },

      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", async (event) => {

        console.error("Razorpay payment failed:", event.error);

        try {

          const failureResponse = await api.post("/user/payment/fail", {

            orderId: paymentOrder.orderId,

            reason: event.error?.description || "Razorpay payment failed",

          });
          if (
            !failureResponse.data?.alreadyPaid &&
            failureResponse.data?.paymentStatus !== "PAID"
          ) {
            setRetryOrderId(paymentOrder.orderId);
            setPaymentMethod("ONLINE");
          }

        } catch (failError) {

          console.error(

            "Could not update failed payment status:",

            failError.response?.data || failError,

          );

        }

        setPlacingOrder(false);

        setOrderError("Payment failed. Your items are still in your cart.");

      });

      razorpay.open();

    } catch (paymentError) {

      console.error(

        "Unable to start payment:",

        paymentError.response?.data || paymentError,

      );

      setOrderError(

        paymentError.response?.data?.message ||

          paymentError.message ||

          "Unable to start online payment. Please try again.",

      );

      setPlacingOrder(false);

    }

  };

  // COD checkout remains on the existing order endpoint.
  const handlePlaceOrder = async () => {

    if (placingOrder) return;

    setOrderError("");

    if (!selectedAddressId) {

      setOrderError("Please select a delivery address.");

      return;

    }

    if (normalizedItems.length === 0) {

      setOrderError("Your cart is empty.");

      return;

    }

    if (paymentMethod === "ONLINE") {

      await handleOnlinePayment();

      return;

    }

    if (paymentMethod !== "COD") {

      setOrderError("Please select a valid payment method.");

      return;

    }

    try {

      setPlacingOrder(true);

      const response = await api.post(API.createOrder, {

        addressId: selectedAddressId,

        paymentMethod: "COD",

        couponCode: appliedCoupon?.code || undefined,

      });

      const order = response.data?.order;

      if (!order?._id) {

        throw new Error(

          "The server did not return a valid order.",

        );

      }

      navigate(`/user/order-success/${order._id}`, {

        replace: true,

      });

    } catch (err) {

      console.error("Order placement failed:", err);

      setOrderError(

        err.response?.data?.message ||

          err.message ||

          "Unable to place your order. Please try again.",

      );

    } finally {

      setPlacingOrder(false);

    }

  };

  if (loading) {

    return (

      <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">

        <p className="text-sm text-gray-500">

          Loading checkout...

        </p>

      </div>

    );

  }

  return (

    <div className="min-h-screen bg-gray-50 text-[#111827]">

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <header className="mb-8 border-b border-gray-200 pb-6">

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

        </header>

        {error && (

          <div

            role="alert"

            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"

          >

            {error}

            <button

              type="button"

              onClick={loadCheckout}

              className="ml-2 font-semibold underline"

            >

              Retry

            </button>

          </div>

        )}

        {normalizedItems.length === 0 ? (

          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">

            <h2 className="text-xl font-semibold">

              Your cart is empty

            </h2>

            <p className="mt-2 text-sm text-gray-500">

              Add a watch before checking out.

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

                      const selected =

                        addressId === selectedAddressId;

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

                            onChange={() =>

                              setSelectedAddressId(addressId)

                            }

                            className="mt-1 accent-[#9A7B3F]"

                          />

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="font-semibold">

                                {address.fullName || address.name}

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

                              {address.addressLine1 ||

                                address.addressLine}

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

                  {[

                    {

                      value: "COD",

                      title: "Cash on delivery",

                      description:

                        "Pay when your order is delivered.",

                    },

                    {

                      value: "ONLINE",

                      title: "Online payment",

                      description:

                        "Pay securely using Razorpay test checkout.",

                    },

                  ].map((method) => (

                    <label

                      key={method.value}

                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${

                        paymentMethod === method.value

                          ? "border-[#9A7B3F] bg-[#9A7B3F]/5"

                          : "border-gray-200"

                      }`}

                    >

                      <input

                        type="radio"

                        name="paymentMethod"

                        value={method.value}

                        checked={

                          paymentMethod === method.value

                        }

                        onChange={() => {

                          setPaymentMethod(method.value);

                          setOrderError("");

                        }}

                        className="mt-1 accent-[#9A7B3F]"

                      />

                      <div>

                        <p className="font-medium">

                          {method.title}

                        </p>

                        <p className="mt-1 text-sm text-gray-500">

                          {method.description}

                        </p>

                      </div>

                    </label>

                  ))}

                </div>

                {paymentMethod === "ONLINE" && (

                  <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">

                    Test mode: use Razorpay test credentials. No real

                    payment should be collected.

                  </p>

                )}

              </section>

              {/* Order items */}

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

                    {normalizedItems.length === 1

                      ? "item"

                      : "items"}

                  </span>

                </div>

                <div className="divide-y divide-gray-100">

                  {normalizedItems.map((item) => {

                    const hasOffer =

                      item.offerSavings > 0 &&

                      item.finalPrice < item.originalPrice;

                    const percentage =

                      item.offer.discountType === "percentage"

                        ? item.offer.discountValue

                        : null;

                    return (

                      <div

                        key={item.id}

                        className="flex gap-4 py-4 first:pt-0 last:pb-0"

                      >

                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">

                          {item.image ? (

                            <img

                              src={item.image}

                              alt={item.name}

                              loading="lazy"

                              onError={(event) => {

                                console.error("Checkout product image failed to load:", {

                                  image: item.image,

                                  productId: getId(item.product),

                                  variantId: getId(item.variant),

                                });

                                event.currentTarget.style.display = "none";

                              }}

                              className="h-full w-full object-contain p-2"

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

                          <h3 className="mt-1 font-medium">

                            {item.name}

                          </h3>

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

                          {hasOffer && (

                            <div className="mt-2">

                              <span className="rounded bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">

                                {percentage != null

                                  ? `${percentage}% OFF`

                                  : "OFFER APPLIED"}

                              </span>

                              {item.offer.name && (

                                <p className="mt-2 text-xs font-medium text-[#9A7B3F]">

                                  {item.offer.name}

                                </p>

                              )}

                              <p className="mt-1 text-xs text-green-700">

                                You save{" "}

                                {formatPrice(

                                  item.offerSavings * item.quantity,

                                )}

                              </p>

                            </div>

                          )}

                        </div>

                        <div className="shrink-0 text-right">

                          {hasOffer && (

                            <p className="text-xs text-gray-400 line-through">

                              {formatPrice(

                                item.originalPrice * item.quantity,

                              )}

                            </p>

                          )}

                          <p className="mt-1 text-sm font-semibold">

                            {formatPrice(

                              item.finalPrice * item.quantity,

                            )}

                          </p>

                        </div>

                      </div>

                    );

                  })}

                </div>

              </section>

            </div>

            {/* Order summary */}

            <aside className="lg:sticky lg:top-6">

              <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">

                <h2 className="text-xl font-semibold">

                  Order summary

                </h2>

                <p className="mt-1 text-sm text-gray-500">

                  Apply a coupon and review your savings.

                </p>

                <form

                  onSubmit={handleApplyCoupon}

                  className="mt-6"

                >

                  <label

                    htmlFor="couponCode"

                    className="mb-2 block text-sm font-medium"

                  >

                    Discount code

                  </label>

                  {appliedCoupon ? (

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3">

                      <div>

                        <p className="text-sm font-semibold text-green-800">

                          {appliedCoupon.code}

                        </p>

                        <p className="mt-1 text-xs text-green-700">

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

                        onChange={(event) => {

                          setCouponCode(

                            event.target.value.toUpperCase(),

                          );

                          setCouponMessage("");

                        }}

                        placeholder="Enter code"

                        className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#9A7B3F] focus:ring-1 focus:ring-[#9A7B3F]"

                      />

                      <button

                        type="submit"

                        disabled={applyingCoupon}

                        className="rounded-md border border-[#111827] px-4 py-2.5 text-sm font-medium transition hover:bg-[#111827] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"

                      >

                        {applyingCoupon

                          ? "Checking..."

                          : "Apply"}

                      </button>

                    </div>

                  )}

                  {couponMessage && (

                    <p

                      role="status"

                      className={`mt-2 text-xs ${

                        appliedCoupon

                          ? "text-green-700"

                          : "text-gray-500"

                      }`}

                    >

                      {couponMessage}

                    </p>

                  )}

                </form>

                <div className="mt-6 space-y-4 border-t border-gray-200 pt-5 text-sm">

                  <div className="flex justify-between gap-4">

                    <span className="text-gray-500">

                      Original subtotal

                    </span>

                    <span className="font-medium">

                      {formatPrice(subtotal)}

                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-gray-500">

                      Offer savings

                    </span>

                    <span className="font-medium text-green-700">

                      {offerSavings > 0

                        ? `−${formatPrice(offerSavings)}`

                        : "—"}

                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-gray-500">

                      Subtotal after offers

                    </span>

                    <span className="font-medium">

                      {formatPrice(discountedSubtotal)}

                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-gray-500">

                      Coupon discount

                    </span>

                    <span className="font-medium text-green-700">

                      {discount > 0

                        ? `−${formatPrice(discount)}`

                        : "—"}

                    </span>

                  </div>

                  <div className="flex justify-between gap-4">

                    <span className="text-gray-500">

                      Shipping

                    </span>

                    <span className="font-medium">

                      {shipping === 0

                        ? "Free"

                        : formatPrice(shipping)}

                    </span>

                  </div>

                  <div className="flex items-end justify-between gap-4 border-t border-gray-200 pt-5">

                    <div>

                      <p className="font-semibold">Total</p>

                      <p className="mt-1 text-xs text-gray-400">

                        Subject to server validation

                      </p>

                    </div>

                    <p className="text-2xl font-semibold tracking-tight">

                      {formatPrice(total)}

                    </p>

                  </div>

                </div>

                {selectedAddress && (

                  <div className="mt-6 rounded-lg bg-gray-50 p-4">

                    <p className="text-xs font-semibold uppercase tracking-widest text-[#9A7B3F]">

                      Delivering to

                    </p>

                    <p className="mt-2 text-sm font-medium">

                      {selectedAddress.fullName ||

                        selectedAddress.name}

                    </p>

                    <p className="mt-1 text-sm leading-5 text-gray-500">

                      {selectedAddress.addressLine1 ||

                        selectedAddress.addressLine}

                      {selectedAddress.addressLine2

                        ? `, ${selectedAddress.addressLine2}`

                        : ""}

                      <br />

                      {selectedAddress.city},{" "}

                      {selectedAddress.state} -{" "}

                      {selectedAddress.pincode}

                    </p>

                  </div>

                )}

                {orderError && (

                  <div

                    role="alert"

                    className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"

                  >

                    {orderError}

                  </div>

                )}

                <button

                  type="button"

                  onClick={() =>
                    paymentMethod === "ONLINE" && retryOrderId
                      ? handleOnlinePayment(retryOrderId)
                      : handlePlaceOrder()
                  }

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
                      ? retryOrderId
                        ? "Retry Payment"
                        : "Continue to payment"
                      : "Place order"}

                </button>

                <p className="mt-4 text-center text-xs leading-5 text-gray-400">

                  The server must validate prices, offers, coupons,

                  and stock before creating the order.

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
