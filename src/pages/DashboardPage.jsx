import React from "react";
import { useNavigate } from "react-router-dom";

// --- SVG Icon Components (no changes needed here) ---

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

const CalculatorIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <line x1="8" y1="6" x2="16" y2="6"></line>
        <line x1="16" y1="14" x2="16" y2="18"></line>
        <line x1="12" y1="10" x2="12" y2="18"></line>
        <line x1="8" y1="10" x2="8" y2="18"></line>
    </svg>
);


const DashboardPage = () => {
  const navigate = useNavigate();

  const tools = [
    {
      title: "Comparable Search",
      description: "Find sales comps by address, filters, and radius.",
      path: "/comps",
      icon: SearchIcon,
    },
    {
      title: "Investment Tracker",
      description: "Add and manage fix & flip or rental properties.",
      path: "/investments",
      icon: BriefcaseIcon,
    },
    {
      title: "ROI Calculator",
      description: "Evaluate the return on investment for a property.",
      path: "/roi",
      icon: CalculatorIcon,
    },
  ];

  return (
    <div>
      <div className="max-w-5xl mx-auto">
        {/* NEW: Updated title styling for the light theme */}
        <h1 className="text-3xl font-bold mb-2 text-brand-gray-900">
          Dashboard
        </h1>
        <p className="text-lg text-brand-gray-500 mb-8">
            Welcome to your AI-powered real estate analysis hub.
        </p>

        {/* NEW: Redesigned tool cards for the light theme */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <div
              key={tool.title}
              className="bg-white rounded-lg p-6 cursor-pointer border border-brand-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
              onClick={() => navigate(tool.path)}
            >
              <div className="flex items-center mb-4">
                <div className="p-3 bg-brand-turquoise-100 rounded-lg mr-4">
                    <tool.icon className="h-6 w-6 text-brand-turquoise-600" />
                </div>
                <h2 className="text-xl font-semibold text-brand-gray-800">
                  {tool.title}
                </h2>
              </div>
              <p className="text-brand-gray-500">{tool.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
