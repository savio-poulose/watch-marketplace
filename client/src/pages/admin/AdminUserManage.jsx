import { FaSearch, FaBan, FaCheck } from "react-icons/fa";
import MainLayout from "../../components/admin/MainLayout";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AdminUserManage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [users, setUsers] = useState([]);
  const [showBlockPopup, setShowBlockPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    async function getAllUsers() {
      try {
        const token = localStorage.getItem("adminToken");

        const response = await axios.get(
          "http://localhost:3000/api/admin/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log(response.data.users);
        setUsers(response.data.users);
      } catch (err) {
        console.log(err);
        toast.error(err.message)
      }
    }

    getAllUsers();
  }, []);

  const handleStatusClick = (user) => {
    setSelectedUser(user);
    setShowBlockPopup(true);
  };
  const handleToggleBlock = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      const response = await axios.patch(
        `http://localhost:3000/api/admin/users/${selectedUser._id}/block`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log(response.data);

      // Update the user in React state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === selectedUser._id
            ? {
                ...user,
                isBlocked: !user.isBlocked,
              }
            : user,
        ),
      );

      
      toast.error(response.data.message)

      setShowBlockPopup(false);
      setSelectedUser(null);
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || err.message)
    }
  };

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      (user.userName || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search);

    const matchesStatus =
      selectedStatus === "" ||
      (selectedStatus === "active" && !user.isBlocked) ||
      (selectedStatus === "blocked" && user.isBlocked);

    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#9A7B3F]">CUSTOMERS</p>

          <h1 className="text-2xl font-semibold text-[#111827] mt-1">
            User Management
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage registered customers and their account status
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-gray-200 p-5 mb-6">
        <div className="flex gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full border border-gray-200 pl-11 pr-4 py-3 text-sm outline-none focus:border-[#9A7B3F]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-200 px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#9A7B3F]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white border border-gray-200">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-[#111827]">User List</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  USER
                </th>

                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  EMAIL
                </th>

                <th className="px-6 py-4 text-xs font-medium text-gray-500">
                  REGISTERED
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
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  {/* USER */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Profile Image */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#111827] text-white flex items-center justify-center text-sm font-medium">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.userName?.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-[#111827]">
                          {user.userName}
                        </p>

                        <p className="text-xs text-gray-400">Customer</p>
                      </div>
                    </div>
                  </td>

                  {/* EMAIL */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.email}
                  </td>

                  {/* REGISTERED */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs ${
                        user.isBlocked
                          ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {user.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {/* View */}

                      {/* Block / Activate */}
                      {user.isBlocked ? (
                        <button
                          type="button"
                          onClick={() => handleStatusClick(user)}
                          className="text-gray-500 cursor-pointer hover:text-green-600 transition"
                          title="Activate User"
                        >
                          <FaCheck />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusClick(user)}
                          className="text-gray-500 cursor-pointer hover:text-red-600 transition"
                          title="Block User"
                        >
                          <FaBan />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showBlockPopup && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#111827]">
              {selectedUser.isBlocked ? "Activate User" : "Block User"}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to{" "}
              <span className="font-medium text-[#111827]">
                {selectedUser.isBlocked ? "activate" : "block"}
              </span>{" "}
              <span className="font-medium text-[#111827]">
                {selectedUser.userName}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowBlockPopup(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleToggleBlock}
                className={`px-4 py-2 text-sm text-white ${
                  selectedUser.isBlocked
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {selectedUser.isBlocked ? "Activate User" : "Block User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default AdminUserManage;
