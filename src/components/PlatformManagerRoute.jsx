import React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-brand-turquoise" />
  </div>
);

const PlatformManagerRoute = ({ children }) => {
  const { authenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isPlatformManager) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PlatformManagerRoute;
