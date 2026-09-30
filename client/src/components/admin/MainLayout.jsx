import { useState } from "react";
import { FaBars } from "react-icons/fa";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f8f7]">

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Area */}
      <div className="min-h-screen lg:ml-64">

        {/* Mobile Header */}
        <div className="lg:hidden h-14 bg-[#111827] flex items-center px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-white text-lg"
          >
            <FaBars />
          </button>

          <h1 className="ml-4 text-white text-sm tracking-[0.2em]">
            OCEANUS
          </h1>
        </div>

        {/* Topbar */}
        <Topbar />

        {/* Page Content */}
        <main className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  );
};

export default MainLayout;