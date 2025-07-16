import React, { useState, useMemo } from 'react';

const CalcInput = ({ label, name, value, onChange, placeholder, type = 'number' }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600">{label}</label>
        <input 
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm"
        />
    </div>
);

const FlipAnalyzer = ({ investment, budgetItems, expenses }) => {
    const [inputs, setInputs] = useState({ purchasePrice: '', arv: '', renovationCosts: '', buyingCosts: '', holdingCosts: '', sellingCosts: '', loanAmount: '', loanPoints: '', otherLoanFees: '' });
    
    // This is a correction from previous versions, using the component's state
    const handleChange = (e) => {
        setInputs(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const calculations = useMemo(() => {
        const p = (name) => Number(inputs[name]) || 0;
        const totalFinancingCosts = (p('loanAmount') * (p('loanPoints') / 100)) + p('otherLoanFees');
        const totalCosts = p('purchasePrice') + p('renovationCosts') + p('buyingCosts') + p('holdingCosts') + p('sellingCosts') + totalFinancingCosts;
        const netProfit = p('arv') - totalCosts;
        const downPayment = p('purchasePrice') - p('loanAmount');
        const totalCashNeeded = downPayment + p('renovationCosts') + p('buyingCosts') + p('holdingCosts') + totalFinancingCosts;
        const cashOnCashROI = totalCashNeeded > 0 ? (netProfit / totalCashNeeded) * 100 : 0;
        return { totalCosts, netProfit, totalFinancingCosts, totalCashNeeded, cashOnCashROI };
    }, [inputs]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-4">Fix & Flip Deal Analyzer</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                        <h4 className="font-semibold">Core Numbers</h4>
                        <CalcInput label="Purchase Price" name="purchasePrice" value={inputs.purchasePrice} onChange={handleChange} placeholder="200000" />
                        <CalcInput label="After Repair Value (ARV)" name="arv" value={inputs.arv} onChange={handleChange} placeholder="350000" />
                        <CalcInput label="Renovation Costs" name="renovationCosts" value={inputs.renovationCosts} onChange={handleChange} placeholder="50000" />
                    </div>
                    <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                        <h4 className="font-semibold">Financing Costs</h4>
                        <CalcInput label="Loan Amount" name="loanAmount" value={inputs.loanAmount} onChange={handleChange} placeholder="160000" />
                        <CalcInput label="Loan Points (%)" name="loanPoints" value={inputs.loanPoints} onChange={handleChange} placeholder="2" />
                        <CalcInput label="Other Loan Fees ($)" name="otherLoanFees" value={inputs.otherLoanFees} onChange={handleChange} placeholder="1500" />
                    </div>
                     <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                        <h4 className="font-semibold">Other Deal Costs</h4>
                        <CalcInput label="Buying / Closing Costs" name="buyingCosts" value={inputs.buyingCosts} onChange={handleChange} placeholder="5000" />
                        <CalcInput label="Holding Costs (Utilities, etc)" name="holdingCosts" value={inputs.holdingCosts} onChange={handleChange} placeholder="6000" />
                        <CalcInput label="Selling Costs (Commissions, etc)" name="sellingCosts" value={inputs.sellingCosts} onChange={handleChange} placeholder="21000" />
                    </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border">
                    <h4 className="text-lg font-bold text-center mb-4">Deal Analysis Results</h4>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between border-b pb-2"><span>After Repair Value (ARV)</span><span className="font-semibold">${Number(inputs.arv || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Purchase Price</span><span>-${Number(inputs.purchasePrice || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Renovation</span><span>-${Number(inputs.renovationCosts || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Buying Costs</span><span>-${Number(inputs.buyingCosts || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Holding Costs</span><span>-${Number(inputs.holdingCosts || 0).toLocaleString()}</span></div>
                         <div className="flex justify-between"><span>Financing Costs</span><span>-${calculations.totalFinancingCosts.toLocaleString()}</span></div>
                        <div className="flex justify-between border-b pb-2"><span>Selling Costs</span><span>-${Number(inputs.sellingCosts || 0).toLocaleString()}</span></div>
                        <div className="flex justify-between font-bold text-lg pt-2"><span>Net Profit</span><span className={calculations.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>${calculations.netProfit.toLocaleString()}</span></div>
                    </div>
                    <div className="mt-8 border-t pt-4 space-y-3">
                        <div className="flex justify-between text-sm"><span className="font-semibold">Total Cash Needed</span><span className="font-bold">${calculations.totalCashNeeded.toLocaleString()}</span></div>
                        <div className="flex justify-between text-lg"><span className="font-semibold">Cash-on-Cash ROI</span><span className={`font-bold ${calculations.cashOnCashROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>{calculations.cashOnCashROI.toFixed(1)}%</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlipAnalyzer; // ✅ This line was missing
