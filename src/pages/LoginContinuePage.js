import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-turquoise"></div>
);

const LoginContinuePage = () => {
  const navigate = useNavigate();
  const { login, authenticated, loading } = useAuth();

  useEffect(() => {
    // Check for the token in the URL only once
    const tokenInUrl = new URLSearchParams(window.location.search).get("token");
    if (tokenInUrl && !localStorage.getItem('token')) {
        login(tokenInUrl);
    }
  }, [login]);


  useEffect(() => {
    // This separate effect handles navigation based on the auth state
    if (!loading) {
      if (authenticated) {
        navigate('/dashboard', { replace: true });
      } else {
        // If there was no token or the token was invalid, go to login
        navigate('/login', { replace: true });
      }
    }
  }, [loading, authenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-4">
      <LoadingSpinner />
      <h1 className="text-xl font-semibold text-gray-700">Finalizing login...</h1>
    </div>
  );
};

export default LoginContinuePage;
