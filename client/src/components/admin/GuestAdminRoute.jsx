import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/useAdminAuth";

function GuestAdminRoute() {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (admin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}

export default GuestAdminRoute;