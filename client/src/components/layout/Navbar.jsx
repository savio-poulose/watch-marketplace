import logo from "../../assets/images/logo.png"
import {Link} from "react-router-dom"
import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineHeart
} from "react-icons/hi2"

// import {FaRegHeart} from "react-icons/fa"

const Navbar = () => {
  return (
    <nav className="w-full bg-white border-b border-slate-300 sticky top-0 ">

      {/* TOP NAVBAR */}
      <div className="h-16 px-5 md:px-8 flex items-center justify-between gap-5 border-b border-slate-300 bg-white shadow-md z-50">

        {/* LOGO */}
        <div >
          <Link to="/">
          <img src={logo} alt="" className="h-16 cursor-pointer "/>
          </Link>
        </div>

        {/* SEARCH */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Search for watches, collections, smart watches..."
            className="w-full h-10 border border-slate-300 rounded px-4 text-sm outline-none focus:border-gray-400"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="hidden md:flex items-center gap-6 text-gray-700 z-0">

          

          {/* WISHLIST */}
          <div className="text-center cursor-pointer relative">
           <Link to="/wishlist">
           <HiOutlineHeart className="w-5 h-5"/>
           </Link>
          </div>

          {/* ACCOUNT */}
          <div className="text-center cursor-pointer">
            <Link to="/user/profile">
            <HiOutlineUser className="h-5 w-5"/>
            </Link>
          </div>

          {/* CART */}
          <div className="text-center cursor-pointer relative">
            <Link to="/cart">
            <HiOutlineShoppingBag className="h-5 w-5"/>
            </Link>
          </div>

        </div>

        {/* MOBILE MENU BUTTON */}
        <button className="md:hidden text-2xl">
          ☰
        </button>

      </div>

      {/* CATEGORY NAVIGATION */}
      <div className="hidden md:flex h-12   items-center justify-center gap-8 text-sm font-medium ">

        <a href="#" className="border-b-2 border-gray-800 h-full flex items-center">
          HOME
        </a>

        <a href="#" className="hover:text-gray-500">
          COLLECTIONS
        </a>

        <a href="#" className="hover:text-gray-500">
          MEN
        </a>

        <a href="#" className="hover:text-gray-500">
          WOMEN
        </a>

        <a href="#" className="hover:text-gray-500">
          CONTACT
        </a>

        

        

        <a href="#" className="hover:text-gray-500">
          ABOUT
        </a>

         <a href="#" className="hover:text-gray-500">
          MY ORDERS
        </a>

        <a href="#" className="text-[#9A7B3F]">
          OFFERS
        </a>

      </div>

    </nav>
  );
};

export default Navbar;