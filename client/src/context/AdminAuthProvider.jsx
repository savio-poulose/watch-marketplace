import { useEffect, useState } from "react";
import axios from "axios";
import AdminAuthContext from "./AdminAuthContext.jsx";

const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAdminAuth = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/admin/me",
        {
          withCredentials: true,
        }
      );

      setAdmin(response.data.admin);
    } catch (error) {
      setAdmin(null);

      console.log(
        "ADMIN AUTH CHECK ERROR:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const logoutAdmin = async () => {
    try {
      await axios.post(
        "http://localhost:3000/api/admin/logout",
        {},
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.log(
        "ADMIN LOGOUT ERROR:",
        error.response?.data || error.message
      );
    } finally {
      setAdmin(null);
    }
  };

  useEffect(() => {
    checkAdminAuth();
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        setAdmin,
        loading,
        checkAdminAuth,
        logoutAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthProvider;