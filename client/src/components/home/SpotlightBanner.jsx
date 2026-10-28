import spotlightImg from "../../assets/images/spotlight_watch.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import toast from "react-hot-toast";
import { HiCheck, HiOutlineSparkles } from "react-icons/hi2";

const SpotlightBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAcquire = () => {
    if (!user) {
      toast.error("Please log in to acquire this exclusive timepiece");
      navigate("/user/login");
      return;
    }
    navigate("/user/collections?category=AUTOMATIC");
  };

  const specs = [
    "Skeletonized 18K Gold & 316L Oystersteel Case",
    "Calibre H-8800 Bi-Directional Self-Winding Movement",
    "Anti-Reflective Scratch-Proof Sapphire Crystal",
    "48-Hour Power Reserve with 100m Hydrostatic Rating",
  ];

  return (
    <section className="w-full bg-[#111827] text-white py-16 sm:py-20 lg:py-24 border-t border-b border-gray-800 relative overflow-hidden">
      {/* Decorative Gold Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#9A7B3F] to-transparent opacity-80" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="rounded-2xl bg-gradient-to-br from-[#1a2233] to-[#0f141f] border border-gray-800 p-6 sm:p-10 lg:p-14 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#9A7B3F]/40 bg-[#9A7B3F]/10 px-3 py-1 text-[10px] font-semibold tracking-widest text-[#9A7B3F] uppercase w-fit mb-4">
                <HiOutlineSparkles className="w-3.5 h-3.5" />
                <span>Pinnacle Masterpiece · Limited Allocation</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
                The Horae Calibre X ChronoMaster Skeleton
              </h2>

              <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed font-light">
                Engineered for the discerning connoisseur, the Calibre X exposes the beating heart of Swiss micro-engineering through an open-worked architectural dial, accented with hand-brushed dual-tone links.
              </p>

              {/* Specifications List */}
              <ul className="mt-6 space-y-2.5">
                {specs.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-300">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#9A7B3F]/20 text-[#9A7B3F]">
                      <HiCheck className="h-3 w-3 stroke-[3]" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Price & CTA */}
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">
                    Boutique Reference Price
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#9A7B3F] tracking-tight">
                    ₹ 1,85,000
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAcquire}
                  className="cursor-pointer rounded-sm bg-[#9A7B3F] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-black transition duration-300 hover:bg-[#b08e4c] hover:shadow-[0_0_25px_rgba(154,123,63,0.5)]"
                >
                  Acquire Timepiece
                </button>
              </div>
            </div>

            {/* Right Watch Image */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group cursor-pointer" onClick={handleAcquire}>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#9A7B3F]/30 to-amber-600/20 blur-xl opacity-70 group-hover:opacity-100 transition duration-700" />
                <div className="relative overflow-hidden rounded-xl border border-gray-700/60 bg-black/60 shadow-2xl">
                  <img
                    src={spotlightImg}
                    alt="The Horae Calibre X ChronoMaster Skeleton"
                    className="w-full h-[320px] sm:h-[380px] lg:h-[420px] object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm border border-gray-700 px-2.5 py-1 rounded text-[10px] font-semibold text-gray-200 uppercase tracking-wider">
                    Edition of 250
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default SpotlightBanner;
