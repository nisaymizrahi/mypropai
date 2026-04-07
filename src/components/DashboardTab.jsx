import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import AddBudgetItemModal from "./AddBudgetItemModal";
import AddExpenseModal from "./AddExpenseModal";
import AddTaskModal from "./AddTaskModal";
import {
  formatCurrency,
  getInvestmentAnalysisMetrics,
} from "../utils/investmentMetrics";
import { INVESTOR_TERMS } from "../utils/investorTerminology";

const SnapshotTile = ({ label, value, tone = "text-ink-900" }) => (
  <div className="metric-tile p-5">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
  </div>
);

const ProgressCard = ({ title, label, percent }) => (
  <div className="section-card p-6">
    <div className="flex items-center justify-between gap-3">
      <div>
        <span className="eyebrow">Progress</span>
        <h3 className="mt-4 text-2xl font-semibold text-ink-900">{title}</h3>
      </div>
      <p className="text-2xl font-semibold text-ink-900">{Math.round(percent)}%</p>
    </div>

    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
        <span>{label}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="h-3 rounded-full bg-ink-100">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-verdigris-700 via-verdigris-500 to-sand-300 transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  </div>
);

const DashboardTab = ({
  investment,
  budgetItems,
  expenses,
  tasks,
  vendors = [],
  sourceLeadSnapshot = null,
  sourceLeadId = "",
  onUpdate,
}) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [expenseModalState, setExpenseModalState] = useState({
    isOpen: false,
    mode: "manual",
  });
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const financial = useMemo(() => {
    const metrics = getInvestmentAnalysisMetrics(investment, { budgetItems, expenses });

    return {
      purchasePrice: metrics.purchasePrice,
      loan: metrics.loanAmount,
      rehab: metrics.totalOriginalBudget,
      committed: metrics.totalCommitted,
      spent: metrics.totalSpent,
      remaining: metrics.remainingBudget,
      totalCost: metrics.allInCost,
      profit: metrics.profit,
      roi: metrics.roiOnCash,
      budgetPercent: metrics.budgetPercent,
    };
  }, [investment, budgetItems, expenses]);

  const schedule = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "Complete").length;
    const percent = total > 0 ? (completed / total) * 100 : 0;

    return { total, completed, percent };
  }, [tasks]);

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.status !== "Complete")
        .sort((left, right) => new Date(left.startDate) - new Date(right.startDate))
        .slice(0, 4),
    [tasks]
  );

  return (
    <>
      <AddTaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        investmentId={investment._id}
        vendors={vendors}
        onSuccess={onUpdate}
      />
      <AddExpenseModal
        isOpen={expenseModalState.isOpen}
        onClose={() => setExpenseModalState({ isOpen: false, mode: "manual" })}
        investmentId={investment._id}
        budgetItems={budgetItems}
        vendors={vendors}
        initialMode={expenseModalState.mode}
        onSuccess={onUpdate}
      />
      <AddBudgetItemModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        investmentId={investment._id}
        onSuccess={onUpdate}
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SnapshotTile label="Purchase price" value={formatCurrency(financial.purchasePrice)} />
          <SnapshotTile label="Loan amount" value={formatCurrency(financial.loan)} />
          <SnapshotTile label="Original rehab budget" value={formatCurrency(financial.rehab)} />
          <SnapshotTile
            label="Committed / spent"
            value={`${formatCurrency(financial.committed)} / ${formatCurrency(financial.spent)}`}
            tone={financial.committed >= financial.spent ? "text-ink-900" : "text-clay-700"}
          />
        </div>

        {sourceLeadSnapshot ? (
          <section className="surface-panel px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="eyebrow">Original deal snapshot</span>
                <h3 className="mt-4 text-3xl font-semibold text-ink-900">
                  Carried over from the original deal
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                  This section keeps the assumptions and notes that existed before the property
                  moved into Property Workspace.
                </p>
              </div>

              {sourceLeadId ? (
                <Link to={`/leads/${sourceLeadId}`} className="secondary-action">
                  {`Open original ${INVESTOR_TERMS.deal.lowerSingular}`}
                </Link>
              ) : null}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SnapshotTile
                label="Seller ask"
                value={formatCurrency(sourceLeadSnapshot.sellerAskingPrice)}
              />
              <SnapshotTile
                label="Target offer"
                value={formatCurrency(sourceLeadSnapshot.targetOffer)}
              />
              <SnapshotTile label="ARV" value={formatCurrency(sourceLeadSnapshot.arv)} />
              <SnapshotTile
                label="Deal rehab estimate"
                value={formatCurrency(sourceLeadSnapshot.rehabEstimate)}
              />
            </div>
          </section>
        ) : null}

        <section className="surface-panel px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Quick actions</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Move the project forward</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Capture new budget lines, expenses, and tasks without leaving the project hub.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setExpenseModalState({ isOpen: true, mode: "manual" })}
              className="primary-action"
            >
              Add expense
            </button>
            <button
              type="button"
              onClick={() => setExpenseModalState({ isOpen: true, mode: "receipt" })}
              className="secondary-action"
            >
              Scan receipt with AI
            </button>
            <button type="button" onClick={() => setShowTaskModal(true)} className="secondary-action">
              Add task
            </button>
            <button type="button" onClick={() => setShowBudgetModal(true)} className="ghost-action">
              Add scope item
            </button>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <ProgressCard title="Budget pulse" label="Spent vs budget" percent={financial.budgetPercent} />
          <ProgressCard title="Schedule pulse" label="Tasks completed" percent={schedule.percent} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="surface-panel px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="eyebrow">Upcoming work</span>
                <h3 className="mt-4 text-3xl font-semibold text-ink-900">Near-term tasks</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                  Focus on the next tasks that keep the investment on schedule.
                </p>
              </div>
              <div className="rounded-[24px] border border-sand-200 bg-sand-50 px-4 py-3 text-sm font-semibold text-sand-700">
                {schedule.completed}/{schedule.total} complete
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <div
                    key={task._id}
                    className="rounded-[24px] border border-ink-100 bg-white/85 p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-ink-900">{task.title}</p>
                        <p className="mt-1 text-sm text-ink-500">
                          Due {new Date(task.endDate).toLocaleDateString()}
                        </p>
                        {task.description ? (
                          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                            {task.description}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-600">
                        {task.status || "Not started"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                  No upcoming tasks yet. Add one to start building the schedule.
                </div>
              )}
            </div>
          </section>

          <section className="surface-panel px-6 py-6 sm:px-7">
            <span className="eyebrow">Project snapshot</span>
            <h3 className="mt-4 text-3xl font-semibold text-ink-900">At-a-glance math</h3>

            <div className="mt-8 space-y-4">
              <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Total spent
                </p>
                <p className="mt-3 text-3xl font-semibold text-ink-900">
                  {formatCurrency(financial.spent)}
                </p>
              </div>
              <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Remaining budget
                </p>
                <p
                  className={`mt-3 text-3xl font-semibold ${
                    financial.remaining >= 0 ? "text-verdigris-700" : "text-clay-700"
                  }`}
                >
                  {formatCurrency(financial.remaining)}
                </p>
              </div>
              <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                  ROI
                </p>
                <p className="mt-3 text-3xl font-semibold text-ink-900">{financial.roi.toFixed(1)}%</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default DashboardTab;
