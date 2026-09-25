import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  const token = localStorage.getItem("userToken");

  if (!token) {
    return <Navigate to="/user/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;