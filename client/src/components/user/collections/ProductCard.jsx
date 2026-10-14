import { useNavigate } from "react-router-dom";

const formatPrice = (price) =>
  `₹${Number(price || 0).toLocaleString("en-IN")}`;

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  // Prevent a crash if the parent passes an undefined product.
  if (!product) return null;

  // Support both API formats.
  const productId = product.id || product._id;
  const image = product.images?.[0] || product.image;

  const hasOffer =
    product.hasOffer ??
    (Number(product.discount) > 0 && product.oldPrice != null);

  const handleNavigate = () => {
    if (!productId) return;
    navigate(`/products/${productId}`);
  };

  return (
    <article
      onClick={handleNavigate}
      className="group cursor-pointer overflow-hidden border border-gray-200 bg-white transition-colors "
    >
      {/* Product image */}
      <div className="relative aspect-square overflow-hidden ">
        {image ? (
          <img
            src={image}
            alt={product.name || "Luxury watch"}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105 sm:p-5"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No image available
          </div>
        )}

        {/* Discount badge */}
        {hasOffer && Number(product.discount) > 0 && (
          <span className="absolute left-2 top-2 bg-[#9A7B3F] px-2 py-1 text-[9px] font-semibold tracking-wide text-white sm:left-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-[10px]">
            {product.discount}% OFF
          </span>
        )}

        {/* Brand */}
        {product.brand && (
          <span className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 text-[8px] uppercase tracking-widest text-[#111827] sm:bottom-3 sm:left-3 sm:text-[9px]">
            {product.brand}
          </span>
        )}
      </div>

      {/* Product information */}
      <div className="p-3 sm:p-4">
        <h3 className="line-clamp-2 min-h-10 text-xs font-semibold text-[#111827] transition-colors  sm:text-sm">
          {product.name || "Unnamed watch"}
        </h3>

        {/* Pricing */}
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-bold text-[#111827] sm:text-base">
            {formatPrice(product.price)}
          </span>

          {hasOffer && product.oldPrice != null && (
            <span className="text-[10px] text-gray-400 line-through sm:text-xs">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>

        {/* View product */}
        <button
          type="button"
          disabled={!productId}
          onClick={(event) => {
            event.stopPropagation();
            handleNavigate();
          }}
          className="mt-3 w-full bg-[#111827] px-2 py-3 text-[9px] font-semibold uppercase tracking-widest text-white transition-colors  disabled:cursor-not-allowed disabled:opacity-50 sm:mt-4 sm:text-[10px]"
        >
          View Product
        </button>
      </div>
    </article>
  );
};

export default ProductCard;