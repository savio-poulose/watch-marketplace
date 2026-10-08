const ProductCard = ({ product }) => {
  const discount = product.oldPrice
    ? Math.round(
        ((product.oldPrice - product.price) /
          product.oldPrice) *
          100
      )
    : 0;

  return (
    <div className="group overflow-hidden border border-gray-200 bg-white">

      {/* Image */}

      <div className="relative aspect-square overflow-hidden bg-[#f3f2ee]">

        {/* Badge */}

        {product.badge && (
          <span className="absolute left-3 top-3 z-10 bg-black px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-white">
            {product.badge}
          </span>
        )}

        {/* Wishlist */}

        <button
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:text-[#9A7B3F]"
          aria-label="Add to wishlist"
        >
          ♡
        </button>

        {/* Product image */}

        <img
          src={`${product.image}?auto=format&fit=crop&w=700&q=80`}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

      </div>

      {/* Content */}

      <div className="p-4">

        {/* Rating */}

        <div className="mb-2 flex items-center gap-1 text-[10px]">

          <span className="text-[#9A7B3F]">
            ★
          </span>

          <span className="text-gray-600">
            {product.rating}
          </span>

          <span className="text-gray-400">
            ({product.reviews})
          </span>

        </div>

        {/* Product name */}

        <h3 className="line-clamp-1 text-sm font-medium text-gray-900">
          {product.name}
        </h3>

        {/* Description */}

        <p className="mt-1 line-clamp-1 text-[10px] text-gray-400">
          Premium luxury watch • Stainless steel
        </p>

        {/* Price */}

        <div className="mt-3 flex items-center gap-2">

          <span className="text-sm font-semibold text-gray-900">
            ₹{product.price.toLocaleString("en-IN")}
          </span>

          {product.oldPrice && (
            <span className="text-[10px] text-gray-400 line-through">
              ₹{product.oldPrice.toLocaleString("en-IN")}
            </span>
          )}

          {discount > 0 && (
            <span className="text-[9px] font-medium text-green-600">
              {discount}% OFF
            </span>
          )}

        </div>

        {/* Add to cart */}

        <button
          className="mt-4 w-full bg-black py-3 text-[9px] font-semibold uppercase tracking-widest text-white transition hover:bg-[#9A7B3F]"
        >
          Add to Bag
        </button>

      </div>

    </div>
  );
};

export default ProductCard;