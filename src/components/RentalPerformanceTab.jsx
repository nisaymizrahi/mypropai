import React, { useMemo } from 'react';

const StatCard = ({ title, value, colorClass = 'text-brand-gray-800', tooltip }) => (
    <div className="bg-brand-gray-50 p-4 rounded-lg border border-brand-gray-200" title={tooltip}>
        <p className="text-sm text-brand-gray-500">{title}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
);

const RentalPerformanceTab = ({ property, operatingExpenses }) => {

    const performanceData = useMemo(() => {
        if (!property || !property.financials) {
            return {}; // Return empty object if data is not available yet
        }

        // --- Income ---
        const monthlyGrossRent = (property.units || [])
            .filter(u => u.currentLease && u.currentLease.isActive)
            .reduce((sum, u) => sum + u.currentLease.rentAmount, 0);
        const annualGrossRent = monthlyGrossRent * 12;

        // --- Expenses ---
        const annualTaxes = property.financials.operatingExpenses?.propertyTaxes || 0;
        const annualInsurance = property.financials.operatingExpenses?.insurance || 0;
        const otherAnnualExpenses = (operatingExpenses || []).reduce((sum, e) => sum + e.amount, 0);
        const totalAnnualOperatingExpenses = annualTaxes + annualInsurance + otherAnnualExpenses;
        const monthlyOperatingExpenses = totalAnnualOperatingExpenses / 12;

        // --- Calculations ---
        const netOperatingIncome = annualGrossRent - totalAnnualOperatingExpenses;

        const loan = property.financials.mortgage;
        const P = loan?.loanAmount || 0;
        const r = (loan?.interestRate / 100) / 12;
        const n = (loan?.loanTerm || 0) * 12;
        
        const monthlyMortgage = (P > 0 && r > 0 && n > 0)
            ? P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
            : 0;

        const monthlyCashFlow = monthlyGrossRent - monthlyOperatingExpenses - monthlyMortgage;
        const annualCashFlow = monthlyCashFlow * 12;

        const currentValue = property.financials.currentValue || property.investment.purchasePrice || 0;
        const capRate = currentValue > 0 ? (netOperatingIncome / currentValue) * 100 : 0;

        return {
            monthlyGrossRent,
            monthlyOperatingExpenses,
            netOperatingIncome,
            monthlyMortgage,
            monthlyCashFlow,
            annualCashFlow,
            capRate,
        };

    }, [property, operatingExpenses]);

    if (!performanceData) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Monthly Cash Flow"
                    value={`$${performanceData.monthlyCashFlow?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    colorClass={performanceData.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}
                    tooltip="Monthly rent minus all operating expenses and mortgage payments."
                />
                <StatCard 
                    title="Net Operating Income (NOI)"
                    value={`$${performanceData.netOperatingIncome?.toLocaleString('en-US', { maximumFractionDigits: 0 })} / yr`}
                    tooltip="Annual income after operating expenses, but before mortgage."
                />
                <StatCard 
                    title="Cap Rate"
                    value={`${performanceData.capRate?.toFixed(2) || '0.00'}%`}
                    tooltip="(Annual NOI / Current Property Value) * 100"
                />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Annual Performance Breakdown</h3>
                <div className="space-y-2 text-sm">
                     <div className="flex justify-between border-b pb-2">
                        <span className="font-medium">Gross Rental Income</span>
                        <span className="font-semibold text-green-600">+ ${(performanceData.monthlyGrossRent * 12).toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between pt-2">
                        <span className="text-brand-gray-600">Operating Expenses</span>
                        <span className="font-semibold text-red-600">- ${(performanceData.monthlyOperatingExpenses * 12).toLocaleString()}</span>
                    </div>
                     <hr className="my-2"/>
                     <div className="flex justify-between font-bold">
                        <span>Net Operating Income (NOI)</span>
                        <span>${performanceData.netOperatingIncome.toLocaleString()}</span>
                    </div>
                     <div className="flex justify-between border-b pb-2">
                        <span className="text-brand-gray-600">Mortgage Payments (P&I)</span>
                        <span className="font-semibold text-red-600">- ${(performanceData.monthlyMortgage * 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                     <div className="flex justify-between font-bold text-lg pt-2">
                        <span>Total Annual Cash Flow</span>
                        <span className={performanceData.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ${performanceData.annualCashFlow.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentalPerformanceTab;