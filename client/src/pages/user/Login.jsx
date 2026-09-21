import axios from "axios";
import { useNavigate,Link } from "react-router-dom";

const Login = () => {

    const navigate = useNavigate()

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
      if (response) {
        navigate("/user");
      }
    } catch (err) {
      console.log(err);

      if(err.response){
        alert(err.response.data.message)
      }else{
        alert("something went wrong")
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

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="new-password"
              className="w-full h-11 bg-gray-100 px-3 text-sm outline-none border border-transparent focus:border-[#b79b62]"
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="w-full h-11 bg-gray-900 text-white text-sm font-medium tracking-wider cursor-pointer hover:bg-gray-800 transition"
          >
            LOGIN
          </button>
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
