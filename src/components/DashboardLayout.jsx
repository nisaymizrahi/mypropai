import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import UserInfoBanner from "./UserInfoBanner";
import { useAuth } from "../context/AuthContext";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  BriefcaseIcon,
  UsersIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
  ChartBarIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';

const navSections = [
  {
    title: "Main",
    links: [
      { to: "/dashboard", label: "Dashboard", icon: HomeIcon },
      { to: "/leads", label: "Leads", icon: ClipboardDocumentListIcon },
    ],
  },
  {
    title: "Investments",
    links: [
      { to: "/investments", label: "My Investments", icon: BriefcaseIcon },
      { to: "/investments/new", label: "Add Investment", icon: PlusCircleIcon },
      { to: "/deal-analysis", label: "Deal Analyzer", icon: ChartBarIcon },
    ],
  },
  {
    title: "Management",
    links: [
      { to: "/management", label: "Properties", icon: FolderOpenIcon },
      { to: "/applications", label: "Applications", icon: ClipboardDocumentListIcon },
      { to: "/team", label: "Team", icon: UsersIcon },
    ],
  },
  {
    title: "Tools",
    links: [
      { to: "/tools", label: "Financial Tools", icon: ChartBarIcon },
      { to: "/reports", label: "Reports", icon: ClipboardDocumentListIcon },
    ],
  },
];

const Sidebar = ({ isExpanded, user }) => (
  <aside className={`min-h-screen bg-white border-r border-gray-200 ${isExpanded ? 'w-64' : 'w-20'} transition-all duration-300 flex flex-col`}>
    <div className="p-4 border-b flex items-center justify-center">
      <Link to="/dashboard" className="block">
        <img
          src="/fliprop_logo.png"
          alt="Fliprop"
          className={`${isExpanded ? "h-10 w-auto" : "h-8 w-8 mx-auto"}`}
        />
      </Link>
    </div>
    <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
      {navSections.map((section, idx) => (
        <div key={idx}>
          {isExpanded && (
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">
              {section.title}
            </div>
          )}
          <ul className="space-y-1">
            {section.links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border-l-4 ${
                      isActive
                        ? "bg-brand-turquoise-50 text-brand-turquoise-700 border-brand-turquoise"
                        : "text-gray-700 border-transparent hover:bg-gray-100"
                    }`
                  }
                >
                  <link.icon className="h-5 w-5" />
                  {isExpanded && <span>{link.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
    <div className="px-4 py-3 border-t border-gray-100">
      {isExpanded ? (
        <div className="text-sm text-gray-600">
          <NotificationBell />
          <div className="mt-2">
            Logged in as<br />
            <strong className="text-brand-turquoise">{user?.name}</strong>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <NotificationBell />
        </div>
      )}
    </div>
    <div className="p-2">
      {isExpanded && (
        <button className="w-full flex items-center justify-center px-3 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-100">
          <Cog6ToothIcon className="h-5 w-5 mr-2" />
          Settings
        </button>
      )}
    </div>
  </aside>
);

function DashboardLayout({ children }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className="hidden lg:flex"
      >
        <Sidebar isExpanded={isSidebarExpanded} user={user} />
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="flex-shrink-0 w-64 bg-white border-r border-gray-200">
            <Sidebar isExpanded={true} user={user} />
          </div>
          <div
            className="flex-grow bg-black bg-opacity-25"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              ☰
            </button>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserInfoBanner />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
