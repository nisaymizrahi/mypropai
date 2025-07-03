import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>; // Optional: use a spinner
  }

  return authenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
