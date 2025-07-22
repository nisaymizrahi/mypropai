import React, { useMemo } from 'react';

const StatCard = ({ title, value, colorClass = 'text-brand-gray-800' }) => (
  <div className="bg-brand-gray-50 p-4 rounded-lg border border-brand-gray-200">
    <p className="text-sm text-brand-gray-500">{title}</p>
    <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

const ProgressBar = ({ value }) => (
  <div className="w-full bg-brand-gray-200 rounded-full h-2.5">
    <div
      className="bg-brand-turquoise h-2.5 rounded-full"
      style={{ width: `${Math.min(value, 100)}%` }}
    ></div>
  </div>
);

const DashboardTab = ({ investment, budgetItems, expenses, tasks }) => {
  const financialSummary = useMemo(() => {
    const totalBudget = budgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0);
    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
    const remainingBudget = totalBudget - totalSpent;
    const budgetSpentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    return { totalBudget, totalSpent, remainingBudget, budgetSpentPercentage };
  }, [budgetItems, expenses]);

  const scheduleSummary = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Complete').length;
    const scheduleProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    return { totalTasks, completedTasks, scheduleProgress };
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'Complete')
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 3);
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Financial Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
          <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Financial Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Budget" value={`$${financialSummary.totalBudget.toLocaleString()}`} />
            <StatCard title="Total Spent" value={`$${financialSummary.totalSpent.toLocaleString()}`} />
            <StatCard
              title="Remaining"
              value={`$${financialSummary.remainingBudget.toLocaleString()}`}
              colorClass={financialSummary.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}
            />
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-brand-gray-500">Budget Progress</span>
              <span className="font-semibold">{financialSummary.budgetSpentPercentage.toFixed(0)}%</span>
            </div>
            <ProgressBar value={financialSummary.budgetSpentPercentage} />
          </div>
        </div>

        {/* Schedule Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
          <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Schedule Overview</h3>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-brand-gray-500">Tasks Completed</span>
              <span className="font-semibold">
                {scheduleSummary.completedTasks} of {scheduleSummary.totalTasks}
              </span>
            </div>
            <ProgressBar value={scheduleSummary.scheduleProgress} />
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
          <h3 className="text-lg font-semibold text-brand-gray-800 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map(task => (
                <div key={task._id} className="text-sm border-b pb-2">
                  <p className="font-semibold text-brand-gray-800">{task.title}</p>
                  <p className="text-xs text-brand-gray-500">
                    Due: {new Date(task.endDate).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-gray-500">No upcoming tasks.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
