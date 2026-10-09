
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios.js"
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



const formatPrice = (price) =>
  `₹${Number(price || 0).toLocaleString("en-IN")}`;

const ProductDetails = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  // Fetch product and all its variants.
  useEffect(() => {
    const controller = new AbortController();

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setVariants([]);
        setSelectedVariant(null);

       const response = await api.get(`/user/products/${id}`, {
  signal: controller.signal,
});

        const { product, variants } = response.data;

        setProduct(product);
        setVariants(variants);

        // Automatically select the first available variant.
        const initialVariant =
          variants.find((variant) => variant.quantity > 0) ||
          variants[0] ||
          null;

        setSelectedVariant(initialVariant);
      } catch (err) {
        if (err.code === "ERR_CANCELED") return;

        setError(
          err.response?.data?.message ||
            "Unable to load this product."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (id) fetchProductDetails();

    return () => controller.abort();
  }, [id]);

  // Variant images take priority over parent product images.
  const images = useMemo(() => {
    if (selectedVariant?.images?.length) {
      return selectedVariant.images;
    }

    return product?.images || [];
  }, [selectedVariant, product]);

  const discount = 0;

  const selectVariant = (variant) => {
    setSelectedVariant(variant);
    setActiveImage(0);
    setQuantity(1);
    setCartMessage("");
  };

  const handlePreviousImage = () => {
    if (!images.length) return;

    setActiveImage((current) =>
      (current - 1 + images.length) % images.length
    );
  };

  const handleNextImage = () => {
    if (!images.length) return;

    setActiveImage((current) =>
      (current + 1) % images.length
    );
  };

 
const handleAddToCart = async () => {
  if (!selectedVariant || selectedVariant.quantity < 1) {
    setCartMessage("This variant is currently out of stock.");
    return;
  }

  if (quantity > selectedVariant.quantity) {
    setCartMessage(
      `Only ${selectedVariant.quantity} item(s) are available.`
    );
    return;
  }

  setAddingToCart(true);
  setCartMessage("");

  try {
    const response = await api.post("/user/cart/items", {
      variantId: selectedVariant._id,
      quantity,
    });

    setCartMessage(
      response.data.message || "Item added to your bag."
    );
  } catch (error) {
    if (error.response?.status === 401) {
      setCartMessage("Please log in to add items to your bag.");
    } else {
      setCartMessage(
        error.response?.data?.message ||
          "Unable to add item to your bag. Please try again."
      );
    }
  } finally {
    setAddingToCart(false);
  }
};


    /*
      Connect your existing cart API here.
      Send selectedVariant._id and quantity.
    */
    setCartMessage(
      `Selected ${quantity} item(s). Connect your cart API to add them.`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-gray-500">
            Loading product details...
          </p>
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
            className="bg-[#111827] px-6 py-3 text-sm text-white"
          >
            Back to Collections
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const category =
    typeof product.categoryId === "object"
      ? product.categoryId?.name
      : "";

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1440px] px-5 pt-6 text-[10px] text-gray-400 lg:px-10">
        
        {category && (
          <>
            
            <span>{category}</span>
          </>
        )}
        <FaChevronRight className="mx-2 inline text-[7px]" />
        <span className="text-[#111827]">{product.name}</span>
      </div>

      <main className="mx-auto max-w-[1440px] px-5 pb-16 pt-5 lg:px-10">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.1fr_0.9fr] xl:gap-10">

          {/* LEFT: Product gallery */}
          <section>
            <div className="relative overflow-hidden border border-gray-100 bg-[#f3f3f1]">
              <div className="flex min-h-[350px] items-center justify-center p-5 sm:min-h-[500px] sm:p-10 lg:min-h-[540px]">
                {images.length > 0 ? (
                  <img
                    src={images[activeImage]}
                    alt={`${product.name} ${
                      selectedVariant?.dialColor || ""
                    }`}
                    className="h-[300px] w-full object-contain sm:h-[430px]"
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
                    No product images available
                  </div>
                )}
              </div>

              {selectedVariant && (
                <span className="absolute bottom-5 left-5 bg-[#111827] px-3 py-2 text-[9px] font-medium uppercase tracking-widest text-white">
                  {selectedVariant.dialColor} Dial
                </span>
              )}

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

            {/* Image thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
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

          {/* RIGHT: Product and selected variant information */}
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
                      <Spec
                        label="CASE SIZE"
                        value={selectedVariant.size}
                      />
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
                          selectedVariant.quantity > 0
                            ? `${selectedVariant.quantity} available`
                            : "Out of stock"
                        }
                      />
                    </div>
                  </div>

                  {/* Selected variant price */}
                  <div className="mt-6 bg-[#f6f6f4] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-2xl font-bold">
                        {formatPrice(selectedVariant.price)}
                      </span>

                      <span className="text-[10px] text-gray-500">
                        Inclusive of applicable taxes
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* VARIANT CARDS */}
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

                    const isSelected =
                      selectedVariant?._id === variant._id;

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
                              alt={`${variant.dialColor} dial watch`}
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
                            {variant.dialColor}
                          </p>

                          <p className="text-sm font-bold">
                            {formatPrice(variant.price)}
                          </p>

                          <p className="text-[10px] text-gray-500">
                            {variant.size} · {variant.strapColor}
                          </p>

                          <p
                            className={`text-[10px] ${
                              variant.quantity > 0
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            {variant.quantity > 0
                              ? "In stock"
                              : "Out of stock"}
                          </p>

                          {isSelected && (
                            <p className="flex items-center gap-1 text-[10px] font-semibold text-[#9A7B3F]">
                              <FaCheckCircle />
                              Selected
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
                    disabled={quantity <= 1}
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
                    disabled={
                      !selectedVariant ||
                      quantity >= Math.min(selectedVariant.quantity, 5)
                    }
                    onClick={() =>
                      setQuantity((current) =>
                        Math.min(
                          current + 1,
                          selectedVariant?.quantity ?? 1,
                          5
                        )
                      )
                    }
                    className="p-3 text-xs disabled:opacity-30"
                  >
                    <FaPlus />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={
                    !selectedVariant ||
                    selectedVariant.quantity < 1 ||
                    addingToCart
                  }
                  onClick={handleAddToCart}
                  className="flex flex-1 items-center justify-center gap-2 bg-[#111827] px-5 py-4 text-[10px] font-semibold tracking-[0.15em] text-white transition hover:bg-[#26344b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaShoppingBag />
                  {selectedVariant?.quantity < 1
                    ? "OUT OF STOCK"
                    : "ADD TO BAG"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsFavorite((current) => !current)}
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
                <p className="mt-3 text-center text-xs text-[#9A7B3F]">
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
         <ReviewsSection/>
      </main>
     
      <Footer />
    </div>
  );
};

// Small reusable specification display.
const Spec = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-medium tracking-wider text-gray-400">
      {label}
    </p>
    <p className="mt-1 text-xs font-medium text-[#111827]">
      {value || "—"}
    </p>
  </div>
);

export default ProductDetails;
