import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");

    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,

        callback: async (response) => {
          try {
            const result = await axios.post(
              "http://localhost:3000/api/user/google-login",
              {
                credential: response.credential,
              },
            );

            // console.log("BACKEND RESPONSE:", result.data);
            localStorage.setItem("userToken", result.data.token);
            navigate("/user/dashboard");
          } catch (error) {
            console.log("GOOGLE LOGIN ERROR:", error);
          }
        },
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleSignIn"),
        {
          theme: "outline",
          size: "large",
          text: "continue_with",
        },
      );
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    console.log(formData);

    const data = Object.fromEntries(formData);
    console.log(data);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/user/login",
        data,
      );

      console.log(response.data);

      localStorage.setItem("userToken", response.data.token);

      navigate("/user/dashboard");
    } catch (err) {
      console.log(err);

      if (err.response) {
        alert(err.response.data.message);
      } else {
        alert("something went wrong");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-5">
      <div className="w-full max-w-lg bg-white p-8 shadow-lg">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-wider text-gray-900">
            LOGIN
          </h1>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              className="w-full h-11 bg-gray-100 px-3 text-sm outline-none border border-transparent focus:border-[#b79b62]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                autoComplete="new-password"
                className="w-full h-11 bg-gray-100 px-3 pr-11 text-sm outline-none border border-transparent focus:border-[#b79b62]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="w-full h-11 bg-gray-900 text-white text-sm font-medium tracking-wider cursor-pointer hover:bg-gray-800 transition"
          >
            LOGIN
          </button>

          {/* Google Login */}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200"></div>

            <span className="text-xs text-gray-400">OR</span>

            <div className="flex-1  h-px bg-gray-200"></div>
          </div>

          <div id="googleSignIn" className="flex  justify-center"></div>
        </form>

        {/* register */}
        <div className="text-center mt-6">
          <Link to="/user/register">
            <p className="text-sm text-gray-500 cursor-pointer">
              Dont have an account?
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
