import React, { useState, useMemo } from "react";
import AddExpenseModal from "./AddExpenseModal";
import AddBudgetItemModal from "./AddBudgetItemModal";
import AIRehabBuilderModal from "./AIRehabBuilderModal";
import BudgetLineItem from "./BudgetLineItem";
import AnalysisCalculator from "./AnalysisCalculator";

const StatCard = ({ title, value, colorClass = "text-brand-gray-800" }) => (
  <div className="bg-brand-gray-50 p-4 rounded-lg border text-center">
    <p className="text-sm text-brand-gray-500">{title}</p>
    <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

const FinancialsTab = ({ investment, budgetItems, expenses, vendors = [], onUpdate }) => {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAIBuilderModal, setShowAIBuilderModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const budgetSummary = useMemo(() => {
    const totalBudget = budgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0);
    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
    const remaining = totalBudget - totalSpent;
    const percent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    return { totalBudget, totalSpent, remaining, percent };
  }, [budgetItems, expenses]);

  return (
    <>
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        investmentId={investment._id}
        defaultCategory={selectedCategory}
        onSuccess={onUpdate}
        budgetItems={budgetItems}
      />
      <AddBudgetItemModal
        isOpen={showAddBudgetModal}
        onClose={() => setShowAddBudgetModal(false)}
        investmentId={investment._id}
        onSuccess={onUpdate}
      />
      <AIRehabBuilderModal
        isOpen={showAIBuilderModal}
        onClose={() => setShowAIBuilderModal(false)}
        investmentId={investment._id}
        onSuccess={onUpdate}
      />

      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Budget" value={`$${budgetSummary.totalBudget.toLocaleString()}`} />
          <StatCard title="Total Spent" value={`$${budgetSummary.totalSpent.toLocaleString()}`} />
          <StatCard
            title="Remaining Budget"
            value={`$${budgetSummary.remaining.toLocaleString()}`}
            colorClass={budgetSummary.remaining >= 0 ? "text-green-600" : "text-red-600"}
          />
          <StatCard title="% Used" value={`${budgetSummary.percent.toFixed(1)}%`} />
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddBudgetModal(true)}
            className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md"
          >
            + Add Budget Line
          </button>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowAddExpenseModal(true);
            }}
            className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md"
          >
            + Add Expense
          </button>
          <button
            onClick={() => setShowAIBuilderModal(true)}
            className="bg-purple-600 text-white font-semibold px-4 py-2 rounded-md"
          >
            🧠 AI Build Budget
          </button>
        </div>

        {/* Budget Table */}
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-left">
                <th className="p-2">Category</th>
                <th className="p-2">Budgeted</th>
                <th className="p-2">Spent</th>
                <th className="p-2">Remaining</th>
                <th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {budgetItems.map((item) => (
                <BudgetLineItem
                  key={item._id}
                  item={item}
                  expenses={expenses.filter((e) => e.budgetItem === item._id || e.category === item.category)}
                  onAddExpense={() => {
                    setSelectedCategory(item.category);
                    setShowAddExpenseModal(true);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* 📊 Deal Analysis Calculator */}
        <AnalysisCalculator investment={investment} totalRehabCost={budgetSummary.totalBudget} />
      </div>
    </>
  );
};

export default FinancialsTab;
