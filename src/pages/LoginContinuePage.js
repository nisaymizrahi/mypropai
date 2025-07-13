import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-turquoise"></div>
);

const LoginContinuePage = () => {
  const navigate = useNavigate();
  // 1. Get the new 'login' function from our context
  const { login } = useAuth();

  useEffect(() => {
    // 2. Get the token from the URL
    const token = new URLSearchParams(window.location.search).get("token");

    if (token) {
      // 3. Call the login function to save the token and trigger auth state update
      login(token);
      // 4. Redirect to the dashboard immediately
      navigate("/dashboard");
    } else {
      // If no token is found, go back to the login page
      navigate("/login");
    }
    
  }, [login, navigate]);

  // This page will only be visible for a moment during the redirect
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-slate-300 text-center p-4">
      <LoadingSpinner />
      <h1 className="text-2xl font-bold text-brand-dark-100">Finalizing login...</h1>
    </div>
  );
};

export default LoginContinuePage;
