import { useState } from "react";
import toast from "react-hot-toast";
import { HiOutlineEnvelope, HiOutlineSparkles } from "react-icons/hi2";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("Welcome to the Horae Private Circle. Invitation sent!");
    setEmail("");
  };

  return (
    <section className="w-full bg-[#111827] py-16 sm:py-20 text-white relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-radial-at-c from-[#1a2333]/40 via-transparent to-transparent pointer-events-none" />

      <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center relative z-10">
        
        <div className="inline-flex items-center gap-2 rounded-full border border-[#9A7B3F]/40 bg-[#9A7B3F]/10 px-3.5 py-1 text-[10px] font-semibold tracking-widest text-[#9A7B3F] uppercase mb-4">
          <HiOutlineSparkles className="w-3.5 h-3.5" />
          <span>Private Collector Circle</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
          Privilege Has Its Privileges
        </h2>

        <p className="mt-3 text-xs sm:text-sm text-gray-400 max-w-xl mx-auto font-light leading-relaxed">
          Subscribe for confidential invitations to private exhibitions, new allocation drops, and curated horological insights.
        </p>

        {/* Subscription Form */}
        <form onSubmit={handleSubmit} className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your private email..."
              className="w-full h-12 rounded-sm border border-gray-700 bg-gray-900/90 pl-11 pr-4 text-xs text-white placeholder-gray-500 outline-none focus:border-[#9A7B3F] transition"
            />
            <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>

          <button
            type="submit"
            className="h-12 cursor-pointer rounded-sm bg-[#9A7B3F] px-6 text-xs font-bold uppercase tracking-widest text-black transition duration-300 hover:bg-[#b08e4c] hover:shadow-[0_0_20px_rgba(154,123,63,0.4)] shrink-0"
          >
            Request Access
          </button>
        </form>

        <p className="mt-4 text-[10px] text-gray-500 font-light">
          Strict confidentiality respected. You may withdraw membership at any time.
        </p>

      </div>
    </section>
  );
};

export default Newsletter;
