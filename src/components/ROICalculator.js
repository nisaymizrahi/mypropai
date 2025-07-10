import React, { useState } from "react";

// --- NEW: Reusable styled input component for consistency ---
const FormInput = ({ ...props }) => (
    <input 
        className="w-full bg-brand-slate-200 border border-brand-dark-700 rounded-md p-2 text-brand-dark-100 placeholder-brand-dark-500 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition"
        {...props} 
    />
);

// --- NEW: Reusable Stat Card Component for results ---
const StatCard = ({ title, value, className = "" }) => (
    <div className={`bg-brand-slate-200 p-3 rounded-lg text-center ${className}`}>
        <p className="text-sm text-brand-dark-400">{title}</p>
        <p className="text-xl font-semibold text-brand-blue">{value}</p>
    </div>
);


const ROICalculator = ({ onCalculate }) => {
  const [inputs, setInputs] = useState({
    price: "",
    down: "20",
    rent: "",
    expenses: ""
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(""); // NEW: State for inline error messages

  const sanitize = (val) => {
    if (typeof val !== 'string') val = String(val);
    return parseFloat(val.replace(/[^0-9.]/g, ""));
  }

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setResults(null);

    const price = sanitize(inputs.price);
    const down = sanitize(inputs.down) / 100;
    const rent = sanitize(inputs.rent);
    const expenses = sanitize(inputs.expenses);

    if (isNaN(price) || isNaN(down) || isNaN(rent) || isNaN(expenses)) {
      setError("Please enter valid numbers for all fields.");
      return;
    }
    
    if (price <= 0) {
        setError("Purchase Price must be greater than zero.");
        return;
    }

    const downPayment = price * down;
    const monthlyCashFlow = rent - expenses;
    const annualCashFlow = monthlyCashFlow * 12;
    const capRate = (annualCashFlow / price) * 100;
    // Handle division by zero for ROI if down payment is 0
    const roi = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;

    const resultData = {
      cashFlow: monthlyCashFlow.toFixed(2),
      capRate: capRate.toFixed(2),
      roi: roi.toFixed(2),
      downPayment: downPayment.toLocaleString()
    };

    setResults(resultData);
    if (onCalculate) onCalculate(resultData);
  };

  return (
    // NEW: Removed old wrapper div, styling is now on the root element
    <div>
      <h3 className="text-xl font-semibold text-brand-dark-100 mb-3">ROI / Cap Rate Calculator</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <label className="block text-sm font-medium text-brand-dark-300 mb-1">Purchase Price</label>
                <FormInput name="price" placeholder="$300,000" value={inputs.price} onChange={handleChange} required />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-dark-300 mb-1">Down Payment (%)</label>
                <FormInput name="down" placeholder="20" value={inputs.down} onChange={handleChange} required />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-dark-300 mb-1">Monthly Rent</label>
                <FormInput name="rent" placeholder="$2,500" value={inputs.rent} onChange={handleChange} required />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-dark-300 mb-1">Monthly Expenses</label>
                <FormInput name="expenses" placeholder="$1,200" value={inputs.expenses} onChange={handleChange} required />
            </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 mt-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-sky-500 transition"
          >
            Calculate
          </button>
        </div>
      </form>

      {results && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Down Payment" value={`$${results.downPayment}`} />
            <StatCard title="Monthly Cash Flow" value={`$${results.cashFlow}`} />
            <StatCard title="Cap Rate" value={`${results.capRate}%`} />
            <StatCard title="Cash-on-Cash ROI" value={`${results.roi}%`} />
        </div>
      )}
    </div>
  );
};

export default ROICalculator;
