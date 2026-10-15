
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaHeart,
  FaShoppingBag,
  FaTrash,
  FaArrowRight,
  FaRegClock,
} from "react-icons/fa";
import toast from "react-hot-toast";

import api from "../../api/axios.js";
import Navbar from "../../components/layout/Navbar.jsx";
import Footer from "../../components/common/Footer.jsx";

const formatPrice = (price) =>
  `₹${Number(price || 0).toLocaleString("en-IN")}`;

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [movingId, setMovingId] = useState(null);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/user/wishlist");

      setWishlist(response.data.wishlist || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load your wishlist"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId) => {
    try {
      setRemovingId(productId);

      await api.delete(`/user/wishlist/${productId}`);

      setWishlist((current) =>
        current.filter(
          (item) => String(item.productId?._id) !== String(productId)
        )
      );

      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to remove product"
      );
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveToCart = async (productId) => {
    try {
      setMovingId(productId);

      // Fetch the product's variants to find an available one.
      const response = await api.get(`/user/products/${productId}`);
      const variants = response.data.variants || [];

      const availableVariant = variants.find(
        (variant) => Number(variant.quantity) > 0
      );

      if (!availableVariant) {
        toast.error("This watch is currently out of stock");
        return;
      }

      await api.post("/user/cart", {
        variantId: availableVariant._id,
        quantity: 1,
      });

      // Remove from wishlist only after the cart request succeeds.
      await api.delete(`/user/wishlist/${productId}`);

      setWishlist((current) =>
        current.filter(
          (item) => String(item.productId?._id) !== String(productId)
        )
      );

      toast.success("Added to bag and removed from wishlist");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to move this watch to your bag"
      );
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <Navbar />

      {/* Page heading */}
      <section className="border-b border-gray-100 bg-[#f7f7f5]">
        <div className="mx-auto max-w-[1440px] px-5 py-10 sm:py-14 lg:px-10">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.3em] text-[#9A7B3F]">
            YOUR PERSONAL COLLECTION
          </p>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                My Wishlist
              </h1>
              <p className="mt-3 text-sm text-gray-500">
                Keep the watches you love close.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaHeart className="text-[#9A7B3F]" />
              {wishlist.length}{" "}
              {wishlist.length === 1 ? "item" : "items"}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto min-h-[50vh] max-w-[1440px] px-5 py-8 sm:py-12 lg:px-10">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#9A7B3F]" />
              <p className="mt-4 text-sm text-gray-500">
                Loading your wishlist...
              </p>
            </div>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center px-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f6f4]">
              <FaHeart className="text-2xl text-[#9A7B3F]" />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
              Your wishlist is empty
            </h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
              Discover watches that match your style and save your
              favourites here for later.
            </p>

            <Link
              to="/user/collections"
              className="mt-7 inline-flex items-center gap-3 bg-[#111827] px-6 py-4 text-[10px] font-semibold tracking-[0.18em] text-white transition hover:bg-[#9A7B3F]"
            >
              EXPLORE COLLECTIONS
              <FaArrowRight />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {wishlist.map((item) => {
              const product = item.productId;

              // Handles products deleted after being added to wishlist.
              if (!product || typeof product !== "object") {
                return null;
              }

              const productId = product._id;
              const imageValue = product.images?.[0];
              const image =
                typeof imageValue === "string"
                  ? imageValue
                  : imageValue?.secure_url ||
                    imageValue?.url ||
                    imageValue?.imageUrl ||
                    "";

              const originalPrice = Number(product.price || 0);

              return (
                <article
                  key={item._id}
                  className="group overflow-hidden border border-gray-200 bg-white transition hover:border-gray-300"
                >
                  {/* Product image */}
                  <div className="relative flex h-64 items-center justify-center overflow-hidden bg-[#f5f5f3] p-6 sm:h-72">
                    <Link
                      to={`/user/products/${productId}`}
                      className="flex h-full w-full items-center justify-center"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <FaShoppingBag className="text-4xl text-gray-300" />
                      )}
                    </Link>

                    <span className="absolute left-4 top-4 bg-white px-3 py-2 text-[9px] font-semibold tracking-widest text-[#9A7B3F]">
                      SAVED ITEM
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemove(productId)}
                      disabled={removingId === productId}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-gray-600 transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>

                  {/* Product details */}
                  <div className="p-5 sm:p-6">
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-[#9A7B3F]">
                      {product.brand || "OCEANUS"}
                    </p>

                    <Link to={`/products/${productId}`}>
                      <h2 className="mt-2 line-clamp-2 text-lg font-semibold transition hover:text-[#9A7B3F]">
                        {product.name}
                      </h2>
                    </Link>

                    <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-gray-500">
                      {product.description || "Discover this timepiece."}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-[9px] tracking-widest text-gray-400">
                          PRODUCT PRICE
                        </p>
                        <p className="mt-1 text-lg font-bold">
                          {originalPrice > 0
                            ? formatPrice(originalPrice)
                            : "View price"}
                        </p>
                      </div>

                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <FaRegClock />
                        Saved
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                      <button
                        type="button"
                        onClick={() => handleMoveToCart(productId)}
                        disabled={
                          movingId === productId ||
                          removingId === productId
                        }
                        className="flex items-center justify-center gap-2 bg-[#111827] px-3 py-4 text-[10px] font-semibold tracking-wider text-white transition hover:bg-[#9A7B3F] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaShoppingBag />
                        {movingId === productId
                          ? "ADDING..."
                          : "MOVE TO BAG"}
                      </button>

                      <Link
                        to={`/products/${productId}`}
                        aria-label={`View ${product.name}`}
                        className="flex items-center justify-center border border-gray-200 px-4 transition hover:border-[#9A7B3F] hover:text-[#9A7B3F]"
                      >
                        <FaArrowRight />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
