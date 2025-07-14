import React, { useState, useMemo } from 'react';

const CalcInput = ({ label, name, value, onChange, placeholder, type = 'number', step = "0.01" }) => (
    <div>
        <label className="block text-sm font-medium text-brand-gray-600">{label}</label>
        <input 
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            step={step}
            className="mt-1 block w-full border border-brand-gray-300 rounded-md p-2"
        />
    </div>
);

const RentalCalculator = () => {
    const [inputs, setInputs] = useState({
        purchasePrice: '',
        downPaymentPercent: '25',
        interestRate: '7',
        loanTerm: '30',
        grossMonthlyRent: '',
        propertyTaxes: '',
        insurance: '',
        vacancyRate: '5',
        repairsRate: '5',
        managementRate: '8'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };
    
    const calculations = useMemo(() => {
        const p = (name) => Number(inputs[name]) || 0;

        const downPaymentAmount = p('purchasePrice') * (p('downPaymentPercent') / 100);
        const loanAmount = p('purchasePrice') - downPaymentAmount;
        const monthlyInterestRate = (p('interestRate') / 100) / 12;
        const numberOfPayments = p('loanTerm') * 12;
        
        const mortgagePayment = numberOfPayments > 0 && monthlyInterestRate > 0
            ? loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
            : 0;
            
        const monthlyTaxes = p('propertyTaxes') / 12;
        const monthlyInsurance = p('insurance') / 12;
        const vacancy = p('grossMonthlyRent') * (p('vacancyRate') / 100);
        const repairs = p('grossMonthlyRent') * (p('repairsRate') / 100);
        const management = p('grossMonthlyRent') * (p('managementRate') / 100);
        
        const totalMonthlyExpenses = monthlyTaxes + monthlyInsurance + vacancy + repairs + management;
        const netOperatingIncome = p('grossMonthlyRent') - totalMonthlyExpenses;
        const monthlyCashFlow = netOperatingIncome - mortgagePayment;
        const annualCashFlow = monthlyCashFlow * 12;

        const totalCashInvested = downPaymentAmount; // Simplified for now
        const cashOnCashROI = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
        
        const capRate = p('purchasePrice') > 0 ? ((netOperatingIncome * 12) / p('purchasePrice')) * 100 : 0;

        return { monthlyCashFlow, cashOnCashROI, capRate, totalMonthlyExpenses, mortgagePayment, netOperatingIncome };
    }, [inputs]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold text-brand-gray-800 mb-6 border-b pb-4">Rental Property Calculator</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Column */}
                <div className="space-y-4">
                    <CalcInput label="Purchase Price ($)" name="purchasePrice" value={inputs.purchasePrice} onChange={handleChange} />
                    <CalcInput label="Gross Monthly Rent ($)" name="grossMonthlyRent" value={inputs.grossMonthlyRent} onChange={handleChange} />
                    <CalcInput label="Down Payment (%)" name="downPaymentPercent" value={inputs.downPaymentPercent} onChange={handleChange} />
                    <CalcInput label="Interest Rate (%)" name="interestRate" value={inputs.interestRate} onChange={handleChange} />
                    <CalcInput label="Loan Term (Years)" name="loanTerm" value={inputs.loanTerm} onChange={handleChange} />
                    <CalcInput label="Annual Property Taxes ($)" name="propertyTaxes" value={inputs.propertyTaxes} onChange={handleChange} />
                    <CalcInput label="Annual Insurance ($)" name="insurance" value={inputs.insurance} onChange={handleChange} />
                    <CalcInput label="Vacancy Rate (%)" name="vacancyRate" value={inputs.vacancyRate} onChange={handleChange} />
                    <CalcInput label="Repairs & Maintenance (%)" name="repairsRate" value={inputs.repairsRate} onChange={handleChange} />
                    <CalcInput label="Management Fee (%)" name="managementRate" value={inputs.managementRate} onChange={handleChange} />
                </div>

                {/* Results Column */}
                <div className="bg-brand-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-bold text-center mb-4">Rental Analysis Results</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span>Gross Monthly Rent</span><span className="font-semibold">${Number(inputs.grossMonthlyRent || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Monthly Operating Expenses</span><span className="font-semibold">-${calculations.totalMonthlyExpenses.toFixed(2)}</span></div>
                        <div className="flex justify-between border-b pb-2"><span>Monthly Mortgage (P&I)</span><span className="font-semibold">-${calculations.mortgagePayment.toFixed(2)}</span></div>
                        
                        <div className="flex justify-between font-bold text-lg pt-2"><span>Monthly Cash Flow</span><span className={calculations.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>${calculations.monthlyCashFlow.toFixed(2)}</span></div>
                    </div>
                    
                    <div className="mt-8 border-t pt-4 space-y-3">
                        <div className="flex justify-between text-base">
                            <span className="font-semibold">Cash on Cash ROI</span>
                            <span className={`font-bold ${calculations.cashOnCashROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>{calculations.cashOnCashROI.toFixed(1)}%</span>
                        </div>
                         <div className="flex justify-between text-base">
                            <span className="font-semibold">Cap Rate</span>
                            <span className={`font-bold ${calculations.capRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>{calculations.capRate.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentalCalculator;