import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { authenticated, loading } = useAuth();

  // ⏳ Wait until auth check finishes
  if (loading) {
    return <p className="text-center p-4">Loading...</p>;
  }

  // ❌ If not authenticated, redirect
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ If authenticated, show child route
  return children;
};

export default PrivateRoute;
