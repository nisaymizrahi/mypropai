import React from "react";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const navigate = useNavigate();

  const tools = [
    {
      title: "Comparable Search",
      description: "Find sales comps by address, filters, and radius.",
      path: "/comps",
    },
    {
      title: "Investment Tracker",
      description: "Add and manage fix & flip or rental properties.",
      path: "/investments",
    },
    {
      title: "ROI Calculator",
      description: "Evaluate the return on investment for a property.",
      path: "/roi",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-purple-700">
          Welcome to MyPropAI Dashboard
        </h1>

        <div className="grid gap-6 sm:grid-cols-2">
          {tools.map((tool) => (
            <div
              key={tool.title}
              className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition"
              onClick={() => navigate(tool.path)}
            >
              <h2 className="text-xl font-semibold text-blue-600">
                {tool.title}
              </h2>
              <p className="text-gray-600 mt-1">{tool.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
