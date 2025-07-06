import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LoginContinuePage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Checking login...");

  useEffect(() => {
    const confirmSession = async () => {
      // ✅ Delay slightly so Safari can attach cookie properly
      setTimeout(async () => {
        try {
          const res = await fetch("https://mypropai-server.onrender.com/api/auth/me", {
            method: "GET",
            credentials: "include",
          });

          if (res.ok) {
            setStatus("Login successful. Redirecting...");
            setTimeout(() => {
              navigate("/dashboard");
            }, 1000);
          } else {
            setStatus("Login failed. Please click below to try again.");
          }
        } catch (err) {
          console.error("Auth check failed:", err);
          setStatus("Network error. Please try again.");
        }
      }, 500); // ✅ Slight delay after redirect to help Safari
    };

    confirmSession();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      <h1 className="text-2xl font-bold mb-4">{status}</h1>
      {status.startsWith("Login failed") || status.startsWith("Network error") ? (
        <button
          onClick={() => window.location.href = "/login"}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      ) : null}
    </div>
  );
};

export default LoginContinuePage;
