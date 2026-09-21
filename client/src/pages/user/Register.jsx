// import { useState } from "react";
import axios from "axios";
import { useNavigate,Link } from "react-router-dom";


const Register = () => {
  const navigate = useNavigate();

  async function handleSubmit(event) {
    console.log("handlesubmit");
    event.preventDefault();
    //    console.log(event.target)
    const formData = new FormData(event.target);
    console.log(formData);

    const data = Object.fromEntries(formData);

    console.log(data);

    const userName = data.userName.trim();
    if (userName === "") {
      alert("enter username");
      return;
    }

    if (data.password !== data.confirmPassword) {
      alert("password doesnt match confirm password");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/user/register",
        data,
      );
      console.log(response.data);
      navigate("/user/login");
    } catch (error) {
      console.log(error.message);

      if (error.response) {
        alert(error.response.data.message);
      } else {
        alert("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-5">
      <div className="w-full max-w-lg bg-white p-8 shadow-lg">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-wider text-gray-900">
            CREATE AN ACCOUNT
          </h1>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* First + Last Name */}
          <div className="">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>

              <input
                type="text"
                name="userName"
                placeholder="William"
                className="w-full h-11 bg-gray-100 px-3 text-sm outline-none border border-transparent focus:border-[#b79b62]"
              />
            </div>
          </div>

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

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="new-password"
              className="w-full h-11 bg-gray-100 px-3 text-sm outline-none border border-transparent focus:border-[#b79b62]"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              autoComplete="new-password"
              className="w-full h-11 bg-gray-100 px-3 text-sm outline-none border border-transparent focus:border-[#b79b62]"
            />
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />

            <p className="text-xs text-gray-500">
              I agree to the Terms and Conditions and Privacy Policy.
            </p>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="w-full h-11 bg-gray-900 text-white text-sm font-medium tracking-wider cursor-pointer hover:bg-gray-800 transition"
          >
            CREATE ACCOUNT
          </button>
        </form>

        {/* Login */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 cursor-pointer">
            Already have an account?
          </p>

          <Link to="/user/login">
          <button
            type="button"
            className="text-sm font-semibold cursor-pointer text-gray-900 mt-1 hover:text-[#b79b62]"
          >
            SIGN IN
          </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
