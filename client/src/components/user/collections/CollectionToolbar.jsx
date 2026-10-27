const CollectionToolbar = ({
  productCount,
  sortBy,
  setSortBy,
}) => {
  return (
    <div className="mb-5 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">

      <div>
        <p className="text-xs text-gray-500">
          Showing{" "}
          <span className="font-medium text-gray-900">
            {productCount}
          </span>{" "}
          products
        </p>
      </div>

      <div className="flex items-center gap-3">

        <label
          htmlFor="sort"
          className="text-[10px] uppercase tracking-wider text-gray-400"
        >
          Sort by
        </label>

        
<select
  id="sort"
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
  className="border border-gray-200 bg-white px-4 py-2 text-xs text-gray-700 outline-none focus:border-[#9A7B3F]"
>
  <option value="featured">Featured</option>
  <option value="price-low-high">Price: Low to High</option>
  <option value="price-high-low">Price: High to Low</option>
  <option value="newest">Newest</option>
  <option value="name-a-z">Name: A to Z</option>
</select>

      </div>

    </div>
  );
};

export default CollectionToolbar;