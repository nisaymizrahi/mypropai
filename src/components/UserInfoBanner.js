import React from "react";
import { useAuth } from "../context/AuthContext";

// SVG Icon for the user banner
const UserIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const UserInfoBanner = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    // NEW: Redesigned classes for the light theme
    <div className="bg-white border-b border-brand-gray-200 px-6 py-3 text-sm text-brand-gray-600 flex justify-end items-center">
      <div className="flex items-center">
        <UserIcon className="h-5 w-5 mr-2 text-brand-gray-400" />
        <span>
          Logged in as <strong className="font-semibold text-brand-gray-800">{user.name}</strong> ({user.email})
        </span>
      </div>
    </div>
  );
};

export default UserInfoBanner;
