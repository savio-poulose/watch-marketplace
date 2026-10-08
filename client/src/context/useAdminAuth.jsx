import { useContext } from "react";
import AdminAuthContext from "./AdminAuthContext.jsx";

export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};