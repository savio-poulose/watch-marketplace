export const emitCartUpdated = (count) => {
  window.dispatchEvent(
    new CustomEvent("cartUpdated", {
      detail: typeof count === "number" ? { count } : undefined,
    })
  );
};

export const emitWishlistUpdated = (count) => {
  window.dispatchEvent(
    new CustomEvent("wishlistUpdated", {
      detail: typeof count === "number" ? { count } : undefined,
    })
  );
};
