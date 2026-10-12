
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  House,
  BriefcaseBusiness,
} from "lucide-react";
import toast from "react-hot-toast";

import Navbar from "../../components/layout/Navbar.jsx";
import api from "../../api/axios.js";

const EditAddress = () => {
  const { addressId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isCheckout = location.state?.from === "checkout";

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "Home",
    isDefault: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  // Fetch the selected address
  useEffect(() => {
    let active = true;

    const fetchAddress = async () => {
      try {
        const response = await api.get(
          `/user/address/${addressId}`
        );

        if (!active) return;

        console.log(response.data.address)

        const address = response.data.address;

        setFormData({
          fullName: address.fullName || "",
          phone: address.phone || "",
          addressLine1: address.addressLine1 || "",
          addressLine2: address.addressLine2 || "",
          city: address.city || "",
          state: address.state || "",
          pincode: address.pincode || "",
          addressType: address.addressType || "Home",
          isDefault: Boolean(address.isDefault),
        });
      } catch (err) {
        if (!active) return;

        const message =
          err.response?.data?.message ||
          "Unable to load this address.";

        setError(message);
        toast.error(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (addressId) {
      fetchAddress();
    } else {
      setError("Address ID is missing.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [addressId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setError("");
  };

  const handleNumericChange = (event) => {
    const { name, value } = event.target;
    const limit = name === "phone" ? 10 : 6;

    setFormData((previous) => ({
      ...previous,
      [name]: value.replace(/\D/g, "").slice(0, limit),
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setError("");
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Recipient name is required.";
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!formData.addressLine1.trim()) {
      nextErrors.addressLine1 = "House / street address is required.";
    }

    if (!formData.city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (!formData.state.trim()) {
      nextErrors.state = "State is required.";
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      nextErrors.pincode = "Enter a valid 6-digit PIN code.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...formData,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      };

      const response = await api.put(
        `/user/address/${addressId}`,
        payload
      );

      toast.success(
        response.data.message || "Address updated successfully."
      );

      if (isCheckout) {
        navigate("/user/checkout", {
          replace: true,
          state: {
            ...location.state,
            selectedAddress: response.data.address?._id || addressId,
          },
        });
      } else {
        navigate("/user/profile", { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to update address. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (isCheckout) {
      navigate("/user/checkout", {
        state: location.state,
      });
    } else {
      navigate("/user/profile");
    }
  };

  const inputClass =
    "h-12 w-full border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#9A7B3F]";

  const labelClass =
    "mb-2 block text-xs font-semibold tracking-wider text-gray-600";

  const errorClass = "mt-1 text-xs text-red-600";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="py-20 text-center text-sm text-gray-500">
          Loading address...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[#111827]">
      <Navbar />

      <main className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={goBack}
            className="mb-8 flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#9A7B3F]"
          >
            <ArrowLeft size={16} />
            {isCheckout ? "Back to checkout" : "Back to profile"}
          </button>

          <header className="mb-8 border-b border-gray-200 pb-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#9A7B3F]">
              <MapPin size={15} />
              Delivery details
            </div>

            <h1 className="text-2xl font-semibold sm:text-3xl">
              Edit Address
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Update the delivery details for your next timepiece.
            </p>
          </header>

          {error && (
            <div
              role="alert"
              className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="border border-gray-200 bg-white"
          >
            <div className="space-y-8 p-5 sm:p-8">
              {/* Contact information */}
              <section>
                <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider">
                  Contact Information
                </h2>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className={labelClass}>
                      RECIPIENT FULL NAME *
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      autoComplete="name"
                      className={inputClass}
                      placeholder="Enter full name"
                    />
                    {errors.fullName && (
                      <p className={errorClass}>{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      MOBILE NUMBER *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleNumericChange}
                      className={inputClass}
                      placeholder="10-digit mobile number"
                    />
                    {errors.phone && (
                      <p className={errorClass}>{errors.phone}</p>
                    )}
                  </div>
                </div>
              </section>

              <div className="border-t border-gray-100" />

              {/* Delivery address */}
              <section>
                <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider">
                  Delivery Address
                </h2>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="addressLine1" className={labelClass}>
                      HOUSE / FLAT / STREET *
                    </label>
                    <input
                      id="addressLine1"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      autoComplete="address-line1"
                      className={inputClass}
                      placeholder="House number, building, street"
                    />
                    {errors.addressLine1 && (
                      <p className={errorClass}>{errors.addressLine1}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="addressLine2" className={labelClass}>
                      LANDMARK / AREA (OPTIONAL)
                    </label>
                    <input
                      id="addressLine2"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      autoComplete="address-line2"
                      className={inputClass}
                      placeholder="Apartment, area or landmark"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="city" className={labelClass}>
                        CITY / TOWN *
                      </label>
                      <input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        autoComplete="address-level2"
                        className={inputClass}
                        placeholder="City or town"
                      />
                      {errors.city && (
                        <p className={errorClass}>{errors.city}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="state" className={labelClass}>
                        STATE *
                      </label>
                      <input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        autoComplete="address-level1"
                        className={inputClass}
                        placeholder="State"
                      />
                      {errors.state && (
                        <p className={errorClass}>{errors.state}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="pincode" className={labelClass}>
                        PIN CODE *
                      </label>
                      <input
                        id="pincode"
                        name="pincode"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handleNumericChange}
                        className={inputClass}
                        placeholder="6-digit PIN code"
                      />
                      {errors.pincode && (
                        <p className={errorClass}>{errors.pincode}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-gray-100" />

              {/* Address type */}
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">
                  Save Address As
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "Home", Icon: House },
                    { value: "Work", Icon: BriefcaseBusiness },
                  ].map(({ value, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={formData.addressType === value}
                      onClick={() =>
                        setFormData((previous) => ({
                          ...previous,
                          addressType: value,
                        }))
                      }
                      className={`flex h-14 items-center justify-center gap-3 border text-sm font-medium transition ${
                        formData.addressType === value
                          ? "border-[#111827] bg-[#111827] text-white"
                          : "border-gray-300 text-gray-600 hover:border-[#9A7B3F]"
                      }`}
                    >
                      <Icon size={18} />
                      {value}
                    </button>
                  ))}
                </div>
              </section>

              {/* Default address */}
              <label className="flex cursor-pointer items-start gap-3 border border-gray-200 p-4">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 accent-[#111827]"
                />
                <span>
                  <span className="block text-sm font-medium">
                    Set as default address
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-gray-500">
                    Use this address as your preferred delivery address.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 p-5 sm:flex-row sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={goBack}
                disabled={saving}
                className="h-12 border border-gray-300 px-6 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="h-12 bg-[#111827] px-8 text-sm font-medium text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditAddress;
