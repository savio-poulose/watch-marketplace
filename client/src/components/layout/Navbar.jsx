import logo from "../../assets/images/logo.png";
import { Link, NavLink } from "react-router-dom";

import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineHeart,
} from "react-icons/hi2";

const Navbar = () => {
  const navLinkClass = ({ isActive }) =>
    `h-full flex items-center transition-colors ${
      isActive
        ? "border-b-2 border-gray-800 text-gray-900"
        : "text-gray-700 hover:text-gray-500"
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-300 bg-white">

      {/* TOP NAVBAR */}
      <div className="flex h-16 items-center justify-between gap-5 border-b border-slate-300 bg-white px-5 shadow-md md:px-8">

        {/* LOGO */}
        <div>
          <Link to="/user/dashboard">
            <img
              src={logo}
              alt="Logo"
              className="h-16 cursor-pointer"
            />
          </Link>
        </div>

        {/* SEARCH */}
        <div className="hidden max-w-xl flex-1 md:flex">
          <input
            type="text"
            placeholder="Search for watches, collections, smart watches..."
            className="h-10 w-full rounded border border-slate-300 px-4 text-sm outline-none focus:border-gray-400"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="z-0 hidden items-center gap-6 text-gray-700 md:flex">

          {/* WISHLIST */}
          <div className="relative cursor-pointer text-center">
            <Link to="/wishlist">
              <HiOutlineHeart className="h-5 w-5" />
            </Link>
          </div>

          {/* ACCOUNT */}
          <div className="cursor-pointer text-center">
            <Link to="/user/profile">
              <HiOutlineUser className="h-5 w-5" />
            </Link>
          </div>

          {/* CART */}
          <div className="relative cursor-pointer text-center">
            <Link to="/cart">
              <HiOutlineShoppingBag className="h-5 w-5" />
            </Link>
          </div>

        </div>

        {/* MOBILE MENU BUTTON */}
        <button className="text-2xl md:hidden">
          ☰
        </button>
      </div>

      {/* CATEGORY NAVIGATION */}
      <div className="hidden h-12 items-center justify-center gap-8 text-sm font-medium md:flex">

        {/* HOME */}
        <NavLink
          to="/user/dashboard"
          className={navLinkClass}
        >
          HOME
        </NavLink>

        {/* COLLECTIONS */}
        <NavLink
          to="/user/collections"
          className={navLinkClass}
        >
          COLLECTIONS
        </NavLink>

        {/* MEN */}
        <NavLink
          to="/user/men"
          className={navLinkClass}
        >
          MEN
        </NavLink>

        {/* WOMEN */}
        <NavLink
          to="/user/women"
          className={navLinkClass}
        >
          WOMEN
        </NavLink>

        {/* CONTACT */}
        <NavLink
          to="/user/contact"
          className={navLinkClass}
        >
          CONTACT
        </NavLink>

        {/* ABOUT */}
        <NavLink
          to="/user/about"
          className={navLinkClass}
        >
          ABOUT
        </NavLink>

        {/* MY ORDERS */}
        <NavLink
          to="/user/orders"
          className={navLinkClass}
        >
          MY ORDERS
        </NavLink>

        {/* OFFERS */}
        <NavLink
          to="/user/offers"
          className={({ isActive }) =>
            `h-full flex items-center transition-colors ${
              isActive
                ? "border-b-2 border-[#9A7B3F] text-[#9A7B3F]"
                : "text-[#9A7B3F] hover:text-[#7d6332]"
            }`
          }
        >
          OFFERS
        </NavLink>

      </div>
    </nav>
  );
};

export default Navbar;