import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/user/Register.jsx";
import Home from "./pages/user/Home.jsx";
import Login from "./pages/user/Login.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProduct from "./pages/admin/AdminProduct.jsx";
import AdminCategory from "./pages/admin/AdminCategory.jsx";

import ProtectedRoute from "./components/user/ProtectedRoute.jsx";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute.jsx";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/user/register" element={<Register />} />
          <Route path="/user/login" element={<Login />} />

           <Route path="/admin/login" element={<AdminLogin />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/user" element={<Home />} />
          </Route>

          <Route element={<ProtectedAdminRoute/>}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/product" element={<AdminProduct />} />
            <Route path="/admin/categories" element={<AdminCategory />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
