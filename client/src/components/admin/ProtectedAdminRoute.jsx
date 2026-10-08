import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/useAdminAuth";

function ProtectedAdminRoute() {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedAdminRoute;