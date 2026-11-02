import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    offerType: {
      type: String,
      enum: ["product", "category"],
      required: true,
      default: function () {
        if (this.productId && !this.categoryId) return "product";
        if (this.categoryId && !this.productId) return "category";
        return undefined;
      },
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: undefined,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: undefined,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(value) {
          return this.discountType !== "percentage" || value <= 100;
        },
        message: "Percentage discount cannot exceed 100%",
      },
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

offerSchema.pre("validate", function () {
  if (!this.offerType) {
    if (this.productId && !this.categoryId) {
      this.offerType = "product";
    } else if (this.categoryId && !this.productId) {
      this.offerType = "category";
    }
  }

  if (this.offerType === "product") {
    if (!this.productId || this.categoryId) {
      this.invalidate("productId", "A product offer must have only productId.");
    }
  } else if (this.offerType === "category") {
    if (!this.categoryId || this.productId) {
      this.invalidate(
        "categoryId",
        "A category offer must have only categoryId.",
      );
    }
  }
});

offerSchema.index(
  { productId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      offerType: "product",
      productId: { $type: "objectId" },
    },
  },
);

offerSchema.index(
  { categoryId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      offerType: "category",
      categoryId: { $type: "objectId" },
    },
  },
);

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
