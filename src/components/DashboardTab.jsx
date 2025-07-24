import React, { useMemo, useState } from 'react';
import AddTaskModal from './AddTaskModal';
import AddBudgetItemModal from './AddBudgetItemModal';
import AddExpenseModal from './AddExpenseModal';
import { createExpense, getAuthHeaders } from '../utils/api';

const StatCard = ({ title, value, colorClass = 'text-brand-gray-800' }) => (
  <div className="bg-brand-gray-50 p-4 rounded-lg border border-brand-gray-200 text-center">
    <p className="text-sm text-brand-gray-500">{title}</p>
    <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

const ProgressBar = ({ label, percent }) => (
  <div className="w-full">
    <div className="flex justify-between text-sm mb-1">
      <span className="text-brand-gray-500">{label}</span>
      <span className="font-semibold">{Math.round(percent)}%</span>
    </div>
    <div className="w-full bg-brand-gray-200 rounded-full h-2.5">
      <div className="bg-brand-turquoise h-2.5 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
    </div>
  </div>
);

const DashboardTab = ({ investment, budgetItems, expenses, tasks }) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const financial = useMemo(() => {
    const purchasePrice = investment.purchasePrice || 0;
    const loan = investment.financingDetails?.purchaseLoan?.loanAmount || 0;
    const arv = investment.arv || 0;
    const rehab = budgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0);
    const spent = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalCost = purchasePrice + rehab;
    const profit = arv - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    const remaining = rehab - spent;
    const budgetPercent = rehab > 0 ? (spent / rehab) * 100 : 0;
    return {
      purchasePrice, loan, rehab, spent, remaining, totalCost, profit, roi, budgetPercent
    };
  }, [investment, budgetItems, expenses]);

  const schedule = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Complete').length;
    const percent = total > 0 ? (completed / total) * 100 : 0;
    return { total, completed, percent };
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'Complete')
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 3);
  }, [tasks]);

  return (
    <>
      <AddTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} investmentId={investment._id} />
      <AddExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} investmentId={investment._id} budgetItems={budgetItems} />
      <AddBudgetItemModal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} investmentId={investment._id} />

      <div className="space-y-6">
        {/* Top Summary Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Purchase Price" value={`$${financial.purchasePrice.toLocaleString()}`} />
          <StatCard title="Loan Amount" value={`$${financial.loan.toLocaleString()}`} />
          <StatCard title="Rehab Budget" value={`$${financial.rehab.toLocaleString()}`} />
          <StatCard title="Total Spent" value={`$${financial.spent.toLocaleString()}`} />
          <StatCard title="Remaining Budget" value={`$${financial.remaining.toLocaleString()}`} colorClass={financial.remaining >= 0 ? 'text-green-600' : 'text-red-600'} />
          <StatCard title="Total Cost" value={`$${financial.totalCost.toLocaleString()}`} />
          <StatCard title="Projected Profit" value={`$${financial.profit.toLocaleString()}`} colorClass={financial.profit >= 0 ? 'text-green-600' : 'text-red-600'} />
          <StatCard title="ROI" value={`${financial.roi.toFixed(1)}%`} colorClass="text-brand-purple-700" />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <button onClick={() => setShowExpenseModal(true)} className="bg-brand-turquoise text-white px-4 py-2 rounded-md font-semibold">+ Add Expense</button>
          <button onClick={() => setShowTaskModal(true)} className="bg-brand-turquoise text-white px-4 py-2 rounded-md font-semibold">+ Add Task</button>
          <button onClick={() => setShowBudgetModal(true)} className="bg-brand-turquoise text-white px-4 py-2 rounded-md font-semibold">+ Add Budget Line</button>
        </div>

        {/* Progress Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">Budget Progress</h3>
            <ProgressBar label="Spent vs Budget" percent={financial.budgetPercent} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-2">Schedule Progress</h3>
            <ProgressBar label="Tasks Completed" percent={schedule.percent} />
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Upcoming Tasks</h3>
          <div className="space-y-3">
            {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
              <div key={task._id} className="border-b pb-2">
                <p className="font-semibold">{task.title}</p>
                <p className="text-sm text-gray-500">Due: {new Date(task.endDate).toLocaleDateString()}</p>
              </div>
            )) : <p className="text-sm text-gray-500">No upcoming tasks.</p>}
          </div>
        </div>

        {/* Timeline Snapshot Placeholder */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2">Timeline Snapshot</h3>
          <p className="text-sm text-brand-gray-500">[Visual timeline placeholder: Purchase → Rehab → Refi → Sale]</p>
        </div>
      </div>
    </>
  );
};

export default DashboardTab;
