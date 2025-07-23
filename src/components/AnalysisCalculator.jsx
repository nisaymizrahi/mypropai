import React, { useState, useMemo, useEffect, useRef } from "react";
import { generateAIReport } from "../utils/api";
import html2pdf from "html2pdf.js";
import { Chart, registerables } from "chart.js";

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
  const [aiLoading, setAiLoading] = useState(false);
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
    const cashInvested = totalCost - loanAmount;
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

  useEffect(() => {
    const pie = document.getElementById("costPieChart");
    if (pie) {
      new Chart(pie, {
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
      });
    }

    const bar = document.getElementById("roiBarChart");
    if (bar) {
      new Chart(bar, {
        type: "bar",
        data: {
          labels: ["ROI", "Annual ROI"],
          datasets: [
            {
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
    }
  }, [calc]);

  const handleExportPDF = () => {
    const element = summaryRef.current;
    if (element) {
      html2pdf().set({ filename: "deal-summary.pdf" }).from(element).save();
    }
  };

  const handleGenerateSummary = async () => {
    try {
      setAiLoading(true);
      const result = await generateAIReport(investment._id);
      setAISummary(result.summary || "AI summary not available.");
    } catch (err) {
      console.error("AI Summary Error:", err);
      setAISummary("AI summary not available.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div ref={summaryRef} className="bg-white border rounded-lg p-6 shadow-sm space-y-6 mt-10">
      <h3 className="text-xl font-bold text-brand-gray-800">📊 Deal Analysis Calculator</h3>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Purchase Price", name: "purchasePrice" },
          { label: "Buy Closing Costs", name: "buyClosingCost" },
          { label: "Holding Period (Months)", name: "holdingMonths" },
          { label: "Loan Amount", name: "loanAmount" },
          { label: "Interest Rate (%)", name: "interestRate" },
          { label: "Term (Months)", name: "loanTerm" },
          { label: "Points (%)", name: "loanPoints" },
          { label: "Taxes (Monthly)", name: "taxes" },
          { label: "Insurance (Monthly)", name: "insurance" },
          { label: "Utilities (Monthly)", name: "utilities" },
          { label: "Other Monthly Costs", name: "otherMonthly" },
          { label: "ARV (Sale Price)", name: "arv" },
          { label: "Sell Closing Costs", name: "sellClosingCost" },
        ].map(({ label, name }) => (
          <div key={name}>
            <label className="block text-sm font-medium">{label}</label>
            <input
              type="number"
              name={name}
              value={inputs[name]}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
            />
          </div>
        ))}
      </div>

      {/* Summary Table */}
      <div className="overflow-x-auto">
        <table className="w-full mt-6 text-sm border-t">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 font-semibold">Metric</th>
              <th className="p-2 font-semibold">Value</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Total Rehab Cost", `$${totalRehabCost.toLocaleString()}`],
              ["Total Finance Cost", `$${calc.totalFinance.toLocaleString()}`],
              ["Total Holding Cost", `$${calc.totalHolding.toLocaleString()}`],
              ["Total Project Cost", `$${calc.totalCost.toLocaleString()}`],
              ["Net Profit", `$${calc.netProfit.toLocaleString()}`],
              ["Cash Invested", `$${calc.cashInvested.toLocaleString()}`],
              ["ROI", `${calc.roi.toFixed(1)}%`],
              ["Annualized ROI", `${calc.annualRoi.toFixed(1)}%`],
              ["Profit per Month", `$${calc.profitPerMonth.toFixed(0)}`],
              ["Break-even ARV", `$${calc.breakEvenARV.toLocaleString()}`],
            ].map(([label, val], idx) => (
              <tr key={idx} className={idx % 2 ? "bg-gray-50" : ""}>
                <td className="p-2">{label}</td>
                <td className="p-2 font-medium">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {/* AI + PDF */}
      <div className="flex flex-wrap gap-4 pt-6">
        <button onClick={handleGenerateSummary} className="bg-blue-600 text-white px-4 py-2 rounded-md">
          {aiLoading ? "Generating..." : "🧠 Generate AI Deal Summary"}
        </button>
        <button onClick={handleExportPDF} className="bg-brand-turquoise text-white px-4 py-2 rounded-md">
          📤 Export to PDF
        </button>
      </div>

      {aiSummary && (
        <div className="bg-gray-100 border p-4 mt-4 rounded-md text-sm whitespace-pre-wrap">
          {aiSummary}
        </div>
      )}
    </div>
  );
};

export default AnalysisCalculator;
