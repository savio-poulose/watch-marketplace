import submarinerImg from "../../assets/images/category/submariner.jpg";
import automaticImg from "../../assets/images/category/automatic.jpg";
import mensImg from "../../assets/images/category/mens.jpg";
import heritageImg from "../../assets/images/category/heritage.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import toast from "react-hot-toast";
import { HiOutlineHeart, HiOutlineEye } from "react-icons/hi2";

const featuredWatches = [
  {
    id: 1,
    name: "Horae Submariner Deep Sea",
    series: "Marine Calibre 300",
    price: "₹ 1,45,000",
    badge: "Best Seller",
    image: submarinerImg,
    category: "AUTOMATIC",
    specs: "300m Water Resistant · Cerachrom Bezel",
  },
  {
    id: 2,
    name: "Horae ChronoMaster Steel",
    series: "Precision Tachymeter",
    price: "₹ 1,28,000",
    badge: "New Release",
    image: mensImg,
    category: "MEN'S",
    specs: "316L Surgical Steel · Sapphire Crystal",
  },
  {
    id: 3,
    name: "Horae Automatic Open-Heart",
    series: "Mechanical Atelier",
    price: "₹ 1,65,000",
    badge: "Limited Edition",
    image: automaticImg,
    category: "AUTOMATIC",
    specs: "28,800 VPH · 42h Power Reserve",
  },
  {
    id: 4,
    name: "Horae Heritage Perpetual",
    series: "Vintage 1952 Revival",
    price: "₹ 1,95,000",
    badge: "Boutique Exclusive",
    image: heritageImg,
    category: "PREMIUM HERITAGE",
    specs: "Alligator Leather · Champagne Sunburst",
  },
];

const FeaturedCollection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleProductClick = (watch) => {
    if (!user) {
      toast.error(`Please log in to view the ${watch.name}`);
      navigate("/user/login");
      return;
    }
    navigate(`/user/collections?category=${encodeURIComponent(watch.category)}`);
  };

  const handleWishlist = (e, watch) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please log in to add items to your wishlist");
      navigate("/user/login");
      return;
    }
    toast.success(`${watch.name} added to wishlist`);
  };

  return (
    <section className="w-full bg-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-10 border-b border-gray-100">
      <div className="mx-auto max-w-7xl">
        
        {/* Section Header */}
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-[#9A7B3F] uppercase">
              Curated Horology
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111827]">
              ICONIC TIMEPIECES
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!user) {
                toast.error("Please log in to view all collections");
                navigate("/user/login");
                return;
              }
              navigate("/user/collections");
            }}
            className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-semibold tracking-wider text-[#8a6d35] transition hover:text-[#111827]"
          >
            EXPLORE COMPLETE CATALOGUE
            <span className="text-base font-bold">→</span>
          </button>
        </div>

        {/* Product Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {featuredWatches.map((watch) => (
            <div
              key={watch.id}
              onClick={() => handleProductClick(watch)}
              className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
            >
              {/* Badge */}
              <div className="absolute top-6 left-6 z-10">
                <span className="rounded-full bg-[#111827] px-2.5 py-1 text-[9px] font-semibold tracking-wider text-[#9A7B3F] uppercase shadow">
                  {watch.badge}
                </span>
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={(e) => handleWishlist(e, watch)}
                className="absolute top-6 right-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-white hover:text-red-500 transition"
                title="Save to Wishlist"
              >
                <HiOutlineHeart className="h-4 w-4" />
              </button>

              {/* Image Container */}
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
                <img
                  src={watch.image}
                  alt={watch.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                {/* Quick Explore Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-white/95 px-4 py-2 text-xs font-semibold tracking-wider text-gray-900 shadow-md">
                    <HiOutlineEye className="h-4 w-4" />
                    QUICK VIEW
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="mt-4 flex flex-1 flex-col justify-between">
                <div>
                  <p className="text-[10px] font-medium tracking-widest text-[#9A7B3F] uppercase">
                    {watch.series}
                  </p>
                  <h3 className="mt-1 text-sm font-bold text-gray-900 group-hover:text-[#9A7B3F] transition-colors">
                    {watch.name}
                  </h3>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {watch.specs}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block">Price</span>
                    <span className="text-base font-extrabold text-gray-900">
                      {watch.price}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-[#8a6d35] group-hover:translate-x-0.5 transition-transform">
                    Details →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturedCollection;
