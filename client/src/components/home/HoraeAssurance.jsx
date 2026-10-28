import {
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineArrowPathRoundedSquare,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";

const pillars = [
  {
    icon: HiOutlineShieldCheck,
    title: "100% Certified Authentic",
    description:
      "Every watch is accompanied by an official serial-verified certificate of authenticity and factory papers.",
  },
  {
    icon: HiOutlineTruck,
    title: "Complimentary Insured Delivery",
    description:
      "Express, door-to-door white-glove courier delivery with 100% transit insurance cover on all shipments.",
  },
  {
    icon: HiOutlineArrowPathRoundedSquare,
    title: "7-Day Hassle-Free Returns",
    description:
      "Enjoy complete peace of mind with our complimentary 7-day return and exchange policy.",
  },
  {
    icon: HiOutlineWrenchScrewdriver,
    title: "5-Year Atelier Warranty",
    description:
      "Comprehensive manufacturer movement warranty backed by certified master horologists.",
  },
];

const HoraeAssurance = () => {
  return (
    <section className="w-full bg-[#faf9f7] py-14 sm:py-16 lg:py-20 border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-[#9A7B3F] uppercase mb-2">
            The Horae Standard
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Unrivaled Horological Assurance
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 font-light">
            Crafting trust as meticulously as we curate each mechanical masterpiece.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm transition duration-300 hover:shadow-md hover:border-[#9A7B3F]/40"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#9A7B3F]/10 text-[#9A7B3F] mb-4">
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                  {pillar.title}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-gray-500 font-light">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default HoraeAssurance;
