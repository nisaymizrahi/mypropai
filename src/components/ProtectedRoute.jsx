import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoadingSpinner = () => (
  <div className="public-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 text-ink-900">
    <div className="absolute inset-0 grid-fade opacity-25" />
    <div className="ambient-orb ambient-orb-bronze float-slower left-[-7rem] top-[-3rem] h-[15rem] w-[15rem]" />
    <div className="ambient-orb ambient-orb-sage float-slow right-[-6rem] top-16 h-[14rem] w-[14rem]" />

    <div className="surface-panel-strong relative flex w-full max-w-md flex-col items-center px-8 py-10 text-center">
      <div className="brand-mark flex h-16 w-16 items-center justify-center rounded-[22px] text-xl font-semibold text-white">
        FL
      </div>
      <div className="loading-ring mt-6 h-12 w-12 animate-spin rounded-full" />
      <span className="eyebrow mt-6">Preparing workspace</span>
      <h1 className="mt-5 font-display text-[2.6rem] leading-none text-ink-900">Just a moment</h1>
      <p className="mt-3 text-sm leading-6 text-ink-600">
        We&apos;re checking your session and opening the refined workspace.
      </p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
