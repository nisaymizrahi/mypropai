import React, { useMemo, useState } from "react";

import { generateAIReport } from "../utils/api";
import {
  formatCurrency,
  getInvestmentAnalysisMetrics,
} from "../utils/investmentMetrics";

const SummaryRow = ({ label, value, tone = "text-ink-900" }) => (
  <div className="flex items-center justify-between gap-6 border-b border-ink-100 py-3 last:border-b-0">
    <span className="text-sm font-medium text-ink-500">{label}</span>
    <span className={`text-sm font-semibold ${tone}`}>{value}</span>
  </div>
);

const DealCalculatorTab = ({ investment, budgetItems = [], expenses = [] }) => {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const metrics = useMemo(
    () => getInvestmentAnalysisMetrics(investment, { budgetItems, expenses }),
    [investment, budgetItems, expenses]
  );

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await generateAIReport(investment._id);
      setReport(result.report || "");
    } catch (err) {
      setError(err.message || "Failed to generate AI report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Calculator inputs</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">Modeled assumptions</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
            The calculator uses the current underwriting fields and falls back to legacy deal data
            where needed.
          </p>

          <div className="mt-8">
            <SummaryRow label="Purchase price" value={formatCurrency(metrics.purchasePrice)} />
            <SummaryRow label="After repair value" value={formatCurrency(metrics.arv)} />
            <SummaryRow label="Buy closing costs" value={formatCurrency(metrics.calcBuyingCost)} />
            <SummaryRow label="Rehab budget" value={formatCurrency(metrics.totalBudget)} />
            <SummaryRow label="Loan amount" value={formatCurrency(metrics.loanAmount)} />
            <SummaryRow label="Interest rate" value={`${metrics.interestRate.toFixed(2)}%`} />
            <SummaryRow label="Holding period" value={`${metrics.holdingMonths || 0} months`} />
            <SummaryRow label="Monthly carry" value={formatCurrency(metrics.monthlyHoldingCost)} />
            <SummaryRow label="Selling costs" value={formatCurrency(metrics.calcSellCost)} />
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Calculator outputs</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">Return math</h3>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Total project cost
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink-900">
                {formatCurrency(metrics.totalCost)}
              </p>
            </div>
            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                All-in cost
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink-900">
                {formatCurrency(metrics.allInCost)}
              </p>
            </div>
            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Profit
              </p>
              <p
                className={`mt-3 text-3xl font-semibold ${
                  metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"
                }`}
              >
                {formatCurrency(metrics.profit)}
              </p>
            </div>
            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                ROI on cash
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink-900">
                {metrics.roiOnCash.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-sand-200 bg-sand-50/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sand-700">
              Decision snapshot
            </p>
            <p className="mt-3 text-sm leading-7 text-ink-600">
              Modeled cash invested is {formatCurrency(metrics.cashInvested)} with a projected
              annualized return of {metrics.annualizedROI.toFixed(1)}%.
            </p>
          </div>
        </section>
      </div>

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">AI analysis</span>
            <h3 className="mt-4 text-3xl font-semibold text-ink-900">Narrative deal review</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              Generate a written summary based on the latest underwriting inputs and budget data.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={loading}
            className="primary-action"
          >
            {loading ? "Generating report..." : "Generate AI report"}
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-[24px] border border-clay-200 bg-clay-50 px-5 py-4 text-sm text-clay-700">
            {error}
          </div>
        ) : null}

        {report ? (
          <div className="mt-6 rounded-[24px] border border-verdigris-200 bg-verdigris-50/60 p-6">
            <div className="whitespace-pre-line text-sm leading-7 text-ink-700">{report}</div>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-sm leading-6 text-ink-500">
            No AI report generated yet. Use the button above to create a narrative summary.
          </div>
        )}
      </section>
    </div>
  );
};

export default DealCalculatorTab;
