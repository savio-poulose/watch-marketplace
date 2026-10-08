const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-2">

      {/* Previous */}

      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`flex h-9 w-9 items-center justify-center border text-sm ${
          currentPage === 1
            ? "cursor-not-allowed border-gray-100 text-gray-300"
            : "border-gray-200 text-gray-700 hover:border-black hover:text-black"
        }`}
      >
        ←
      </button>

      {/* Page numbers */}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`flex h-9 min-w-9 items-center justify-center border px-3 text-xs ${
            currentPage === page
              ? "border-black bg-black text-white"
              : "border-gray-200 bg-white text-gray-700 hover:border-black"
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next */}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`flex h-9 w-9 items-center justify-center border text-sm ${
          currentPage === totalPages
            ? "cursor-not-allowed border-gray-100 text-gray-300"
            : "border-gray-200 text-gray-700 hover:border-black hover:text-black"
        }`}
      >
        →
      </button>

    </div>
  );
};

export default Pagination;