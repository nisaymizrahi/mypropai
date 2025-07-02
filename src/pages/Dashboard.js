// src/pages/Dashboard.js

import React from "react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-purple-700">Your Dashboard</h1>
        <p className="text-gray-600 mb-4">
          Welcome! This is your personal real estate investment dashboard.
        </p>

        {/* You can add more sections here later like: */}
        {/* - List of properties */}
        {/* - Add new investment */}
        {/* - Analytics summary */}
        {/* - Upcoming tasks */}
        <div className="bg-white p-6 rounded shadow">
          <p>This dashboard page is ready for your features!</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
