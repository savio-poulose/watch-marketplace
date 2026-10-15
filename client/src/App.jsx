import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Register from "./pages/user/Register.jsx";
import Home from "./pages/user/Home.jsx";
import Login from "./pages/user/Login.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProduct from "./pages/admin/AdminProduct.jsx";
import AdminCategory from "./pages/admin/AdminCategory.jsx";
import Profile from "./pages/user/Profile.jsx";
import ChangePassword from "./pages/user/ChangePassword .jsx";
import ForgetPassword from "./pages/user/ForgetPassword.jsx";
import VerifyResetOTP from "./pages/user/VerifyResetOTP.jsx";
import ResetPassword from "./pages/user/ResetPassword.jsx";
import AdminUserManage from "./pages/admin/AdminUserManage.jsx";
import Collections from "./pages/user/Collections.jsx";
import ProductDetails from "./pages/user/ProductDetails.jsx";
import Cart from "./pages/user/Cart.jsx";
import AddAddress from "./pages/user/AddAddress.jsx";
import EditAddress from "./pages/user/EditAddress.jsx";
import Checkout from "./pages/user/Checkout.jsx";
import MyOrders from "./pages/user/MyOrders.jsx";
import OrderDetails from "./pages/user/OrderDetails.jsx"
import AdminOrder from "./pages/admin/AdminOrder.jsx";
import AdminCoupon from "./pages/admin/AdminCoupon.jsx";
import ProtectedRoute from "./components/user/ProtectedRoute.jsx";
import GuestRoute from "./components/user/GuestRoute.jsx";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute.jsx";
import GuestAdminRoute from "./components/admin/GuestAdminRoute.jsx";
import OrderSuccess from "./pages/user/OrderSuccess.jsx";
import Wishlist from "./pages/user/Wishlist.jsx";

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#ffffff",
            color: "#111827",
            border: "1px solid #9A7B3F",
          },
          success: {
            iconTheme: {
              primary: "#9A7B3F",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />

      <BrowserRouter>
        <Routes>
          {/* Guest Routes */}
          <Route element={<GuestRoute />}>
            <Route path="/user/register" element={<Register />} />
            <Route path="/user/login" element={<Login />} />
          </Route>

          <Route element={<GuestAdminRoute />}>
            <Route path="/admin/login" element={<AdminLogin />} />
          </Route>

          {/* User Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/user/dashboard" element={<Home />} />
            <Route path="/user/profile" element={<Profile />} />
            <Route path="/user/change-password" element={<ChangePassword />} />
            <Route path="/user/forget-password" element={<ForgetPassword />} />
            <Route path="/user/verify-reset-otp" element={<VerifyResetOTP />} />
            <Route path="/user/reset-password" element={<ResetPassword />} />
            <Route path="/user/collections" element={<Collections />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/user/cart" element={<Cart />} />
            <Route path="/user/address/add" element={<AddAddress />} />
            <Route path="/user/address/edit/:addressId" element={<EditAddress />} />
            <Route path="/user/checkout" element={<Checkout />} />
            <Route path="/user/order-success/:orderId" element={<OrderSuccess />} />
            <Route path="/user/orders" element={<MyOrders />} />
            <Route path="/user/order/:orderId" element={<OrderDetails />} />
            <Route path="/user/wishlist" element={<Wishlist />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/product" element={<AdminProduct />} />
            <Route path="/admin/categories" element={<AdminCategory />} />
            <Route path="/admin/users" element={<AdminUserManage />} />
            <Route path="/admin/orders" element={<AdminOrder />} />
            <Route path="/admin/coupon" element={<AdminCoupon />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
