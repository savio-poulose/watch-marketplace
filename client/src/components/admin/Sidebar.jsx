import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaTags,
  FaShoppingBag,
  FaUsers,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

const Sidebar = () => {
  return (
    <aside className="w-64 min-h-screen bg-[#111827] text-white flex flex-col">
      {/* Logo */}
      <div className="h-20 px-7 flex items-center border-b border-gray-700">
        <div>
          <h1 className="text-xl tracking-[0.3em] font-light">OCEANUS</h1>

          <p className="text-[9px] tracking-[0.25em] text-[#9A7B3F] mt-1">
            ADMIN PANEL
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-7">
        <p className="text-[10px] tracking-[0.2em] text-gray-500 px-3 mb-3">
          MAIN MENU
        </p>

        <div className="space-y-1">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-3 text-sm transition ${
                isActive
                  ? "bg-white text-[#111827]"
                  : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <FaTachometerAlt className="text-xs" />
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/product"
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-3 text-sm transition ${
                isActive
                  ? "bg-white text-[#111827]"
                  : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <FaBoxOpen className="text-xs" />
            Products
          </NavLink>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-3 text-sm transition ${
                isActive
                  ? "bg-white text-[#111827]"
                  : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <FaTags className="text-xs" />
            Categories
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-3 text-sm transition ${
                isActive
                  ? "bg-white text-[#111827]"
                  : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <FaShoppingBag className="text-xs" />
            Orders
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-3 text-sm transition ${
                isActive
                  ? "bg-white text-[#111827]"
                  : "text-gray-300 hover:bg-gray-800"
              }`
            }
          >
            <FaUsers className="text-xs" />
            Users
          </NavLink>
        </div>

        <p className="text-[10px] tracking-[0.2em] text-gray-500 px-3 mb-3 mt-10">
          SYSTEM
        </p>

        <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:bg-gray-800 transition text-sm">
          <FaCog className="text-xs" />
          Settings
        </button>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-[#9A7B3F] text-sm">
          <FaSignOutAlt className="text-xs" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
