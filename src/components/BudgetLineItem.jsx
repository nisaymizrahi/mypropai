import React from "react";

const BudgetLineItem = ({ item, expenses = [], onAddExpense }) => {
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = item.budgetedAmount - spent;
  const overBudget = remaining < 0;

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-2 font-medium">{item.category}</td>
      <td className="p-2">${item.budgetedAmount.toLocaleString()}</td>
      <td className="p-2">${spent.toLocaleString()}</td>
      <td className={`p-2 ${overBudget ? "text-red-600" : ""}`}>${remaining.toLocaleString()}</td>
      <td className="p-2 text-right">
        <button
          className="text-sm text-brand-turquoise hover:underline"
          onClick={onAddExpense}
        >
          + Add Expense
        </button>
      </td>
    </tr>
  );
};

export default BudgetLineItem;
