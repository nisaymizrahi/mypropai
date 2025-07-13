import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoadingSpinner = () => (
    <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-turquoise"></div>
    </div>
);

const ProtectedRoute = ({ children }) => {
  const { authenticated, loading } = useAuth();

  // While the context is checking the token, show a loading spinner.
  if (loading) {
    return <LoadingSpinner />;
  }

  // After checking, if the user is authenticated, show the page. Otherwise, redirect to login.
  return authenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
