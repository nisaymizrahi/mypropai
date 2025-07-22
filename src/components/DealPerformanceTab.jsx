import React, { useMemo } from 'react';

const StatCard = ({ title, value, colorClass = 'text-brand-gray-800', tooltip }) => (
  <div className="bg-brand-gray-50 p-4 rounded-lg border border-brand-gray-200" title={tooltip}>
    <p className="text-sm text-brand-gray-500">{title}</p>
    <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

const DealPerformanceTab = ({ investment, budgetItems, expenses }) => {
  const performanceMetrics = useMemo(() => {
    const { dealAnalysis, financingDetails, purchasePrice, arv } = investment;
    const totalBudget = budgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0);
    const loanAmount = financingDetails?.purchaseLoan?.loanAmount || 0;
    const interestRate = financingDetails?.purchaseLoan?.interestRate || 0;
    const holdingMonths = dealAnalysis?.holdingCosts?.durationMonths || 0;

    const interestPaid = (loanAmount * (interestRate / 100)) / 12 * holdingMonths;
    const totalFinancingCosts = interestPaid + (dealAnalysis?.financingCosts || 0);
    const totalCosts = (purchasePrice || 0) + totalBudget + (dealAnalysis?.buyingCosts || 0) + (dealAnalysis?.holdingCosts?.monthlyAmount * holdingMonths || 0) + (dealAnalysis?.sellingCosts?.value || 0) + totalFinancingCosts;
    const netProfit = (arv || 0) - totalCosts;

    const downPayment = (purchasePrice || 0) - loanAmount;
    const totalCashNeeded = downPayment + totalBudget + (dealAnalysis?.buyingCosts || 0) + (dealAnalysis?.holdingCosts?.monthlyAmount * holdingMonths || 0) + totalFinancingCosts;
    const cashOnCashROI = totalCashNeeded > 0 ? (netProfit / totalCashNeeded) * 100 : 0;
    const projectedEquity = (arv || 0) - loanAmount;

    return {
      netProfit,
      cashOnCashROI,
      projectedEquity,
      allInCost: totalCosts,
    };
  }, [investment, budgetItems, expenses]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Projected Net Profit" value={`$${performanceMetrics.netProfit.toLocaleString()}`} colorClass={performanceMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'} tooltip="ARV - all costs" />
        <StatCard title="Cash-on-Cash ROI" value={`${performanceMetrics.cashOnCashROI.toFixed(1)}%`} colorClass={performanceMetrics.cashOnCashROI >= 15 ? 'text-green-600' : 'text-yellow-600'} tooltip="(Profit / Cash In) * 100" />
        <StatCard title="Projected Equity" value={`$${performanceMetrics.projectedEquity.toLocaleString()}`} tooltip="ARV - loan balance" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Financial Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b pb-2">
            <span className="font-medium">After Repair Value (ARV)</span>
            <span className="font-semibold text-green-600">+ ${investment.arv?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-brand-gray-600">All-In Cost</span>
            <span className="font-semibold text-red-600">- ${performanceMetrics.allInCost.toLocaleString()}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>Projected Net Profit</span>
            <span>${performanceMetrics.netProfit.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealPerformanceTab;
