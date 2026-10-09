
import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    size: {
      type: String,
      required: true,
      trim: true,
    },

    strapMaterial: {
      type: String,
      required: true,
      trim: true,
    },

    caseMaterial: {
      type: String,
      required: true,
      trim: true,
    },

    dialColor: {
      type: String,
      required: true,
      trim: true,
    },

    strapColor: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },

    images: {
      type: [{ type: String }],
      default: [],
      validate: {
        validator: (images) => images.length <= 3,
        message: "A variant can have a maximum of 3 images",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Variant = mongoose.model("Variant", variantSchema);

export default Variant;
