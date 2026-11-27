import React from "react";
import ReactDOM from "react-dom/client";
import AuthProvider from "./context/AuthProvider.jsx";
import AdminAuthProvider from "./context/AdminAuthProvider.jsx";
import CartWishlistProvider from "./context/CartWishlistProvider.jsx";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <AuthProvider>
        <CartWishlistProvider>
          <App />
        </CartWishlistProvider>
      </AuthProvider>
    </AdminAuthProvider>
  </React.StrictMode>,
);
