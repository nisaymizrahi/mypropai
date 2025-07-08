import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTokenHeader } from "../utils/api";

const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBudgetDetails, setShowBudgetDetails] = useState(false);

  const [newLine, setNewLine] = useState({ category: "", description: "", amount: "" });

  useEffect(() => {
    fetchInvestment();
  }, [id]);

  const fetchInvestment = async () => {
    try {
      const res = await fetch(`https://mypropai-server.onrender.com/api/investments/${id}`, {
        headers: getTokenHeader(),
      });

      if (!res.ok) throw new Error("Failed to load investment");
      const data = await res.json();
      setInvestment(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load investment.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudgetLine = async () => {
    if (!newLine.category || !newLine.amount) return;

    const updated = {
      ...investment,
      budget: [
        ...(investment.budget || []),
        {
          ...newLine,
          amount: Number(newLine.amount),
        },
      ],
    };

    try {
      const res = await fetch(`https://mypropai-server.onrender.com/api/investments/${id}`, {
        method: "PATCH",
        headers: getTokenHeader(),
        body: JSON.stringify({ budget: updated.budget }),
      });

      if (!res.ok) throw new Error("Failed to save budget line");
      const data = await res.json();
      setInvestment(data);
      setNewLine({ category: "", description: "", amount: "" });
    } catch (err) {
      console.error("Add budget line error:", err);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!investment) return null;

  const totalBudget = (investment.budget || []).reduce((sum, line) => sum + (line.amount || 0), 0);
  const expenses = investment.expenses || [];
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const profit = (investment.arv || 0) - (investment.purchasePrice || 0) - totalExpenses;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Investment Detail</h1>
        <button
          onClick={() => navigate(`/investments/${id}/edit`)}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Edit Property
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow space-y-2">
        <p><strong>Address:</strong> {investment.address}</p>
        <p><strong>Type:</strong> {investment.type}</p>
        <p><strong>Purchase Price:</strong> ${investment.purchasePrice?.toLocaleString()}</p>
        <p><strong>Lot Size:</strong> {investment.lotSize} sqft</p>
        <p><strong>Property Size:</strong> {investment.sqft} sqft</p>
        <p><strong>ARV:</strong> ${investment.arv?.toLocaleString()}</p>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Renovation Budget</h2>
          <button
            onClick={() => setShowBudgetDetails(!showBudgetDetails)}
            className="text-blue-600 hover:underline"
          >
            {showBudgetDetails ? "Hide" : "View"} Details
          </button>
        </div>
        <p className="mt-2 text-gray-700">Total Budget: ${totalBudget.toLocaleString()}</p>

        {showBudgetDetails && (
          <>
            <div className="mt-3 border-t pt-2 space-y-2 text-sm">
              {(investment.budget || []).map((item, idx) => (
                <div key={idx} className="flex justify-between border-b py-1">
                  <span>{item.category}{item.description ? ` - ${item.description}` : ""}</span>
                  <span>${item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-1">Add Budget Line</h3>
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  type="text"
                  placeholder="Category"
                  className="border p-2 rounded w-40"
                  value={newLine.category}
                  onChange={(e) => setNewLine({ ...newLine, category: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Description"
                  className="border p-2 rounded w-48"
                  value={newLine.description}
                  onChange={(e) => setNewLine({ ...newLine, description: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  className="border p-2 rounded w-32"
                  value={newLine.amount}
                  onChange={(e) => setNewLine({ ...newLine, amount: e.target.value })}
                />
                <button
                  onClick={handleAddBudgetLine}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add Line
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Expenses</h2>
        {expenses.length === 0 && <p className="text-gray-500">No expenses added yet.</p>}
        {expenses.map((e, idx) => (
          <div key={e._id || idx} className="flex justify-between border-b py-2 text-sm">
            <span>{e.category || "Uncategorized"} - {e.type || "Unnamed"}</span>
            <span>${e.amount?.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold mt-3">
          <span>Total Expenses:</span>
          <span>${totalExpenses.toLocaleString()}</span>
        </div>
      </div>

      <div className={`p-4 rounded shadow text-lg font-semibold ${
        profit >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}>
        Profit Estimate: ${profit.toLocaleString()}
      </div>
    </div>
  );
};

export default InvestmentDetail;
