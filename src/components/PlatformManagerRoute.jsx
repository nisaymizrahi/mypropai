import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-brand-turquoise" />
  </div>
);

const PlatformManagerRoute = ({ children }) => {
  const location = useLocation();
  const { authenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.profileCompletionRequired && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }

  if (!user?.isPlatformManager) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PlatformManagerRoute;
