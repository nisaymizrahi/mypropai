import React from "react";
import { useParams } from "react-router-dom";

const InvestmentDetail = () => {
  const { id } = useParams();

  // Temporary mock data
  const investment = {
    id,
    address: "123 Main St",
    type: "Fix and Flip",
    purchasePrice: 250000,
    lotSize: 4000,
    sqft: 1800,
    expenses: [
      { id: 1, category: "Labor", type: "Framing", amount: 5000 },
      { id: 2, category: "Material", type: "Drywall", amount: 2000 },
    ],
    arv: 360000,
  };

  const totalExpenses = investment.expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = investment.arv - investment.purchasePrice - totalExpenses;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Investment Detail</h1>

      <div className="bg-white p-4 rounded shadow mb-6 space-y-2">
        <p><strong>Address:</strong> {investment.address}</p>
        <p><strong>Type:</strong> {investment.type}</p>
        <p><strong>Purchase Price:</strong> ${investment.purchasePrice.toLocaleString()}</p>
        <p><strong>Lot Size:</strong> {investment.lotSize} sqft</p>
        <p><strong>Property Size:</strong> {investment.sqft} sqft</p>
        <p><strong>ARV:</strong> ${investment.arv.toLocaleString()}</p>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Expenses</h2>
        {investment.expenses.map((e) => (
          <div key={e.id} className="flex justify-between border-b py-2 text-sm">
            <span>{e.category} - {e.type}</span>
            <span>${e.amount.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold mt-3">
          <span>Total Expenses:</span>
          <span>${totalExpenses.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded shadow text-green-700 font-semibold text-lg">
        Profit Estimate: ${profit.toLocaleString()}
      </div>
    </div>
  );
};

export default InvestmentDetail;
