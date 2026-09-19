import mens from "../../assets/images/category/mens.jpg";
import womens from "../../assets/images/category/womens.jpg";
import smart from "../../assets/images/category/smart.jpg";
import automatic from "../../assets/images/category/automatic.jpg";
import heritage from "../../assets/images/category/heritage.jpg";

const categories = [
  {
    title: "MEN'S",
    subtitle: "Chronographs & Steel",
    image: mens,
  },
  {
    title: "WOMEN'S",
    subtitle: "Elegance & Pearl",
    image: womens,
  },
  {
    title: "SMART",
    subtitle: "Tech & Precision",
    image: smart,
  },
  {
    title: "AUTOMATIC",
    subtitle: "Mechanical Movement",
    image: automatic,
  },
  {
    title: "PREMIUM HERITAGE",
    subtitle: "Limited Editions",
    image: heritage,
  },
];

const ShopCategory = () => {
  return (
    <section className="w-full bg-white px-4 py-12 sm:px-6 sm:py-14 md:px-8 md:py-16 lg:px-10 lg:py-20">

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="mb-2 text-[9px] font-semibold tracking-[0.2em] text-[#9a7b3f] sm:text-[10px] md:text-[11px]">
            EXPLORE BY CATEGORY
          </p>

          <h2 className="text-xl font-bold tracking-tight text-[#111827] sm:text-2xl">
            SHOP CATEGORIES
          </h2>
        </div>

        <button className="flex w-fit cursor-pointer items-center gap-1 text-[9px] font-semibold tracking-wide text-[#8a6d35] transition hover:text-[#111827] sm:mb-1 sm:text-[10px] md:text-[11px]">
          VIEW ALL CATEGORIES
          <span className="text-sm sm:text-base">→</span>
        </button>

      </div>

      {/* Categories */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:gap-4 md:grid-cols-3 lg:mt-8 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">

        {categories.map((category) => (
          <div
            key={category.title}
            className="group flex min-w-0 cursor-pointer flex-col items-center rounded-md border border-gray-200 bg-[#fafafa] px-2 py-4 transition duration-300 hover:-translate-y-1 hover:shadow-md sm:px-3 md:px-4"
          >

            {/* Image */}
            <div className="flex h-[85px] w-[85px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-gray-100 shadow-[0_1px_6px_rgba(0,0,0,0.12)] sm:h-[100px] sm:w-[100px] sm:border-[6px] md:h-[112px] md:w-[112px] md:border-[7px]">

              <img
                src={category.image}
                alt={category.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />

            </div>

            {/* Text */}
            <div className="mt-4 w-full text-center sm:mt-5">

              <h3 className="truncate text-[9px] font-bold tracking-[0.06em] text-[#111827] sm:text-[10px] sm:tracking-[0.08em]">
                {category.title}
              </h3>

              <p className="mt-1 truncate text-[8px] text-gray-400 sm:text-[9px]">
                {category.subtitle}
              </p>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
};

export default ShopCategory;