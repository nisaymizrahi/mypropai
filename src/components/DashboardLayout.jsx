import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import UserInfoBanner from "./UserInfoBanner";
import NotificationBell from "./NotificationBell"; // ✅ Added

const navLinks = [
  { to: "/dashboard", text: "Dashboard" },
  { to: "/leads", text: "Leads" },
  { to: "/investments", text: "Investments" },
  { to: "/management", text: "Management" },
  { to: "/applications", text: "Applications" },
  { to: "/tools", text: "Financial Tools" },
  { to: "/investments/new", text: "Add Investment" },
];

const NavItem = ({ to, text, isExpanded, onClick }) => {
  const activeLinkStyle = "bg-brand-turquoise-100 text-brand-turquoise-600 font-semibold";
  const inactiveLinkStyle = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center p-2 rounded-lg transition-colors duration-200 ${
          isActive ? activeLinkStyle : inactiveLinkStyle
        }`
      }
    >
      <span className={`overflow-hidden transition-all ${isExpanded ? "w-40 ml-3" : "w-0"}`}>{text}</span>
    </NavLink>
  );
};

function DashboardLayout({ children }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
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
      <aside
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`bg-white border-r border-gray-200 hidden lg:flex flex-col transition-all duration-300 ease-in-out z-40 ${
          isSidebarExpanded ? "w-64" : "w-20"
        }`}
      >
        <div className="p-4 border-b h-16 flex items-center justify-center">
          <Link to="/dashboard" className="text-3xl font-bold text-brand-turquoise">
            {isSidebarExpanded ? "MyPropAI" : "AI"}
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => (
            <NavItem key={link.to} {...link} isExpanded={isSidebarExpanded} />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div ref={mobileMenuRef} className="relative">
            <div className="flex items-center justify-between px-4 h-16">
              <div className="lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  ☰
                </button>
              </div>
              <div className="flex-1 flex justify-end items-center gap-4">
                <NotificationBell /> {/* 🔔 Added */}
                <UserInfoBanner />
              </div>
            </div>
            {isMobileMenuOpen && (
              <nav className="lg:hidden border-b bg-white absolute w-full shadow-lg">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navLinks.map((link) => (
                    <NavItem
                      key={link.to}
                      {...link}
                      isExpanded={true}
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
                </div>
              </nav>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
