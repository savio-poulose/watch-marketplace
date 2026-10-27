import { useEffect, useState } from "react";

import api from "../../api/axios.js";

import toast from "react-hot-toast";

import Cropper from "react-easy-crop";

import { FaPlus, FaSearch, FaEdit, FaTrash, FaSpinner } from "react-icons/fa";

import MainLayout from "../../components/admin/MainLayout";

const API = "/admin/product";

const CATEGORY_API = "/admin/category";

const emptyVariant = () => ({
  size: "",

  strapMaterial: "",

  caseMaterial: "",

  dialColor: "",

  strapColor: "",

  price: "",

  quantity: "",

  images: [],

  imageFiles: [],
});

const emptyOffer = () => ({
  isActive: false,

  discountType: "percentage",

  discountValue: "",

  startDate: "",

  endDate: "",
});

const emptyProduct = () => ({
  name: "",

  brand: "",

  gender: "",

  categoryId: "",

  description: "",
});

const formatDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)

    .toISOString()

    .slice(0, 16);
};

const getCroppedImage = (imageSrc, pixelCrop, fileName) => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");

      canvas.width = pixelCrop.width;

      canvas.height = pixelCrop.height;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Could not create image canvas."));

        return;
      }

      context.drawImage(
        image,

        pixelCrop.x,

        pixelCrop.y,

        pixelCrop.width,

        pixelCrop.height,

        0,

        0,

        pixelCrop.width,

        pixelCrop.height,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not crop image."));

            return;
          }

          resolve(
            new File([blob], fileName, {
              type: "image/jpeg",

              lastModified: Date.now(),
            }),
          );
        },

        "image/jpeg",

        0.92,
      );
    };

    image.onerror = () => reject(new Error("Failed to load image."));

    image.src = imageSrc;
  });
};

const AdminProduct = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;

  const [categories, setCategories] = useState([]);

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);

  const [productData, setProductData] = useState(emptyProduct());

  const [variants, setVariants] = useState([emptyVariant()]);

  const [offer, setOffer] = useState(emptyOffer());

  const [editingId, setEditingId] = useState(null);

  const [deleteId, setDeleteId] = useState(null);

  const [statusProduct, setStatusProduct] = useState(null);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const [cropImage, setCropImage] = useState(null);

  const [cropFileName, setCropFileName] = useState("image.jpg");

  const [cropVariantIndex, setCropVariantIndex] = useState(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [savingCrop, setSavingCrop] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(API);

      setProducts(data.response || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load products");
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get(CATEGORY_API);

      setCategories(data.categories || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load categories");
    }
  };

  useEffect(() => {
    fetchProducts();

    fetchCategories();
  }, []);

  const resetForm = () => {
    setProductData(emptyProduct());

    setVariants([emptyVariant()]);

    setOffer(emptyOffer());

    setEditingId(null);
  };

  const updateProductField = (field, value) => {
    setProductData((previous) => ({
      ...previous,

      [field]: value,
    }));
  };

  const updateVariantField = (index, field, value) => {
    setVariants((previous) =>
      previous.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  const addVariant = () => {
    setVariants((previous) => [...previous, emptyVariant()]);
  };

  const removeVariant = (index) => {
    if (variants.length === 1) {
      toast.error("A product must have at least one variant");

      return;
    }

    setVariants((previous) => previous.filter((_, i) => i !== index));
  };

  const addImages = (index, fileList) => {
    const file = Array.from(fileList || [])[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");

      return;
    }

    const variant = variants[index];

    if (!variant) return;

    const currentCount = variant.images.length + variant.imageFiles.length;

    if (currentCount >= 3) {
      toast.error("Maximum 3 images per variant");

      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setCropVariantIndex(index);

    setCropFileName(file.name);

    setCropImage(imageUrl);

    setCrop({ x: 0, y: 0 });

    setZoom(1);

    setCroppedAreaPixels(null);
  };

  const closeCropModal = () => {
    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }

    setCropImage(null);

    setCropVariantIndex(null);

    setCroppedAreaPixels(null);

    setZoom(1);
  };

  const saveCroppedImage = async () => {
    if (!cropImage || !croppedAreaPixels || cropVariantIndex === null) {
      toast.error("Please select a crop area.");

      return;
    }

    setSavingCrop(true);

    try {
      const croppedFile = await getCroppedImage(
        cropImage,

        croppedAreaPixels,

        cropFileName,
      );

      const index = cropVariantIndex;

      setVariants((previous) =>
        previous.map((variant, i) => {
          if (i !== index) return variant;

          const count = variant.images.length + variant.imageFiles.length;

          if (count >= 3) return variant;

          return {
            ...variant,

            imageFiles: [...variant.imageFiles, croppedFile],
          };
        }),
      );

      closeCropModal();

      toast.success("Cropped image added.");
    } catch (error) {
      console.error("Image crop failed:", error);

      toast.error("Failed to crop image.");
    } finally {
      setSavingCrop(false);
    }
  };

  const removeSavedImage = (variantIndex, imageIndex) => {
    setVariants((previous) =>
      previous.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,

              images: variant.images.filter((_, j) => j !== imageIndex),
            }
          : variant,
      ),
    );
  };

  const removeSelectedImage = (variantIndex, imageIndex) => {
    setVariants((previous) =>
      previous.map((variant, i) =>
        i === variantIndex
          ? {
              ...variant,

              imageFiles: variant.imageFiles.filter((_, j) => j !== imageIndex),
            }
          : variant,
      ),
    );
  };

  const validateForm = () => {
    if (
      !productData.name.trim() ||
      !productData.brand.trim() ||
      !productData.gender ||
      !productData.categoryId ||
      !productData.description.trim()
    ) {
      toast.error("Complete all product fields");

      return false;
    }

    for (let index = 0; index < variants.length; index++) {
      const variant = variants[index];

      if (
        !variant.size.trim() ||
        !variant.strapMaterial.trim() ||
        !variant.caseMaterial.trim() ||
        !variant.dialColor.trim() ||
        !variant.strapColor.trim()
      ) {
        toast.error(`Complete all fields for variant ${index + 1}`);

        return false;
      }

      const price = Number(variant.price);

      const quantity = Number(variant.quantity);

      if (
        variant.price === "" ||
        !Number.isFinite(price) ||
        price < 0 ||
        variant.quantity === "" ||
        !Number.isInteger(quantity) ||
        quantity < 0
      ) {
        toast.error(`Invalid price or stock in variant ${index + 1}`);

        return false;
      }

      if (variant.images.length + variant.imageFiles.length > 3) {
        toast.error(`Variant ${index + 1} can have at most 3 images`);

        return false;
      }
    }

    if (offer.isActive) {
      const discount = Number(offer.discountValue);

      if (
        !Number.isFinite(discount) ||
        discount <= 0 ||
        (offer.discountType === "percentage" && discount > 100) ||
        !offer.startDate ||
        !offer.endDate ||
        new Date(offer.startDate) >= new Date(offer.endDate)
      ) {
        toast.error("Enter a valid offer and date range");

        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const formData = new FormData();

      Object.entries(productData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const variantsForSubmit = variants.map(({ imageFiles, ...variant }) => ({
        ...variant,

        price: Number(variant.price),

        quantity: Number(variant.quantity),
      }));

      formData.append("variants", JSON.stringify(variantsForSubmit));

      formData.append("offer", JSON.stringify(offer));

      variants.forEach((variant, index) => {
        variant.imageFiles.forEach((file) => {
          formData.append(`variantImages_${index}`, file);
        });
      });

      const url = editingId ? `${API}/${editingId}` : API;

      const { data } = editingId
        ? await api.put(url, formData)
        : await api.post(url, formData);

      toast.success(data.message || "Product saved successfully");

      setShowForm(false);

      resetForm();

      await fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id) => {
    setLoading(true);

    try {
      const { data } = await api.get(`${API}/${id}`);

      const product = data.product;

      const savedVariants = data.variants || [];

      const savedOffer = data.offer;

      setProductData({
        name: product.name || "",

        brand: product.brand || "",

        gender: product.gender || "",

        categoryId: product.categoryId?._id || product.categoryId || "",

        description: product.description || "",
      });

      setVariants(
        savedVariants.length
          ? savedVariants.map((variant) => ({
              size: variant.size || "",

              strapMaterial: variant.strapMaterial || "",

              caseMaterial: variant.caseMaterial || "",

              dialColor: variant.dialColor || "",

              strapColor: variant.strapColor || "",

              price: variant.price ?? "",

              quantity: variant.quantity ?? "",

              images: variant.images || [],

              imageFiles: [],
            }))
          : [emptyVariant()],
      );

      setOffer(
        savedOffer
          ? {
              isActive: savedOffer.isActive || false,

              discountType: savedOffer.discountType || "percentage",

              discountValue: savedOffer.discountValue ?? "",

              startDate: formatDateTimeLocal(savedOffer.startDate),

              endDate: formatDateTimeLocal(savedOffer.endDate),
            }
          : emptyOffer(),
      );

      setEditingId(id);

      setShowForm(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { data } = await api.delete(`${API}/${deleteId}`);

      toast.success(data.message || "Product deleted");

      setDeleteId(null);

      await fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  const handleToggleStatus = async () => {
    if (!statusProduct) return;

    try {
      const { data } = await api.patch(
        `${API}/status/${statusProduct.id}`,
        {}
      );

      toast.success(data.message || "Product status updated");

      setStatusProduct(null);

      await fetchProducts();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update product status",
      );
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = search.toLowerCase().trim();

    const matchesSearch =
      product.name?.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query);

    const matchesCategory =
      !categoryFilter || product.category === categoryFilter;

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && product.isActive) ||
      (statusFilter === "inactive" && !product.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage,
  );

  return (
    <MainLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#9A7B3F]">CATALOG</p>

          <h1 className="mt-1 text-2xl font-semibold text-[#111827]">
            Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage products, variants, images and stock
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();

            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-[#111827] cursor-pointer px-5 py-3 text-sm text-white"
        >
          <FaPlus /> Add Product
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 border border-gray-200 bg-white p-6"
        >
          <h2 className="mb-6 text-lg font-semibold text-[#111827]">
            {editingId ? "Edit Product" : "Add Product"}
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Product Name
              </label>

              <input
                required
                value={productData.name}
                onChange={(e) => updateProductField("name", e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">Brand</label>

              <input
                required
                value={productData.brand}
                onChange={(e) => updateProductField("brand", e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">Gender</label>

              <select
                required
                value={productData.gender}
                onChange={(e) => updateProductField("gender", e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 text-sm"
              >
                <option value="">Select gender</option>

                <option value="Men">Men</option>

                <option value="Women">Women</option>

                <option value="Unisex">Unisex</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Category
              </label>

              <select
                required
                value={productData.categoryId}
                onChange={(e) =>
                  updateProductField("categoryId", e.target.value)
                }
                className="w-full border border-gray-200 px-4 py-3 text-sm"
              >
                <option value="">Select category</option>

                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-gray-600">
                Description
              </label>

              <textarea
                required
                rows={4}
                value={productData.description}
                onChange={(e) =>
                  updateProductField("description", e.target.value)
                }
                className="w-full border border-gray-200 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#111827]">
                  Product Variants
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  The first variant provides the default product images.
                </p>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-2 text-sm text-[#9A7B3F]"
              >
                <FaPlus /> Add Variant
              </button>
            </div>

            {variants.map((variant, index) => (
              <div key={index} className="mb-5 border border-gray-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    Variant {index + 1}
                    {index === 0 && (
                      <span className="ml-2 text-xs font-normal text-[#9A7B3F]">
                        Default
                      </span>
                    )}
                  </h4>

                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label="Remove variant"
                  >
                    <FaTrash />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Case Size
                    </label>

                    <input
                      required
                      value={variant.size}
                      onChange={(e) =>
                        updateVariantField(index, "size", e.target.value)
                      }
                      placeholder="43mm"
                      className="w-full border border-gray-200 px-3 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Strap Material
                    </label>

                    <input
                      required
                      value={variant.strapMaterial}
                      onChange={(e) =>
                        updateVariantField(
                          index,

                          "strapMaterial",

                          e.target.value,
                        )
                      }
                      placeholder="Stainless Steel"
                      className="w-full border border-gray-200 px-3 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Case Material
                    </label>

                    <input
                      required
                      value={variant.caseMaterial}
                      onChange={(e) =>
                        updateVariantField(
                          index,

                          "caseMaterial",

                          e.target.value,
                        )
                      }
                      placeholder="Titanium"
                      className="w-full border border-gray-200 px-3 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Dial Color
                    </label>

                    <input
                      required
                      value={variant.dialColor}
                      onChange={(e) =>
                        updateVariantField(index, "dialColor", e.target.value)
                      }
                      placeholder="Champagne"
                      className="w-full border border-gray-200 px-3 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Strap Color
                    </label>

                    <input
                      required
                      value={variant.strapColor}
                      onChange={(e) =>
                        updateVariantField(index, "strapColor", e.target.value)
                      }
                      placeholder="Gold"
                      className="w-full border border-gray-200 px-3 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Price (₹)
                    </label>

                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.price}
                      onChange={(e) =>
                        updateVariantField(index, "price", e.target.value)
                      }
                      placeholder="100000"
                      className="w-full border border-gray-200 px-3 py-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Stock Quantity
                    </label>

                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={variant.quantity}
                      onChange={(e) =>
                        updateVariantField(index, "quantity", e.target.value)
                      }
                      placeholder="4"
                      className="w-full border border-gray-200 px-3 py-3 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-600">Variant Images</p>

                    <span className="text-xs text-gray-400">
                      {variant.images.length + variant.imageFiles.length}/3
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {variant.images.map((image, imageIndex) => (
                      <div
                        key={`saved-${imageIndex}`}
                        className="relative border border-gray-200 p-1"
                      >
                        <img
                          src={image}
                          alt={`Variant ${index + 1}`}
                          className="h-32 w-full object-contain"
                        />

                        <button
                          type="button"
                          onClick={() => removeSavedImage(index, imageIndex)}
                          className="absolute right-2 top-2 bg-white p-2 text-red-500 shadow"
                          aria-label="Remove saved image"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}

                    {variant.imageFiles.map((file, imageIndex) => (
                      <div
                        key={`new-${imageIndex}`}
                        className="relative border border-gray-200 p-1"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New variant ${index + 1}`}
                          className="h-32 w-full object-contain"
                        />

                        <button
                          type="button"
                          onClick={() => removeSelectedImage(index, imageIndex)}
                          className="absolute right-2 top-2 bg-white p-2 text-red-500 shadow"
                          aria-label="Remove selected image"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}

                    {variant.images.length + variant.imageFiles.length < 3 && (
                      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#9A7B3F]">
                        <FaPlus className="mb-2" />
                        Add Image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            addImages(index, e.target.files);

                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#111827]">
                Product Offer
              </h3>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={offer.isActive}
                  onChange={(e) =>
                    setOffer((previous) => ({
                      ...previous,

                      isActive: e.target.checked,
                    }))
                  }
                />
                Enable Offer
              </label>
            </div>

            {offer.isActive && (
              <div className="grid grid-cols-1 gap-4 border border-gray-200 p-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-600">
                    Discount Type
                  </label>

                  <select
                    value={offer.discountType}
                    onChange={(e) =>
                      setOffer((previous) => ({
                        ...previous,

                        discountType: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 px-4 py-3 text-sm"
                  >
                    <option value="percentage">Percentage</option>

                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-600">
                    Discount Value
                  </label>

                  <input
                    required
                    type="number"
                    min="0.01"
                    max={offer.discountType === "percentage" ? 100 : undefined}
                    step="0.01"
                    value={offer.discountValue}
                    onChange={(e) =>
                      setOffer((previous) => ({
                        ...previous,

                        discountValue: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-600">
                    Start Date
                  </label>

                  <input
                    required
                    type="datetime-local"
                    value={offer.startDate}
                    onChange={(e) =>
                      setOffer((previous) => ({
                        ...previous,

                        startDate: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-600">
                    End Date
                  </label>

                  <input
                    required
                    type="datetime-local"
                    value={offer.endDate}
                    onChange={(e) =>
                      setOffer((previous) => ({
                        ...previous,

                        endDate: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 px-4 py-3 text-sm"
                  />
                </div>
              </div>
            )}
          </section>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowForm(false);

                resetForm();
              }}
              className="border cursor-pointer border-gray-200 px-5 py-3 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#111827] cursor-pointer px-5 py-3 text-sm text-white disabled:opacity-60"
            >
              {loading && <FaSpinner className="animate-spin" />}

              {loading
                ? "Saving..."
                : editingId
                ? "Update Product"
                : "Add Product"}
            </button>
          </div>
        </form>
      )}

      {/* Search and filters */}

      <div className="mb-6 border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search products..."
              className="w-full border border-gray-200 py-3 pl-11 pr-4 text-sm"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-200 px-4 py-3 text-sm"
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-200 px-4 py-3 text-sm"
          >
            <option value="">All Statuses</option>

            <option value="active">Active</option>

            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Product list */}

      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-[#111827]">Product List</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                {[
                  "PRODUCT",

                  "BRAND",

                  "CATEGORY",

                  "PRICE",

                  "STOCK",

                  "STATUS",

                  "ACTIONS",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-4 text-xs font-medium text-gray-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-12 w-12 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center bg-gray-100 text-xs text-gray-400">
                          No image
                        </div>
                      )}

                      <span className="text-sm font-medium">
                        {product.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.brand}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.category}
                  </td>

                  <td className="px-6 py-4 text-sm">₹{product.price}</td>

                  <td className="px-6 py-4 text-sm">{product.stock}</td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setStatusProduct(product)}
                      className={`rounded-full cursor-pointer px-3 py-1 text-xs ${
                        product.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(product.id)}
                        disabled={loading}
                        className="text-gray-500 cursor-pointer hover:text-[#9A7B3F]"
                        aria-label="Edit product"
                      >
                        <FaEdit />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteId(product.id)}
                        className="text-gray-500 cursor-pointer hover:text-red-600"
                        aria-label="Delete product"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 0 && (
        <div className="mt-4 flex flex-col gap-4 border border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Showing {startIndex + 1}–
            {Math.min(startIndex + productsPerPage, filteredProducts.length)} of{" "}
            {filteredProducts.length} products
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => page - 1)}
              className="border border-gray-200 px-3 py-2 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm ${
                    currentPage === page
                      ? "bg-[#111827] text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
              className="border border-gray-200 px-3 py-2 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white p-6">
            <h2 className="text-lg font-semibold">Delete Product?</h2>

            <p className="mt-3 text-sm text-gray-500">
              This deletes the product and its variants.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="border cursor-pointer  border-gray-200 px-5 py-2.5 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 cursor-pointer px-5 py-2.5 text-sm text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status confirmation */}

      {statusProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white p-6">
            <h2 className="text-lg font-semibold">
              {statusProduct.isActive
                ? "Deactivate Product?"
                : "Activate Product?"}
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              {statusProduct.isActive
                ? "Customers will no longer be able to purchase this product."
                : "This product will become available to customers."}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStatusProduct(null)}
                className="border cursor-pointer border-gray-200 px-5 py-2.5 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleToggleStatus}
                className={`px-5 py-2.5 text-sm cursor-pointer text-white ${
                  statusProduct.isActive ? "bg-red-600" : "bg-green-600"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {cropImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl overflow-hidden bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">
                  Crop Variant Image
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Adjust the image before uploading.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCropModal}
                disabled={savingCrop}
                className="text-2xl text-gray-500 hover:text-gray-900 disabled:opacity-50"
                aria-label="Close crop modal"
              >
                &times;
              </button>
            </div>

            <div className="relative h-[320px] bg-gray-900 sm:h-[420px]">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedPixels) => {
                  setCroppedAreaPixels(croppedPixels);
                }}
              />
            </div>

            <div className="px-5 py-4">
              <label className="mb-2 block text-sm text-gray-600">Zoom</label>

              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[#9A7B3F]"
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCropModal}
                  disabled={savingCrop}
                  className="border border-gray-200 px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveCroppedImage}
                  disabled={savingCrop || !croppedAreaPixels}
                  className="bg-[#111827] px-5 py-2.5 text-sm text-white disabled:opacity-50"
                >
                  {savingCrop ? "Cropping..." : "Crop & Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AdminProduct;
