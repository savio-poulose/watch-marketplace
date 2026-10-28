import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/axios.js";

import {
  FaHeart,
  FaShoppingBag,
  FaCheckCircle,
  FaMinus,
  FaPlus,
  FaShieldAlt,
  FaTruck,
  FaUndo,
  FaArrowLeft,
  FaArrowRight,
  FaChevronRight,
} from "react-icons/fa";

import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/common/Footer.jsx";
import ReviewsSection from "../../components/user/collections/ReviewsSection.jsx";
import toast from "react-hot-toast";

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString("en-IN")}`;

const calculateOfferPrice = (originalPrice, offer) => {
  const price = Number(originalPrice || 0);

  if (!offer || !offer.isActive || price <= 0) {
    return {
      originalPrice: price,
      finalPrice: price,
      discountAmount: 0,
      discountPercentage: 0,
      hasOffer: false,
    };
  }

  const now = new Date();
  const startsAt = new Date(offer.startDate);
  const endsAt = new Date(offer.endDate);

  const isCurrentlyValid =
    !Number.isNaN(startsAt.getTime()) &&
    !Number.isNaN(endsAt.getTime()) &&
    startsAt <= now &&
    endsAt >= now;

  if (!isCurrentlyValid) {
    return {
      originalPrice: price,
      finalPrice: price,
      discountAmount: 0,
      discountPercentage: 0,
      hasOffer: false,
    };
  }

  let discountAmount = 0;

  if (offer.discountType === "percentage") {
    const percentage = Math.min(
      Math.max(Number(offer.discountValue) || 0, 0),
      100,
    );

    discountAmount = (price * percentage) / 100;
  } else if (offer.discountType === "fixed") {
    discountAmount = Math.min(
      Math.max(Number(offer.discountValue) || 0, 0),
      price,
    );
  }

  discountAmount = Math.round(discountAmount * 100) / 100;

  const finalPrice = Math.round((price - discountAmount) * 100) / 100;

  const discountPercentage =
    price > 0 ? Math.round((discountAmount / price) * 100) : 0;

  return {
    originalPrice: price,
    finalPrice,
    discountAmount,
    discountPercentage,
    hasOffer: discountAmount > 0,
  };
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [offer, setOffer] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({
    backgroundX: 50,
    backgroundY: 50,
  });

  const ZOOM_LEVEL = 2.5;

  const handleImageMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = Math.min(
      Math.max((event.clientX - rect.left) / rect.width, 0),
      1,
    );

    const y = Math.min(
      Math.max((event.clientY - rect.top) / rect.height, 0),
      1,
    );

    setZoomPosition({
      backgroundX: x * 100,
      backgroundY: y * 100,
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setVariants([]);
        setOffer(null);
        setSelectedVariant(null);

        const response = await api.get(`/user/products/${id}`, {
          signal: controller.signal,
        });

        const fetchedProduct = response.data.product;
        const fetchedVariants = response.data.variants ?? [];
        const fetchedOffer = response.data.offer ?? null;

        setProduct(fetchedProduct);
        setVariants(fetchedVariants);
        setOffer(fetchedOffer);

        const initialVariant =
          fetchedVariants.find((variant) => Number(variant.quantity) > 0) ??
          fetchedVariants[0] ??
          null;

        setSelectedVariant(initialVariant);
      } catch (err) {
        if (err.code === "ERR_CANCELED") return;

        setError(err.response?.data?.message || "Unable to load this product.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    if (id) fetchProductDetails();
    else setLoading(false);

    return () => controller.abort();
  }, [id]);

  const images = useMemo(() => {
    if (selectedVariant?.images?.length) {
      return selectedVariant.images;
    }

    return product?.images ?? [];
  }, [selectedVariant, product]);

  const pricing = useMemo(
    () => calculateOfferPrice(selectedVariant?.price, offer),
    [selectedVariant, offer],
  );

  const selectVariant = (variant) => {
    setSelectedVariant(variant);
    setActiveImage(0);
    setQuantity(1);
    setCartMessage("");
  };

  const handlePreviousImage = () => {
    if (!images.length) return;

    setActiveImage((current) => (current - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    if (!images.length) return;

    setActiveImage((current) => (current + 1) % images.length);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant || Number(selectedVariant.quantity) < 1) {
      setCartMessage("This variant is currently out of stock.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setCartMessage("Please select a valid quantity.");
      return;
    }

    if (quantity > Number(selectedVariant.quantity)) {
      setCartMessage(`Only ${selectedVariant.quantity} item(s) are available.`);
      return;
    }

    setAddingToCart(true);
    setCartMessage("");

    try {
      const response = await api.post("/user/cart", {
        variantId: selectedVariant._id,
        quantity,
      });

      const message = response.data.message || "Item added to your bag.";

      toast.success(message);
      setCartMessage(message);
      navigate("/user/cart");
    } catch (err) {
      if (err.response?.status === 401) {
        setCartMessage("Please log in to add items to your bag.");
      } else {
        setCartMessage(
          err.response?.data?.message ||
            "Unable to add item to your bag. Please try again.",
        );
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product?._id) return;

    try {
      if (isFavorite) {
        await api.delete(`/user/wishlist/${product._id}`);

        setIsFavorite(false);
        toast.success("Removed from wishlist");
      } else {
        const response = await api.post("/user/wishlist", {
          productId: product._id,
        });

        setIsFavorite(true);
        toast.success(response.data.message || "Added to wishlist");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Please log in to manage your wishlist");
        return;
      }

      toast.error(error.response?.data?.message || "Failed to update wishlist");

      console.error("Wishlist error:", error);
    }
  };

  useEffect(() => {
    if (!product?._id) return;

    let cancelled = false;

    const fetchWishlistStatus = async () => {
      try {
        const response = await api.get(`/user/wishlist/${product._id}/status`);

        if (!cancelled) {
          setIsFavorite(Boolean(response.data.isFavorite));
        }
      } catch (error) {
        if (!cancelled) {
          setIsFavorite(false);

          if (error.response?.status !== 401) {
            console.error("Failed to fetch wishlist status:", error);
          }
        }
      }
    };

    setIsFavorite(false);
    fetchWishlistStatus();

    return () => {
      cancelled = true;
    };
  }, [product?._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-gray-500">Loading product details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5">
          <h1 className="text-xl font-semibold text-[#111827]">
            Product unavailable
          </h1>

          <p className="text-sm text-gray-500">
            {error || "This product could not be found."}
          </p>

          <Link
            to="/user/collections"
            className="bg-[#111827] px-6 py-3 text-sm text-white transition hover:bg-[#9A7B3F]"
          >
            Back to Collections
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const category =
    typeof product.categoryId === "object" ? product.categoryId?.name : "";

  const selectedStock = Number(selectedVariant?.quantity ?? 0);
  const maxSelectableQuantity = Math.min(selectedStock, 5);
  const isOutOfStock = !selectedVariant || selectedStock < 1;

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1440px] px-5 pt-6 text-[10px] text-gray-400 lg:px-10">
        {category && <span>{category}</span>}
        {category && <FaChevronRight className="mx-2 inline text-[7px]" />}
        <span className="text-[#111827]">{product.name}</span>
      </div>

      <main className="mx-auto max-w-[1440px] px-5 pb-16 pt-5 lg:px-10">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.1fr_0.9fr] xl:gap-10">
          {/* Product gallery */}
          {/* Product gallery */}
          <section className="relative">
            {/* Main image and zoom interaction */}
            <div
              className="relative"
              onMouseEnter={() => setIsZooming(true)}
              onMouseMove={handleImageMouseMove}
              onMouseLeave={() => setIsZooming(false)}
            >
              {/* Main image */}
              <div className="relative border border-gray-100 bg-[#f3f3f1]">
                <div className="flex min-h-[350px] items-center justify-center p-5 sm:min-h-[500px] sm:p-10 lg:min-h-[540px]">
                  {images.length > 0 ? (
                    <img
                      src={images[activeImage]}
                      alt={`${product.name} ${
                        selectedVariant?.dialColor || ""
                      }`}
                      className="h-[300px] w-full cursor-crosshair object-contain sm:h-[430px]"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
                      No product images available
                    </div>
                  )}
                </div>

                {/* Selected dial label */}
                {selectedVariant && (
                  <span className="absolute bottom-5 left-5 bg-[#111827] px-3 py-2 text-[9px] font-medium uppercase tracking-widest text-white">
                    {selectedVariant.dialColor || "Selected"} Dial
                  </span>
                )}

                {/* Previous and next buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePreviousImage}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xs shadow-sm hover:bg-[#111827] hover:text-white"
                    >
                      <FaArrowLeft />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xs shadow-sm hover:bg-[#111827] hover:text-white"
                    >
                      <FaArrowRight />
                    </button>
                  </>
                )}
              </div>

              {/* Rectangular zoom preview */}
              {isZooming && images.length > 0 && (
                <div
                  className="pointer-events-none absolute left-full top-0 z-50 ml-3 hidden h-[540px] w-[420px] border border-gray-200 bg-white shadow-xl lg:block"
                  style={{
                    backgroundImage: `url("${images[activeImage]}")`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${ZOOM_LEVEL * 100}% ${ZOOM_LEVEL * 100}%`,
                    backgroundPosition: `${zoomPosition.backgroundX}% ${zoomPosition.backgroundY}%`,
                  }}
                />
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1}`}
                    className={`h-20 w-20 shrink-0 overflow-hidden border-2 bg-[#f3f3f1] ${
                      activeImage === index
                        ? "border-[#111827]"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}

                <div className="flex items-center text-[9px] tracking-widest text-gray-400">
                  VIEW {activeImage + 1} / {images.length}
                </div>
              </div>
            )}
          </section>

          {/* Product information */}
          <section className="space-y-5">
            <div className="border border-gray-100 p-5 sm:p-7">
              <p className="mb-3 text-[10px] font-semibold tracking-[0.25em] text-[#9A7B3F]">
                {product.brand}
                {category ? ` / ${category}` : ""}
              </p>

              <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
                {product.name}
              </h1>

              <p className="mt-4 text-xs leading-6 text-gray-500 sm:text-sm">
                {product.description}
              </p>

              {selectedVariant && (
                <>
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <p className="text-[10px] font-semibold tracking-widest text-[#9A7B3F]">
                      SELECTED CONFIGURATION
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <Spec label="CASE SIZE" value={selectedVariant.size} />
                      <Spec
                        label="DIAL COLOUR"
                        value={selectedVariant.dialColor}
                      />
                      <Spec
                        label="STRAP COLOUR"
                        value={selectedVariant.strapColor}
                      />
                      <Spec
                        label="STRAP MATERIAL"
                        value={selectedVariant.strapMaterial}
                      />
                      <Spec
                        label="CASE MATERIAL"
                        value={selectedVariant.caseMaterial}
                      />

                      <Spec
                        label="STOCK"
                        value={
                          selectedStock > 0
                            ? `${selectedStock} available`
                            : "Out of stock"
                        }
                      />
                    </div>
                  </div>

                  {/* Offer pricing */}
                  <div className="mt-6 bg-[#f6f6f4] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-2xl font-bold">
                        {formatPrice(pricing.finalPrice)}
                      </span>

                      {pricing.hasOffer && (
                        <>
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(pricing.originalPrice)}
                          </span>

                          <span className="bg-[#9A7B3F] px-2 py-1 text-[10px] font-semibold text-white">
                            {pricing.discountPercentage}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    {pricing.hasOffer && (
                      <p className="mt-2 text-xs font-medium text-green-700">
                        You save {formatPrice(pricing.discountAmount)}
                      </p>
                    )}

                    <p className="mt-2 text-[10px] text-gray-500">
                      Inclusive of applicable taxes
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Variants */}
            <div className="border border-gray-200 p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-widest">
                    AVAILABLE VARIANTS
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Select a watch to view its specifications and price.
                  </p>
                </div>

                <span className="text-[10px] text-gray-500">
                  {variants.length} options
                </span>
              </div>

              {variants.length === 0 ? (
                <p className="mt-5 text-sm text-gray-500">
                  No active variants available for this product.
                </p>
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {variants.map((variant) => {
                    const variantImage =
                      variant.images?.[0] || product.images?.[0];

                    const isSelected = selectedVariant?._id === variant._id;

                    const stock = Number(variant.quantity ?? 0);

                    const variantPricing = calculateOfferPrice(
                      variant.price,
                      offer,
                    );

                    return (
                      <button
                        key={variant._id}
                        type="button"
                        onClick={() => selectVariant(variant)}
                        aria-pressed={isSelected}
                        className={`overflow-hidden border text-left transition ${
                          isSelected
                            ? "border-[#111827] ring-1 ring-[#111827]"
                            : "border-gray-200 hover:border-[#9A7B3F]"
                        }`}
                      >
                        <div className="flex h-28 items-center justify-center bg-[#f6f6f4] p-3">
                          {variantImage ? (
                            <img
                              src={variantImage}
                              alt={`${variant.dialColor || "Watch"} dial watch`}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">
                              No image
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 p-3">
                          <p className="truncate text-xs font-semibold">
                            {variant.dialColor || "Standard variant"}
                          </p>

                          <p className="text-sm font-bold">
                            {formatPrice(variantPricing.finalPrice)}
                          </p>

                          {variantPricing.hasOffer && (
                            <p className="text-[10px] text-gray-400 line-through">
                              {formatPrice(variantPricing.originalPrice)}
                            </p>
                          )}

                          <p className="text-[10px] text-gray-500">
                            {variant.size || "—"} · {variant.strapColor || "—"}
                          </p>

                          <p
                            className={`text-[10px] font-medium ${
                              stock > 0 ? "text-green-700" : "text-red-600"
                            }`}
                          >
                            {stock > 0 ? `${stock} available` : "Out of stock"}
                          </p>

                          {isSelected && (
                            <p className="flex items-center gap-1 text-[10px] font-semibold text-[#9A7B3F]">
                              <FaCheckCircle /> Selected
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quantity and cart */}
            <div className="border border-gray-200 p-5 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex items-center justify-between border border-gray-200 sm:w-28">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() =>
                      setQuantity((current) => Math.max(1, current - 1))
                    }
                    className="p-3 text-xs disabled:opacity-30"
                  >
                    <FaMinus />
                  </button>

                  <span className="text-xs">{quantity}</span>

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={isOutOfStock || quantity >= maxSelectableQuantity}
                    onClick={() =>
                      setQuantity((current) =>
                        Math.min(current + 1, maxSelectableQuantity),
                      )
                    }
                    className="p-3 text-xs disabled:opacity-30"
                  >
                    <FaPlus />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock || addingToCart}
                  onClick={handleAddToCart}
                  className="flex flex-1 items-center justify-center gap-2 bg-[#111827] px-5 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition hover:bg-[#26344b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaShoppingBag />
                  {isOutOfStock
                    ? "OUT OF STOCK"
                    : addingToCart
                    ? "ADDING..."
                    : "ADD TO BAG"}
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  aria-label="Toggle wishlist"
                  aria-pressed={isFavorite}
                  className={`flex items-center justify-center border px-5 py-4 ${
                    isFavorite
                      ? "border-[#111827] bg-[#111827] text-white"
                      : "border-gray-200 text-gray-600 hover:border-[#111827]"
                  }`}
                >
                  <FaHeart />
                </button>
              </div>

              {cartMessage && (
                <p
                  role="status"
                  className="mt-3 text-center text-xs text-[#9A7B3F]"
                >
                  {cartMessage}
                </p>
              )}

              <div className="mt-5 grid grid-cols-1 gap-3 text-[10px] text-gray-500 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-[#9A7B3F]" />
                  Authenticity guaranteed
                </div>

                <div className="flex items-center gap-2">
                  <FaTruck className="text-[#9A7B3F]" />
                  Insured delivery
                </div>

                <div className="flex items-center gap-2">
                  <FaUndo className="text-[#9A7B3F]" />
                  Easy returns
                </div>
              </div>
            </div>
          </section>
        </div>

        <ReviewsSection productId={product?._id || id} productName={product?.name} />
      </main>

      <Footer />
    </div>
  );
};

const Spec = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-medium tracking-wider text-gray-400">
      {label}
    </p>
    <p className="mt-1 text-xs font-medium text-[#111827]">{value || "—"}</p>
  </div>
);

export default ProductDetails;
