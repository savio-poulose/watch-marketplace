
import { useState } from "react";
import { Mail, Phone, MapPin, Clock, ArrowRight } from "lucide-react";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus("");

    // UI-only submission. Connect this to a backend API
    // before using it to send real customer messages.
    setStatus(
      "Your message is ready. Contact form submission is not connected to the server yet."
    );
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />

      {/* Hero */}
      <section className="bg-[#111827] px-6 py-20 text-white md:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-[#C5A46D]">
            We're here to help
          </p>

          <h1 className="max-w-3xl text-4xl font-light leading-tight sm:text-5xl md:text-7xl">
            Let's start a
            <span className="block font-semibold text-[#C5A46D]">
              conversation.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-7 text-gray-300 md:text-base">
            Have a question about our timepieces, your order, or finding the
            perfect watch? Our team is here to assist you.
          </p>
        </div>
      </section>

      {/* Contact section */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:gap-24">
          {/* Contact information */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#9A7B3F]">
              Contact HORAE
            </p>

            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              How can we help you?
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-gray-500">
              Whether you need assistance with an order or advice on choosing
              a timepiece, get in touch with us.
            </p>

            <div className="mt-10 space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-gray-100">
                  <Mail size={20} className="text-[#9A7B3F]" />
                </div>

                <div>
                  <h3 className="font-semibold">Email us</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    For product and order enquiries
                  </p>
                  <a
                    href="mailto:support@horae.com"
                    className="mt-2 inline-block text-sm font-medium hover:text-[#9A7B3F]"
                  >
                    support@horae.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-gray-100">
                  <Phone size={20} className="text-[#9A7B3F]" />
                </div>

                <div>
                  <h3 className="font-semibold">Call us</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Speak with our support team
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    Add your official support number
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-gray-100">
                  <Clock size={20} className="text-[#9A7B3F]" />
                </div>

                <div>
                  <h3 className="font-semibold">Support hours</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Monday – Saturday
                    <br />
                    9:00 AM – 6:00 PM IST
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-gray-100">
                  <MapPin size={20} className="text-[#9A7B3F]" />
                </div>

                <div>
                  <h3 className="font-semibold">Our location</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Online luxury watch marketplace
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="border border-gray-200 p-6 sm:p-9">
            <h2 className="text-2xl font-semibold">Send us a message</h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Fill in the details below and tell us how we can help.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium"
                >
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className="w-full border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#9A7B3F]"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className="w-full border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#9A7B3F]"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium"
                >
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                >
                  <option value="" disabled>
                    Select a subject
                  </option>
                  <option value="product">Product enquiry</option>
                  <option value="order">Order-related issue</option>
                  <option value="payment">Payment issue</option>
                  <option value="return">Return or cancellation</option>
                  <option value="other">Other enquiry</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium"
                >
                  Your message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we assist you?"
                  rows={5}
                  required
                  maxLength={3000}
                  className="w-full resize-y border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#9A7B3F]"
                />
              </div>

              {status && (
                <p role="status" className="text-sm text-amber-700">
                  {status}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 bg-[#111827] px-6 py-4 text-sm font-medium text-white transition hover:bg-[#9A7B3F] disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Send message"}
                <ArrowRight size={18} />
              </button>

              <p className="text-xs leading-5 text-gray-400">
                This form is currently a frontend-only demonstration. Your
                message will not be sent until a backend endpoint is connected.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Closing banner */}
      <section className="bg-gray-50 px-6 py-14 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9A7B3F]">
          HORAE
        </p>
        <h2 className="mt-4 text-2xl font-light sm:text-3xl">
          Every second deserves to be exceptional.
        </h2>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
