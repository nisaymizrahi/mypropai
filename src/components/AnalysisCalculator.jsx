import React, { useState, useEffect, useMemo, useRef } from "react";
import { Chart, registerables } from "chart.js";
import html2pdf from "html2pdf.js";
import { generateAIReport } from "../utils/api";

Chart.register(...registerables);

const AnalysisCalculator = ({ investment, totalRehabCost }) => {
  const [inputs, setInputs] = useState({
    purchasePrice: investment.purchasePrice || 0,
    buyClosingCost: 0,
    buyClosingIsPercent: true,
    loanAmount: 0,
    interestRate: 8,
    loanTerm: 12,
    loanPoints: 1,
    fundedAmount: 0,
    holdingMonths: 6,
    taxes: 0,
    insurance: 0,
    utilities: 0,
    otherMonthly: 0,
    arv: investment.arv || 0,
    sellClosingCost: 0,
    sellClosingIsPercent: true,
  });

  const [aiSummary, setAISummary] = useState("");
  const summaryRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : parseFloat(value || 0),
    }));
  };

  const calc = useMemo(() => {
    const {
      purchasePrice,
      buyClosingCost,
      buyClosingIsPercent,
      loanAmount,
      interestRate,
      loanTerm,
      loanPoints,
      fundedAmount,
      holdingMonths,
      taxes,
      insurance,
      utilities,
      otherMonthly,
      arv,
      sellClosingCost,
      sellClosingIsPercent,
    } = inputs;

    const buyClosing = buyClosingIsPercent ? (purchasePrice * buyClosingCost) / 100 : buyClosingCost;
    const sellClosing = sellClosingIsPercent ? (arv * sellClosingCost) / 100 : sellClosingCost;
    const pointsCost = (loanPoints / 100) * loanAmount;
    const financeInterest = (loanAmount * (interestRate / 100)) * (loanTerm / 12);
    const totalFinance = pointsCost + financeInterest;
    const totalHolding = (taxes + insurance + utilities + otherMonthly) * holdingMonths;
    const totalCost = purchasePrice + buyClosing + totalRehabCost + totalFinance + totalHolding + sellClosing;
    const netProfit = arv - totalCost;
    const cashInvested = totalCost - fundedAmount;
    const roi = cashInvested > 0 ? (netProfit / cashInvested) * 100 : 0;
    const annualRoi = roi * (12 / holdingMonths);
    const profitPerMonth = netProfit / holdingMonths;
    const breakEvenARV = totalCost;

    return {
      buyClosing,
      sellClosing,
      pointsCost,
      financeInterest,
      totalFinance,
      totalHolding,
      totalCost,
      netProfit,
      cashInvested,
      roi,
      annualRoi,
      profitPerMonth,
      breakEvenARV,
    };
  }, [inputs, totalRehabCost]);

  // Render Pie Chart
  useEffect(() => {
    const ctx = document.getElementById("costPieChart");
    if (!ctx) return;

    new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Purchase", "Buy Closing", "Rehab", "Finance", "Holding", "Sell Closing"],
        datasets: [
          {
            data: [
              inputs.purchasePrice,
              calc.buyClosing,
              totalRehabCost,
              calc.totalFinance,
              calc.totalHolding,
              calc.sellClosing,
            ],
            backgroundColor: ["#14b8a6", "#4ade80", "#60a5fa", "#facc15", "#fb923c", "#f87171"],
          },
        ],
      },
      options: { responsive: true },
    });
  }, [calc]);

  // Render ROI Bar Chart
  useEffect(() => {
    const ctx = document.getElementById("roiBarChart");
    if (!ctx) return;

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["ROI", "Annualized ROI"],
        datasets: [
          {
            label: "%",
            data: [calc.roi.toFixed(1), calc.annualRoi.toFixed(1)],
            backgroundColor: ["#3b82f6", "#6366f1"],
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => `${val}%`,
            },
          },
        },
      },
    });
  }, [calc]);

  const handleExportPDF = () => {
    const element = summaryRef.current;
    if (element) {
      html2pdf().set({ filename: "deal-summary.pdf" }).from(element).save();
    }
  };

  const handleGenerateSummary = async () => {
    try {
      const result = await generateAIReport(investment._id);
      setAISummary(result.summary || "AI summary not available.");
    } catch (err) {
      console.error("AI Summary Error:", err);
      setAISummary("Error generating summary.");
    }
  };

  return (
    <div ref={summaryRef} className="bg-white border rounded-lg p-6 shadow-sm space-y-6 mt-10">
      <h3 className="text-xl font-bold text-brand-gray-800">📊 Deal Analysis Calculator</h3>

      {/* Inputs UI (same as before, for brevity, not repeated here) */}
      {/* ...reuse the same editable inputs grid you already have from earlier */}

      {/* Summary */}
      <div className="border-t pt-6 mt-4 space-y-2 text-sm text-brand-gray-800">
        <div><strong>Total Rehab Cost:</strong> ${totalRehabCost.toLocaleString()}</div>
        <div><strong>Total Finance Cost:</strong> ${calc.totalFinance.toLocaleString()}</div>
        <div><strong>Total Holding Cost:</strong> ${calc.totalHolding.toLocaleString()}</div>
        <div><strong>Total Project Cost:</strong> ${calc.totalCost.toLocaleString()}</div>
        <div><strong>Net Profit:</strong> ${calc.netProfit.toLocaleString()}</div>
        <div><strong>Cash Invested:</strong> ${calc.cashInvested.toLocaleString()}</div>
        <div><strong>ROI:</strong> {calc.roi.toFixed(1)}%</div>
        <div><strong>Annualized ROI:</strong> {calc.annualRoi.toFixed(1)}%</div>
        <div><strong>Profit per Month:</strong> ${calc.profitPerMonth.toFixed(0)}</div>
        <div><strong>Break-even ARV:</strong> ${calc.breakEvenARV.toLocaleString()}</div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <div>
          <h4 className="text-md font-semibold mb-2">📈 Cost Breakdown</h4>
          <canvas id="costPieChart" />
        </div>
        <div>
          <h4 className="text-md font-semibold mb-2">📊 ROI Comparison</h4>
          <canvas id="roiBarChart" />
        </div>
      </div>

      {/* AI & Export */}
      <div className="pt-6 space-y-4">
        <button onClick={handleGenerateSummary} className="bg-blue-600 text-white px-4 py-2 rounded-md">
          🧠 Generate AI Deal Summary
        </button>
        {aiSummary && <div className="bg-gray-100 border p-4 rounded-md text-sm whitespace-pre-wrap">{aiSummary}</div>}
        <button onClick={handleExportPDF} className="bg-brand-turquoise text-white px-4 py-2 rounded-md">
          📤 Export Analysis to PDF
        </button>
      </div>
    </div>
  );
};

export default AnalysisCalculator;
