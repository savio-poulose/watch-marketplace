
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Gem,
  ShieldCheck,
  Award,
} from "lucide-react";

import Header from "../../components/common/Header";
import Hero from "../../components/common/Hero";
import ShopCategory from "../../components/products/ShopCategory";
import Footer from "../../components/common/Footer";

const values = [
  {
    icon: Gem,
    title: "Timeless Design",
    description:
      "Discover timepieces that combine elegant design with lasting appeal, suited to your personal style.",
  },
  {
    icon: ShieldCheck,
    title: "Trust & Transparency",
    description:
      "Enjoy a straightforward shopping experience with clear product details and transparent pricing.",
  },
  {
    icon: Award,
    title: "Quality First",
    description:
      "Explore watches selected for their design, distinctive details, and place in your collection.",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />

      <main>
        {/* Main Hero */}
        <Hero />

        {/* Shop by Category */}
        <section id="categories" className="py-12 md:py-16">
          <ShopCategory />
        </section>

        {/* Brand Story */}
        <section className="overflow-hidden px-6 py-16 md:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-20">
            {/* Watch Image */}
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -bottom-4 -left-4 h-full w-full border border-[#9A7B3F]/50" />

              <img
                src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=85"
                alt="Elegant wristwatch showcasing timeless design"
                loading="lazy"
                className="relative h-[320px] w-full object-cover sm:h-[430px]"
              />
            </div>

            {/* Story Content */}
            <div className="mt-4 md:mt-0">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9A7B3F]">
                The Story of OCEANUS
              </p>

              <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                More than a watch.
                <span className="mt-2 block font-light text-gray-500">
                  A statement of time.
                </span>
              </h2>

              <div className="mt-7 space-y-5 text-sm leading-7 text-gray-600">
                <p>
                  At OCEANUS, we believe a watch is more than an instrument
                  for measuring time. It can express personality, celebrate
                  milestones, and become part of your story.
                </p>

                <p>
                  Our marketplace brings together timepieces for different
                  tastes and occasions, from understated everyday designs
                  to statement pieces for special moments.
                </p>

                <p>
                  Our goal is to make discovering your next watch simple,
                  enjoyable, and informed.
                </p>
              </div>

              <Link
                to="/about"
                className="mt-8 inline-flex items-center gap-3 border-b border-[#9A7B3F] pb-2 text-sm font-semibold transition hover:text-[#9A7B3F]"
              >
                Discover our story
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        {/* Brand Statement */}
        <section className="bg-[#111827] px-6 py-20 text-white md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <Clock
              size={38}
              strokeWidth={1.3}
              className="mx-auto text-[#C5A46D]"
            />

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-[#C5A46D]">
              Our Philosophy
            </p>

            <h2 className="mt-5 text-3xl font-light leading-snug sm:text-5xl">
              Every second deserves to be
              <span className="block font-semibold text-[#C5A46D]">
                exceptional.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-gray-300">
              Find a timepiece that reflects your style, accompanies your
              everyday moments, and marks the occasions that matter.
            </p>
          </div>
        </section>

        {/* Our Values */}
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9A7B3F]">
                What We Stand For
              </p>

              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                The principles behind OCEANUS
              </h2>

              <p className="mt-5 text-sm leading-7 text-gray-500">
                A considered shopping experience starts with the details
                that matter.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {values.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="border border-gray-200 p-7 transition duration-300 hover:-translate-y-1 hover:border-[#9A7B3F]/50 hover:shadow-lg sm:p-9"
                >
                  <div className="flex h-14 w-14 items-center justify-center bg-[#F7F6F2] text-[#9A7B3F]">
                    <Icon size={26} strokeWidth={1.6} />
                  </div>

                  <h3 className="mt-6 text-xl font-semibold">
                    {title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-gray-500">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="bg-[#F7F6F2] px-6 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9A7B3F]">
              Find Your Timepiece
            </p>

            <h2 className="mt-5 text-3xl font-light sm:text-5xl">
              Your next favourite watch
              <span className="mt-2 block font-semibold">
                is waiting for you.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-gray-600">
              Explore our collection and find a timepiece that fits your
              style.
            </p>

            <Link
              to="/collections"
              className="mt-8 inline-flex items-center gap-3 bg-[#111827] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#9A7B3F]"
            >
              Explore watches
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
