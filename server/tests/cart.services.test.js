import { jest, describe, beforeEach, test, expect } from "@jest/globals";

// Mock database models
const mockCart = {
  findOne: jest.fn(),
  updateOne: jest.fn(),
};

const mockVariant = {
  findById: jest.fn(),
};

const mockProduct = {
  findById: jest.fn(),
};

const mockOffer = {
  find: jest.fn(),
};

// Register ESM mocks BEFORE importing the service
await jest.unstable_mockModule("../models/cart.module.js", () => ({
  default: mockCart,
}));

await jest.unstable_mockModule("../models/variant.model.js", () => ({
  default: mockVariant,
}));

await jest.unstable_mockModule("../models/product.model.js", () => ({
  default: mockProduct,
}));

await jest.unstable_mockModule("../models/offer.model.js", () => ({
  default: mockOffer,
}));

// Import service after registering mocks
const { addItemToCartService } = await import(
  "../services/user/cart.service.js"
);

// Valid MongoDB ObjectIds
const userId = "507f191e810c19729de860ea";
const variantId = "507f1f77bcf86cd799439011";

describe("Cart Service - Maximum Quantity", () => {
  let cart;

  beforeEach(() => {
    jest.clearAllMocks();

    cart = {
      userId,
      items: [
        {
          variantId,
          quantity: 45,
        },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    mockVariant.findById.mockResolvedValue({
      _id: variantId,
      productId: "507f191e810c19729de860eb",
      isActive: true,
      quantity: 100,
    });

    mockProduct.findById.mockResolvedValue({
      isActive: true,
    });
  });

  test("should reject adding items when total exceeds 50", async () => {
    mockCart.findOne.mockResolvedValueOnce(cart);

    await expect(
      addItemToCartService({
        userId,
        variantId,
        quantity: 6,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Maximum cart quantity is 50.",
    });

    expect(cart.save).not.toHaveBeenCalled();
  });

  test("should allow adding items when total is exactly 50", async () => {
    const populatedCart = {
      items: [],
      toObject() {
        return {
          userId,
          items: [],
        };
      },
    };

    const populateQuery = {
      populate: jest.fn().mockResolvedValue(populatedCart),
    };

    mockCart.findOne
      .mockResolvedValueOnce(cart)
      .mockReturnValueOnce(populateQuery);

    const result = await addItemToCartService({
      userId,
      variantId,
      quantity: 5,
    });

    expect(cart.items[0].quantity).toBe(50);
    expect(cart.save).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
  });
});