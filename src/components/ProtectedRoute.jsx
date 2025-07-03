import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="));

    setAuthenticated(!!token);
  }, []);

  if (authenticated === null) return null; // prevent flicker

  return authenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
