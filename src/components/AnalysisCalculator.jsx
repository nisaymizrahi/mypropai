import React, { useState, useMemo, useRef } from "react";
import { generateAIReport } from "../utils/api";
import html2pdf from "html2pdf.js";

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
      setAISummary("Error generating summary.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div ref={summaryRef} className="bg-white border rounded-lg p-6 shadow-sm space-y-6 mt-10">
      <h3 className="text-xl font-bold text-brand-gray-800">📊 Deal Analysis Calculator</h3>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Purchase Price</label>
          <input name="purchasePrice" value={inputs.purchasePrice} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium">Buy Closing Costs</label>
          <input name="buyClosingCost" value={inputs.buyClosingCost} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
          <label className="text-xs"><input type="checkbox" name="buyClosingIsPercent" checked={inputs.buyClosingIsPercent} onChange={handleChange} /> % of Price</label>
        </div>
        <div>
          <label className="block text-sm font-medium">Holding Period (Months)</label>
          <input name="holdingMonths" value={inputs.holdingMonths} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>

        {/* Loan Details */}
        <div>
          <label className="block text-sm font-medium">Loan Amount</label>
          <input name="loanAmount" value={inputs.loanAmount} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium">Interest Rate (%)</label>
          <input name="interestRate" value={inputs.interestRate} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium">Term (Months)</label>
          <input name="loanTerm" value={inputs.loanTerm} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium">Points (%)</label>
          <input name="loanPoints" value={inputs.loanPoints} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium">Amount Funded by Lender</label>
          <input name="fundedAmount" value={inputs.fundedAmount} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>

        {/* Holding Costs */}
        <div>
          <label className="block text-sm font-medium">Taxes (monthly)</label>
          <input name="taxes" value={inputs.taxes} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium">Insurance (monthly)</label>
          <input name="insurance" value={inputs.insurance} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium">Utilities (monthly)</label>
          <input name="utilities" value={inputs.utilities} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium">Other Monthly Costs</label>
          <input name="otherMonthly" value={inputs.otherMonthly} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>

        {/* Sale */}
        <div>
          <label className="block text-sm font-medium">ARV (After Repair Value)</label>
          <input name="arv" value={inputs.arv} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium">Sell Closing Costs</label>
          <input name="sellClosingCost" value={inputs.sellClosingCost} onChange={handleChange} type="number" className="w-full border p-2 rounded-md" />
          <label className="text-xs"><input type="checkbox" name="sellClosingIsPercent" checked={inputs.sellClosingIsPercent} onChange={handleChange} /> % of ARV</label>
        </div>
      </div>

      {/* Summary */}
      <div className="pt-6 border-t text-sm space-y-2 text-brand-gray-800">
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

      {/* Buttons */}
      <div className="flex gap-4 pt-6">
        <button onClick={handleGenerateSummary} className="bg-blue-600 text-white px-4 py-2 rounded-md">
          {aiLoading ? "Generating..." : "🧠 Generate AI Deal Summary"}
        </button>
        <button onClick={handleExportPDF} className="bg-brand-turquoise text-white px-4 py-2 rounded-md">
          📤 Export to PDF
        </button>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="bg-gray-100 p-4 border rounded-md text-sm whitespace-pre-wrap mt-4">
          {aiSummary}
        </div>
      )}
    </div>
  );
};

export default AnalysisCalculator;
