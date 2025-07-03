import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("https://mypropai-server.onrender.com/api/auth/me", {
          method: "GET",
          credentials: "include", // ✅ Important to send cookies
        });

        if (res.ok) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
        }
      } catch (err) {
        setAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (authenticated === null) return null; // Still checking

  return authenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
