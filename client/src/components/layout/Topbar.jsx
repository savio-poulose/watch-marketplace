import { FaTruck } from "react-icons/fa";

const Topbar = () => {
  return (
    <div className="h-6 bg-[#111827] text-gray-300">
      <div className="container mx-auto h-full flex items-center justify-center text-[10px] tracking-wider px-2 sm:px-4">

        {/* LEFT */}
        <div className="hidden sm:flex items-center  whitespace-nowrap animate-marquee">
          <FaTruck className="w-3 h-3 mr-2 shrink-0" />
          COMPLIMENTARY EXPRESS DELIVERY & 7-DAY HASSLE-FREE RETURNS
        </div>

      

       

      </div>
    </div>
  );
};

export default Topbar;