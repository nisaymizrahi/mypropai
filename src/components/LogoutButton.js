import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// SVG Icon for the logout button
const LogOutIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);


const LogoutButton = () => {
  const navigate = useNavigate();
  const { authenticated, setUser, setAuthenticated, setToken } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("token"); 
    setAuthenticated(false);
    setUser(null);
    setToken(null);
    navigate("/login");
  };

  if (!authenticated) return null;

  return (
    <button
      onClick={handleLogout}
      // NEW: Redesigned classes for the light theme
      className="w-full flex items-center justify-center text-brand-gray-500 px-4 py-2.5 rounded-lg hover:bg-brand-gray-100 hover:text-brand-gray-800 transition-colors duration-200"
    >
        <LogOutIcon className="h-5 w-5 mr-2" />
        <span>Logout</span>
    </button>
  );
};

export default LogoutButton;
