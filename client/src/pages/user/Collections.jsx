import { useEffect, useState } from "react";
import CollectionFilters from "../../components/user/collections/CollectionFilters";
import CollectionToolbar from "../../components/user/collections/CollectionToolbar";
import ProductGrid from "../../components/user/collections/ProductGrid";
import Pagination from "../../components/user/collections/Pagination";
import Navbar from "../../components/layout/Navbar";

const Collections = () => {
  const [products, setProducts] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const productsPerPage = 9;

  const [filters, setFilters] = useState({
    brands: [],
    priceRange: [0, 100000],
    dialShade: [],
    movementType: [],
    strapMaterial: [],
  });

  const [sortBy, setSortBy] = useState("featured");

  
  useEffect(() => {
    const dummyProducts = [
      {
        id: 1,
        name: "Titan Karishma Quartz Analog",
        brand: "Titan",
        price: 3445,
        oldPrice: 3995,
        image:
          "https://images.unsplash.com/photo-1524805444758-089113d48a6d",
        badge: "BESTSELLER",
        rating: 4.5,
        reviews: 120,
      },
      {
        id: 2,
        name: "Titan Edge Slimline Champagne",
        brand: "Titan",
        price: 14995,
        oldPrice: 16995,
        image:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        badge: "NEW ARRIVAL",
        rating: 4.7,
        reviews: 89,
      },
      {
        id: 3,
        name: "Titan Minimalist Obsidian Black",
        brand: "Titan",
        price: 4495,
        oldPrice: 5295,
        image:
          "https://images.unsplash.com/photo-1523170335258-f5ed11844a49",
        badge: "BESTSELLER",
        rating: 4.5,
        reviews: 98,
      },
      {
        id: 4,
        name: "Titan Karishma Black & Rose",
        brand: "Titan",
        price: 4495,
        oldPrice: 4995,
        image:
          "https://images.unsplash.com/photo-1524805444758-089113d48a6d",
        badge: "TRENDING",
        rating: 4.6,
        reviews: 73,
      },
      {
        id: 5,
        name: "Titan Grand Regalia",
        brand: "Titan",
        price: 24495,
        oldPrice: 28995,
        image:
          "https://images.unsplash.com/photo-1539874754764-5a96559165b0",
        badge: "PREMIUM AUTOMATIC",
        rating: 4.8,
        reviews: 56,
      },
      {
        id: 6,
        name: "Titan Octane Chrono Mesh",
        brand: "Titan",
        price: 18995,
        oldPrice: 21995,
        image:
          "https://images.unsplash.com/photo-1508057198894-247b23fe5ade",
        badge: "LIMITED EDITION",
        rating: 4.7,
        reviews: 64,
      },
      {
        id: 7,
        name: "Titan Automatic Skeleton",
        brand: "Titan",
        price: 42995,
        oldPrice: 48995,
        image:
          "https://images.unsplash.com/photo-1523170335258-f5ed11844a49",
        badge: "HAUTE HORLOGERIE",
        rating: 4.9,
        reviews: 42,
      },
      {
        id: 8,
        name: "Titan Ceramic Precision Dual",
        brand: "Titan",
        price: 29995,
        oldPrice: 34995,
        image:
          "https://images.unsplash.com/photo-1524805444758-089113d48a6d",
        badge: "CERAMIC DIAL",
        rating: 4.6,
        reviews: 31,
      },
      {
        id: 9,
        name: "Titan Regalia Sovereign Gold",
        brand: "Titan",
        price: 11495,
        oldPrice: 13995,
        image:
          "https://images.unsplash.com/photo-1547996160-81dfa63595aa",
        badge: "ROYAL GOLD",
        rating: 4.8,
        reviews: 27,
      },
      {
        id: 1,
        name: "Titan Karishma Quartz Analog",
        brand: "Titan",
        price: 3445,
        oldPrice: 3995,
        image:
          "https://images.unsplash.com/photo-1524805444758-089113d48a6d",
        badge: "BESTSELLER",
        rating: 4.5,
        reviews: 120,
      },
      {
        id: 2,
        name: "Titan Edge Slimline Champagne",
        brand: "Titan",
        price: 14995,
        oldPrice: 16995,
        image:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        badge: "NEW ARRIVAL",
        rating: 4.7,
        reviews: 89,
      },
      {
        id: 3,
        name: "Titan Minimalist Obsidian Black",
        brand: "Titan",
        price: 4495,
        oldPrice: 5295,
        image:
          "https://images.unsplash.com/photo-1523170335258-f5ed11844a49",
        badge: "BESTSELLER",
        rating: 4.5,
        reviews: 98,
      },
      {
        id: 4,
        name: "Titan Karishma Black & Rose",
        brand: "Titan",
        price: 4495,
        oldPrice: 4995,
        image:
          "https://images.unsplash.com/photo-1524805444758-089113d48a6d",
        badge: "TRENDING",
        rating: 4.6,
        reviews: 73,
      },
      {
        id: 5,
        name: "Titan Grand Regalia",
        brand: "Titan",
        price: 24495,
        oldPrice: 28995,
        image:
          "https://images.unsplash.com/photo-1539874754764-5a96559165b0",
        badge: "PREMIUM AUTOMATIC",
        rating: 4.8,
        reviews: 56,
      },
      {
        id: 6,
        name: "Titan Octane Chrono Mesh",
        brand: "Titan",
        price: 18995,
        oldPrice: 21995,
        image:
          "https://images.unsplash.com/photo-1508057198894-247b23fe5ade",
        badge: "LIMITED EDITION",
        rating: 4.7,
        reviews: 64,
      },
      {
        id: 7,
        name: "Titan Automatic Skeleton",
        brand: "Titan",
        price: 42995,
        oldPrice: 48995,
        image:
          "https://images.unsplash.com/photo-1523170335258-f5ed11844a49",
        badge: "HAUTE HORLOGERIE",
        rating: 4.9,
        reviews: 42,
      },
      {
        id: 8,
        name: "Titan Ceramic Precision Dual",
        brand: "Titan",
        price: 29995,
        oldPrice: 34995,
        image:
          "https://images.unsplash.com/photo-1524805444758-089113d48a6d",
        badge: "CERAMIC DIAL",
        rating: 4.6,
        reviews: 31,
      },
      {
        id: 9,
        name: "Titan Regalia Sovereign Gold",
        brand: "Titan",
        price: 11495,
        oldPrice: 13995,
        image:
          "https://images.unsplash.com/photo-1547996160-81dfa63595aa",
        badge: "ROYAL GOLD",
        rating: 4.8,
        reviews: 27,
      },
    ];

    setProducts(dummyProducts);
  }, []);

  

  const totalPages = Math.ceil(products.length / productsPerPage);

  const startIndex = (currentPage - 1) * productsPerPage;

  const currentProducts = products.slice(
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
        <Navbar/>
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
            productCount={products.length}
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