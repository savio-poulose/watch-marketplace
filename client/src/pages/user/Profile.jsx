import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Navbar from "../../components/layout/Navbar";
import api from "../../api/axios.js";
import { useAuth } from "../../context/useAuth";
import { Wallet,TicketPercent  } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Profile state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserName, setEditUserName] = useState("");
  const [saving, setSaving] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);

  // Fetch profile
  useEffect(() => {
    let active = true;

    const fetchUserInfo = async () => {
      try {
        const response = await api.get("/user/profile");

        if (!active) return;

        const fetchedUser = response.data.user;
        setUser(fetchedUser);
        setEditUserName(fetchedUser.userName || "");
      } catch (err) {
        if (!active) return;

        toast.error(err.response?.data?.message || "Failed to load profile.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchUserInfo();

    return () => {
      active = false;
    };
  }, []);

  // Fetch saved addresses
  const fetchAddresses = useCallback(async () => {
    setAddressLoading(true);

    try {
      const response = await api.get("/user/address");
      setAddresses(response.data.addresses || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load addresses.");
    } finally {
      setAddressLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully.");
      navigate("/user/login");
    } catch {
      toast.error("Unable to log out. Please try again.");
    }
  };

  // Update username
  const handleSaveProfile = async () => {
    if (!editUserName.trim()) {
      toast.error("Username cannot be empty.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(`/user/profile/${user._id}`, {
        userName: editUserName.trim(),
      });

      setUser(response.data.user);
      setEditUserName(response.data.user.userName);
      setIsEditing(false);

      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // Upload profile photo
  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await api.put(
        `/user/profile/${user._id}/photo`,
        formData,
      );

      setUser(response.data.user);
      toast.success("Profile photo updated successfully.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update profile photo.",
      );
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  // Navigate to address form
  const handleAddAddress = () => {
    navigate("/user/address/add");
  };

  const handleEditAddress = (addressId) => {
    navigate(`/user/address/edit/${addressId}`);
  };

  // Delete address
  const handleDeleteAddress = async (addressId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?",
    );

    if (!confirmed) return;

    try {
      const response = await api.delete(`/user/address/${addressId}`);

      toast.success(response.data.message || "Address deleted successfully.");

      await fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete address.");
    }
  };

  // Set default address
  const handleDefaultAddress = async (addressId) => {
    try {
      const response = await api.patch(
        `/user/address/${addressId}/default`,
        {},
      );

      toast.success(response.data.message || "Default address updated.");

      await fetchAddresses();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update default address.",
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-500">Unable to load profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[#111827]">
      <Navbar />

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your account information and addresses.
            </p>
          </header>

          {/* Profile information */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Profile card */}
            <section className="border border-gray-200 bg-white p-6">
              <div className="flex flex-col items-center text-center">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="h-24 w-24 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#111827] text-3xl font-semibold text-white">
                    {user.userName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}

                <h2 className="mt-4 text-lg font-medium text-gray-900">
                  {user.userName}
                </h2>

                <p className="break-all text-sm text-gray-500">{user.email}</p>

                <input
                  type="file"
                  accept="image/*"
                  id="profileImage"
                  className="hidden"
                  onChange={handleProfileImageChange}
                  disabled={saving}
                />

                <label
                  htmlFor="profileImage"
                  className={`mt-5 cursor-pointer border border-gray-300 px-5 py-2 text-sm transition hover:bg-gray-50 ${
                    saving ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  {saving ? "Uploading..." : "Change Photo"}
                </label>
              </div>
            </section>

            {/* Account information */}
            <section className="border border-gray-200 bg-white p-6 lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Account Information
                </h2>

                <div className="flex items-center gap-4">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditUserName(user.userName || "");
                        setIsEditing(false);
                      }}
                      disabled={saving}
                      className="text-sm text-gray-500 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      if (isEditing) {
                        handleSaveProfile();
                      } else {
                        setEditUserName(user.userName || "");
                        setIsEditing(true);
                      }
                    }}
                    className="text-sm font-medium text-[#9A7B3F] hover:text-[#785e2f] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : isEditing ? "Save" : "Edit"}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="userName"
                    className="mb-2 block text-xs font-medium text-gray-500"
                  >
                    USERNAME
                  </label>

                  <input
                    id="userName"
                    type="text"
                    value={editUserName}
                    onChange={(event) => setEditUserName(event.target.value)}
                    readOnly={!isEditing}
                    className={`h-11 w-full border border-gray-300 px-3 text-sm text-gray-700 outline-none focus:border-[#9A7B3F] ${
                      isEditing ? "bg-white" : "bg-gray-50"
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-medium text-gray-500"
                  >
                    EMAIL
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={user.email || ""}
                    readOnly
                    className="h-11 w-full border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700 outline-none"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* My Addresses */}
          <section className="mt-6 border border-gray-200 bg-white p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  My Addresses
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your delivery addresses.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddAddress}
                className="h-10 cursor-pointer bg-[#111827] px-5 text-sm font-medium text-white transition hover:bg-[#1f2937]"
              >
                + Add Address
              </button>
            </div>

            {addressLoading ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-500">Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="border border-dashed border-gray-300 py-10 text-center">
                <p className="text-sm text-gray-500">No addresses added yet.</p>

                <button
                  type="button"
                  onClick={handleAddAddress}
                  className="mt-3 cursor-pointer text-sm font-medium text-[#9A7B3F] underline"
                >
                  Add your first address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {addresses.map((address) => (
                  <article
                    key={address._id}
                    className="border border-gray-200 p-5 transition hover:border-gray-300"
                  >
                    {/* Address heading */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {address.fullName}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {address.phone}
                        </p>
                      </div>

                      <span className="shrink-0 border border-gray-200 px-2 py-1 text-xs text-gray-600">
                        {address.addressType}
                      </span>
                    </div>

                    {/* Address details */}
                    <p className="text-sm leading-6 text-gray-600">
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                      <br />
                      {address.city}, {address.state} - {address.pincode}
                    </p>

                    {address.isDefault && (
                      <span className="mt-3 inline-block text-xs font-semibold uppercase tracking-wider text-[#9A7B3F]">
                        Default Address
                      </span>
                    )}

                    {/* Actions */}
                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-gray-100 pt-4">
                      <button
                        type="button"
                        onClick={() => handleEditAddress(address._id)}
                        className="cursor-pointer text-sm font-medium text-gray-700 transition hover:text-[#9A7B3F]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(address._id)}
                        className="cursor-pointer text-sm font-medium text-red-600 transition hover:text-red-700"
                      >
                        Delete
                      </button>

                      {!address.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDefaultAddress(address._id)}
                          className="cursor-pointer text-sm font-medium text-gray-700 transition hover:text-[#9A7B3F]"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Wallet and Coupons */}
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate("/user/wallet")}
              className="flex items-center justify-between border border-gray-200 bg-white p-6 text-left transition hover:border-[#9A7B3F] hover:shadow-sm cursor-pointer"
            >
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">
                  My Wallet
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  View balance and refund transactions.
                </p>
              </div>
              <Wallet className="h-8 w-8 text-[#9A7B3F]" />
            </button>

            
          </section>

          {/* Account security */}
          <section className="mt-6 border border-gray-200 bg-white p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Account Security
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your password and account security.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/user/change-password")}
                  className="border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  Change Password
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/user/forget-password")}
                  className="border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  Forgot Password
                </button>
              </div>
            </div>
          </section>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 h-11 w-full cursor-pointer border border-red-300 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            LOG OUT
          </button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
