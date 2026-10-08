import React from "react";
import ReactDOM from "react-dom/client";
import AuthProvider from "./context/AuthProvider.jsx";
import AdminAuthProvider from "./context/AdminAuthProvider.jsx";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AdminAuthProvider>
  </React.StrictMode>,
);
