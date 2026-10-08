import { useEffect, useState } from "react";
import axios from "axios";
import AuthContext from "./AuthContext";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/user/me",
        {
          withCredentials: true,
        }
      );

      setUser(response.data.user);
    } catch (error) {
      setUser(null);
      console.log("AUTH CHECK ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        "http://localhost:3000/api/user/logout",
        {},
        {
          withCredentials: true,
        }
      );
    } catch (error) {
      console.log("LOGOUT ERROR:", error.response?.data);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;