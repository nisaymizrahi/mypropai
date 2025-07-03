import React from "react";
import { useAuth } from "../context/AuthContext";

const UserInfoBanner = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-white border-b px-6 py-3 text-sm text-gray-700 flex justify-between items-center">
      <div>
        Logged in as <strong>{user.name}</strong> ({user.email})
      </div>
    </div>
  );
};

export default UserInfoBanner;
