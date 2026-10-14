
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
  `₹${Number(price || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const Cart = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [error, setError] = useState("");

  const getVariant = (item) => {
    if (item.variantId && typeof item.variantId === "object") {
      return item.variantId;
    }

    if (item.variant && typeof item.variant === "object") {
      return item.variant;
    }

    return null;
  };

  const getProduct = (item) => {
    const variant = getVariant(item);

    if (
      variant?.productId &&
      typeof variant.productId === "object"
    ) {
      return variant.productId;
    }

    if (item.productId && typeof item.productId === "object") {
      return item.productId;
    }

    if (item.product && typeof item.product === "object") {
      return item.product;
    }

    return null;
  };

  const getVariantId = (item) => {
    const variant = getVariant(item);

    return (
      variant?._id ||
      item.variantId?._id ||
      item.variantId ||
      item.variant?._id ||
      item.variant
    );
  };

  const getOriginalPrice = (item) => {
    const variant = getVariant(item);

    return Number(
      item.originalPrice ??
        variant?.originalPrice ??
        variant?.price ??
        item.price ??
        0
    );
  };

  const getItemPrice = (item) => {
    const variant = getVariant(item);

    return Number(
      item.discountedPrice ??
        item.finalPrice ??
        item.price ??
        variant?.discountedPrice ??
        variant?.price ??
        0
    );
  };

  const getItemOffer = (item) => {
    const variant = getVariant(item);
    const product = getProduct(item);

    return item.offer ?? variant?.offer ?? product?.offer ?? null;
  };

 

  const getItemSavings = (item) =>
    Math.max(0, getOriginalPrice(item) - getItemPrice(item));

  const getItemImage = (item) => {
    const variant = getVariant(item);
    const product = getProduct(item);

    return (
      variant?.images?.[0] ||
      product?.images?.[0] ||
      item.images?.[0] ||
      item.image ||
      ""
    );
  };

  const getItemName = (item) => {
    const product = getProduct(item);

    return (
      product?.name ||
      item.productName ||
      item.name ||
      "Luxury Watch"
    );
  };

  const getItemDetails = (item) => {
    const variant = getVariant(item);

    if (!variant) return [];

    return [
      variant.strapMaterial,
      variant.caseSize ? `${variant.caseSize} mm case` : null,
      variant.sku ? `SKU: ${variant.sku}` : null,
    ].filter(Boolean);
  };

  const getStock = (item) => {
    const variant = getVariant(item);

    return Number(
      variant?.stock ??
        variant?.quantity ??
        item.stock ??
        item.availableStock ??
        0
    );
  };

  const fetchCart = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/user/cart");
      const data = response.data.cart ?? response.data;

      const items = Array.isArray(data)
        ? data
        : data.items ?? data.cartItems ?? [];

      setCart(items);
    } catch (err) {
      console.error("Failed to fetch cart:", err);
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

  const updateQuantity = async (item, change) => {
    const variantId = getVariantId(item);
    const newQuantity = Number(item.quantity || 1) + change;
    const stock = getStock(item);

    if (!variantId) {
      setError("Unable to identify this product variant.");
      return;
    }

    if (newQuantity < 1) return;

    if (newQuantity > stock) {
      setError(
        stock > 0
          ? `Only ${stock} item(s) are available in stock.`
          : "This item is currently out of stock."
      );
      return;
    }

    try {
      setError("");
      setUpdatingItem(String(variantId));

      await api.patch(`/user/cart/items/${variantId}`, {
        quantity: newQuantity,
      });

      await fetchCart();
    } catch (err) {
      console.error("Failed to update quantity:", err);
      setError(
        err.response?.data?.message ||
          "Unable to update quantity."
      );
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (item) => {
    const variantId = getVariantId(item);

    if (!variantId) {
      setError("Unable to identify this product variant.");
      return;
    }

    try {
      setError("");
      setRemovingItem(String(variantId));

      await api.delete(`/user/cart/items/${variantId}`);

      setCart((previousCart) =>
        previousCart.filter(
          (cartItem) =>
            String(getVariantId(cartItem)) !== String(variantId)
        )
      );
    } catch (err) {
      console.error("Failed to remove cart item:", err);
      setError(
        err.response?.data?.message ||
          "Unable to remove this item."
      );
    } finally {
      setRemovingItem(null);
    }
  };

  const subtotal = cart.reduce(
    (total, item) =>
      total + getItemPrice(item) * Number(item.quantity || 0),
    0
  );

  const originalSubtotal = cart.reduce(
    (total, item) =>
      total + getOriginalPrice(item) * Number(item.quantity || 0),
    0
  );

  const offerSavings = cart.reduce(
    (total, item) =>
      total + getItemSavings(item) * Number(item.quantity || 0),
    0
  );

  const totalItems = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const hasOfferSavings = offerSavings > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#9A7B3F]" />
            <p className="text-sm text-gray-500">
              Loading your cart...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <Navbar />

        <main className="flex min-h-[65vh] items-center justify-center px-4 py-16">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
              <FaShoppingBag className="text-3xl text-[#9A7B3F]" />
            </div>

            <h1 className="mb-3 text-2xl font-semibold sm:text-3xl">
              Your cart is empty
            </h1>

            <p className="mb-8 text-sm leading-6 text-gray-500">
              Explore our collection and find your next timepiece.
            </p>

            {error && (
              <p className="mb-5 text-sm text-red-600">{error}</p>
            )}

            <Link
              to="/collections"
              className="inline-flex items-center gap-3 rounded-md bg-[#9A7B3F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#806532]"
            >
              Explore Collection
              <FaArrowRight />
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 pb-6 sm:mb-10">
          <Link
            to="/collections"
            className="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#9A7B3F]"
          >
            <FaArrowLeft className="text-xs" />
            Continue shopping
          </Link>

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#9A7B3F]">
                Your selection
              </p>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Shopping Cart
              </h1>
            </div>

            <p className="text-sm text-gray-500">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
          {/* Cart items */}
          <section className="space-y-4">
            {cart.map((item, index) => {
              const variantId = getVariantId(item);
              const variant = getVariant(item);
              const product = getProduct(item);

              const price = getItemPrice(item);
              const originalPrice = getOriginalPrice(item);
              const savings = getItemSavings(item);
              const offer = getItemOffer(item);

              const quantity = Number(item.quantity || 0);
              const stock = getStock(item);
              const hasOffer = savings > 0;

              const itemTotal = price * quantity;
              const originalItemTotal = originalPrice * quantity;
              const itemSavings = savings * quantity;

              const image = getItemImage(item);
              const productId =
                product?._id ||
                item.productId?._id ||
                item.productId;

              const details = getItemDetails(item);
              const productLink = productId
                ? `/products/${productId}`
                : "/collections";

              const isUpdating =
                updatingItem === String(variantId);
              const isRemoving =
                removingItem === String(variantId);

              return (
                <article
                  key={variantId || item._id || index}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 sm:p-6"
                >
                  <div className="flex gap-4 sm:gap-6">
                    {/* Product image */}
                    <Link
                      to={productLink}
                      className="flex h-32 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-50 sm:h-40 sm:w-36"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={getItemName(item)}
                          className="h-full w-full object-contain p-2 transition duration-300 hover:scale-105"
                        />
                      ) : (
                        <FaShoppingBag className="text-3xl text-gray-300" />
                      )}
                    </Link>

                    {/* Product information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={productLink}
                            className="line-clamp-2 text-base font-semibold text-gray-900 transition hover:text-[#9A7B3F] sm:text-lg"
                          >
                            {getItemName(item)}
                          </Link>

                          {details.length > 0 && (
                            <p className="mt-2 text-xs leading-5 text-gray-500">
                              {details.join(" · ")}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          disabled={isRemoving || isUpdating}
                          aria-label={`Remove ${getItemName(item)}`}
                          className="shrink-0 p-2 text-gray-400 transition hover:text-red-600 disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <span className="text-xs">Removing...</span>
                          ) : (
                            <FaTrashAlt />
                          )}
                        </button>
                      </div>

                      {/* Offer */}
                      {hasOffer && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-sm bg-[#9A7B3F]/10 px-2 py-1 text-xs font-semibold text-[#806532]">
                            <FaCheckCircle />
                            Special Offer
                          </span>

                          {offer?.discountType === "percentage" &&
                            offer?.discountValue != null && (
                              <span className="text-xs font-medium text-green-700">
                                {offer.discountValue}% off
                              </span>
                            )}

                          {offer?.name && (
                            <span className="text-xs text-gray-500">
                              {offer.name}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {formatPrice(price)}
                          </span>

                          {hasOffer && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(originalPrice)}
                            </span>
                          )}
                        </div>

                        {hasOffer && (
                          <p className="mt-1 text-xs text-green-700">
                            You save {formatPrice(savings)} per item
                          </p>
                        )}
                      </div>

                      {/* Quantity and item total */}
                      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-gray-100 pt-4">
                        <div>
                          <p className="mb-2 text-xs text-gray-500">
                            Quantity
                          </p>

                          <div className="inline-flex items-center rounded-md border border-gray-200 bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item, -1)}
                              disabled={
                                quantity <= 1 ||
                                isUpdating ||
                                isRemoving
                              }
                              aria-label="Decrease quantity"
                              className="p-2.5 text-gray-600 transition hover:text-[#9A7B3F] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <FaMinus className="text-xs" />
                            </button>

                            <span className="min-w-9 text-center text-sm text-gray-900">
                              {isUpdating ? "..." : quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateQuantity(item, 1)}
                              disabled={
                                quantity >= stock ||
                                isUpdating ||
                                isRemoving
                              }
                              aria-label="Increase quantity"
                              className="p-2.5 text-gray-600 transition hover:text-[#9A7B3F] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <FaPlus className="text-xs" />
                            </button>
                          </div>

                          {stock > 0 && (
                            <p className="mt-2 text-xs text-gray-400">
                              {stock} available
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="mb-1 text-xs text-gray-500">
                            Item total
                          </p>

                          <p className="text-base font-semibold text-gray-900">
                            {formatPrice(itemTotal)}
                          </p>

                          {hasOffer && (
                            <>
                              <p className="mt-1 text-xs text-gray-400 line-through">
                                {formatPrice(originalItemTotal)}
                              </p>

                              <p className="mt-1 text-xs font-medium text-green-700">
                                Saved {formatPrice(itemSavings)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            <Link
              to="/collections"
              className="inline-flex items-center gap-2 pt-2 text-sm text-gray-500 transition hover:text-[#9A7B3F]"
            >
              <FaArrowLeft className="text-xs" />
              Continue shopping
            </Link>
          </section>

          {/* Order summary */}
          <aside className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
            <h2 className="border-b border-gray-200 pb-5 text-lg font-semibold text-gray-900">
              Order Summary
            </h2>

            <div className="space-y-4 py-5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-500">
                  Original subtotal
                </span>
                <span className="text-gray-700">
                  {formatPrice(originalSubtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-500">
                  Subtotal after offers
                </span>
                <span className="font-medium text-gray-900">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {hasOfferSavings && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-green-700">Offer savings</span>
                  <span className="font-medium text-green-700">
                    -{formatPrice(offerSavings)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-right text-gray-400">
                  Calculated at checkout
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-500">Coupon discount</span>
                <span className="text-gray-400">
                  Applied at checkout
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold text-gray-900">
                  Estimated total
                </span>
                <span className="text-xl font-semibold text-[#9A7B3F]">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Shipping and coupon discounts will be calculated at
                checkout. Final prices are confirmed by the server.
              </p>

              <button
                type="button"
                onClick={() => navigate("/user/checkout")}
                className="mt-6 cursor-pointer flex w-full items-center justify-center gap-3 rounded-md bg-[#111827] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#806532]"
              >
                Proceed to Checkout
                <FaArrowRight />
              </button>

              <div className="mt-5 flex items-start gap-3 border-t border-gray-100 pt-5">
                <FaCheckCircle className="mt-0.5 shrink-0 text-[#9A7B3F]" />
                <p className="text-xs leading-5 text-gray-500">
                  Secure checkout. Product availability and final
                  payable amounts are verified before your order is
                  placed.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
