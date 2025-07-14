import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary } from '../utils/api';
import { Link } from 'react-router-dom';

const LoadingSpinner = () => <div className="flex justify-center items-center p-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div></div>;

const StatCard = ({ title, value, linkTo }) => (
    <Link to={linkTo} className="block bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition">
        <p className="text-sm font-medium text-brand-gray-500">{title}</p>
        <p className="text-3xl font-bold text-brand-gray-800 mt-1">{value}</p>
    </Link>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const summaryData = await getDashboardSummary();
        setSummary(summaryData);
      } catch (err) {
        setError(err.message || 'Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!summary) return <p className="text-center">No summary data available.</p>;

  const { kpis, recentActivity, actionItems } = summary;

  return (
    <div className="space-y-8">
        <div>
            <h1 className="text-3xl font-bold text-brand-gray-900">
              Welcome back, {user?.name || ''}!
            </h1>
            <p className="text-lg text-brand-gray-500 mt-1">
                Here's a snapshot of your portfolio.
            </p>
        </div>

        {/* KPI Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Portfolio Value" 
                value={`$${kpis.portfolioValue.toLocaleString()}`}
                linkTo="/investments"
            />
            <StatCard 
                title="Active Projects" 
                value={kpis.activeProjects}
                linkTo="/investments"
            />
            <StatCard 
                title="Gross Monthly Rent" 
                value={`$${kpis.monthlyRent.toLocaleString()}`}
                linkTo="/management"
            />
             <StatCard 
                title="Occupancy Rate" 
                value={`${kpis.occupancyRate.toFixed(0)}%`}
                linkTo="/management"
            />
        </div>

        {/* Action Items & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action Items */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Action Items</h3>
                <div className="space-y-3">
                    {actionItems.tasks.length > 0 ? (
                        actionItems.tasks.map(task => (
                            <div key={task._id} className="text-sm p-2 bg-yellow-50 rounded-md">
                                <p className="font-semibold text-yellow-800">Upcoming Task:</p>
                                <p className="text-yellow-700">{task.title} - Due: {new Date(task.endDate).toLocaleDateString()}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-brand-gray-500">No upcoming task deadlines.</p>
                    )}
                </div>
            </div>
            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Recent Expenses</h3>
                <div className="space-y-2">
                     {recentActivity.expenses.length > 0 ? (
                        recentActivity.expenses.map(expense => (
                            <div key={expense._id} className="flex justify-between items-center text-sm border-b pb-2">
                                <span>{expense.description}</span>
                                <span className="font-semibold">${expense.amount.toLocaleString()}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-brand-gray-500">No recent expenses.</p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardPage;
