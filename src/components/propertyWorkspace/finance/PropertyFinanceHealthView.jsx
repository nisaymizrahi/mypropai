import React from "react";
import {
  BanknotesIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";

import { formatCurrency } from "../../../utils/investmentMetrics";
import { FinanceRow, formatPercent, MetricTile, ProgressBar } from "./PropertyFinanceShared";

const PropertyFinanceHealthView = ({
  embedded = false,
  metrics,
  financeSummary,
  expenses,
  budgetCategorySummary,
}) => (
  <div className="space-y-6">
    {!embedded ? (
      <section className="surface-panel px-6 py-7 sm:px-7">
        <span className="eyebrow">Finance / Financial Health</span>
        <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
          Keep the entire project financial picture in one control tower
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
          This dashboard brings the purchase basis, expected budget, actual spend, carry, debt,
          and return profile together so you can see the health of the property at a glance.
        </p>
      </section>
    ) : null}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricTile
        icon={BanknotesIcon}
        label="All-in basis"
        value={formatCurrency(metrics.totalCost)}
        hint="Purchase, close, expected budget, finance, and hold."
      />
      <MetricTile
        icon={ChartBarIcon}
        label="Projected profit"
        value={formatCurrency(metrics.profit)}
        hint={`${formatPercent(metrics.roiOnCash)} ROI on cash invested.`}
        tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
      />
      <MetricTile
        icon={ClipboardDocumentListIcon}
        label="Budget remaining"
        value={formatCurrency(metrics.remainingBudget)}
        hint={`${formatCurrency(metrics.totalSpent)} already spent against expected cost.`}
        tone={metrics.remainingBudget >= 0 ? "text-ink-900" : "text-clay-700"}
      />
      <MetricTile
        icon={ReceiptPercentIcon}
        label="AI receipt entries"
        value={financeSummary.receiptAiCount}
        hint={`${expenses.length} total expense record${expenses.length === 1 ? "" : "s"} so far.`}
      />
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)]">
      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Budget pulse</span>
        <h4 className="mt-4 text-2xl font-semibold text-ink-900">Progress against plan</h4>
        <div className="mt-6 space-y-5">
          <ProgressBar
            label="Actual spent vs expected budget"
            value={metrics.totalSpent}
            total={metrics.totalBudget || 1}
            tone="bg-verdigris-500"
            helper={`${formatCurrency(metrics.totalSpent)} of ${formatCurrency(metrics.totalBudget)}`}
          />
          <ProgressBar
            label="Committed vs original budget"
            value={metrics.totalCommitted}
            total={metrics.totalOriginalBudget || 1}
            tone="bg-sky-500"
            helper={`${formatCurrency(metrics.totalCommitted)} committed`}
          />
          <ProgressBar
            label="All-in cost vs ARV"
            value={metrics.totalCost}
            total={metrics.arv || 1}
            tone="bg-amber-400"
            helper={`${formatCurrency(metrics.totalCost)} of ${formatCurrency(metrics.arv)} projected value`}
          />
          <ProgressBar
            label="Debt share of total cost"
            value={metrics.loanAmount}
            total={metrics.totalCost || 1}
            tone="bg-clay-400"
            helper={`${formatCurrency(metrics.loanAmount)} debt currently modeled`}
          />
        </div>
      </section>

      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Return profile</span>
        <h4 className="mt-4 text-2xl font-semibold text-ink-900">Outcome summary</h4>
        <div className="mt-6">
          <FinanceRow label="Purchase price" value={formatCurrency(metrics.purchasePrice)} />
          <FinanceRow label="Buy closing costs" value={formatCurrency(metrics.calcBuyingCost)} />
          <FinanceRow label="Expected rehab budget" value={formatCurrency(metrics.totalBudget)} />
          <FinanceRow label="Finance costs" value={formatCurrency(metrics.calcFinanceCost)} />
          <FinanceRow label="Holding costs" value={formatCurrency(metrics.calcHoldingCost)} />
          <FinanceRow label="Projected ARV" value={formatCurrency(metrics.arv)} />
          <FinanceRow label="Selling costs" value={formatCurrency(metrics.calcSellCost)} />
          <FinanceRow
            label="Net profit"
            value={formatCurrency(metrics.profit)}
            tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
          />
        </div>
      </section>
    </div>

    <section className="section-card p-6 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow">Category burn</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Where the budget is moving</h4>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
            A quick read on how the current project categories compare against expected cost.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {budgetCategorySummary.length > 0 ? (
          budgetCategorySummary.slice(0, 8).map((group) => (
            <div key={group.label} className="rounded-[20px] border border-ink-100 bg-white/90 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink-900">{group.label}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {group.expensesCount} expense record{group.expensesCount === 1 ? "" : "s"} linked
                  </p>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-3 xl:min-w-[360px]">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Expected
                    </p>
                    <p className="mt-1 font-semibold text-ink-900">{formatCurrency(group.expected)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Actual
                    </p>
                    <p className="mt-1 font-semibold text-ink-900">{formatCurrency(group.actual)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Variance
                    </p>
                    <p
                      className={`mt-1 font-semibold ${
                        group.variance <= 0 ? "text-verdigris-700" : "text-clay-700"
                      }`}
                    >
                      {formatCurrency(group.variance)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ProgressBar
                  label="Actual vs expected"
                  value={group.actual}
                  total={group.expected || 1}
                  tone="bg-verdigris-500"
                />
                <ProgressBar
                  label="Committed vs expected"
                  value={group.committed}
                  total={group.expected || 1}
                  tone="bg-sky-500"
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
            No budget lines yet. The budget versus actual section is ready whenever you start
            adding scope items or expenses.
          </div>
        )}
      </div>
    </section>
  </div>
);

export default PropertyFinanceHealthView;
