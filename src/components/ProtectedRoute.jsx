import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { authenticated, loading, token } = useAuth();

  // Still checking auth
  if (loading || (token && !authenticated)) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return authenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
