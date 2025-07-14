import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-turquoise"></div>
);

const LoginContinuePage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Get the token from the URL query string
    const token = new URLSearchParams(window.location.search).get("token");

    if (token) {
      // 1. Save the token using our context function.
      login(token);
      // 2. Immediately navigate to the dashboard. The ProtectedRoute will handle the loading state.
      navigate("/dashboard", { replace: true });
    } else {
      // If no token is found for any reason, go back to the login page.
      navigate("/login", { replace: true });
    }
  }, [login, navigate]); // The effect runs only once when the component loads

  // This page is only visible for a brief moment during the redirect.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-4">
      <LoadingSpinner />
      <h1 className="text-xl font-semibold text-gray-700">Finalizing login...</h1>
    </div>
  );
};

export default LoginContinuePage;
