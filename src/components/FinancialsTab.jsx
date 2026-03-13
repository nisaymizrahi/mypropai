import React, { useMemo, useState } from "react";
import {
  BanknotesIcon,
  CpuChipIcon,
  DocumentChartBarIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import AddBudgetItemModal from "./AddBudgetItemModal";
import AddExpenseModal from "./AddExpenseModal";
import AIRehabBuilderModal from "./AIRehabBuilderModal";
import AnalysisCalculator from "./AnalysisCalculator";
import BudgetLineItem from "./BudgetLineItem";
import { formatCurrency, getInvestmentAnalysisMetrics } from "../utils/investmentMetrics";

const MetricTile = ({ icon: Icon, label, value, hint, tone = "text-ink-900" }) => (
  <div className="metric-tile p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const FinancialsTab = ({ investment, budgetItems, expenses, vendors = [], onUpdate }) => {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAIBuilderModal, setShowAIBuilderModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const metrics = useMemo(
    () => getInvestmentAnalysisMetrics(investment, { budgetItems, expenses }),
    [investment, budgetItems, expenses]
  );

  return (
    <>
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        investmentId={investment._id}
        defaultCategory={selectedCategory}
        onSuccess={onUpdate}
        budgetItems={budgetItems}
        vendors={vendors}
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={BanknotesIcon}
            label="Total budget"
            value={formatCurrency(metrics.totalBudget)}
            hint="Combined budget across all project categories."
          />
          <MetricTile
            icon={DocumentChartBarIcon}
            label="Total spent"
            value={formatCurrency(metrics.totalSpent)}
            hint={`${metrics.budgetPercent.toFixed(1)}% of current budget used.`}
          />
          <MetricTile
            icon={WrenchScrewdriverIcon}
            label="Remaining budget"
            value={formatCurrency(metrics.remainingBudget)}
            tone={metrics.remainingBudget >= 0 ? "text-verdigris-700" : "text-clay-700"}
            hint="Negative values indicate the project is over budget."
          />
          <MetricTile
            icon={CpuChipIcon}
            label="All-in cost"
            value={formatCurrency(metrics.allInCost)}
            hint="Acquisition, rehab, hold, finance, and exit assumptions combined."
          />
        </div>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Capital actions</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Control the budget in one place</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Add budget lines, log expenses, or use AI to create a starting budget structure for
                the project.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowAddBudgetModal(true)} className="primary-action">
              Add budget line
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setShowAddExpenseModal(true);
              }}
              className="secondary-action"
            >
              Add expense
            </button>
            <button type="button" onClick={() => setShowAIBuilderModal(true)} className="ghost-action">
              Generate AI budget
            </button>
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Budget overview</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Line-item control</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Review each budget category, see what has been spent, and add new expenses directly
                from the matching line item.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {budgetItems.length > 0 ? (
              budgetItems.map((item) => (
                <BudgetLineItem
                  key={item._id}
                  item={item}
                  expenses={expenses.filter(
                    (expense) => expense.budgetItem === item._id || expense.category === item.category
                  )}
                  onAddExpense={() => {
                    setSelectedCategory(item.category);
                    setShowAddExpenseModal(true);
                  }}
                />
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                No budget lines yet. Add one manually or generate a draft with AI.
              </div>
            )}
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">Deal analysis</span>
            <h3 className="text-3xl font-semibold text-ink-900">Underwriting summary</h3>
            <p className="max-w-2xl text-sm leading-6 text-ink-500">
              Validate costs, returns, and AI-generated analysis using the latest project inputs.
            </p>
          </div>

          <div className="mt-8">
            <AnalysisCalculator investment={{ ...investment, totalBudget: metrics.totalBudget }} />
          </div>
        </section>
      </div>
    </>
  );
};

export default FinancialsTab;
