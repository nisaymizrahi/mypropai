import React, { useMemo, useState } from "react";
import {
  BanknotesIcon,
  CpuChipIcon,
  DocumentChartBarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import AddBudgetItemModal from "./AddBudgetItemModal";
import AddExpenseModal from "./AddExpenseModal";
import AIRehabBuilderModal from "./AIRehabBuilderModal";
import AnalysisCalculator from "./AnalysisCalculator";
import BudgetAwardModal from "./BudgetAwardModal";
import BudgetLineItem from "./BudgetLineItem";
import {
  addBudgetAward,
  deleteBudgetAward,
  updateBudgetAward,
} from "../utils/api";
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

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "—";
  return parsed.toLocaleDateString();
};

const FinancialsTab = ({ investment, budgetItems, expenses, vendors = [], onUpdate }) => {
  const [expenseModalState, setExpenseModalState] = useState({
    isOpen: false,
    budgetItemId: "",
    awardId: "",
    mode: "manual",
  });
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAIBuilderModal, setShowAIBuilderModal] = useState(false);
  const [awardModalState, setAwardModalState] = useState({
    isOpen: false,
    budgetItem: null,
    award: null,
  });

  const metrics = useMemo(
    () => getInvestmentAnalysisMetrics(investment, { budgetItems, expenses }),
    [investment, budgetItems, expenses]
  );

  const projectLevelExpenses = useMemo(
    () => expenses.filter((expense) => !expense.budgetItem),
    [expenses]
  );

  const handleOpenExpenseModal = ({ budgetItemId = "", awardId = "", mode = "manual" } = {}) => {
    setExpenseModalState({
      isOpen: true,
      budgetItemId,
      awardId,
      mode,
    });
  };

  const handleSaveAward = async (payload) => {
    if (!awardModalState.budgetItem?._id) {
      return;
    }

    if (awardModalState.award?.awardId) {
      await updateBudgetAward(
        awardModalState.budgetItem._id,
        awardModalState.award.awardId,
        payload
      );
    } else {
      await addBudgetAward(awardModalState.budgetItem._id, payload);
    }

    await onUpdate?.();
  };

  const handleDeleteAward = async (budgetItem, award) => {
    if (!window.confirm("Remove this selected vendor from the scope item?")) {
      return;
    }

    await deleteBudgetAward(budgetItem._id, award.awardId);
    await onUpdate?.();
  };

  return (
    <>
      <AddExpenseModal
        isOpen={expenseModalState.isOpen}
        onClose={() =>
          setExpenseModalState({ isOpen: false, budgetItemId: "", awardId: "", mode: "manual" })
        }
        investmentId={investment._id}
        defaultBudgetItemId={expenseModalState.budgetItemId}
        defaultAwardId={expenseModalState.awardId}
        initialMode={expenseModalState.mode}
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
      <BudgetAwardModal
        isOpen={awardModalState.isOpen}
        onClose={() => setAwardModalState({ isOpen: false, budgetItem: null, award: null })}
        onSave={handleSaveAward}
        vendors={vendors}
        budgetItem={awardModalState.budgetItem}
        initialAward={awardModalState.award}
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={BanknotesIcon}
            label="Original budget"
            value={formatCurrency(metrics.totalOriginalBudget)}
            hint="Imported from the original renovation assumptions."
          />
          <MetricTile
            icon={DocumentChartBarIcon}
            label="Committed"
            value={formatCurrency(metrics.totalCommitted)}
            hint="Chosen vendors and supplier commitments across all scope items."
          />
          <MetricTile
            icon={SparklesIcon}
            label="Actual spent"
            value={formatCurrency(metrics.totalSpent)}
            hint={`${formatCurrency(metrics.unassignedSpent)} outside any specific scope item.`}
          />
          <MetricTile
            icon={CpuChipIcon}
            label="Outstanding"
            value={formatCurrency(metrics.outstandingCommitted)}
            tone={metrics.outstandingCommitted >= 0 ? "text-ink-900" : "text-clay-700"}
            hint="Committed amount still not paid out yet."
          />
        </div>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Capital actions</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">
                Control the project budget in one place
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Keep the original budget, commit vendors to each scope item, and capture actual
                payments as they happen.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowAddBudgetModal(true)} className="primary-action">
              Add scope item
            </button>
            <button
              type="button"
              onClick={() => handleOpenExpenseModal()}
              className="secondary-action"
            >
              Add manual expense
            </button>
            <button
              type="button"
              onClick={() => handleOpenExpenseModal({ mode: "receipt" })}
              className="secondary-action"
            >
              Scan receipt with AI
            </button>
            <button type="button" onClick={() => setShowAIBuilderModal(true)} className="ghost-action">
              Generate AI budget
            </button>
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Scope control</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Budget items</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Each item tracks the original budget, the selected vendors you committed to, and
                the actual expenses already paid.
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
                    (expense) =>
                      (typeof expense.budgetItem === "object"
                        ? expense.budgetItem?._id
                        : expense.budgetItem) === item._id
                  )}
                  onAddExpense={() => handleOpenExpenseModal({ budgetItemId: item._id })}
                  onAddAward={() =>
                    setAwardModalState({ isOpen: true, budgetItem: item, award: null })
                  }
                  onEditAward={(award) =>
                    setAwardModalState({ isOpen: true, budgetItem: item, award })
                  }
                  onDeleteAward={(award) => handleDeleteAward(item, award)}
                />
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                No scope items yet. Add one manually or generate a draft with AI.
              </div>
            )}
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Project-level expenses</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Custom expenses</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Use this for payments that do not belong to a single scope item or vendor
                commitment, like permits, dumpsters, or one-off fees.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenExpenseModal()}
              className="secondary-action"
            >
              Add custom expense
            </button>
          </div>

          <div className="mt-8 space-y-3">
            {projectLevelExpenses.length > 0 ? (
              projectLevelExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="rounded-[22px] border border-ink-100 bg-white/85 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-ink-900">{expense.title}</p>
                      <p className="mt-1 text-sm text-ink-500">
                        {(expense.vendor?.name || expense.payeeName || "Custom expense") +
                          (expense.description ? ` • ${expense.description}` : "")}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                        {formatDate(expense.date)}
                      </p>
                      {expense.notes ? (
                        <p className="mt-3 text-sm leading-6 text-ink-500">{expense.notes}</p>
                      ) : null}
                    </div>
                    <p className="text-lg font-semibold text-ink-900">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                No project-level custom expenses yet.
              </div>
            )}
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">Deal analysis</span>
            <h3 className="text-3xl font-semibold text-ink-900">Underwriting summary</h3>
            <p className="max-w-2xl text-sm leading-6 text-ink-500">
              Validate costs, returns, and analysis using the latest project inputs.
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
