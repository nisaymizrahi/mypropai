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

const MortgageCalculator = () => {
    const [inputs, setInputs] = useState({
        loanAmount: '300000',
        interestRate: '7',
        loanTerm: '30'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    const calculations = useMemo(() => {
        const P = Number(inputs.loanAmount) || 0;
        const r = (Number(inputs.interestRate) / 100) / 12;
        const n = (Number(inputs.loanTerm)) * 12;

        if (P <= 0 || r <= 0 || n <= 0) {
            return { monthlyPayment: 0, totalPayment: 0, totalInterest: 0 };
        }

        const M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = M * n;
        const totalInterest = totalPayment - P;
        
        return { monthlyPayment: M, totalPayment, totalInterest };
    }, [inputs]);
    
    return (
         <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold text-brand-gray-800 mb-6 border-b pb-4">Mortgage Calculator</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Column */}
                <div className="space-y-4">
                    <CalcInput label="Loan Amount ($)" name="loanAmount" value={inputs.loanAmount} onChange={handleChange} />
                    <CalcInput label="Interest Rate (%)" name="interestRate" value={inputs.interestRate} onChange={handleChange} />
                    <CalcInput label="Loan Term (Years)" name="loanTerm" value={inputs.loanTerm} onChange={handleChange} />
                </div>

                {/* Results Column */}
                <div className="bg-brand-gray-50 p-6 rounded-lg text-center">
                    <p className="text-brand-gray-600">Monthly Payment</p>
                    <p className="text-4xl font-bold text-brand-turquoise-600 my-2">
                        ${calculations.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <div className="text-sm text-brand-gray-500 space-y-1 mt-4 border-t pt-4">
                       <div className="flex justify-between"><span>Total Principal Paid:</span> <span className="font-semibold">${Number(inputs.loanAmount || 0).toLocaleString()}</span></div>
                       <div className="flex justify-between"><span>Total Interest Paid:</span> <span className="font-semibold">${calculations.totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MortgageCalculator;