import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import UserInfoBanner from "./UserInfoBanner";

// --- SVG Icon Components ---
const HomeIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> );
const TargetIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg> );
const BriefcaseIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> );
const HomeDollarIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline><path d="M12 15s-2-1.5-2-3c0-1.1.9-2 2-2s2 .9 2 2c0 1.5-2 3-2 3z"></path></svg> );
const CalculatorIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="8" y2="14"></line><line x1="16" y1="18" x2="8" y2="18"></line><line x1="10" y1="10" x2="14" y2="10"></line></svg> );
const PlusCircleIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> );
const MenuIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg> );
const CloseIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> );

const navLinks = [
  { to: "/dashboard", text: "Dashboard", icon: HomeIcon },
  { to: "/leads", text: "Leads", icon: TargetIcon },
  { to: "/investments", text: "Investments", icon: BriefcaseIcon },
  { to: "/management", text: "Management", icon: HomeDollarIcon },
  { to: "/tools", text: "Financial Tools", icon: CalculatorIcon },
  { to: "/investments/new", text: "Add Investment", icon: PlusCircleIcon },
];

const NavItem = ({ to, icon: Icon, text, isExpanded, onClick }) => {
    // ✅ THIS IS THE FIX: Variables are now defined inside the component that uses them.
    const activeLinkStyle = "bg-brand-turquoise-100 text-brand-turquoise-600 font-semibold";
    const inactiveLinkStyle = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";

    return (
        <NavLink to={to} onClick={onClick} className={({ isActive }) => `flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive ? activeLinkStyle : inactiveLinkStyle}`}>
            <Icon className="h-6 w-6 flex-shrink-0" />
            <span className={`overflow-hidden transition-all ${isExpanded ? 'w-40 ml-3' : 'w-0'}`}>{text}</span>
        </NavLink>
    );
};

function DashboardLayout({ children }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside 
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`bg-white border-r border-gray-200 hidden lg:flex flex-col transition-all duration-300 ease-in-out z-40
                   ${isSidebarExpanded ? 'w-64' : 'w-20'}`}
      >
        <div className="p-4 border-b h-16 flex items-center justify-center">
          <Link to="/dashboard" className="text-3xl font-bold text-brand-turquoise">
            {isSidebarExpanded ? 'MyPropAI' : 'AI'}
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
            {navLinks.map((link) => (
                <NavItem key={link.to} {...link} isExpanded={isSidebarExpanded} />
            ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
            <div className="flex items-center justify-between px-4 h-16">
                <div className="lg:hidden">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-gray-100">
                        {isMobileMenuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                    </button>
                </div>
                <div className="flex-1 flex justify-end">
                    <UserInfoBanner />
                </div>
            </div>
            {isMobileMenuOpen && (
                <nav className="lg:hidden border-b bg-white">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <NavItem 
                                key={link.to} 
                                {...link} 
                                isExpanded={true} // Always expanded in mobile dropdown
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
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
