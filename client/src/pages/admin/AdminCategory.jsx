import { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import api from "../../api/axios.js";
import MainLayout from "../../components/admin/MainLayout";
import toast from "react-hot-toast";

const API = "/admin/category";
const CATEGORIES_PER_PAGE = 5;

const emptyOffer = () => ({
  isActive: false,
  discountType: "percentage",
  discountValue: "",
  startDate: "",
  endDate: "",
});

const formatDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const AdminCategory = () => {
  const [showForm, setShowForm] = useState(false);
  const [categoryList, setCategoryList] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [offer, setOffer] = useState(emptyOffer());
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await api.get(API);

      setCategoryList(response.data.categories || []);
    } catch (err) {
      console.error("FETCH CATEGORY ERROR:", err);
      toast.error(err.response?.data?.message || "Failed to load categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setEditingCategory(null);
    setOffer(emptyOffer());
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingCategory(category);

    // These values are populated if the backend already returns category offer fields.
    setOffer({
      isActive: category.offer?.isActive ?? category.offerIsActive ?? false,
      discountType:
        category.offer?.discountType ??
        category.offerDiscountType ??
        "percentage",
      discountValue:
        category.offer?.discountValue ?? category.offerDiscountValue ?? "",
      startDate: formatDateTimeLocal(
        category.offer?.startDate ?? category.offerStartDate
      ),
      endDate: formatDateTimeLocal(
        category.offer?.endDate ?? category.offerEndDate
      ),
    });

    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(event.currentTarget);

      // Send offer fields along with the category form.
      // The backend schema/controller must also save these fields for persistence.
      formData.set("offerIsActive", String(offer.isActive));
      formData.set("offerDiscountType", offer.discountType);
      formData.set("offerDiscountValue", offer.discountValue);
      formData.set("offerStartDate", offer.startDate);
      formData.set("offerEndDate", offer.endDate);

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
          toast.error("Enter a valid category offer and date range");
          setSaving(false);
          return;
        }
      }

      if (editingCategory) {
        await api.put(`${API}/${editingCategory._id}`, formData);
        toast.success("Category updated successfully");
      } else {
        await api.post(API, formData);
        toast.success("Category added successfully");
      }

      // event.currentTarget.reset();
      setShowForm(false);
      resetForm();
      setCurrentPage(1);
      
      try{
        await fetchCategories();
      }catch(error){
        console.log(error+":failed to fetch categories")
      }

    } catch (err) {
      console.error("CATEGORY ERROR:", err);
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete the category "${category.name}"?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`${API}/${category._id}`);

      setCategoryList((previous) =>
        previous.filter((item) => item._id !== category._id)
      );
      setCurrentPage(1);
      toast.success("Deleted successfully");
    } catch (err) {
      console.error("DELETE CATEGORY ERROR:", err);
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const filteredCategories = categoryList.filter((category) => {
    const query = search.trim().toLowerCase();
    return (
      category.name?.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(
    filteredCategories.length / CATEGORIES_PER_PAGE
  );
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const startIndex = (safeCurrentPage - 1) * CATEGORIES_PER_PAGE;
  const paginatedCategories = filteredCategories.slice(
    startIndex,
    startIndex + CATEGORIES_PER_PAGE
  );

  return (
    <MainLayout>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#9A7B3F]">CATALOG</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#111827]">
            Categories
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage product categories and category offers
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="flex items-center gap-2 bg-[#111827] px-5 py-3 text-sm text-white transition hover:bg-gray-800"
        >
          <FaPlus className="text-xs" />
          Add Category
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="mb-6 border border-gray-200 bg-white p-6"
        >
          <h2 className="mb-6 text-lg font-semibold text-[#111827]">
            {editingCategory ? "Edit Category" : "Add Category"}
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Category Name
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={editingCategory?.name || ""}
                placeholder="Enter category name"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Category Image
              </label>
              <input
                type="file"
                name="image"
                accept="image/*"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              />
              {editingCategory?.image && (
                <div className="mt-3">
                  <p className="mb-2 text-xs text-gray-500">Current Image</p>
                  <img
                    src={editingCategory.image}
                    alt={editingCategory.name}
                    className="h-20 w-20 object-cover"
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-gray-600">
                Description
              </label>
              <textarea
                name="description"
                defaultValue={editingCategory?.description || ""}
                rows={4}
                placeholder="Enter category description"
                className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
              />
            </div>
          </div>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#111827]">
                  Category Offer
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Offer applies to products in this category when supported by
                  the backend pricing logic.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={offer.isActive}
                  onChange={(event) =>
                    setOffer((previous) => ({
                      ...previous,
                      isActive: event.target.checked,
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
                    onChange={(event) =>
                      setOffer((previous) => ({
                        ...previous,
                        discountType: event.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 px-4 py-3 text-sm"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-600">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    max={offer.discountType === "percentage" ? 100 : undefined}
                    step="0.01"
                    required
                    value={offer.discountValue}
                    onChange={(event) =>
                      setOffer((previous) => ({
                        ...previous,
                        discountValue: event.target.value,
                      }))
                    }
                    placeholder={
                      offer.discountType === "percentage" ? "10" : "1000"
                    }
                    className="w-full border border-gray-200 px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-600">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={offer.startDate}
                    onChange={(event) =>
                      setOffer((previous) => ({
                        ...previous,
                        startDate: event.target.value,
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
                    type="datetime-local"
                    required
                    value={offer.endDate}
                    onChange={(event) =>
                      setOffer((previous) => ({
                        ...previous,
                        endDate: event.target.value,
                      }))
                    }
                    className="w-full border border-gray-200 px-4 py-3 text-sm"
                  />
                </div>
              </div>
            )}
          </section>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="border border-gray-200 px-5 py-3 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#111827] px-5 py-3 text-sm text-white disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingCategory
                  ? "Update Category"
                  : "Add Category"}
            </button>
          </div>
        </form>
      )}

      <div className="mb-6 border border-gray-200 bg-white p-5">
        <label className="mb-2 block text-sm text-gray-600">
          Search Categories
        </label>
        <input
          type="text"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by category name or description..."
          className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
        />
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-[#111827]">
            Category List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                {["IMAGE", "NAME", "DESCRIPTION", "STATUS", "OFFER", "ACTIONS"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-6 py-4 text-xs font-medium text-gray-500"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {paginatedCategories.map((category) => {
                const categoryOffer =
                  category.offer ||
                  (category.offerIsActive
                    ? {
                        isActive: category.offerIsActive,
                        discountType: category.offerDiscountType,
                        discountValue: category.offerDiscountValue,
                      }
                    : null);

                return (
                  <tr
                    key={category._id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="h-12 w-12 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center bg-gray-100 text-xs text-gray-400">
                          No image
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#111827]">
                        {category.name}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="max-w-md text-sm text-gray-500">
                        {category.description || "—"}
                      </p>
                    </td>

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

                    <td className="px-6 py-4">
                      {categoryOffer?.isActive ? (
                        <span className="text-xs font-medium text-[#9A7B3F]">
                          {categoryOffer.discountValue}
                          {categoryOffer.discountType === "percentage"
                            ? "% off"
                            : " off"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No offer</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => openEditForm(category)}
                          className="text-gray-500 hover:text-[#9A7B3F]"
                          aria-label="Edit category"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          className="text-gray-500 hover:text-red-600"
                          aria-label="Delete category"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCategories.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && (
          <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing {startIndex + 1}–
              {Math.min(startIndex + CATEGORIES_PER_PAGE, filteredCategories.length)}{" "}
              of {filteredCategories.length} categories
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                className="border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
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
                      safeCurrentPage === page
                        ? "bg-[#111827] text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AdminCategory;
