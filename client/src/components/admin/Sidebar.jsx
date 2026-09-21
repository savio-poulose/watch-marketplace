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
          <h1 className="text-xl tracking-[0.3em] font-light">
            OCEANUS
          </h1>

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

          <button className="w-full flex items-center gap-3 px-3 py-3 bg-white text-[#111827] text-sm">
            <FaTachometerAlt className="text-xs" />
            Dashboard
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:bg-gray-800 transition text-sm">
            <FaBoxOpen className="text-xs" />
            Products
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:bg-gray-800 transition text-sm">
            <FaTags className="text-xs" />
            Categories
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:bg-gray-800 transition text-sm">
            <FaShoppingBag className="text-xs" />
            Orders
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:bg-gray-800 transition text-sm">
            <FaUsers className="text-xs" />
            Users
          </button>

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

        <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-300 hover:text-white text-sm">
          <FaSignOutAlt className="text-xs" />
          Logout
        </button>

      </div>

    </aside>
  );
};

export default Sidebar;