import { HiStar } from "react-icons/hi2";

const reviews = [
  {
    id: 1,
    quote:
      "The finishing on the Horae ChronoMaster is astonishing. The ceramic bezel and sweep of the automatic seconds hand rival timepieces thrice the price. Exquisite presentation box as well.",
    author: "Vikramaditya S.",
    location: "Mumbai · Verified Collector",
    model: "Purchased Horae ChronoMaster Steel",
  },
  {
    id: 2,
    quote:
      "Unmatched customer attention. Delivery arrived in a tamper-evident insured lockbox with full certification papers. The dial symmetry on the Calibre X is pure horological poetry.",
    author: "Dr. Ananya Mukherjee",
    location: "Bangalore · Horology Enthusiast",
    model: "Purchased Horae Calibre X Skeleton",
  },
  {
    id: 3,
    quote:
      "From seamless order verification to the flawless 300m waterproof testing documentation, Horae has set the gold benchmark for luxury timepiece acquisition in India.",
    author: "Rajesh K. Varma",
    location: "New Delhi · Vintage Collector",
    model: "Purchased Horae Submariner Deep Sea",
  },
];

const Testimonials = () => {
  return (
    <section className="w-full bg-white py-16 sm:py-20 lg:py-24 border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] text-[#9A7B3F] uppercase mb-2">
            Collector Endorsements
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Voices of Discerning Patrons
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 font-light">
            Trusted by horologists, collectors, and connoisseurs nationwide.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-[#fafafa] p-6 sm:p-7 shadow-sm transition duration-300 hover:shadow-md hover:border-[#9A7B3F]/40"
            >
              <div>
                {/* 5 Stars */}
                <div className="flex items-center gap-1 text-[#9A7B3F] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <HiStar key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-xs sm:text-sm leading-relaxed text-gray-700 italic font-light">
                  "{review.quote}"
                </p>
              </div>

              {/* Author Info */}
              <div className="mt-6 border-t border-gray-200/80 pt-4">
                <p className="text-xs font-bold text-gray-900">
                  {review.author}
                </p>
                <p className="text-[10px] text-[#8a6d35] font-medium mt-0.5">
                  {review.location}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {review.model}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
