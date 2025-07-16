import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import UserInfoBanner from "./UserInfoBanner";

// ... (All SVG Icons) ...

const navLinks = [
  { to: "/dashboard", text: "Dashboard", icon: HomeIcon },
  { to: "/leads", text: "Leads", icon: TargetIcon },
  { to: "/investments", text: "Investments", icon: BriefcaseIcon },
  { to: "/management", text: "Management", icon: HomeDollarIcon },
  { to: "/tools", text: "Financial Tools", icon: CalculatorIcon },
  { to: "/investments/new", text: "Add Investment", icon: PlusCircleIcon },
];

const NavItem = ({ to, icon: Icon, text, isExpanded }) => {
    const activeClass = "bg-brand-turquoise-100 text-brand-turquoise-600";
    const inactiveClass = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
    return (
        <NavLink to={to} className={({ isActive }) => `flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive ? activeClass : inactiveClass}`}>
            <Icon className="h-6 w-6 flex-shrink-0" />
            <span className={`overflow-hidden transition-all ${isExpanded ? 'w-40 ml-3' : 'w-0'}`}>{text}</span>
        </NavLink>
    );
};

function DashboardLayout({ children }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside 
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`bg-white border-r border-gray-200 hidden lg:flex flex-col transition-all duration-300 ease-in-out
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
        <header className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 h-16">
                <div className="lg:hidden">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-gray-100">
                        <MenuIcon className="h-6 w-6" />
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
                            <NavLink key={link.to} to={link.to} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-base font-medium ${isActive ? 'bg-brand-turquoise-100 text-brand-turquoise-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                                <link.icon className="h-6 w-6 mr-3" />
                                <span>{link.text}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>
            )}
        </header>
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
