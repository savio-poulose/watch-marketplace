import { createContext } from "react";

const CartWishlistContext = createContext({
  cartCount: 0,
  wishlistCount: 0,
  fetchCartCount: () => {},
  fetchWishlistCount: () => {},
  refreshCounts: () => {},
  setCartCount: () => {},
  setWishlistCount: () => {},
});

export default CartWishlistContext;
