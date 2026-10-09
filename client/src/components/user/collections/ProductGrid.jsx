import ProductCard from "./ProductCard";

const ProductGrid = ({ products }) => {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-sm border border-gray-200 bg-white">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">
            No watches found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try changing your filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;