import { FaPlus, FaSearch, FaEdit, FaTrash, FaEye } from "react-icons/fa";

import MainLayout from "../../components/admin/MainLayout";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";

const AdminProduct = () => {
  const [showForm, setShowForm] = useState(false);

  const [variants, setVariants] = useState([
    {
      size: "",
      material: "",
      color: "",
      price: "",
      quantity: "",
    },
  ]);
  const [categoryList, setCategoryList] = useState([]);
  const [images, setImages] = useState([]);
  const [products, setProducts] = useState([]);
  

  useEffect(() => {
    async function fetchCategory() {
      try {
        const token = localStorage.getItem("adminToken");

        const response = await axios.get(
          "http://localhost:3000/api/admin/category",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // console.log(response.data)
        setCategoryList(response.data.categories);
        // console.log(categoryList)
      } catch (err) {
        console.log(err.message);
        alert(err.message);
      }
    }
    fetchCategory();
  }, []);

  useEffect(() => {
    // console.log(categoryList);
  }, [categoryList]);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    // console.log(formData);

    formData.append("variants", JSON.stringify(variants));
    // console.log("Images:", formData.getAll("images"));

    // const data = Object.fromEntries(formData);
    // console.log("product :" , data);
    // console.log("Variants:", variants);

    try {
      const token = localStorage.getItem("adminToken");

      const response = await axios.post(
        "http://localhost:3000/api/admin/product",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // console.log(response.data)
      alert(response.data.message);
      event.target.reset();

      // Clear variants
      setVariants([
        {
          size: "",
          material: "",
          color: "",
          price: "",
          quantity: "",
        },
      ]);

      // Clear images
      setImages([]);
    } catch (err) {
      alert(err.message);
    }
  }

  useEffect(() => {
    async function getAllProduct() {
      try {
        const token = localStorage.getItem("adminToken");

        const response = await axios.get(
          "http://localhost:3000/api/admin/product",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setProducts(response.data.response);
      } catch (err) {
        console.log(err.message);
      }
    }
    getAllProduct();
  }, []);

  useEffect(() => {
    console.log(products);
  }, [products]);

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#9A7B3F]">CATALOG</p>

          <h1 className="text-2xl font-semibold text-[#111827] mt-1">
            Products
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage your watch products and inventory
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#111827] text-white px-5 py-3 text-sm hover:bg-gray-800 transition"
        >
          <FaPlus className="text-xs" />
          Add Product
        </button>
      </div>

      {/* Add Product Form */}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 p-6 mb-6"
        >
          <h2 className="text-lg cursor pointer font-semibold text-[#111827] mb-6">
            Add Product
          </h2>

          {/* Product Information */}

          <div className="grid grid-cols-2 gap-5">
            {/* Product Name */}

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Product Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter product name"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              />
            </div>

            {/* Brand */}

            <div>
              <label className="block text-sm text-gray-600 mb-2">Brand</label>

              <input
                type="text"
                name="brand"
                placeholder="Enter brand"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              />
            </div>

            {/* Gender */}

            <div>
              <label className="block text-sm text-gray-600 mb-2">Gender</label>

              <select
                name="gender"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              >
                <option value="">Select gender</option>

                <option value="Men">Men</option>

                <option value="Women">Women</option>

                <option value="Unisex">Unisex</option>
              </select>
            </div>

            {/* Category */}

            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Category
              </label>

              <select
                name="categoryId"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              >
                <option value="">Select category</option>

                {categoryList.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}

            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-2">
                Description
              </label>

              <textarea
                name="description"
                rows="4"
                placeholder="Enter product description"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              />
            </div>
          </div>

          {/* Product Images */}

          <div className="mt-6">
            <label className="block text-sm text-gray-600 mb-2">
              Product Images
            </label>

            <div className="grid grid-cols-3 gap-4">
              {/* Selected Images */}
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative border border-gray-200 p-2"
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Product ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />
                </div>
              ))}

              {/* Add Image Button */}
              {images.length < 3 && (
                <label className="border border-dashed border-gray-300 p-6 text-center cursor-pointer flex flex-col items-center justify-center h-44">
                  <FaPlus className="text-gray-400 mb-2" />

                  <p className="text-sm text-gray-500">Add Image</p>

                  <input
                    type="file"
                    name="images"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const selectedFiles = Array.from(e.target.files);

                      setImages((prevImages) => [
                        ...prevImages,
                        ...selectedFiles,
                      ]);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          {/* Product Variants */}

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#111827]">
                  Product Variants
                </h3>

                <p className="text-xs text-gray-400 mt-1">
                  Add different versions of this product
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setVariants([
                    ...variants,
                    {
                      size: "",
                      material: "",
                      color: "",
                      price: "",
                      quantity: "",
                    },
                  ])
                }
                className="flex items-center gap-2 text-sm text-[#9A7B3F] hover:text-[#7d632f]"
              >
                <FaPlus className="text-xs" />
                Add Variant
              </button>
            </div>

            {/* Variant Header */}

            <div className="grid grid-cols-6 gap-3 mb-2">
              <p className="text-xs text-gray-500">Size</p>

              <p className="text-xs text-gray-500">Material</p>

              <p className="text-xs text-gray-500">Color</p>

              <p className="text-xs text-gray-500">Price</p>

              <p className="text-xs text-gray-500">Stock</p>

              <p className="text-xs text-gray-500">Action</p>
            </div>

            {/* Variant Rows */}

            {variants.map((variant, index) => (
              <div key={index} className="grid grid-cols-6 gap-3 mb-3">
                {/* Size */}
                <input
                  type="text"
                  placeholder="42mm"
                  value={variant.size}
                  onChange={(e) => {
                    const updatedVariants = [...variants];

                    updatedVariants[index].size = e.target.value;

                    setVariants(updatedVariants);
                  }}
                  className="border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                />

                {/* Material */}
                <input
                  type="text"
                  placeholder="Steel"
                  value={variant.material}
                  onChange={(e) => {
                    const updatedVariants = [...variants];

                    updatedVariants[index].material = e.target.value;

                    setVariants(updatedVariants);
                  }}
                  className="border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                />

                {/* Color */}
                <input
                  type="text"
                  placeholder="Black"
                  value={variant.color}
                  onChange={(e) => {
                    const updatedVariants = [...variants];

                    updatedVariants[index].color = e.target.value;

                    setVariants(updatedVariants);
                  }}
                  className="border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                />

                {/* Price */}
                <input
                  type="number"
                  placeholder="650000"
                  value={variant.price}
                  onChange={(e) => {
                    const updatedVariants = [...variants];

                    updatedVariants[index].price = e.target.value;

                    setVariants(updatedVariants);
                  }}
                  className="border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                />

                {/* Quantity */}
                <input
                  type="number"
                  placeholder="10"
                  value={variant.quantity}
                  onChange={(e) => {
                    const updatedVariants = [...variants];

                    updatedVariants[index].quantity = e.target.value;

                    setVariants(updatedVariants);
                  }}
                  className="border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                />

                {/* Delete */}
                <button
                  type="button"
                  className="flex items-center justify-center text-gray-400 hover:text-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          {/* Form Buttons */}

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-3 cursor-pointer text-sm border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-3 cursor-pointer text-sm bg-[#111827] text-white hover:bg-gray-800"
            >
              Add Product
            </button>
          </div>
        </form>
      )}

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

            {categoryList.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-[#111827]">Product List</h2>
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
              {products.map((product) => (
                <tr
                  key={product._id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  {/* PRODUCT */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover"
                      />

                      <div>
                        <p className="text-sm font-medium text-[#111827]">
                          {product.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* BRAND */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.brand}
                  </td>

                  {/* CATEGORY */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.category}
                  </td>

                  {/* PRICE */}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    ₹{product.price}
                  </td>

                  {/* STOCK */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.stock}
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs ${
                        product.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* ACTIONS */}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminProduct;
