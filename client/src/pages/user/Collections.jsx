
import { useEffect, useMemo, useState } from "react";

import CollectionFilters from "../../components/user/collections/CollectionFilters";
import CollectionToolbar from "../../components/user/collections/CollectionToolbar";
import ProductGrid from "../../components/user/collections/ProductGrid";
import Pagination from "../../components/user/collections/Pagination";
import Navbar from "../../components/layout/Navbar";

import api from "../../api/axios.js";
import toast from "react-hot-toast";

const Collections = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9;

  const [filters, setFilters] = useState({
    brands: [],
    priceRange: [0, 10000000],
    dialShade: [],
    movementType: [],
    strapMaterial: [],
  });

  const [sortBy, setSortBy] = useState("featured");

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
      // Brand filter
      if (
        filters.brands.length > 0 &&
        !filters.brands.some(
          (brand) =>
            brand.toLowerCase() ===
            (product.brand || "").toLowerCase()
        )
      ) {
        return false;
      }

      // Dial color filter
      if (
        filters.dialShade.length > 0 &&
        !filters.dialShade.some(
          (shade) =>
            shade.toLowerCase() ===
            (product.dialColor || "").toLowerCase()
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
  }, [products, filters, sortBy]);

  const totalPages = Math.ceil(
    filteredProducts.length / productsPerPage
  );

  const startIndex = (currentPage - 1) * productsPerPage;

  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  console.log(currentProducts)

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

    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

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

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-gray-500">
                Loading watches...
              </p>
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
