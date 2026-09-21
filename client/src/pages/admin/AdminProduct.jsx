import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye } from "react-icons/fa";
import MainLayout from "../../components/admin/MainLayout";

const AdminProduct = () => {
  return (
    <MainLayout>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">

        <div>
          <p className="text-xs tracking-[0.2em] text-[#9A7B3F]">
            CATALOG
          </p>

          <h1 className="text-2xl font-semibold text-[#111827] mt-1">
            Products
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage your watch products and inventory
          </p>
        </div>

        <button
          className="flex items-center gap-2 bg-[#111827] text-white px-5 py-3 text-sm hover:bg-gray-800 transition"
        >
          <FaPlus className="text-xs" />
          Add Product
        </button>

      </div>


      {/* Search + Filters */}
      <div className="bg-white border border-gray-200 p-5 mb-6">

        <div className="flex gap-4">

          {/* Search */}
          <div className="relative flex-1">

            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />

            <input
              type="text"
              placeholder="Search products..."
              className="w-full border border-gray-200 pl-11 pr-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
            />

          </div>


          {/* Category */}
          <select className="border border-gray-200 px-4 py-3 text-sm text-gray-600 outline-none">
            <option>All Categories</option>
            <option>Luxury</option>
            <option>Sports</option>
            <option>Classic</option>
          </select>


          {/* Status */}
          <select className="border border-gray-200 px-4 py-3 text-sm text-gray-600 outline-none">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>

        </div>

      </div>


      {/* Product Table */}
      <div className="bg-white border border-gray-200">

        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">

          <h2 className="text-sm font-semibold text-[#111827]">
            Product List
          </h2>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>
              <tr className="border-b border-gray-200 text-left">

                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  PRODUCT
                </th>

                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  BRAND
                </th>

                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  CATEGORY
                </th>

                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  PRICE
                </th>

                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  STOCK
                </th>

                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  STATUS
                </th>

                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  ACTIONS
                </th>

              </tr>
            </thead>


            <tbody>

              {/* Example product */}
              <tr className="border-b border-gray-100 hover:bg-gray-50">

                <td className="px-6 py-4">

                  <div className="flex items-center gap-4">

                    <img
                      src="https://example.com/watch.jpg"
                      alt="Watch"
                      className="w-12 h-12 object-cover"
                    />

                    <div>
                      <p className="text-sm font-medium text-[#111827]">
                        Seamaster Diver 300M
                      </p>

                      <p className="text-xs text-gray-400">
                        SKU: OCE-001
                      </p>
                    </div>

                  </div>

                </td>


                <td className="px-6 py-4 text-sm text-gray-600">
                  Omega
                </td>


                <td className="px-6 py-4 text-sm text-gray-600">
                  Luxury
                </td>


                <td className="px-6 py-4 text-sm text-gray-700">
                  ₹6,50,000
                </td>


                <td className="px-6 py-4 text-sm text-gray-600">
                  10
                </td>


                <td className="px-6 py-4">

                  <span className="px-3 py-1 text-xs bg-green-50 text-green-700">
                    Active
                  </span>

                </td>


                <td className="px-6 py-4">

                  <div className="flex items-center gap-3">

                    <button className="text-gray-500 hover:text-[#111827]">
                      <FaEye />
                    </button>

                    <button className="text-gray-500 hover:text-[#9A7B3F]">
                      <FaEdit />
                    </button>

                    <button className="text-gray-500 hover:text-red-600">
                      <FaTrash />
                    </button>

                  </div>

                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </MainLayout>
  );
};

export default AdminProduct;