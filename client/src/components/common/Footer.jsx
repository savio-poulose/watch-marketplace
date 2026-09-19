const footerLinks = {
  "Customer Service": [
    "Payment Options",
    "Track Order",
    "Returns & Exchange",
    "Shipping & Delivery",
  ],
  "About Horae": [
    "Our Brand Story",
    "Careers",
    "Sustainability",
    "Contact Us",
  ],
  Collections: [
    "Men's Watches",
    "Women's Watches",
    "Automatic",
    "Smart Watches",
  ],
};

const Footer = () => {
  return (
    <footer className="w-full bg-[#111827] text-gray-400">

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
                {title}
              </h3>

              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[10px] transition hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">
              Need Assistance?
            </h3>

            <p className="text-[10px] leading-5">
              Mon - Sat: 10 AM - 7 PM
            </p>

            <p className="text-[10px] leading-5">
              support@horae.com
            </p>

            {/* Social */}
            <div className="mt-4 flex gap-2">
              <a
                href="#"
                className="flex h-7 w-7 items-center justify-center rounded bg-[#1f2937] text-[9px] text-white transition hover:bg-white hover:text-[#111827]"
              >
                f
              </a>

              <a
                href="#"
                className="flex h-7 w-7 items-center justify-center rounded bg-[#1f2937] text-[9px] text-white transition hover:bg-white hover:text-[#111827]"
              >
                ig
              </a>

              <a
                href="#"
                className="flex h-7 w-7 items-center justify-center rounded bg-[#1f2937] text-[9px] text-white transition hover:bg-white hover:text-[#111827]"
              >
                yt
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-700/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-[9px] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">

          <p>
            © 2026 HORAE. All rights reserved.
          </p>

          <p>
            VISA&nbsp;&nbsp; · &nbsp;&nbsp;MASTERCARD&nbsp;&nbsp; · &nbsp;&nbsp;UPI
          </p>

        </div>
      </div>

    </footer>
  );
};

export default Footer;