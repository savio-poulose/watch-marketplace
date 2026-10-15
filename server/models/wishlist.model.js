import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same product from being added twice
// to the same user's wishlist.
wishlistSchema.index(
  { userId: 1, productId: 1 },
  { unique: true }
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;