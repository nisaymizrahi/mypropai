import React from "react";
import { Link, useNavigate } from "react-router-dom";

function DashboardLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie = "token=; Max-Age=0; path=/;";
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-6 space-y-6">
        <h1 className="text-2xl font-bold mb-6">MyPropAI</h1>
        <nav className="space-y-4">
          <Link to="/dashboard" className="block hover:text-blue-300">
            Dashboard
          </Link>
          <Link to="/comps" className="block hover:text-blue-300">
            Comps Tool
          </Link>
          <Link to="/investments" className="block hover:text-blue-300">
            My Investments
          </Link>
          <Link to="/investments/new" className="block hover:text-blue-300">
            Add Investment
          </Link>
          <button
            onClick={handleLogout}
            className="mt-8 block w-full text-left text-red-400 hover:text-red-600"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}

export default DashboardLayout;
