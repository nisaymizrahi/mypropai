import React from "react";
import { NavLink } from "react-router-dom";
import LogoutButton from "./LogoutButton";
import UserInfoBanner from "./UserInfoBanner";

// --- SVG Icon Components (no changes needed here) ---

const HomeIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const SearchIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const BriefcaseIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);

const PlusCircleIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
);

const navLinks = [
  { to: "/dashboard", text: "Dashboard", icon: HomeIcon },
  { to: "/comps", text: "Comps Tool", icon: SearchIcon },
  { to: "/investments", text: "My Investments", icon: BriefcaseIcon },
  { to: "/investments/new", text: "Add Investment", icon: PlusCircleIcon },
];

// --- Redesigned DashboardLayout Component for Light Theme ---

function DashboardLayout({ children }) {
  // NEW: Styles for the light theme with turquoise accents
  const activeLinkStyle = "bg-brand-turquoise-100 text-brand-turquoise-600 font-semibold";
  const inactiveLinkStyle = "text-brand-gray-500 hover:bg-brand-gray-100 hover:text-brand-gray-900";

  return (
    <div className="flex min-h-screen">
      {/* NEW: Redesigned Sidebar for Light Theme */}
      <aside className="w-64 bg-white border-r border-brand-gray-200 flex flex-col">
        <div className="p-6 border-b border-brand-gray-200">
          <h1 className="text-2xl font-bold text-brand-turquoise tracking-wider">MyPropAI</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${isActive ? activeLinkStyle : inactiveLinkStyle}`
              }
            >
              <link.icon className="h-5 w-5 mr-3" />
              <span>{link.text}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-brand-gray-200">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content area (background color is set on the body in index.css) */}
      <main className="flex-1 flex flex-col">
        <UserInfoBanner />
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
