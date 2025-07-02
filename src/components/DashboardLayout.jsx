import React from "react";
import { Link, useLocation } from "react-router-dom";

const DashboardLayout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Comps Tool", path: "/comps" },
    { label: "Add Investment", path: "/investments/new" },
    { label: "My Investments", path: "/investments" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4 shadow-md">
        <h2 className="text-xl font-bold text-purple-700 mb-6">MyPropAI</h2>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded hover:bg-purple-100 ${
                location.pathname === item.path ? "bg-purple-200 font-semibold" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
};

export default DashboardLayout;
