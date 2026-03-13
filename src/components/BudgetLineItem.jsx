import React from "react";

import { formatCurrency } from "../utils/investmentMetrics";

const BudgetLineItem = ({ item, expenses = [], onAddExpense }) => {
  const spent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const remaining = Number(item.budgetedAmount || 0) - spent;
  const overBudget = remaining < 0;

  return (
    <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-base font-semibold text-ink-900">{item.category}</p>
          {item.description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">{item.description}</p>
          ) : (
            <p className="mt-2 text-sm text-ink-400">No description added yet.</p>
          )}
        </div>

        <button type="button" onClick={onAddExpense} className="ghost-action self-start">
          Add expense
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] border border-ink-100 bg-ink-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">Budgeted</p>
          <p className="mt-2 text-lg font-semibold text-ink-900">
            {formatCurrency(item.budgetedAmount)}
          </p>
        </div>
        <div className="rounded-[20px] border border-ink-100 bg-ink-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">Spent</p>
          <p className="mt-2 text-lg font-semibold text-ink-900">{formatCurrency(spent)}</p>
        </div>
        <div className="rounded-[20px] border border-ink-100 bg-ink-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">Remaining</p>
          <p className={`mt-2 text-lg font-semibold ${overBudget ? "text-clay-700" : "text-verdigris-700"}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetLineItem;
