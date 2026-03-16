import React, { useMemo } from "react";

import {
  getDrawRequestById,
  getDrawRequestLabel,
  getFundingSourceById,
  getFundingSourceLabel,
} from "../utils/capitalStack";
import { formatCurrency } from "../utils/investmentMetrics";

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "—";
  return parsed.toLocaleDateString();
};

const BudgetMetric = ({ label, value, tone = "text-ink-900" }) => (
  <div className="rounded-[20px] border border-ink-100 bg-ink-50/70 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className={`mt-2 text-lg font-semibold ${tone}`}>{value}</p>
  </div>
);

const BudgetLineItem = ({
  item,
  expenses = [],
  fundingSources = [],
  drawRequests = [],
  onAddExpense,
  onAddAward,
  onEditAward,
  onDeleteAward,
}) => {
  const committed = useMemo(
    () =>
      Array.isArray(item.awards)
        ? item.awards.reduce((sum, award) => sum + Number(award.amount || 0), 0)
        : 0,
    [item.awards]
  );
  const spent = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );
  const originalBudget = Number(item.originalBudgetAmount ?? item.budgetedAmount ?? 0);
  const remaining = originalBudget - spent;
  const committedVariance = committed - originalBudget;
  const overBudget = remaining < 0;

  return (
    <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-base font-semibold text-ink-900">{item.category}</p>
          {item.description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">{item.description}</p>
          ) : (
            <p className="mt-2 text-sm text-ink-400">No scope description added yet.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onAddAward} className="secondary-action">
            Add vendor
          </button>
          <button type="button" onClick={onAddExpense} className="ghost-action">
            Add expense
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <BudgetMetric label="Original budget" value={formatCurrency(originalBudget)} />
        <BudgetMetric
          label="Committed"
          value={formatCurrency(committed)}
          tone={committedVariance > 0 ? "text-clay-700" : "text-ink-900"}
        />
        <BudgetMetric label="Actual spent" value={formatCurrency(spent)} />
        <BudgetMetric
          label="Remaining"
          value={formatCurrency(remaining)}
          tone={overBudget ? "text-clay-700" : "text-verdigris-700"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-[22px] border border-ink-100 bg-white/85 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">Selected vendors</p>
              <p className="mt-1 text-sm text-ink-500">
                Compare original budget against the vendors or suppliers you committed to.
              </p>
            </div>
            <span className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1 text-xs font-semibold text-sand-700">
              {(item.awards || []).length} commitment{(item.awards || []).length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {(item.awards || []).length > 0 ? (
              item.awards.map((award) => {
                const awardVendorName =
                  (typeof award.vendor === "object" ? award.vendor?.name : "") ||
                  award.vendorName ||
                  "Selected vendor";

                return (
                  <div
                    key={award.awardId}
                    className="rounded-[18px] border border-ink-100 bg-sand-50/60 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{awardVendorName}</p>
                        <p className="mt-1 text-sm text-ink-500">
                          {award.description || "No scope note added for this vendor."}
                        </p>
                        {award.notes ? (
                          <p className="mt-3 text-sm leading-6 text-ink-500">{award.notes}</p>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Committed
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink-900">
                          {formatCurrency(award.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => onEditAward(award)}
                        className="ghost-action"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAward(award)}
                        className="ghost-action text-clay-700 hover:bg-clay-50 hover:text-clay-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                No selected vendors yet. Add one when you choose labor, materials, or a supplier
                for this item.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[22px] border border-ink-100 bg-white/85 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">Expenses</p>
              <p className="mt-1 text-sm text-ink-500">
                Actual payments tied to this scope item appear here, including deposits and custom
                purchases.
              </p>
            </div>
            <span className="rounded-full border border-verdigris-200 bg-verdigris-50 px-3 py-1 text-xs font-semibold text-verdigris-700">
              {expenses.length} expense{expenses.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {expenses.length > 0 ? (
              expenses.map((expense) => {
                const linkedFundingSource = getFundingSourceById(
                  fundingSources,
                  expense.fundingSourceId
                );
                const linkedDrawRequest = getDrawRequestById(drawRequests, expense.drawRequestId);

                return (
                  <div
                    key={expense._id}
                    className="rounded-[18px] border border-ink-100 bg-ink-50/60 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{expense.title}</p>
                        <p className="mt-1 text-sm text-ink-500">
                          {(expense.vendor?.name || expense.payeeName || "Custom expense") +
                            (expense.description ? ` • ${expense.description}` : "")}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                          {formatDate(expense.date)}
                        </p>

                        {linkedFundingSource || linkedDrawRequest ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {linkedFundingSource ? (
                              <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                                {getFundingSourceLabel(
                                  linkedFundingSource,
                                  Math.max(
                                    fundingSources.findIndex(
                                      (source) =>
                                        source.sourceId === linkedFundingSource.sourceId
                                    ),
                                    0
                                  )
                                )}
                              </span>
                            ) : null}
                            {linkedDrawRequest ? (
                              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                                {getDrawRequestLabel(
                                  linkedDrawRequest,
                                  Math.max(
                                    drawRequests.findIndex(
                                      (request) => request.drawId === linkedDrawRequest.drawId
                                    ),
                                    0
                                  )
                                )}
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        {expense.notes ? (
                          <p className="mt-3 text-sm leading-6 text-ink-500">{expense.notes}</p>
                        ) : null}
                      </div>
                      <p className="text-lg font-semibold text-ink-900">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                No expenses logged yet for this item.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default BudgetLineItem;
