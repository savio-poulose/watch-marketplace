import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f8f8f7] flex">

      {/* Sidebar */}
      <Sidebar />

      {/* Right side */}
      <div className="flex-1 flex flex-col">

        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 p-8">
          {children}
        </main>

      </div>

    </div>
  );
};

export default MainLayout;