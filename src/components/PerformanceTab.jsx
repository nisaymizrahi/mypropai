import React, { useMemo } from 'react';

const StatCard = ({ title, value, colorClass = 'text-brand-gray-800', tooltip }) => (
    <div className="bg-brand-gray-50 p-4 rounded-lg border border-brand-gray-200" title={tooltip}>
        <p className="text-sm text-brand-gray-500">{title}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
);

const PerformanceTab = ({ investment, budgetItems, expenses }) => {

    const performanceMetrics = useMemo(() => {
        const { dealAnalysis, financingDetails, purchasePrice, arv } = investment;

        const totalBudget = budgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0);
        
        const totalFinancingCosts = (financingDetails.purchaseLoan.loanAmount * (financingDetails.purchaseLoan.interestRate / 100)) + (dealAnalysis.financingCosts || 0);
        
        const allInCost = purchasePrice + totalBudget + (dealAnalysis.buyingCosts || 0) + (dealAnalysis.holdingCosts?.monthlyAmount * dealAnalysis.holdingCosts?.durationMonths || 0) + (dealAnalysis.sellingCosts?.value || 0) + totalFinancingCosts;
        
        const netProfit = arv - allInCost;
        
        const downPayment = purchasePrice - financingDetails.purchaseLoan.loanAmount;
        const totalCashNeeded = downPayment + totalBudget + (dealAnalysis.buyingCosts || 0) + (dealAnalysis.holdingCosts?.monthlyAmount * dealAnalysis.holdingCosts?.durationMonths || 0) + totalFinancingCosts;

        const cashOnCashROI = totalCashNeeded > 0 ? (netProfit / totalCashNeeded) * 100 : 0;
        
        const loanAmount = financingDetails.purchaseLoan.loanAmount || 0;
        // Simplified for now; a full amortization schedule would be needed for perfect accuracy.
        const projectedEquity = arv - loanAmount;

        return {
            netProfit,
            cashOnCashROI,
            projectedEquity,
            allInCost,
        };
    }, [investment, budgetItems, expenses]);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Projected Net Profit"
                    value={`$${performanceMetrics.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                    colorClass={performanceMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}
                    tooltip="After Repair Value minus all calculated costs (purchase, rehab, financing, etc.)"
                />
                <StatCard 
                    title="Cash-on-Cash ROI"
                    value={`${performanceMetrics.cashOnCashROI.toFixed(1)}%`}
                    colorClass={performanceMetrics.cashOnCashROI >= 15 ? 'text-green-600' : 'text-yellow-600'}
                    tooltip="(Net Profit / Total Cash Needed) * 100"
                />
                <StatCard 
                    title="Projected Equity"
                    value={`$${performanceMetrics.projectedEquity.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                    tooltip="After Repair Value minus the loan balance"
                />
            </div>
            
            {/* Financial Breakdown Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Financial Breakdown</h3>
                <div className="space-y-2 text-sm">
                     <div className="flex justify-between border-b pb-2">
                        <span className="font-medium">After Repair Value (ARV)</span>
                        <span className="font-semibold text-green-600">+ ${investment.arv.toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between pt-2">
                        <span className="text-brand-gray-600">All-In Cost</span>
                        <span className="font-semibold text-red-600">- ${performanceMetrics.allInCost.toLocaleString()}</span>
                    </div>
                     <hr className="my-2"/>
                     <div className="flex justify-between font-bold text-lg">
                        <span>Projected Net Profit</span>
                        <span>${performanceMetrics.netProfit.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceTab;