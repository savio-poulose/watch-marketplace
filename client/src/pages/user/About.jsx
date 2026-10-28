
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Gem,
  ShieldCheck,
  Award,
} from "lucide-react";

import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

const About = () => {
  const values = [
    {
      icon: <Gem size={25} />,
      title: "Timeless Design",
      description:
        "We celebrate watches that combine elegant design with enduring appeal, making every timepiece a lasting part of your collection.",
    },
    {
      icon: <ShieldCheck size={25} />,
      title: "Trust & Transparency",
      description:
        "We believe every purchase should feel confident and straightforward, with clear product information and a reliable shopping experience.",
    },
    {
      icon: <Award size={25} />,
      title: "Quality First",
      description:
        "We focus on craftsmanship, thoughtful details, and helping customers discover watches that suit their individual style.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#111827] px-6 py-24 text-white md:py-36">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border border-[#9A7B3F]/30" />
        <div className="absolute -right-10 -top-14 h-60 w-60 rounded-full border border-[#9A7B3F]/20" />

        <div className="relative mx-auto max-w-7xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.4em] text-[#C5A46D]">
            The Story of OCEANUS
          </p>

          <h1 className="max-w-4xl text-4xl font-light leading-tight sm:text-5xl md:text-7xl">
            More than a watch.
            <span className="mt-2 block font-semibold text-[#C5A46D]">
              A statement of time.
            </span>
          </h1>

          <p className="mt-8 max-w-2xl text-sm leading-8 text-gray-300 md:text-base">
            OCEANUS is a luxury watch marketplace built for people who
            appreciate timeless design, refined details, and the significance
            of every second.
          </p>

          <Link
            to="/collections"
            className="mt-10 inline-flex items-center gap-3 bg-[#C5A46D] px-7 py-4 text-sm font-semibold text-[#111827] transition hover:bg-white"
          >
            Explore our collection
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Brand Story */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-20">
          <div className="relative">
            <div className="absolute -bottom-4 -left-4 h-full w-full border border-[#9A7B3F]/40" />

            <img
              src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=85"
              alt="Elegant wristwatch representing timeless design"
              className="relative h-[350px] w-full object-cover sm:h-[450px]"
              loading="lazy"
            />
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#9A7B3F]">
              Our Philosophy
            </p>

            <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Time moves forward.
              <span className="block font-light text-gray-500">
                Style stays timeless.
              </span>
            </h2>

            <div className="mt-7 space-y-5 text-sm leading-8 text-gray-600">
              <p>
                At OCEANUS, we believe a watch is more than an instrument for
                measuring time. It can express personality, mark an important
                milestone, and become part of someone's story.
              </p>

              <p>
                Our marketplace brings together timepieces for different
                tastes and occasions, from understated everyday designs to
                statement pieces for special moments.
              </p>

              <p>
                Our goal is to make discovering your next watch simple,
                enjoyable, and informed, with a shopping experience that
                reflects the elegance of the products themselves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Statement */}
      <section className="bg-[#F7F6F2] px-6 py-20 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Clock
            size={36}
            strokeWidth={1.3}
            className="mx-auto text-[#9A7B3F]"
          />

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-[#9A7B3F]">
            What OCEANUS Stands For
          </p>

          <h2 className="mt-5 text-3xl font-light leading-snug sm:text-5xl">
            Every second deserves to be
            <span className="font-semibold"> exceptional.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-gray-600">
            We want every customer to find a timepiece that feels right for
            them, whether it is a personal purchase, a thoughtful gift, or a
            watch to mark a defining moment.
          </p>
        </div>
      </section>

      {/* Our Values */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9A7B3F]">
              Our Values
            </p>

            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              The principles behind OCEANUS
            </h2>

            <p className="mt-5 text-sm leading-7 text-gray-500">
              A considered shopping experience starts with the principles
              behind it.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="border border-gray-200 p-8 transition duration-300 hover:-translate-y-1 hover:border-[#9A7B3F]/60 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center bg-[#F7F6F2] text-[#9A7B3F]">
                  {value.icon}
                </div>

                <h3 className="mt-6 text-xl font-semibold">
                  {value.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-gray-500">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-[#111827] px-6 py-20 text-center text-white md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#C5A46D]">
            Find Your Timepiece
          </p>

          <h2 className="mt-5 text-3xl font-light leading-tight sm:text-5xl">
            Your next chapter starts
            <span className="block font-semibold text-[#C5A46D]">
              one second at a time.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-gray-300">
            Explore watches that complement your style and the moments that
            matter to you.
          </p>

          <Link
            to="/collections"
            className="mt-9 inline-flex items-center gap-3 bg-[#C5A46D] px-7 py-4 text-sm font-semibold text-[#111827] transition hover:bg-white"
          >
            Shop watches
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
