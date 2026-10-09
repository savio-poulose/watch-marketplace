
const VariantSelector = ({
  variants,
  selectedVariant,
  onSelectVariant,
}) => {
  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="mb-3 text-xs text-gray-600">
        Colour:{" "}
        <span className="font-semibold text-[#111827]">
          {selectedVariant?.dialColor ||
            selectedVariant?.color ||
            selectedVariant?.strapMaterial ||
            "Select variant"}
        </span>
      </p>

      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const image = variant.images?.[0] || variant.image;
          const isSelected = selectedVariant?._id === variant._id;

          return (
            <button
              key={variant._id}
              type="button"
              onClick={() => onSelectVariant(variant)}
              className={`w-[72px] shrink-0 cursor-pointer overflow-hidden rounded-lg border bg-white text-left transition ${
                isSelected
                  ? "border-2 border-[#2563a6] ring-1 ring-[#2563a6]"
                  : "border-gray-200 hover:border-[#111827]"
              }`}
            >
              <div className="flex h-[66px] items-center justify-center bg-white p-1.5">
                {image ? (
                  <img
                    src={image}
                    alt={`${variant.dialColor || variant.color || "Watch"} variant`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-gray-400">
                    No image
                  </span>
                )}
              </div>

              <div className="border-t border-gray-100 px-1.5 py-1.5">
                <p className="truncate text-xs font-medium text-[#111827]">
                  ₹{Number(variant.price || 0).toLocaleString("en-IN")}
                </p>

                {variant.oldPrice > variant.price && (
                  <p className="truncate text-[9px] text-gray-500 line-through">
                    ₹{variant.oldPrice.toLocaleString("en-IN")}
                  </p>
                )}

                {variant.stock <= 0 && (
                  <p className="mt-1 text-[9px] text-red-600">
                    Out of stock
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VariantSelector;
