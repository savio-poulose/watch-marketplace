import logo from "../../assets/images/logo.png";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/useAuth";
import toast from "react-hot-toast";

import {
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineMagnifyingGlass,
  HiOutlineBars3,
  HiXMark,
} from "react-icons/hi2";

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleProtectedAction = (path, message = "Please log in to continue") => {
    if (!user) {
      toast.error(message);
      navigate("/user/login");
      return;
    }
    navigate(path);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to search products");
      navigate("/user/login");
      return;
    }
    if (searchTerm.trim()) {
      navigate(`/user/collections?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `h-full flex items-center transition-colors cursor-pointer ${
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
          <Link to={user ? "/user/dashboard" : "/"}>
            <img
              src={logo}
              alt="Logo"
              className="h-16 cursor-pointer"
            />
          </Link>
        </div>

        {/* SEARCH */}
        <form onSubmit={handleSearch} className="hidden max-w-xl flex-1 md:flex">
          <div className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for watches, collections, smart watches..."
              className="h-10 w-full rounded border border-slate-300 pl-4 pr-10 text-sm outline-none focus:border-gray-400"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              title="Search"
            >
              <HiOutlineMagnifyingGlass className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* RIGHT SIDE */}
        <div className="z-0 hidden items-center gap-6 text-gray-700 md:flex">
          {/* WISHLIST */}
          <button
            type="button"
            onClick={() =>
              handleProtectedAction(
                "/user/wishlist",
                "Please log in to view your wishlist"
              )
            }
            className="relative cursor-pointer text-center text-gray-700 transition hover:text-[#9A7B3F]"
            title="Wishlist"
          >
            <HiOutlineHeart className="h-5 w-5" />
          </button>

          {/* CART */}
          <button
            type="button"
            onClick={() =>
              handleProtectedAction(
                "/user/cart",
                "Please log in to view your cart"
              )
            }
            className="relative cursor-pointer text-center text-gray-700 transition hover:text-[#9A7B3F]"
            title="Cart"
          >
            <HiOutlineShoppingBag className="h-5 w-5" />
          </button>

          {/* USER / LOGIN */}
          {user ? (
            <Link
              to="/user/profile"
              className="flex items-center gap-2 cursor-pointer text-gray-700 transition hover:text-[#9A7B3F]"
              title="Profile"
            >
              <HiOutlineUser className="h-5 w-5" />
              <span className="text-xs font-medium max-w-[100px] truncate">
                {user.name?.split(" ")[0] || "Account"}
              </span>
            </Link>
          ) : (
            <Link
              to="/user/login"
              className="flex items-center gap-1.5 rounded-full border border-[#9A7B3F] px-4 py-1.5 text-xs font-semibold tracking-wider text-[#9A7B3F] transition hover:bg-[#9A7B3F] hover:text-white"
            >
              <HiOutlineUser className="h-4 w-4" />
              <span>LOGIN</span>
            </Link>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-2xl text-gray-700 md:hidden cursor-pointer"
        >
          {mobileMenuOpen ? (
            <HiXMark className="h-6 w-6" />
          ) : (
            <HiOutlineBars3 className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* CATEGORY NAVIGATION (DESKTOP) */}
      <div className="hidden h-12 items-center justify-center gap-8 text-sm font-medium md:flex">
        {/* HOME */}
        <NavLink
          to={user ? "/user/dashboard" : "/"}
          className={navLinkClass}
        >
          HOME
        </NavLink>

        {/* COLLECTIONS */}
        <button
          type="button"
          onClick={() =>
            handleProtectedAction(
              "/user/collections",
              "Please log in to browse collections"
            )
          }
          className="h-full flex items-center transition-colors text-gray-700 hover:text-gray-500 cursor-pointer"
        >
          COLLECTIONS
        </button>

        

        

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
        <button
          type="button"
          onClick={() =>
            handleProtectedAction(
              "/user/orders",
              "Please log in to view your orders"
            )
          }
          className="h-full flex items-center transition-colors text-gray-700 hover:text-gray-500 cursor-pointer"
        >
          MY ORDERS
        </button>

        {/* OFFERS */}
        <button
          type="button"
          onClick={() =>
            handleProtectedAction(
              "/user/offers",
              "Please log in to view exclusive offers"
            )
          }
          className="h-full flex items-center transition-colors text-[#9A7B3F] hover:text-[#7d6332] cursor-pointer"
        >
          OFFERS
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-5 py-4 shadow-lg md:hidden">
          <form onSubmit={(e) => { setMobileMenuOpen(false); handleSearch(e); }} className="mb-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search watches..."
                className="h-10 w-full rounded border border-slate-300 pl-4 pr-10 text-sm outline-none"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <HiOutlineMagnifyingGlass className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-3 text-sm font-medium text-gray-700">
            <Link
              to={user ? "/user/dashboard" : "/"}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#9A7B3F]"
            >
              HOME
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleProtectedAction("/user/collections", "Please log in to browse collections");
              }}
              className="text-left py-1 hover:text-[#9A7B3F]"
            >
              COLLECTIONS
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleProtectedAction("/user/collections?category=MEN'S", "Please log in to view men's collection");
              }}
              className="text-left py-1 hover:text-[#9A7B3F]"
            >
              MEN
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleProtectedAction("/user/collections?category=WOMEN'S", "Please log in to view women's collection");
              }}
              className="text-left py-1 hover:text-[#9A7B3F]"
            >
              WOMEN
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleProtectedAction("/user/orders", "Please log in to view your orders");
              }}
              className="text-left py-1 hover:text-[#9A7B3F]"
            >
              MY ORDERS
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleProtectedAction("/user/offers", "Please log in to view exclusive offers");
              }}
              className="text-left py-1 text-[#9A7B3F]"
            >
              OFFERS
            </button>

            <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleProtectedAction("/user/wishlist", "Please log in to view your wishlist");
                }}
                className="flex items-center gap-1.5 py-1 text-gray-700 hover:text-[#9A7B3F]"
              >
                <HiOutlineHeart className="h-5 w-5" />
                <span>Wishlist</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleProtectedAction("/user/cart", "Please log in to view your cart");
                }}
                className="flex items-center gap-1.5 py-1 text-gray-700 hover:text-[#9A7B3F]"
              >
                <HiOutlineShoppingBag className="h-5 w-5" />
                <span>Cart</span>
              </button>
              {user ? (
                <Link
                  to="/user/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 py-1 text-gray-700 hover:text-[#9A7B3F]"
                >
                  <HiOutlineUser className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
              ) : (
                <Link
                  to="/user/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full border border-[#9A7B3F] px-3 py-1 text-xs font-semibold text-[#9A7B3F]"
                >
                  LOGIN
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;