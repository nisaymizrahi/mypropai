import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import UserInfoBanner from "./UserInfoBanner";
import {
  HomeIcon,
  ClipboardListIcon,
  BriefcaseIcon,
  UsersIcon,
  CogIcon,
  PlusCircleIcon,
  ChartBarIcon,
  FolderOpenIcon,
} from "@heroicons/react/outline";

const navSections = [
  {
    title: "Main",
    links: [
      { to: "/dashboard", label: "Dashboard", icon: HomeIcon },
      { to: "/leads", label: "Leads", icon: ClipboardListIcon },
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
      { to: "/applications", label: "Applications", icon: ClipboardListIcon },
      { to: "/team", label: "Team", icon: UsersIcon },
    ],
  },
  {
    title: "Tools",
    links: [
      { to: "/tools", label: "Financial Tools", icon: ChartBarIcon },
      { to: "/reports", label: "Reports", icon: ClipboardListIcon },
    ],
  },
];

const Sidebar = ({ isExpanded }) => (
  <aside className="min-h-screen bg-white border-r border-gray-200 w-20 lg:w-64 transition-all duration-300 flex flex-col">
    <div className="p-4 border-b">
      <Link to="/dashboard" className="text-xl font-bold text-brand-turquoise block text-center">
        {isExpanded ? "MyPropAI" : "AI"}
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
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive
                        ? "bg-brand-turquoise-100 text-brand-turquoise-700"
                        : "text-gray-700 hover:bg-gray-100"
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
    <div className="p-2">
      {isExpanded && (
        <button className="w-full flex items-center justify-center px-3 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-100">
          <CogIcon className="h-5 w-5 mr-2" />
          Settings
        </button>
      )}
    </div>
  </aside>
);

function DashboardLayout({ children }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

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
        <Sidebar isExpanded={isSidebarExpanded} />
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="flex-shrink-0 w-64 bg-white border-r border-gray-200">
            <Sidebar isExpanded={true} />
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
