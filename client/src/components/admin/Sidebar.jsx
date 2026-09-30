import { useNavigate, NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaTags,
  FaShoppingBag,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after clicking a link
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50
          h-screen w-64
          bg-[#111827] text-white
          flex flex-col
          transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Logo */}
        <div className="h-20 px-7 flex items-center justify-between border-b border-gray-700 shrink-0">
          <div>
            <h1 className="text-xl tracking-[0.3em] font-light">
              OCEANUS
            </h1>

            <p className="text-[9px] tracking-[0.25em] text-[#9A7B3F] mt-1">
              ADMIN PANEL
            </p>
          </div>

          {/* Close button - mobile only */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white lg:hidden"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-7 overflow-y-auto">
          <p className="text-[10px] tracking-[0.2em] text-gray-500 px-3 mb-3">
            MAIN MENU
          </p>

          <div className="space-y-1">
            <NavLink
              to="/admin/dashboard"
              onClick={handleNavClick}
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
              onClick={handleNavClick}
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
              onClick={handleNavClick}
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
              onClick={handleNavClick}
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
              onClick={handleNavClick}
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

          {/* System */}
          <p className="text-[10px] tracking-[0.2em] text-gray-500 px-3 mb-3 mt-10">
            SYSTEM
          </p>

          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:bg-gray-800 transition text-sm"
          >
            <FaCog className="text-xs" />
            Settings
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-[#9A7B3F] text-sm"
          >
            <FaSignOutAlt className="text-xs" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;