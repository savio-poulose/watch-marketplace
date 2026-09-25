import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const token = localStorage.getItem("userToken");

        if (!token) {
          alert("Please login");
          return;
        }

        const decoded = jwtDecode(token);

        const response = await axios.get(
          `http://localhost:3000/api/user/profile/${decoded.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUser(response.data.user);
        console.log(response.data)
      } catch (err) {
  console.log("PROFILE ERROR:", err);
  console.log("RESPONSE:", err.response?.data);
  console.log("STATUS:", err.response?.status);

  alert(err.response?.data?.message || err.message);
} finally {
        setLoading(false);
      }
    }

    fetchUserInfo();
  }, []);


  const handleLogout = () => {
  localStorage.removeItem("userToken");
  navigate("/user/login");
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-gray-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="flex justify-center items-center py-20">
          <p className="text-sm text-gray-500">
            Unable to load profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      <div className="px-6 py-10">

        <div className="max-w-5xl mx-auto">

          {/* Header */}

          <div className="mb-8">

            <h1 className="text-2xl font-semibold text-gray-900">
              My Profile
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Manage your account information and addresses
            </p>

          </div>


          {/* Profile Information */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Profile Card */}

            <div className="bg-white border border-gray-200 p-6">

              <div className="flex flex-col items-center text-center">

                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />

                <h2 className="mt-4 text-lg font-medium text-gray-900">
                  {user.userName}
                </h2>

                <p className="text-sm text-gray-500">
                  {user.email}
                </p>

                <button className="mt-5 px-5 py-2 border border-gray-300 text-sm hover:bg-gray-50 transition">
                  Change Photo
                </button>

              </div>

            </div>


            {/* Account Information */}

            <div className="lg:col-span-2 bg-white border border-gray-200 p-6">

              <div className="flex items-center justify-between mb-6">

                <h2 className="text-lg font-medium text-gray-900">
                  Account Information
                </h2>

                <button className="text-sm text-gray-600 hover:text-gray-900">
                  Edit
                </button>

              </div>


              <div className="space-y-6">

                {/* Username */}

                <div>

                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    USERNAME
                  </label>

                  <input
                    type="text"
                    value={user.userName || ""}
                    readOnly
                    className="w-full h-11 border border-gray-300 px-3 text-sm text-gray-700 outline-none"
                  />

                </div>


                {/* Email */}

                <div>

                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    EMAIL
                  </label>

                  <input
                    type="email"
                    value={user.email || ""}
                    readOnly
                    className="w-full h-11 border border-gray-300 px-3 text-sm text-gray-700 outline-none"
                  />

                </div>

              </div>

            </div>

          </div>


          {/* Addresses */}

          <div className="mt-6 bg-white border border-gray-200 p-6">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-lg font-medium text-gray-900">
                  My Addresses
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Manage your delivery addresses
                </p>

              </div>

              <button className="h-10 px-5 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition">
                + Add Address
              </button>

            </div>


            {/* No Address */}

            <div className="border border-dashed border-gray-300 py-10 text-center">

              <p className="text-sm text-gray-500">
                No addresses added yet.
              </p>

              <button className="mt-3 text-sm text-gray-900 underline">
                Add your first address
              </button>

            </div>

          </div>


          {/* Account Links */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

            

          </div>
          <button
  onClick={handleLogout}
  className="mt-4 w-full h-10 border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition"
>
  LOGOUT
</button>

        </div>

      </div>

    </div>
  );
};

export default Profile;