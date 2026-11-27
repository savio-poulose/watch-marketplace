import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import CollectionFilters from "../../components/user/collections/CollectionFilters";
import CollectionToolbar from "../../components/user/collections/CollectionToolbar";
import ProductGrid from "../../components/user/collections/ProductGrid";
import Pagination from "../../components/user/collections/Pagination";
import Navbar from "../../components/layout/Navbar";

import api from "../../api/axios.js";
import toast from "react-hot-toast";

const Collections = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get("category");
  const urlSearch = searchParams.get("search");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9;

  const [filters, setFilters] = useState({
    categories: urlCategory ? [urlCategory] : [],
    brands: [],
    priceRange: [0, 10000000],
    dialShade: [],
    movementType: [],
    strapMaterial: [],
  });

  const [sortBy, setSortBy] = useState("featured");

  // Keep category in sync with URL parameter if it changes
  useEffect(() => {
    if (urlCategory) {
      setFilters((prev) => {
        const alreadySelected = prev.categories.some(
          (c) => c.toLowerCase() === urlCategory.toLowerCase()
        );
        if (alreadySelected) return prev;
        return {
          ...prev,
          categories: [urlCategory],
        };
      });
      setCurrentPage(1);
    }
  }, [urlCategory]);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const response = await api.get("/user/products");

        if (!cancelled) {
          setProducts(response.data.products ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch products:", err);
          toast.error(
            err.response?.data?.message || "Unable to load products."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      // URL search query filter
      if (urlSearch && urlSearch.trim()) {
        const query = urlSearch.trim().toLowerCase();
        const name = (product.name || "").toLowerCase();
        const brand = (product.brand || "").toLowerCase();
        const cat = (product.category || product.categoryName || "").toLowerCase();

        if (
          !name.includes(query) &&
          !brand.includes(query) &&
          !cat.includes(query)
        ) {
          return false;
        }
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        const productCat = (
          product.category ||
          product.categoryName ||
          ""
        )
          .trim()
          .toLowerCase();
        const productCatId = (product.categoryId || "").toString().toLowerCase();
        const productGender = (product.gender || "").trim().toLowerCase();

        const matchesCategory = filters.categories.some((cat) => {
          const target = cat.trim().toLowerCase();

          // Direct category name match or substring match
          if (
            productCat &&
            (productCat === target ||
              productCat.includes(target) ||
              target.includes(productCat))
          ) {
            return true;
          }

          // Direct category ID match
          if (productCatId && productCatId === target) {
            return true;
          }

          // Gender-based mapping (e.g. MEN'S -> Men, WOMEN'S -> Women)
          if (
            target.includes("men") &&
            !target.includes("women") &&
            productGender === "men"
          ) {
            return true;
          }

          if (target.includes("women") && productGender === "women") {
            return true;
          }

          return false;
        });

        if (!matchesCategory) {
          return false;
        }
      }

      // Brand filter
      if (
        filters.brands.length > 0 &&
        !filters.brands.some(
          (brand) =>
            brand.toLowerCase() === (product.brand || "").toLowerCase()
        )
      ) {
        return false;
      }

      // Dial color filter
      if (
        filters.dialShade.length > 0 &&
        !filters.dialShade.some(
          (shade) =>
            shade.toLowerCase() === (product.dialColor || "").toLowerCase()
        )
      ) {
        return false;
      }

      // Strap material filter
      if (
        filters.strapMaterial.length > 0 &&
        !filters.strapMaterial.some(
          (material) =>
            material.toLowerCase() ===
            (product.strapMaterial || "").toLowerCase()
        )
      ) {
        return false;
      }

      // Price filter uses the discounted selling price.
      const price = Number(product.price ?? 0);
      const [minPrice, maxPrice] = filters.priceRange;

      if (price < minPrice || price > maxPrice) {
        return false;
      }

      return true;
    });

    // Sorting
    switch (sortBy) {
      case "price-low-high":
        filtered.sort(
          (a, b) => Number(a.price ?? 0) - Number(b.price ?? 0)
        );
        break;

      case "price-high-low":
        filtered.sort(
          (a, b) => Number(b.price ?? 0) - Number(a.price ?? 0)
        );
        break;

      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        break;

      case "name-a-z":
        filtered.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        break;

      case "featured":
      default:
        break;
    }

    return filtered;
  }, [products, filters, sortBy, urlSearch]);

  const totalPages = Math.ceil(
    filteredProducts.length / productsPerPage
  );

  const startIndex = (currentPage - 1) * productsPerPage;

  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));

    // If category was cleared, clear category from searchParams as well
    if (filterName === "categories" && (!value || value.length === 0)) {
      if (searchParams.has("category")) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("category");
        setSearchParams(nextParams, { replace: true });
      }
    }

    setCurrentPage(1);
  };

  const removeCategoryFilter = (catToRemove) => {
    const updated = (filters.categories || []).filter(
      (c) => c !== catToRemove
    );
    handleFilterChange("categories", updated);
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 10000000],
      dialShade: [],
      movementType: [],
      strapMaterial: [],
    });
    if (searchParams.has("category") || searchParams.has("search")) {
      setSearchParams({}, { replace: true });
    }
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const activeCategoryCount = filters.categories?.length || 0;
  const hasActiveFilters =
    activeCategoryCount > 0 ||
    filters.brands.length > 0 ||
    filters.dialShade.length > 0 ||
    filters.strapMaterial.length > 0 ||
    Boolean(urlSearch);

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <Navbar />
      </div>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-6 py-8">
        <CollectionFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <main className="min-w-0 flex-1">
          <CollectionToolbar
            productCount={filteredProducts.length}
            sortBy={sortBy}
            setSortBy={handleSortChange}
          />

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Active Filters:
              </span>

              {filters.categories?.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] px-3 py-1 text-xs text-white"
                >
                  <span>Category: {cat}</span>
                  <button
                    type="button"
                    onClick={() => removeCategoryFilter(cat)}
                    className="hover:text-[#9A7B3F] cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}

              {filters.brands?.map((brand) => (
                <span
                  key={brand}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-800"
                >
                  <span>Brand: {brand}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleFilterChange(
                        "brands",
                        filters.brands.filter((b) => b !== brand)
                      )
                    }
                    className="hover:text-black cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}

              {urlSearch && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-800">
                  <span>Search: "{urlSearch}"</span>
                </span>
              )}

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-[#9A7B3F] hover:underline cursor-pointer ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-gray-500">Loading watches...</p>
            </div>
          ) : currentProducts.length > 0 ? (
            <ProductGrid products={currentProducts} />
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <h2 className="text-lg font-semibold text-[#111827]">
                No watches found
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Try changing your filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 rounded bg-[#9A7B3F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#806532] cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>
          )}

          {!loading && totalPages > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Collections;
