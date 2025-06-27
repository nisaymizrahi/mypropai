import React, { useState } from "react";

const ROICalculator = ({ onCalculate }) => {
  const [inputs, setInputs] = useState({
    price: "",
    down: "",
    rent: "",
    expenses: ""
  });

  const [results, setResults] = useState(null);

  const sanitize = (val) => parseFloat(val.replace(/[^0-9.]/g, ""));

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const price = sanitize(inputs.price);
    const down = sanitize(inputs.down) / 100;
    const rent = sanitize(inputs.rent);
    const expenses = sanitize(inputs.expenses);

    if (isNaN(price) || isNaN(down) || isNaN(rent) || isNaN(expenses)) {
      alert("Please enter valid numbers.");
      return;
    }

    const downPayment = price * down;
    const monthlyCashFlow = rent - expenses;
    const annualCashFlow = monthlyCashFlow * 12;
    const capRate = (annualCashFlow / price) * 100;
    const roi = (annualCashFlow / downPayment) * 100;

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
    <div className="bg-white shadow rounded p-6">
      <h2 className="text-xl font-semibold mb-4">ROI / Cap Rate Calculator</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          name="price"
          placeholder="Purchase Price"
          value={inputs.price}
          onChange={handleChange}
          required
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          name="down"
          placeholder="Down Payment (%)"
          value={inputs.down}
          onChange={handleChange}
          required
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          name="rent"
          placeholder="Monthly Rent"
          value={inputs.rent}
          onChange={handleChange}
          required
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          name="expenses"
          placeholder="Monthly Expenses"
          value={inputs.expenses}
          onChange={handleChange}
          required
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="md:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="w-full py-2 px-4 mt-2 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 transition"
          >
            Calculate
          </button>
        </div>
      </form>

      {results && (
        <div className="mt-6 p-4 border border-gray-200 bg-gray-50 rounded text-sm">
          <p><strong>Down Payment:</strong> ${results.downPayment}</p>
          <p><strong>Monthly Cash Flow:</strong> ${results.cashFlow}</p>
          <p><strong>Cap Rate:</strong> {results.capRate}%</p>
          <p><strong>Cash-on-Cash ROI:</strong> {results.roi}%</p>
        </div>
      )}
    </div>
  );
};

export default ROICalculator;
