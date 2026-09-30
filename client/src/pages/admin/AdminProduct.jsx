import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaSpinner,
} from "react-icons/fa";

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
  const [offer, setOffer] = useState({
    isActive: false,
    discountType: "percentage",
    discountValue: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  console.log(editingProductId);
  const [productData, setProductData] = useState({
    name: "",
    brand: "",
    gender: "",
    categoryId: "",
    description: "",
  });
  const [existingImages, setExistingImages] = useState([]);
  const [deleteProductId, setDeleteProductId] = useState(null);

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


  async function handleSubmit(event) {
    event.preventDefault();
    const token = localStorage.getItem("adminToken");
    if (editingProductId) {
      setLoading(true);

      const formData = new FormData(event.target);

      formData.append("variants", JSON.stringify(variants));
      formData.append("offer", JSON.stringify(offer));
      formData.append("existingImages", JSON.stringify(existingImages));

      try {
        const response = await axios.put(
          `http://localhost:3000/api/admin/product/${editingProductId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        alert(response.data.message);

        event.target.reset();

        // Clear edit mode
        setEditingProductId(null);

        // Clear form
        setProductData({
          name: "",
          brand: "",
          gender: "",
          categoryId: "",
          description: "",
        });

        setVariants([
          {
            size: "",
            material: "",
            color: "",
            price: "",
            quantity: "",
          },
        ]);

        setImages([]);
        setExistingImages([]);

        setOffer({
          isActive: false,
          discountType: "percentage",
          discountValue: "",
          startDate: "",
          endDate: "",
        });
      } catch (err) {
        alert(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);

      const formData = new FormData(event.target);
      // console.log(formData);

      formData.append("variants", JSON.stringify(variants));

      formData.append("offer", JSON.stringify(offer));
      // console.log("Images:", formData.getAll("images"));

      // const data = Object.fromEntries(formData);
      // console.log("product :" , data);
      // console.log("Variants:", variants);

      try {
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
        setOffer({
          isActive: false,
          discountType: "percentage",
          discountValue: "",
          startDate: "",
          endDate: "",
        });
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
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



  const handleEdit = async (id) => {
    try {
      setLoading(true);
      setEditingProductId(id);

      const token = localStorage.getItem("adminToken");

      const response = await axios.get(
        `http://localhost:3000/api/admin/product/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("Edit product data:", response.data);

      const { product, variants, offer } = response.data;

      // Store ID so submit knows this is an edit
      setEditingProductId(id);

      // Product fields
      setProductData({
        name: product.name || "",
        brand: product.brand || "",
        gender: product.gender || "",
        categoryId: product.categoryId?._id || product.categoryId || "",
        description: product.description || "",
      });

      setExistingImages(product.images || []);

      // Variants
      setVariants(
        variants.map((variant) => ({
          size: variant.size || "",
          material: variant.material || "",
          color: variant.color || "",
          price: variant.price || "",
          quantity: variant.quantity || "",
        })),
      );

      // Offer
      if (offer) {
        setOffer({
          isActive: offer.isActive,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          startDate: formatDateTimeLocal(offer.startDate),
          endDate: formatDateTimeLocal(offer.endDate),
        });
      } else {
        setOffer({
          isActive: false,
          discountType: "percentage",
          discountValue: "",
          startDate: "",
          endDate: "",
        });
      }

      setShowForm(true);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to get product");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeLocal = (date) => {
    if (!date) return "";

    const d = new Date(date);

    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60000);

    return localDate.toISOString().slice(0, 16);
  };

  async function handleDeleteProduct() {

    try{

      

      const token = localStorage.getItem("adminToken");

      const response = await axios.delete(
        `http://localhost:3000/api/admin/product/${deleteProductId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(response)
 
      
      

    }catch(err){
      console.log(err.message)
      alert(err.message)
    }

  }

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
          onClick={() => {
            setEditingProductId(null);
            setShowForm(true);

            setProductData({
              name: "",
              brand: "",
              gender: "",
              categoryId: "",
              description: "",
            });

            setVariants([
              {
                size: "",
                material: "",
                color: "",
                price: "",
                quantity: "",
              },
            ]);

            setImages([]);
            setExistingImages([]);

            setOffer({
              isActive: false,
              discountType: "percentage",
              discountValue: "",
              startDate: "",
              endDate: "",
            });
          }}
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
                value={productData.name}
                onChange={(e) =>
                  setProductData({
                    ...productData,
                    name: e.target.value,
                  })
                }
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
                value={productData.brand}
                onChange={(e) =>
                  setProductData({
                    ...productData,
                    brand: e.target.value,
                  })
                }
                placeholder="Enter brand"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              />
            </div>

            {/* Gender */}

            <div>
              <label className="block text-sm text-gray-600 mb-2">Gender</label>

              <select
                name="gender"
                value={productData.gender}
                onChange={(e) =>
                  setProductData({
                    ...productData,
                    gender: e.target.value,
                  })
                }
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
                value={productData.categoryId}
                onChange={(e) =>
                  setProductData({
                    ...productData,
                    categoryId: e.target.value,
                  })
                }
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
                value={productData.description}
                onChange={(e) =>
                  setProductData({
                    ...productData,
                    description: e.target.value,
                  })
                }
                rows="4"
              />
            </div>
          </div>

          {/* Product Images */}

          <div className="mt-6">
            <label className="block text-sm text-gray-600 mb-2">
              Product Images
            </label>

            <div className="grid grid-cols-3 gap-4">
              {/* Existing Cloudinary images */}
              {existingImages.map((image, index) => (
                <div
                  key={`existing-${index}`}
                  className="relative border border-gray-200 p-2"
                >
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setExistingImages(
                        existingImages.filter(
                          (_, imageIndex) => imageIndex !== index,
                        ),
                      );
                    }}
                    className="absolute top-2 right-2 bg-white text-red-500 w-7 h-7 flex items-center justify-center shadow"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}

              {/* New uploaded images */}
              {images.map((image, index) => (
                <div
                  key={`new-${index}`}
                  className="relative border border-gray-200 p-2"
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`New product ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setImages(
                        images.filter((_, imageIndex) => imageIndex !== index),
                      );
                    }}
                    className="absolute top-2 right-2 bg-white text-red-500 w-7 h-7 flex items-center justify-center shadow"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}

              {/* Add image */}
              {existingImages.length + images.length < 3 && (
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

                      e.target.value = "";
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
                  className="flex cursor-pointer items-center justify-center text-gray-400 hover:text-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
          {/* Product Offer */}

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#111827]">
                  Product Offer
                </h3>

                <p className="text-xs text-gray-400 mt-1">
                  Add a discount for this product
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={offer.isActive}
                  onChange={(e) =>
                    setOffer({
                      ...offer,
                      isActive: e.target.checked,
                    })
                  }
                />
                Enable Offer
              </label>
            </div>

            {offer.isActive && (
              <div className="grid grid-cols-2 gap-5 border border-gray-200 p-5">
                {/* Discount Type */}

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Discount Type
                  </label>

                  <select
                    value={offer.discountType}
                    onChange={(e) =>
                      setOffer({
                        ...offer,
                        discountType: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                {/* Discount Value */}

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Discount Value
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={offer.discountValue}
                    onChange={(e) =>
                      setOffer({
                        ...offer,
                        discountValue: e.target.value,
                      })
                    }
                    placeholder={
                      offer.discountType === "percentage" ? "10" : "5000"
                    }
                    className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                  />
                </div>

                {/* Start Date */}

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Start Date
                  </label>

                  <input
                    type="datetime-local"
                    value={offer.startDate}
                    onChange={(e) =>
                      setOffer({
                        ...offer,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                  />
                </div>

                {/* End Date */}

                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    End Date
                  </label>

                  <input
                    type="datetime-local"
                    value={offer.endDate}
                    onChange={(e) =>
                      setOffer({
                        ...offer,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
                  />
                </div>
              </div>
            )}
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
              disabled={loading}
              className={`px-5 py-3 text-sm bg-[#111827] text-white flex items-center gap-2 ${
                loading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-gray-800 cursor-pointer"
              }`}
            >
              {loading && <FaSpinner className="animate-spin" />}
              {loading
                ? editingProductId
                  ? "Updating Product..."
                  : "Adding Product..."
                : editingProductId
                ? "Edit Product"
                : "Add Product"}
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
                      

                      <button
                        className="text-gray-500 hover:text-[#9A7B3F]"
                        type="button"
                        onClick={() => handleEdit(product.id)}
                      >
                        <FaEdit />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteProductId(product.id)}
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
      {deleteProductId && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white p-6 shadow-xl">
            <h2 className="text-lg cursor-pointer font-semibold text-[#111827]">
              Delete Product
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Are you sure you want to delete this product? This action cannot
              be undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              {/* Cancel */}
              <button
                type="button"
                onClick={() => setDeleteProductId(null)}
                className="px-5 py-2.5 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              {/* Confirm Delete */}
              <button
                type="button"
                onClick={() => {
                  handleDeleteProduct()
                  console.log("Delete:", deleteProductId);

                  setDeleteProductId(null);
                }}
                className="px-5 py-2.5 text-sm bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AdminProduct;
