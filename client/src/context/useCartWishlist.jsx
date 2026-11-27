import { useContext } from "react";
import CartWishlistContext from "./CartWishlistContext.jsx";

export const useCartWishlist = () => {
  const context = useContext(CartWishlistContext);
  if (!context) {
    throw new Error(
      "useCartWishlist must be used within a CartWishlistProvider"
    );
  }
  return context;
};

export default useCartWishlist;
