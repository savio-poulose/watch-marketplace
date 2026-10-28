import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../../api/axios.js";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";

const VerifyRegisterOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve email from navigation state or fallback to sessionStorage
  const [email] = useState(() => {
    return location.state?.email || sessionStorage.getItem("pending_register_email") || "";
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  // Ensure email exists, otherwise redirect to register
  useEffect(() => {
    if (!email) {
      toast.error("No pending registration found. Please register first.");
      navigate("/user/register", { replace: true });
    }
  }, [email, navigate]);

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle single digit input
  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1); // Only keep the last numeric digit

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input if digit entered
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste for full 6 digits
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);

    // Focus last filled box or next empty box
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // Submit OTP verification
  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/user/verify-register-otp", {
        email,
        otp: fullOtp,
      });

      toast.success(response.data?.message || "Registration successful! Welcome to Luxury Watches.");
      sessionStorage.removeItem("pending_register_email");

      navigate("/user/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResend || resending) return;

    try {
      setResending(true);
      const response = await api.post("/user/resend-register-otp", { email });

      toast.success(response.data?.message || "A new verification code has been sent!");
      setTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-5">
      <div className="w-full max-w-lg bg-white p-8 sm:p-10 shadow-lg border border-gray-100">
        
        {/* Top Icon Badge */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#f8f5ee] border border-[#e5dcc7] flex items-center justify-center text-[#b79b62]">
            <ShieldCheck size={32} />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-wider text-gray-900 uppercase">
            Verify Your Email
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            We have sent a 6-digit verification code to
          </p>
          <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
            <Mail size={13} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-800 tracking-wide">
              {email}
            </span>
          </div>
        </div>

        {/* OTP Input Fields */}
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider text-center mb-3">
              Enter 6-Digit Code
            </label>

            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-gray-50 text-gray-900 border border-gray-300 outline-none transition focus:border-[#b79b62] focus:bg-white focus:ring-1 focus:ring-[#b79b62]"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          {/* Resend Timer / Action */}
          <div className="text-center pt-2">
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resending}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-[#b79b62] transition cursor-pointer"
              >
                <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
                {resending ? "Sending new code..." : "Resend Verification Code"}
              </button>
            ) : (
              <p className="text-xs text-gray-500">
                Didn't receive code? Resend in{" "}
                <span className="font-semibold text-gray-900">
                  {`00:${timer < 10 ? "0" : ""}${timer}`}
                </span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full h-11 bg-gray-900 text-white text-sm font-medium tracking-wider hover:bg-gray-800 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                VERIFYING...
              </>
            ) : (
              "VERIFY & COMPLETE REGISTRATION"
            )}
          </button>
        </form>

        {/* Back / Change Email Link */}
        <div className="text-center mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2">
          <Link
            to="/user/register"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft size={13} />
            Wrong email address? Back to registration
          </Link>
        </div>

      </div>
    </div>
  );
};

export default VerifyRegisterOTP;
