import React, { useRef, useState } from "react";
import { generateAIReport } from "../utils/api";
import html2pdf from "html2pdf.js";
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PieController,
  BarController
} from "chart.js";

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, PieController, BarController);

const AnalysisCalculator = ({ investment }) => {
  const [aiSummary, setAISummary] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const chartRef = useRef();
  const exportRef = useRef();

  const {
    purchasePrice,
    arv,
    buyClosingCost,
    buyClosingIsPercent,
    loanAmount,
    interestRate,
    loanTerm,
    loanPoints,
    holdingMonths,
    taxes,
    insurance,
    utilities,
    otherMonthly,
    sellClosingCost,
    sellClosingIsPercent,
  } = investment;

  const totalBudget = investment.totalBudget || 0; // Can be injected in the future

  const calcBuyingCost =
    buyClosingIsPercent && buyClosingCost
      ? (purchasePrice * buyClosingCost) / 100
      : buyClosingCost || 0;

  const calcFinanceCost =
    loanAmount && interestRate && loanTerm
      ? ((loanAmount * (interestRate / 100)) / 12) * loanTerm + (loanPoints / 100) * loanAmount
      : 0;

  const calcHoldingCost =
    (Number(taxes || 0) +
      Number(insurance || 0) +
      Number(utilities || 0) +
      Number(otherMonthly || 0)) * (holdingMonths || 0);

  const calcSellCost =
    sellClosingIsPercent && sellClosingCost
      ? (arv * sellClosingCost) / 100
      : sellClosingCost || 0;

  const totalCost =
    Number(purchasePrice || 0) +
    calcBuyingCost +
    totalBudget +
    calcFinanceCost +
    calcHoldingCost;

  const profit = Number(arv || 0) - totalCost - calcSellCost;
  const cashInvested = totalCost - loanAmount;
  const roi = ((profit / cashInvested) * 100) || 0;
  const annualizedROI = roi / ((holdingMonths || 1) / 12);

  const breakevenARV = totalCost + calcSellCost;

  const handleExportPDF = () => {
    html2pdf().from(exportRef.current).save("Deal-Analysis-Report.pdf");
  };

  const handleGenerateAI = async () => {
    try {
      setLoadingAI(true);
      const res = await generateAIReport(investment._id);
      setAISummary(res.summary);
    } catch (err) {
      setAISummary("AI summary not available.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-8">
      <div ref={exportRef} className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
        <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">Deal Analysis Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Purchase Price</span>
              <span>${purchasePrice?.toLocaleString() || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>Buy Closing Costs</span>
              <span>${calcBuyingCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Rehab Cost</span>
              <span>${totalBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Financing Cost</span>
              <span>${calcFinanceCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Holding Cost</span>
              <span>${calcHoldingCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total Project Cost</span>
              <span>${totalCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Projected ARV</span>
              <span>${arv?.toLocaleString() || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>Sell Closing Costs</span>
              <span>${calcSellCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Net Profit</span>
              <span>${profit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cash Invested</span>
              <span>${cashInvested.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-green-700 font-semibold">
              <span>ROI</span>
              <span>{roi.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-indigo-700 font-semibold">
              <span>Annualized ROI</span>
              <span>{annualizedROI.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-gray-600 text-xs pt-2 border-t">
              <span>Breakeven ARV</span>
              <span>${breakevenARV.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button onClick={handleExportPDF} className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md">
          Export to PDF
        </button>
        <button
          onClick={handleGenerateAI}
          disabled={loadingAI}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
        >
          {loadingAI ? "Generating..." : "Generate AI Deal Summary"}
        </button>
      </div>

      {aiSummary && (
        <div className="bg-brand-gray-50 p-4 rounded-lg border text-sm text-brand-gray-800">
          <h3 className="font-semibold mb-2">AI Deal Summary</h3>
          <p>{aiSummary}</p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-2">Cost Breakdown</h3>
          <canvas
            ref={(el) => {
              if (el) {
                new Chart(el, {
                  type: "pie",
                  data: {
                    labels: ["Buy Costs", "Rehab", "Finance", "Holding"],
                    datasets: [
                      {
                        data: [calcBuyingCost, totalBudget, calcFinanceCost, calcHoldingCost],
                        backgroundColor: ["#14b8a6", "#4f46e5", "#f59e0b", "#ef4444"],
                      },
                    ],
                  },
                  options: { responsive: true, plugins: { legend: { position: "bottom" } } },
                });
              }
            }}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Profit vs ROI</h3>
          <canvas
            ref={(el) => {
              if (el) {
                new Chart(el, {
                  type: "bar",
                  data: {
                    labels: ["Profit", "ROI %", "Annual ROI %"],
                    datasets: [
                      {
                        label: "Value",
                        data: [profit, roi, annualizedROI],
                        backgroundColor: ["#22c55e", "#2563eb", "#9333ea"],
                      },
                    ],
                  },
                  options: {
                    responsive: true,
                    scales: {
                      y: { beginAtZero: true },
                    },
                  },
                });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisCalculator;
