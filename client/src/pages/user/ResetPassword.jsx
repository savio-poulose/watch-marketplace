import { useState } from "react";
// import Navbar from "../../components/layout/Navbar";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      alert("Email not found");
      navigate("/user/forgot-password");
      return;
    }

    if (!newPassword || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    try {
      const response = await axios.put(
        "http://localhost:3000/api/user/reset-password",
        {
          email,
          newPassword,
        }
      );

      alert(response.data.message);

      navigate("/user/login", {
        replace: true,
      });
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to reset password"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <Navbar /> */}

      <div className="px-6 py-10">
        <div className="max-w-xl mx-auto">

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Reset Password
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Enter your new password below.
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="space-y-5">

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  NEW PASSWORD
                </label>

                <div className="relative">
                  <input
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    className="w-full h-11 border border-gray-300 px-3 pr-12 text-sm outline-none focus:border-gray-600"
                    placeholder="Enter new password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        !showNewPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                  >
                    {showNewPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  CONFIRM NEW PASSWORD
                </label>

                <div className="relative">
                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    className="w-full h-11 border border-gray-300 px-3 pr-12 text-sm outline-none focus:border-gray-600"
                    placeholder="Confirm new password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleResetPassword}
                  className="w-full h-11 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
                >
                  Reset Password
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;