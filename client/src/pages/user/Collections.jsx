import { useEffect, useState,useMemo } from "react";
import CollectionFilters from "../../components/user/collections/CollectionFilters";
import CollectionToolbar from "../../components/user/collections/CollectionToolbar";
import ProductGrid from "../../components/user/collections/ProductGrid";
import Pagination from "../../components/user/collections/Pagination";
import Navbar from "../../components/layout/Navbar";
import toast from "react-hot-toast";
import axios from "axios";

const Collections = () => {
  const [products, setProducts] = useState([]);

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
    async function fetchProducts() {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/user/products",
          {
            withCredentials: true,
          },
        );

        // console.log(response)

        setProducts(response.data.products);
      } catch (err) {
        console.log(err);
        toast.error("something went wrong");
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Brand filter
      
      if (
        filters.brands.length > 0 &&
        !filters.brands.some(
          (brand) =>
            brand.toLowerCase() === (product.brand || "").toLowerCase(),
        )
      ) {
        return false;
      }

      // Dial color filter
      if (
        filters.dialShade.length > 0 &&
        !filters.dialShade.some(
          (shade) =>
            shade.toLowerCase() === (product.dialColor || "").toLowerCase(),
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
            (product.strapMaterial || "").toLowerCase(),
        )
      ) {
        return false;
      }

      // Price filter
      const price = Number(product.price ?? 0);
      const [minPrice, maxPrice] = filters.priceRange;

      if (price < minPrice || price > maxPrice) {
        return false;
      }

      return true;
    });
  }, [products, filters]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const startIndex = (currentPage - 1) * productsPerPage;

  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage,
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * Filter change
   */

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));

    // Whenever filter changes, go back to page 1
    setCurrentPage(1);
  };


  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Page Header */}

      <div className="border-b border-gray-200 sticky top-0 z-100 bg-white">
        <Navbar />
      </div>

      {/* Main Collection */}

      <div className="mx-auto flex max-w-[1400px] gap-6 px-6 py-8">
        {/* Filters */}

        <CollectionFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Products Section */}

        <main className="min-w-0 flex-1">
          <CollectionToolbar
  productCount={filteredProducts.length}
  sortBy={sortBy}
  setSortBy={setSortBy}
/>

          <ProductGrid products={currentProducts} />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </main>
      </div>
    </div>
  );
};

export default Collections;
