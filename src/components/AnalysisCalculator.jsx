import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  PieController,
} from "chart.js";

import { generateAIReport } from "../utils/api";
import { exportElementToPdf } from "../utils/pdfExport";
import {
  formatCurrency,
  getInvestmentAnalysisMetrics,
} from "../utils/investmentMetrics";

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, PieController, BarController);

const SummaryPair = ({ label, value, tone = "text-ink-900" }) => (
  <div className="flex items-center justify-between gap-6 border-b border-ink-100 py-3 last:border-b-0">
    <span className="text-sm font-medium text-ink-500">{label}</span>
    <span className={`text-sm font-semibold ${tone}`}>{value}</span>
  </div>
);

const AnalysisCalculator = ({ investment, budgetItems = [], expenses = [] }) => {
  const [aiSummary, setAISummary] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const exportRef = useRef(null);
  const costCanvasRef = useRef(null);
  const returnCanvasRef = useRef(null);
  const costChartRef = useRef(null);
  const returnChartRef = useRef(null);

  const metrics = useMemo(
    () => getInvestmentAnalysisMetrics(investment, { budgetItems, expenses }),
    [budgetItems, expenses, investment]
  );

  useEffect(() => {
    if (!costCanvasRef.current || !returnCanvasRef.current) {
      return undefined;
    }

    costChartRef.current?.destroy();
    returnChartRef.current?.destroy();

    costChartRef.current = new Chart(costCanvasRef.current, {
      type: "pie",
      data: {
        labels: ["Buy costs", "Rehab", "Finance", "Holding"],
        datasets: [
          {
            data: [
              metrics.calcBuyingCost,
              metrics.totalBudget,
              metrics.calcFinanceCost,
              metrics.calcHoldingCost,
            ],
            backgroundColor: ["#1f6f63", "#dbc79d", "#51657f", "#cf9573"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });

    returnChartRef.current = new Chart(returnCanvasRef.current, {
      type: "bar",
      data: {
        labels: ["Profit", "ROI %", "Annual ROI %"],
        datasets: [
          {
            label: "Value",
            data: [metrics.profit, metrics.roiOnCash, metrics.annualizedROI],
            backgroundColor: ["#1f6f63", "#39526d", "#cf9573"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });

    return () => {
      costChartRef.current?.destroy();
      returnChartRef.current?.destroy();
    };
  }, [
    metrics.calcBuyingCost,
    metrics.totalBudget,
    metrics.calcFinanceCost,
    metrics.calcHoldingCost,
    metrics.profit,
    metrics.roiOnCash,
    metrics.annualizedROI,
  ]);

  const handleExportPDF = async () => {
    if (!exportRef.current) {
      return;
    }

    await exportElementToPdf({
      element: exportRef.current,
      filename: "deal-analysis-report.pdf",
    });
  };

  const handleGenerateAI = async () => {
    try {
      setLoadingAI(true);
      const response = await generateAIReport(investment._id);
      setAISummary(response.report);
    } catch (err) {
      setAISummary(err.message || "AI summary not available.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      <div ref={exportRef} className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="rounded-[24px] border border-ink-100 bg-white/90 p-6">
            <span className="eyebrow">Deal summary</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Capital structure</h4>

            <div className="mt-6">
              <SummaryPair label="Purchase price" value={formatCurrency(metrics.purchasePrice)} />
              <SummaryPair label="Buy closing costs" value={formatCurrency(metrics.calcBuyingCost)} />
              <SummaryPair label="Rehab budget" value={formatCurrency(metrics.totalBudget)} />
              <SummaryPair label="Financing cost" value={formatCurrency(metrics.calcFinanceCost)} />
              <SummaryPair label="Holding cost" value={formatCurrency(metrics.calcHoldingCost)} />
              <SummaryPair
                label="Total project cost"
                value={formatCurrency(metrics.totalCost)}
                tone="text-ink-900"
              />
            </div>
          </div>

          <div className="rounded-[24px] border border-ink-100 bg-white/90 p-6">
            <span className="eyebrow">Return profile</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Outcome assumptions</h4>

            <div className="mt-6">
              <SummaryPair label="Projected ARV" value={formatCurrency(metrics.arv)} />
              <SummaryPair label="Selling costs" value={formatCurrency(metrics.calcSellCost)} />
              <SummaryPair
                label="Net profit"
                value={formatCurrency(metrics.profit)}
                tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
              />
              <SummaryPair label="Cash invested" value={formatCurrency(metrics.cashInvested)} />
              <SummaryPair label="ROI" value={`${metrics.roiOnCash.toFixed(1)}%`} />
              <SummaryPair
                label="Annualized ROI"
                value={`${metrics.annualizedROI.toFixed(1)}%`}
              />
              <SummaryPair label="Breakeven ARV" value={formatCurrency(metrics.breakevenARV)} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[24px] border border-ink-100 bg-white/90 p-6">
            <h4 className="text-lg font-semibold text-ink-900">Cost breakdown</h4>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              See where capital is concentrated across acquisition, rehab, finance, and hold.
            </p>
            <div className="mt-6">
              <canvas ref={costCanvasRef} />
            </div>
          </div>

          <div className="rounded-[24px] border border-ink-100 bg-white/90 p-6">
            <h4 className="text-lg font-semibold text-ink-900">Return snapshot</h4>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Compare projected profit with ROI and annualized return assumptions.
            </p>
            <div className="mt-6">
              <canvas ref={returnCanvasRef} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleExportPDF} className="secondary-action">
          Export to PDF
        </button>
        <button
          type="button"
          onClick={handleGenerateAI}
          disabled={loadingAI}
          className="primary-action"
        >
          {loadingAI ? "Generating AI summary..." : "Generate AI deal summary"}
        </button>
      </div>

      {aiSummary ? (
        <div className="rounded-[24px] border border-verdigris-200 bg-verdigris-50/60 p-6">
          <span className="eyebrow">AI summary</span>
          <div className="mt-4 whitespace-pre-line text-sm leading-7 text-ink-700">{aiSummary}</div>
        </div>
      ) : null}
    </div>
  );
};

export default AnalysisCalculator;
