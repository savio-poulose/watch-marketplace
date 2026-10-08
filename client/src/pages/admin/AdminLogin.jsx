
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAdminAuth } from "../../context/useAdminAuth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { checkAdminAuth } = useAdminAuth();

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    try {
      await axios.post(
        "http://localhost:3000/api/admin/login",
        data,
        {
          withCredentials: true,
        }
      );

      await checkAdminAuth();

      toast.success("Login successful");
      navigate("/admin/dashboard");

    } catch (err) {
      console.log("ADMIN LOGIN ERROR:", err);

      if (err.response) {
        toast.error(
          err.response.data.message || "Admin login failed"
        );
      } else {
        toast.error("Something went wrong");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-5">
      <div className="w-full max-w-lg bg-white p-8 shadow-lg">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-wider text-gray-900">
            ADMIN LOGIN
          </h1>
        </div>

        <form
          className="space-y-5"
          onSubmit={handleSubmit}
        >

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full h-11 bg-gray-100 px-3 text-sm outline-none border border-transparent focus:border-[#b79b62]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full h-11 bg-gray-100 px-3 text-sm outline-none border border-transparent focus:border-[#b79b62]"
            />
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-gray-900 text-white text-sm font-medium tracking-wider cursor-pointer hover:bg-gray-800 transition"
          >
            LOGIN
          </button>

        </form>
      </div>
    </div>
  );
};

export default AdminLogin;