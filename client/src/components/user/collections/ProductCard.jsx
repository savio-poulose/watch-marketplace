import { useNavigate } from "react-router-dom";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products/${product.id}`)}
      className="cursor-pointer border border-gray-200"
    >
      <img
        src={product.images?.[0] || product.image}
        alt={product.name}
        className="aspect-square w-full object-cover"
      />

      <div className="p-4">
        <h3>{product.name}</h3>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/products/${product._id}`);
          }}
          className="mt-3 w-full bg-[#111827] py-3 text-white"
        >
          View Product
        </button>
      </div>
    </div>
  );
};

export default ProductCard;