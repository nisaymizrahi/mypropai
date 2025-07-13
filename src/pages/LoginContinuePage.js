import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-turquoise"></div>
);

const LoginContinuePage = () => {
  const navigate = useNavigate();
  const { login, authenticated } = useAuth();

  useEffect(() => {
    // If user is already authenticated, send them to the dashboard.
    if (authenticated) {
        navigate('/dashboard');
        return;
    }

    const token = new URLSearchParams(window.location.search).get("token");

    if (token) {
      // Call the login function to save the token. The context's own
      // useEffect will then fire, authenticate the user, and this
      // component will re-render, hitting the 'if (authenticated)' block above.
      login(token);
      // Remove the token from the URL for cleanliness
      window.history.replaceState({}, document.title, "/login-continue");
    } else {
      // If no token, go back to the login page
      navigate("/login");
    }
    
  }, [login, navigate, authenticated]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-slate-300 text-center p-4">
      <LoadingSpinner />
      <h1 className="text-2xl font-bold text-brand-dark-100">Finalizing login...</h1>
    </div>
  );
};

export default LoginContinuePage;
