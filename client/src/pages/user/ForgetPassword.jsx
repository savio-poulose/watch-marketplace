import { useState } from "react";
// import Navbar from "../../components/layout/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgetPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const handleSendOTP = async () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/user/forgot-password",
        {
          email,
        }
      );

      alert(response.data.message);

      // Later we'll pass the email to the OTP page
      navigate("/user/verify-reset-otp", {
        state: { email },
      });
    } catch (err) {
      alert(
        err.response?.data?.message || err.message
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
              Forgot Password
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Enter your email address and we'll send you an OTP.
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="space-y-5">

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  EMAIL ADDRESS
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 border border-gray-300 px-3 text-sm outline-none focus:border-gray-600"
                  placeholder="Enter your email"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSendOTP}
                  className="w-full h-11 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
                >
                  Send OTP
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate("/user/login")}
                className="w-full text-sm text-gray-500 hover:text-gray-900"
              >
                Back to Login
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;