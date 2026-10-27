import api from "../../../api/axios.js";
import { useEffect, useState } from "react";

const CollectionFilters = ({ filters, onFilterChange }) => {
  const [options, setOptions] = useState({
    brands: [],
    dialShades: [],
    strapMaterials: [],
  });

  const [draftFilters, setDraftFilters] = useState(filters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const { data } = await api.get("/user/products/filters");
        setOptions(data.filters);
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
        setError("Unable to load filters.");
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  // Keep draft selections in sync if the parent resets filters
  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const handleCheckbox = (filterName, value) => {
    setDraftFilters((previous) => {
      const currentValues = previous[filterName] || [];

      return {
        ...previous,
        [filterName]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });
  };

  const resetFilters = () => {
    const resetValues = {
      brands: [],
      dialShade: [],
      strapMaterial: [],
      priceRange: [0, 100000],
    };

    setDraftFilters(resetValues);

    Object.entries(resetValues).forEach(([key, value]) => {
      onFilterChange(key, value);
    });
  };

  const applyFilters = () => {
    Object.entries(draftFilters).forEach(([key, value]) => {
      onFilterChange(key, value);
    });
  };

  if (loading) {
    return (
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="border border-gray-200 bg-white p-5 text-sm text-gray-500">
          Loading filters...
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-24 rounded-sm border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
            Filters
          </h2>

          <button
            type="button"
            onClick={resetFilters}
            className="text-[10px] uppercase tracking-wider text-gray-400 hover:text-black"
          >
            Reset
          </button>
        </div>

        {error && <p className="px-5 pt-4 text-xs text-red-600">{error}</p>}

        <FilterSection title="Brands">
          {options.brands.map((brand) => (
            <FilterCheckbox
              key={brand}
              label={brand}
              checked={(draftFilters.brands || []).includes(brand)}
              onChange={() => handleCheckbox("brands", brand)}
            />
          ))}
        </FilterSection>

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
              value={draftFilters.priceRange?.[1] ?? 100000}
              onChange={(event) =>
                setDraftFilters((previous) => ({
                  ...previous,
                  priceRange: [0, Number(event.target.value)],
                }))
              }
              className="w-full accent-[#111827]"
            />

            <div className="mt-3 text-xs font-medium text-gray-700">
              Up to ₹
              {(draftFilters.priceRange?.[1] ?? 100000).toLocaleString("en-IN")}
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Dial Shade">
          {options.dialShades.map((shade) => (
            <FilterCheckbox
              key={shade}
              label={shade}
              checked={(draftFilters.dialShade || []).includes(shade)}
              onChange={() => handleCheckbox("dialShade", shade)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Strap Material">
          {options.strapMaterials.map((material) => (
            <FilterCheckbox
              key={material}
              label={material}
              checked={(draftFilters.strapMaterial || []).includes(material)}
              onChange={() => handleCheckbox("strapMaterial", material)}
            />
          ))}
        </FilterSection>

        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={applyFilters}
            className="w-full cursor-pointer bg-black py-3 text-[10px] font-semibold uppercase tracking-widest text-white transition hover:bg-[#9A7B3F]"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </aside>
  );
};

const FilterSection = ({ title, children }) => (
  <div className="border-b border-gray-100 px-5 py-5">
    <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-gray-900">
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const FilterCheckbox = ({ label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-3 text-xs text-gray-600">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-3.5 w-3.5 rounded border-gray-300 accent-[#9A7B3F]"
    />
    <span className="hover:text-black">{label}</span>
  </label>
);

export default CollectionFilters;
