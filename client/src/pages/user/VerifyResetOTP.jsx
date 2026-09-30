import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import Navbar from "../../components/layout/Navbar";
import axios from "axios";

const VerifyResetOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");

  const handleVerifyOTP = async () => {
    if (!email) {
      alert("Email not found");
      navigate("/user/forgot-password");
      return;
    }

    if (!otp) {
      alert("Please enter the OTP");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/user/verify-reset-otp",
        {
          email,
          otp,
        }
      );

      alert(response.data.message);

      // We'll replace this with a secure reset token later
      navigate("/user/reset-password", {
        state: { email },
      });

    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Invalid OTP"
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
              Verify OTP
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Enter the OTP sent to your email address.
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="space-y-5">

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  OTP
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  className="w-full h-11 border border-gray-300 px-3 text-sm tracking-widest outline-none focus:border-gray-600"
                  placeholder="Enter 6-digit OTP"
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                className="w-full h-11 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
              >
                Verify OTP
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VerifyResetOTP;