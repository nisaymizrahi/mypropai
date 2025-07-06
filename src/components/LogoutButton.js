import React from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const LogoutButton = () => {
  const navigate = useNavigate();
  const { authenticated, setUser, setAuthenticated, setToken } = useAuth();

  const handleLogout = () => {
    logoutUser(); // ✅ remove token from localStorage
    setAuthenticated(false);
    setUser(null);
    setToken(null);
    navigate("/login");
  };

  if (!authenticated) return null;

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
