import craftsmanshipImg from "../../assets/images/craftsmanship.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import toast from "react-hot-toast";
import { HiOutlineSparkles, HiOutlineShieldCheck, HiOutlineClock, HiOutlineGlobeAlt } from "react-icons/hi2";

const BrandStory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAction = () => {
    if (!user) {
      toast.error("Please log in to discover our full atelier heritage");
      navigate("/user/login");
      return;
    }
    navigate("/user/about");
  };

  const stats = [
    { value: "100+", label: "Years of Heritage", icon: HiOutlineClock },
    { value: "0.02s", label: "Daily Precision Tolerance", icon: HiOutlineSparkles },
    { value: "50+", label: "Master Horologists", icon: HiOutlineGlobeAlt },
    { value: "5 Years", label: "Global Atelier Warranty", icon: HiOutlineShieldCheck },
  ];

  return (
    <section className="w-full bg-[#0d1117] py-16 sm:py-20 lg:py-24 text-gray-200 overflow-hidden relative">
      {/* Background Subtle Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#9A7B3F]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#9A7B3F]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Image Side */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Gold Border Accent Box */}
              <div className="absolute -inset-3 rounded-xl border border-[#9A7B3F]/30 transform -rotate-1 hidden sm:block pointer-events-none" />
              
              <div className="relative overflow-hidden rounded-lg shadow-2xl border border-gray-800">
                <img
                  src={craftsmanshipImg}
                  alt="Master watchmaker assembling tourbillon movement"
                  className="w-full h-[360px] sm:h-[440px] md:h-[480px] object-cover transition duration-700 hover:scale-105"
                />
                
                {/* Floating Heritage Badge */}
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-black/80 backdrop-blur-md border border-[#9A7B3F]/40 px-4 py-3 rounded-md shadow-lg">
                  <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#9A7B3F]">
                    Handmade Movement
                  </p>
                  <p className="text-xs font-medium text-white mt-0.5">
                    Calibre 1924 Tourbillon
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Text Editorial Side */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="h-px w-8 bg-[#9A7B3F]" />
              <p className="text-[11px] font-semibold tracking-[0.25em] text-[#9A7B3F] uppercase">
                The Art of Horology
              </p>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              A Century of Uncompromising Precision & Mastery
            </h2>

            <p className="mt-4 text-sm sm:text-base leading-relaxed text-gray-300 font-light">
              At <strong className="text-white font-medium">HORAE</strong>, time is not merely measured—it is sculpted. Every timepiece in our curation embodies generations of Swiss horological heritage, marrying micromechanical precision with timeless aesthetic poise.
            </p>

            <p className="mt-3 text-sm leading-relaxed text-gray-400 font-light">
              From hand-beveled bridges to anti-reflective sapphire crystal and surgical-grade 316L steel, each watch undergoes rigorous 500-hour chronometric testing before reaching your wrist.
            </p>

            {/* Metrics Grid */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-b border-gray-800 py-6">
              {stats.map((stat, idx) => {
                const IconComponent = stat.icon;
                return (
                  <div key={idx} className="flex flex-col items-center text-center p-2">
                    <IconComponent className="w-5 h-5 text-[#9A7B3F] mb-1.5" />
                    <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {stat.value}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-gray-400 mt-1 uppercase tracking-wider leading-tight">
                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action CTA */}
            <div className="mt-8 flex items-center gap-4">
              <button
                type="button"
                onClick={handleAction}
                className="cursor-pointer inline-flex items-center gap-2 rounded-sm bg-[#9A7B3F] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-black transition duration-300 hover:bg-[#b08e4c] hover:shadow-[0_0_20px_rgba(154,123,63,0.4)]"
              >
                <span>Discover Atelier</span>
                <span>→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    toast.error("Please log in to browse collections");
                    navigate("/user/login");
                    return;
                  }
                  navigate("/user/collections");
                }}
                className="cursor-pointer inline-flex items-center gap-2 rounded-sm border border-gray-700 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-[#9A7B3F] hover:text-[#9A7B3F]"
              >
                View Collection
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default BrandStory;
