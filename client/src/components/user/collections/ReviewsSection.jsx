import { FaStar } from "react-icons/fa";
  //dummy reviewss
  const dummyReviews = [
  {
    id: 1,
    name: "Arjun M.",
    rating: 5,
    date: "12 Sep 2026",
    title: "Exceptional craftsmanship",
    comment:
      "The watch looks elegant and feels premium. The finishing and attention to detail are impressive.",
  },
  {
    id: 2,
    name: "Rahul K.",
    rating: 4,
    date: "04 Sep 2026",
    title: "A beautiful timepiece",
    comment:
      "Great design and comfortable to wear. The packaging was also well presented.",
  },
  {
    id: 3,
    name: "Nikhil P.",
    rating: 5,
    date: "28 Aug 2026",
    title: "Worth considering",
    comment:
      "A sophisticated watch with a clean dial and a premium appearance. Happy with the overall design.",
  },
];


const ReviewsSection = () => {
  const averageRating =
    dummyReviews.reduce((total, review) => total + review.rating, 0) /
    dummyReviews.length;

  return (
    <section className="mt-12 border-t border-gray-200 pt-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] text-[#9A7B3F]">
            CUSTOMER FEEDBACK
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            Reviews & Ratings
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Discover what customers think about this timepiece.
          </p>
        </div>

        <div className="border border-gray-200 p-5 sm:min-w-52">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-semibold">
              {averageRating.toFixed(1)}
            </span>

            <div>
              <div className="flex gap-1 text-[#9A7B3F]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={
                      star <= Math.round(averageRating)
                        ? ""
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>

              <p className="mt-1 text-xs text-gray-500">
                {dummyReviews.length} sample reviews
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        Demo content — these are placeholder reviews, not verified customer feedback.
      </div>

      <div className="mt-6 divide-y divide-gray-200 border-y border-gray-200">
        {dummyReviews.map((review) => (
          <article key={review.id} className="py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold">
                  {review.title}
                </h3>

                <div className="mt-2 flex gap-1 text-sm text-[#9A7B3F]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={
                        star <= review.rating
                          ? ""
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
              </div>

              <span className="text-xs text-gray-400">
                {review.date}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              {review.comment}
            </p>

            <p className="mt-4 text-xs font-medium text-[#111827]">
              {review.name}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};


export default ReviewsSection