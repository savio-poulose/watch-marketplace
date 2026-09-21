import { useEffect, useState } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";

import MainLayout from "../../components/admin/MainLayout";

const AdminCategory = () => {
  const [showForm, setShowForm] = useState(false);
  const [categoryList,setCategoryList] = useState([]);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    console.log(formData);
    const data = Object.fromEntries(formData);
    // console.log(data);

    try {

        const token = localStorage.getItem("adminToken");
// console.log("TOKEN:", token); 
      const response = await axios.post(
        "http://localhost:3000/api/admin/category",
        data,
        {
            headers:{
                Authorization: `Bearer ${token}`
            }
        }
      );
      
      event.target.reset(); // clears all form fields
setShowForm(false);
        alert(response.data)
        console.log(response.data)

    } catch (err) {
      console.log(err);

      if (err.response) {
        alert(err.response.data.message);
      } else {
        alert("something went wrong");
      }
    }
  }


 useEffect(() => {
  async function fetchCategories() {
    try {

        const token = localStorage.getItem("adminToken");

      const response = await axios.get(
        "http://localhost:3000/api/admin/category",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response.data.categories);
      setCategoryList(response.data.categories)
    } catch (err) {
      console.log(err.message);
    }
  }

  fetchCategories();
}, []);


  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#9A7B3F]">CATALOG</p>

          <h1 className="text-2xl font-semibold text-[#111827] mt-1">
            Categories
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage product categories
          </p>
        </div>

        <button
          onClick={() => {
            // console.log("ADD CATEGORY CLICKED");
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-[#111827] text-white px-5 py-3 text-sm hover:bg-gray-800 transition"
        >
          <FaPlus className="text-xs" />
          Add Category
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-[#111827] mb-6">
            Add Category
          </h2>

          <div className="grid grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Category Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter category name"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Image URL
              </label>

              <input
                type="text"
                name="image"
                placeholder="Enter image URL"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-2">
                Description
              </label>

              <textarea
                name="description"
                rows="4"
                placeholder="Enter category description"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-3 text-sm border border-gray-200 text-gray-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-3 text-sm bg-[#111827] text-white"
            >
              Add Category
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="bg-white border border-gray-200 p-5 mb-6">
        <div className="relative max-w-md">
          <FaSearch
            className="absolute left-4 top-1/2
            -translate-y-1/2 text-gray-400 text-sm"
          />

          <input
            type="text"
            placeholder="Search categories..."
            className="w-full border border-gray-200
            pl-11 pr-4 py-3 text-sm
            outline-none
            focus:border-[#9A7B3F]"
          />
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white border border-gray-200">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-[#111827]">
            Category List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  IMAGE
                </th>

                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  NAME
                </th>

                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  DESCRIPTION
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
  {categoryList.map((category) => (
    <tr
      key={category._id}
      className="border-b border-gray-100 hover:bg-gray-50"
    >
      {/* Image */}
      <td className="px-6 py-4">
        <img
          src={category.image}
          alt={category.name}
          className="w-12 h-12 object-cover"
        />
      </td>

      {/* Name */}
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-[#111827]">
          {category.name}
        </p>
      </td>

      {/* Description */}
      <td className="px-6 py-4">
        <p className="text-sm text-gray-500 max-w-md">
          {category.description}
        </p>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span
          className={`px-3 py-1 text-xs ${
            category.isActive
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {category.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            className="text-gray-500 hover:text-[#9A7B3F]"
          >
            <FaEdit />
          </button>

          <button
            className="text-gray-500 hover:text-red-600"
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
            
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminCategory;
