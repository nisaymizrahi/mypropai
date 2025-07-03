import React from "react";
import { Link } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import UserInfoBanner from "./UserInfoBanner";

function DashboardLayout({ children }) {
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
          <div className="mt-8">
            <LogoutButton />
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50">
        <UserInfoBanner />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

export default DashboardLayout;
