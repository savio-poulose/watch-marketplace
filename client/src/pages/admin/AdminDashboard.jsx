import MainLayout from "../../components/admin/MainLayout";

const AdminDashboard = () => {
  return (
    <MainLayout>

      <div>

        {/* Page heading */}
        <div className="mb-8">

          <p className="text-[10px] tracking-[0.25em] text-[#9A7B3F] uppercase">
            Overview
          </p>

          <h1 className="text-2xl font-semibold text-[#111827] mt-1">
            Store Performance
          </h1>

        </div>


        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          <div className="bg-white border border-gray-200 p-6">
            <p className="text-xs text-gray-500">
              Total Users
            </p>

            <h2 className="text-2xl font-semibold text-[#111827] mt-3">
              1,240
            </h2>
          </div>


          <div className="bg-white border border-gray-200 p-6">
            <p className="text-xs text-gray-500">
              Total Products
            </p>

            <h2 className="text-2xl font-semibold text-[#111827] mt-3">
              86
            </h2>
          </div>


          <div className="bg-white border border-gray-200 p-6">
            <p className="text-xs text-gray-500">
              Total Orders
            </p>

            <h2 className="text-2xl font-semibold text-[#111827] mt-3">
              342
            </h2>
          </div>


          <div className="bg-white border border-gray-200 p-6">
            <p className="text-xs text-gray-500">
              Revenue
            </p>

            <h2 className="text-2xl font-semibold text-[#111827] mt-3">
              ₹8.42L
            </h2>
          </div>

        </div>

      </div>

    </MainLayout>
  );
};

export default AdminDashboard;