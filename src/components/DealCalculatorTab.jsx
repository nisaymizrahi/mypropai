import React, { useState } from 'react';
import { generateAIReport } from '../utils/api';

const DealCalculatorTab = ({ investment }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calc = () => {
    const p = investment.purchasePrice || 0;
    const a = investment.arv || 0;
    const buy = investment.dealAnalysis?.buyingCosts || 0;
    const rehab = investment.budget?.reduce((sum, b) => sum + (b.amount || 0), 0);
    const holdMonths = investment.dealAnalysis?.holdingCosts?.durationMonths || 6;
    const holdingCost = (investment.dealAnalysis?.holdingCosts?.monthlyAmount || 0) * holdMonths;
    const sell = investment.dealAnalysis?.sellingCosts?.value || 0;
    const isPercent = investment.dealAnalysis?.sellingCosts?.isPercentage;

    const finance = investment.dealAnalysis?.financingCosts || 0;

    const saleCost = isPercent ? (sell / 100) * a : sell;
    const totalCost = p + buy + rehab + holdingCost + saleCost + finance;
    const profit = a - totalCost;
    const roi = p > 0 ? (profit / p) * 100 : 0;

    return { p, a, buy, rehab, holdingCost, saleCost, finance, totalCost, profit, roi };
  };

  const summary = calc();

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await generateAIReport(investment._id);
      setReport(result.report);
    } catch (err) {
      setError("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-gray-900">Deal Calculator</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-4 space-y-2">
          <h3 className="text-lg font-semibold">Summary</h3>
          <ul className="text-sm">
            <li><strong>Purchase Price:</strong> ${summary.p.toLocaleString()}</li>
            <li><strong>ARV:</strong> ${summary.a.toLocaleString()}</li>
            <li><strong>Buying Costs:</strong> ${summary.buy.toLocaleString()}</li>
            <li><strong>Rehab Budget:</strong> ${summary.rehab?.toLocaleString()}</li>
            <li><strong>Holding Costs:</strong> ${summary.holdingCost?.toLocaleString()}</li>
            <li><strong>Sale Closing:</strong> ${summary.saleCost.toLocaleString()}</li>
            <li><strong>Financing:</strong> ${summary.finance.toLocaleString()}</li>
            <li className="font-bold"><strong>Total Cost:</strong> ${summary.totalCost.toLocaleString()}</li>
            <li className="font-bold text-green-600"><strong>Net Profit:</strong> ${summary.profit.toLocaleString()}</li>
            <li><strong>ROI:</strong> {summary.roi.toFixed(1)}%</li>
          </ul>
        </div>
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold">AI Report</h3>
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="bg-brand-turquoise text-white px-4 py-2 rounded-md"
          >
            {loading ? "Generating..." : "Generate AI Report"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {report && (
            <div className="text-sm whitespace-pre-line bg-brand-gray-50 p-4 rounded-md border">
              {report}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DealCalculatorTab;
