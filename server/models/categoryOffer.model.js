import mongoose from "mongoose";

const categoryOfferSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    gender: {
      type: String,
      enum: ["ALL", "Men", "Women", "Unisex"],
      default: "ALL",
    },

    discountPercentage: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

categoryOfferSchema.index({
  categoryId: 1,
  isActive: 1,
});

export default mongoose.model(
  "CategoryOffer",
  categoryOfferSchema
);