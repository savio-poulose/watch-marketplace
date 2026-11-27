import { useCallback, useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "./useAuth.jsx";
import CartWishlistContext from "./CartWishlistContext.jsx";

export const CartWishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }

    try {
      const response = await api.get("/user/cart");
      const data = response.data?.cart ?? response.data;
      const items = Array.isArray(data)
        ? data
        : data?.items ?? data?.cartItems ?? [];

      const count = items.reduce(
        (total, item) => total + Number(item?.quantity || 0),
        0
      );
      setCartCount(count);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        setCartCount(0);
      }
    }
  }, [user]);

  const fetchWishlistCount = useCallback(async () => {
    if (!user) {
      setWishlistCount(0);
      return;
    }

    try {
      const response = await api.get("/user/wishlist");
      const list = response.data?.wishlist ?? response.data ?? [];
      const validItems = Array.isArray(list)
        ? list.filter((item) => item?.productId && typeof item.productId === "object")
        : [];
      setWishlistCount(validItems.length);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        setWishlistCount(0);
      }
    }
  }, [user]);

  const refreshCounts = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }
    await Promise.allSettled([fetchCartCount(), fetchWishlistCount()]);
  }, [user, fetchCartCount, fetchWishlistCount]);

  useEffect(() => {
    if (user) {
      refreshCounts();
    } else {
      setCartCount(0);
      setWishlistCount(0);
    }
  }, [user, refreshCounts]);

  // Listen to global events for real-time synchronization across pages
  useEffect(() => {
    const handleCartUpdate = (e) => {
      if (typeof e.detail?.count === "number") {
        setCartCount(e.detail.count);
      } else {
        fetchCartCount();
      }
    };

    const handleWishlistUpdate = (e) => {
      if (typeof e.detail?.count === "number") {
        setWishlistCount(e.detail.count);
      } else {
        fetchWishlistCount();
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("wishlistUpdated", handleWishlistUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, [fetchCartCount, fetchWishlistCount]);

  return (
    <CartWishlistContext.Provider
      value={{
        cartCount,
        wishlistCount,
        fetchCartCount,
        fetchWishlistCount,
        refreshCounts,
        setCartCount,
        setWishlistCount,
      }}
    >
      {children}
    </CartWishlistContext.Provider>
  );
};

export default CartWishlistProvider;
