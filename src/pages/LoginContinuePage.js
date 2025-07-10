import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// NEW: A spinner for visual feedback during the login process
const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-blue mb-6"></div>
);

const LoginContinuePage = () => {
  const navigate = useNavigate();
  const { setToken, setAuthenticated, setUser } = useAuth();
  const [status, setStatus] = useState("Finalizing login...");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (token) {
      // Set token in local storage and context
      localStorage.setItem("token", token);
      setToken(token);

      // Verify the token with the backend
      const verifyToken = async () => {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'https://mypropai-server.onrender.com'}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setAuthenticated(true);
            setStatus("Success! Redirecting to your dashboard...");
            setTimeout(() => navigate("/dashboard"), 1500);
          } else {
            throw new Error("Authentication failed.");
          }
        } catch (err) {
          console.error("Auth verification failed:", err);
          setStatus("Login failed. Please try again.");
          setTimeout(() => navigate("/login"), 2000);
        }
      };

      verifyToken();

    } else {
      // No token found, redirect to login
      setStatus("No token found. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    }
    
    // Clean up the URL
    window.history.replaceState({}, document.title, "/login-continue");

  }, [navigate, setAuthenticated, setToken, setUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-slate-300 text-center p-4">
      <LoadingSpinner />
      <h1 className="text-2xl font-bold text-brand-dark-100">{status}</h1>
    </div>
  );
};

export default LoginContinuePage;
