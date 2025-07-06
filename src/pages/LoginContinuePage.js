import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginContinuePage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Please click below to continue login");

  const handleManualCheck = async () => {
    setStatus("Checking login...");

    const token = localStorage.getItem("token"); // ✅ read token from storage

    if (!token) {
      setStatus("No token found. Please log in again.");
      return;
    }

    try {
      const res = await fetch("https://mypropai-server.onrender.com/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setStatus("Login successful. Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        setStatus("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setStatus("Network error. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      <h1 className="text-2xl font-bold mb-4">{status}</h1>
      <button
        onClick={handleManualCheck}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Continue to Dashboard
      </button>
    </div>
  );
};

export default LoginContinuePage;
