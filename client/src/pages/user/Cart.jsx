
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaMinus,
  FaPlus,
  FaShoppingBag,
  FaTrashAlt,
} from "react-icons/fa";

import api from "../../api/axios.js";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/common/Footer.jsx";

const formatPrice = (price) =>
  `₹${Number(price || 0).toLocaleString("en-IN")}`;

const Cart = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Normalize the cart response into an array of cart items.
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/user/cart");
      const data = response.data.cart ?? response.data;

      setCart(Array.isArray(data) ? data : data.items ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your cart. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Support populated variantId and product references.
  const getVariant = (item) =>
    item.variantId && typeof item.variantId === "object"
      ? item.variantId
      : null;

  const getProduct = (item) => {
    const variant = getVariant(item);

    if (variant?.productId && typeof variant.productId === "object") {
      return variant.productId;
    }

    if (item.productId && typeof item.productId === "object") {
      return item.productId;
    }

    return null;
  };

  const getVariantId = (item) => {
    const variant = getVariant(item);
    return variant?._id || item.variantId;
  };

  const getItemPrice = (item) => {
    const variant = getVariant(item);
    return Number(variant?.price ?? item.price ?? 0);
  };

  const getItemImage = (item) => {
    const variant = getVariant(item);
    const product = getProduct(item);

    return (
      variant?.images?.[0] ||
      product?.images?.[0] ||
      item.images?.[0] ||
      ""
    );
  };

  const getItemName = (item) => {
    const product = getProduct(item);
    return product?.name || item.productName || "Luxury Watch";
  };

  const getVariantDescription = (item) => {
    const variant = getVariant(item);

    if (!variant) return item.variantDescription || "";

    return [
      variant.size,
      variant.dialColor && `${variant.dialColor} dial`,
      variant.strapMaterial,
      variant.strapColor,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  // Update quantity through the backend.
  const updateQuantity = async (item, nextQuantity) => {
    const variantId = getVariantId(item);

    if (!variantId || nextQuantity < 1) return;

    setUpdatingId(String(variantId));
    setError("");
    setNotice("");

    try {
      await api.patch(`/user/cart/items/${variantId}`, {
        quantity: nextQuantity,
      });

      await fetchCart();
      setNotice("Cart updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update quantity. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Remove a variant from the cart.
  const removeItem = async (item) => {
    const variantId = getVariantId(item);

    if (!variantId) return;

    setRemovingId(String(variantId));
    setError("");
    setNotice("");

    try {
      await api.delete(`/user/cart/items/${variantId}`);

      setCart((current) =>
        current.filter(
          (cartItem) =>
            String(getVariantId(cartItem)) !== String(variantId)
        )
      );

      setNotice("Item removed from your bag.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to remove item. Please try again."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const subtotal = cart.reduce(
    (total, item) =>
      total + getItemPrice(item) * Number(item.quantity || 0),
    0
  );

  const totalItems = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const handleCheckout = () => {
    navigate("/user/checkout");
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111827]">
      <Navbar />

      <main className="mx-auto min-h-[65vh] max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-8">
       

        {/* Page heading */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9A7B3F]">
              Your Selection
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Shopping Bag
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Review your selected timepieces before checkout.
            </p>
          </div>

          <span className="text-xs text-gray-500">
            {totalItems} {totalItems === 1 ? "ITEM" : "ITEMS"}
          </span>
        </div>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchCart}
              className="shrink-0 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {notice && (
          <p
            role="status"
            className="mb-6 flex items-center gap-2 border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          >
            <FaCheckCircle />
            {notice}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#111827]" />
              <p className="text-sm text-gray-500">Loading your bag...</p>
            </div>
          </div>
        ) : cart.length === 0 ? (
          /* Empty cart */
          <div className="flex min-h-[380px] flex-col items-center justify-center border border-gray-200 bg-white px-6 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F3F0] text-[#111827]">
              <FaShoppingBag size={22} />
            </div>

            <h2 className="text-xl font-semibold">Your bag is empty</h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Discover a timepiece that reflects your style and add it to
              your collection.
            </p>

            <Link
              to="/user/collections"
              className="mt-7 inline-flex items-center gap-3 bg-[#111827] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#26344B]"
            >
              Explore Collections
              <FaArrowRight />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_350px] xl:gap-10">
            {/* Cart items */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">
                  Selected Timepieces
                </h2>

                <span className="text-xs text-gray-400">
                  {cart.length} {cart.length === 1 ? "product" : "products"}
                </span>
              </div>

              {cart.map((item) => {
                const variantId = getVariantId(item);
                const variant = getVariant(item);
                const product = getProduct(item);
                const price = getItemPrice(item);
                const quantity = Number(item.quantity || 0);
                const itemKey = String(variantId || item._id);

                const isUpdating = updatingId === itemKey;
                const isRemoving = removingId === itemKey;

                const availableStock = Number(
                  variant?.quantity ?? item.availableStock ?? 99
                );

                const image = getItemImage(item);
                const description = getVariantDescription(item);

                return (
                  <article
                    key={itemKey}
                    className="border border-gray-200 bg-white p-4 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row">
                      {/* Product image */}
                      <Link
                        to={
                          product?._id
                            ? `/user/products/${product._id}`
                            : "#"
                        }
                        className="flex h-40 shrink-0 items-center justify-center overflow-hidden bg-[#F3F3F0] sm:h-44 sm:w-40"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={getItemName(item)}
                            className="h-full w-full object-contain p-3"
                          />
                        ) : (
                          <FaShoppingBag
                            className="text-gray-300"
                            size={30}
                          />
                        )}
                      </Link>

                      {/* Product details */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#9A7B3F]">
                              {product?.brand || product?.brandName || "TIMEPIECE"}
                            </p>

                            <h3 className="text-base font-semibold leading-6 sm:text-lg">
                              {getItemName(item)}
                            </h3>

                            {description && (
                              <p className="mt-2 text-xs leading-5 text-gray-500">
                                {description}
                              </p>
                            )}

                            {variant?.sku && (
                              <p className="mt-1 text-[10px] text-gray-400">
                                SKU: {variant.sku}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item)}
                            disabled={isRemoving || isUpdating}
                            aria-label={`Remove ${getItemName(item)}`}
                            className="shrink-0 p-2 text-gray-400 transition hover:text-red-600 disabled:opacity-40"
                          >
                            <FaTrashAlt size={13} />
                          </button>
                        </div>

                        <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-gray-100 pt-4">
                          {/* Quantity selector */}
                          <div>
                            <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.16em] text-gray-400">
                              Quantity
                            </p>

                            <div className="flex h-10 items-center border border-gray-200">
                              <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={quantity <= 1 || isUpdating || isRemoving}
                                onClick={() =>
                                  updateQuantity(item, quantity - 1)
                                }
                                className="h-full px-3 text-xs transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <FaMinus />
                              </button>

                              <span className="min-w-8 text-center text-xs font-medium">
                                {isUpdating ? "..." : quantity}
                              </span>

                              <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={
                                  quantity >= Math.min(availableStock, 5) ||
                                  isUpdating ||
                                  isRemoving
                                }
                                onClick={() =>
                                  updateQuantity(item, quantity + 1)
                                }
                                className="h-full px-3 text-xs transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <FaPlus />
                              </button>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-[0.15em] text-gray-400">
                              Item total
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                              {formatPrice(price * quantity)}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-400">
                              {formatPrice(price)} per item
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              <Link
                to="/user/collections"
                className="inline-flex items-center gap-2 py-3 text-xs font-medium text-gray-500 transition hover:text-[#9A7B3F]"
              >
                <FaArrowLeft size={10} />
                Continue shopping
              </Link>
            </section>

            {/* Order summary */}
            <aside className="border border-gray-200 bg-white p-5 sm:p-7 lg:sticky lg:top-6">
              <h2 className="border-b border-gray-200 pb-5 text-sm font-semibold uppercase tracking-[0.15em]">
                Order Summary
              </h2>

              <div className="space-y-4 py-5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-xs font-medium text-green-700">
                    Calculated at checkout
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-xs text-gray-400">
                    Applied at checkout
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 py-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em]">
                    Estimated Total
                  </span>

                  <span className="text-xl font-bold">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <p className="mt-2 text-[10px] leading-5 text-gray-400">
                  Final shipping, discounts and applicable taxes will be
                  confirmed during checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0 || updatingId !== null || removingId !== null}
                className="flex w-full items-center justify-center gap-3 bg-[#111827] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#26344B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Proceed to Checkout
                <FaArrowRight />
              </button>

              <div className="mt-5 flex items-start gap-3 border-t border-gray-100 pt-5">
                <FaCheckCircle className="mt-0.5 shrink-0 text-[#9A7B3F]" />

                <p className="text-[10px] leading-5 text-gray-500">
                  Secure checkout. Your final order total will be confirmed
                  before payment.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
