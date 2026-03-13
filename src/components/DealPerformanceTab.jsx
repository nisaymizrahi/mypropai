import React, { useMemo } from "react";

import {
  formatCurrency,
  getInvestmentAnalysisMetrics,
} from "../utils/investmentMetrics";

const MetricTile = ({ label, value, hint, tone = "text-ink-900" }) => (
  <div className="metric-tile p-5">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const BreakdownRow = ({ label, value, tone = "text-ink-900" }) => (
  <div className="flex items-center justify-between gap-6 border-b border-ink-100 py-3 last:border-b-0">
    <span className="text-sm font-medium text-ink-500">{label}</span>
    <span className={`text-sm font-semibold ${tone}`}>{value}</span>
  </div>
);

const DealPerformanceTab = ({ investment, budgetItems = [], expenses = [] }) => {
  const metrics = useMemo(
    () => getInvestmentAnalysisMetrics(investment, { budgetItems, expenses }),
    [investment, budgetItems, expenses]
  );

  const profitMargin = metrics.arv > 0 ? (metrics.profit / metrics.arv) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Projected net profit"
          value={formatCurrency(metrics.profit)}
          tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
          hint="Future value minus acquisition, rehab, finance, hold, and exit costs."
        />
        <MetricTile
          label="Cash-on-cash ROI"
          value={`${metrics.roiOnCash.toFixed(1)}%`}
          tone={metrics.roiOnCash >= 15 ? "text-verdigris-700" : "text-ink-900"}
          hint="Return on the cash actually deployed into the project."
        />
        <MetricTile
          label="Projected equity"
          value={formatCurrency(metrics.projectedEquity)}
          hint="Estimated value remaining after the modeled debt balance."
        />
        <MetricTile
          label="Breakeven ARV"
          value={formatCurrency(metrics.breakevenARV)}
          hint="The minimum future value needed to cover the full modeled stack."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Performance stack</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">Where the deal lands</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
            This view rolls the latest underwriting assumptions and project budget into a single
            return picture.
          </p>

          <div className="mt-8">
            <BreakdownRow label="Projected ARV" value={formatCurrency(metrics.arv)} />
            <BreakdownRow label="Purchase price" value={formatCurrency(metrics.purchasePrice)} />
            <BreakdownRow label="Buy closing costs" value={formatCurrency(metrics.calcBuyingCost)} />
            <BreakdownRow label="Rehab budget" value={formatCurrency(metrics.totalBudget)} />
            <BreakdownRow label="Financing cost" value={formatCurrency(metrics.calcFinanceCost)} />
            <BreakdownRow label="Holding cost" value={formatCurrency(metrics.calcHoldingCost)} />
            <BreakdownRow label="Selling cost" value={formatCurrency(metrics.calcSellCost)} />
            <BreakdownRow label="All-in cost" value={formatCurrency(metrics.allInCost)} />
            <BreakdownRow
              label="Projected net profit"
              value={formatCurrency(metrics.profit)}
              tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
            />
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Return profile</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">Decision signals</h3>

          <div className="mt-8 grid gap-4">
            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Margin on future value
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink-900">{profitMargin.toFixed(1)}%</p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Higher margins create more protection against pricing or scope drift.
              </p>
            </div>

            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Budget control
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink-900">
                {metrics.budgetPercent.toFixed(1)}%
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                {formatCurrency(metrics.totalSpent)} spent against {formatCurrency(metrics.totalBudget)} budget.
              </p>
            </div>

            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Cash invested
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink-900">
                {formatCurrency(metrics.cashInvested)}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Down payment plus modeled buy, rehab, finance, and carry costs.
              </p>
            </div>

            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Annualized return
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink-900">
                {metrics.annualizedROI.toFixed(1)}%
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Based on a {metrics.holdingMonths || 0}-month hold period.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DealPerformanceTab;
