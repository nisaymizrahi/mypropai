import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import UserInfoBanner from "./UserInfoBanner";

// --- SVG Icon Components ---
const HomeIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> );
const SearchIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const BriefcaseIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> );
const PlusCircleIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> );
const HomeDollarIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline><path d="M12 15s-2-1.5-2-3c0-1.1.9-2 2-2s2 .9 2 2c0 1.5-2 3-2 3z"></path></svg> );
const CalculatorIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="8" y2="14"></line><line x1="16" y1="18" x2="8" y2="18"></line><line x1="10" y1="10" x2="14" y2="10"></line></svg> );
const MenuIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg> );
const CloseIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> );

const navLinks = [
  { to: "/dashboard", text: "Dashboard", icon: HomeIcon },
  { to: "/comps", text: "Comps Tool", icon: SearchIcon },
  { to: "/investments", text: "My Investments", icon: BriefcaseIcon },
  { to: "/management", text: "Management", icon: HomeDollarIcon },
  { to: "/tools", text: "Financial Tools", icon: CalculatorIcon },
  { to: "/investments/new", text: "Add Investment", icon: PlusCircleIcon },
];

function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const activeLinkStyle = "bg-brand-turquoise-100 text-brand-turquoise-600 font-semibold";
  const inactiveLinkStyle = "text-brand-gray-500 hover:bg-brand-gray-100 hover:text-brand-gray-900";

  // Handles closing the menu if you click outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* --- Desktop Sidebar (Visible on large screens) --- */}
      <aside className="w-64 bg-white border-r border-brand-gray-200 flex-col hidden lg:flex">
        <div className="p-6 border-b border-brand-gray-200">
          <h1 className="text-2xl font-bold text-brand-turquoise tracking-wider">MyPropAI</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${isActive ? activeLinkStyle : inactiveLinkStyle}`}>
              <link.icon className="h-5 w-5 mr-3" />
              <span>{link.text}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col">
        {/* --- Top Header (Main content header) --- */}
        <header className="bg-white border-b border-brand-gray-200">
            <div className="flex items-center justify-between px-4 h-16">
                {/* Mobile Menu Button (visible on small screens) */}
                <div className="lg:hidden">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-gray-100">
                        {isMobileMenuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                    </button>
                </div>
                {/* User Info Banner now lives inside the main header */}
                <div className="flex-1 flex justify-end">
                    <UserInfoBanner />
                </div>
            </div>
            
            {/* --- Mobile Dropdown Menu --- */}
            {isMobileMenuOpen && (
                <nav ref={menuRef} className="lg:hidden border-t bg-white">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <NavLink key={link.to} to={link.to} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive ? activeLinkStyle : inactiveLinkStyle}`}>
                                <link.icon className="h-6 w-6 mr-3" />
                                <span>{link.text}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>
            )}
        </header>
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
