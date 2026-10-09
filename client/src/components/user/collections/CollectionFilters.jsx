const CollectionFilters = ({ filters, onFilterChange }) => {
  const brands = [
    "Titan",
    "Fastrack",
    "Sonata",
    "Police",
    "Tommy Hilfiger",
    "Police Luxury",
  ];

  const dialShades = [
    "Blue",
    "Green",
    "Black",
    "Silver",
  ];

  const movementTypes = [
    "Quartz",
    "Automatic",
    "Mechanical",
    "Multifunction",
  ];

  const strapMaterials = [
    "Stainless Steel",
    "Leather",
    "Full Grain Leather",
    "Mesh",
    "Silicone",
  ];

  const handleCheckbox = (filterName, value) => {
    const currentValues = filters[filterName];

    if (currentValues.includes(value)) {
      onFilterChange(
        filterName,
        currentValues.filter((item) => item !== value)
      );
    } else {
      onFilterChange(
        filterName,
        [...currentValues, value]
      );
    }
  };

  return (
    <aside className="hidden w-64 shrink-0 lg:block">

      <div className="sticky top-24 rounded-sm border border-gray-200 bg-white">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
            Filters
          </h2>

          <button
            onClick={() => {
              onFilterChange("brands", []);
              onFilterChange("dialShade", []);
              onFilterChange("movementType", []);
              onFilterChange("strapMaterial", []);
              onFilterChange("priceRange", [0, 100000]);
            }}
            className="text-[10px] uppercase tracking-wider text-gray-400 hover:text-black"
          >
            Reset
          </button>

        </div>

        {/* Brands */}

        <FilterSection title="Brands">

          {brands.map((brand) => (
            <FilterCheckbox
              key={brand}
              label={brand}
              checked={filters.brands.includes(brand)}
              onChange={() =>
                handleCheckbox("brands", brand)
              }
            />
          ))}

        </FilterSection>

        {/* Price */}

        <FilterSection title="Price Range">

          <div className="px-1">

            <div className="mb-4 flex justify-between text-xs text-gray-500">
              <span>₹0</span>
              <span>₹1,00,000+</span>
            </div>

            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={filters.priceRange[1]}
              onChange={(e) =>
                onFilterChange(
                  "priceRange",
                  [0, Number(e.target.value)]
                )
              }
              className="w-full accent-[#111827]"
            />

            <div className="mt-3 text-xs font-medium text-gray-700">
              Up to ₹{filters.priceRange[1].toLocaleString("en-IN")}
            </div>

          </div>

        </FilterSection>

        {/* Dial Shade */}

        <FilterSection title="Dial Shade">

          {dialShades.map((shade) => (
            <FilterCheckbox
              key={shade}
              label={shade}
              checked={filters.dialShade.includes(shade)}
              onChange={() =>
                handleCheckbox("dialShade", shade)
              }
            />
          ))}

        </FilterSection>

        {/* Movement */}

        <FilterSection title="Movement Type">

          {movementTypes.map((movement) => (
            <FilterCheckbox
              key={movement}
              label={movement}
              checked={filters.movementType.includes(movement)}
              onChange={() =>
                handleCheckbox("movementType", movement)
              }
            />
          ))}

        </FilterSection>

        {/* Strap */}

        <FilterSection title="Strap Material">

          {strapMaterials.map((material) => (
            <FilterCheckbox
              key={material}
              label={material}
              checked={filters.strapMaterial.includes(material)}
              onChange={() =>
                handleCheckbox("strapMaterial", material)
              }
            />
          ))}

        </FilterSection>

        <div className="border-t border-gray-100 p-4">

          <button className="w-full bg-black py-3 text-[10px] font-semibold uppercase tracking-widest text-white transition hover:bg-[#9A7B3F]">
            Apply Filters
          </button>

        </div>

      </div>
    </aside>
  );
};


/*
 * Reusable filter section
 */

const FilterSection = ({ title, children }) => {
  return (
    <div className="border-b border-gray-100 px-5 py-5">

      <div className="mb-4 flex items-center justify-between">

        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-900">
          {title}
        </h3>

        <span className="text-gray-400">
         ⌃
        </span>

      </div>

      <div className="space-y-3">
        {children}
      </div>

    </div>
  );
};


/*
 * Reusable checkbox
 */

const FilterCheckbox = ({
  label,
  checked,
  onChange,
}) => {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-xs text-gray-600">

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded border-gray-300 accent-[#9A7B3F]"
      />

      <span className="hover:text-black">
        {label}
      </span>

    </label>
  );
};

export default CollectionFilters;