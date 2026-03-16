import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { useAuth } from "../context/AuthContext";

const LoadingSpinner = () => (
  <div className="public-shell flex min-h-screen items-center justify-center px-4 text-ink-900">
    <div className="surface-panel flex w-full max-w-sm flex-col items-center px-7 py-8 text-center">
      <BrandLogo imageClassName="h-12 max-w-[120px]" />
      <div className="loading-ring mt-5 h-10 w-10 animate-spin rounded-full" />
      <h1 className="mt-5 font-display text-[2rem] leading-none text-ink-900">Just a moment</h1>
      <p className="mt-3 text-sm leading-6 text-ink-600">
        We&apos;re checking your session and opening the workspace.
      </p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
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

  return children;
};

export default ProtectedRoute;
