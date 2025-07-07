import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTokenHeader } from "../utils/api";

const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [budget, setBudget] = useState("");

  const [newExpense, setNewExpense] = useState({
    category: "",
    type: "",
    amount: "",
  });

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
      setBudget(data.initialBudget || "");
    } catch (err) {
      console.error(err);
      setError("Failed to load investment.");
    } finally {
      setLoading(false);
    }
  };

  const saveBudget = async () => {
    if (!budget) return;
    setSaving(true);
    try {
      const res = await fetch(`https://mypropai-server.onrender.com/api/investments/${id}`, {
        method: "PATCH",
        headers: getTokenHeader(),
        body: JSON.stringify({ initialBudget: Number(budget) }),
      });

      if (!res.ok) throw new Error("Failed to save budget");

      const updated = await res.json();
      setInvestment(updated);
    } catch (err) {
      console.error("Save budget error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) return;

    const updated = {
      ...investment,
      expenses: [
        ...(investment.expenses || []),
        {
          ...newExpense,
          amount: Number(newExpense.amount),
          date: new Date(),
        },
      ],
    };

    try {
      const res = await fetch(`https://mypropai-server.onrender.com/api/investments/${id}`, {
        method: "PATCH",
        headers: getTokenHeader(),
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Failed to add expense");
      const data = await res.json();
      setInvestment(data);
      setNewExpense({ category: "", type: "", amount: "" });
    } catch (err) {
      console.error("Add expense error:", err);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!investment) return null;

  const expenses = investment.expenses || [];
  const renovationExpenses = expenses
    .filter((e) => e.category?.toLowerCase() === "renovation" || e.category?.toLowerCase() === "labor")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const remainingBudget = (investment.initialBudget || 0) - renovationExpenses;
  const profit = (investment.arv || 0) - (investment.purchasePrice || 0) - expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

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
        <h2 className="text-lg font-semibold mb-2">Renovation Budget</h2>
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Enter budget"
            className="border p-2 rounded w-40"
          />
          <button
            onClick={saveBudget}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Budget"}
          </button>
        </div>
        {investment.initialBudget && (
          <div className="mt-4 text-sm text-gray-700 space-y-1">
            <p>Initial Budget: ${investment.initialBudget.toLocaleString()}</p>
            <p>Renovation Cost So Far: ${renovationExpenses.toLocaleString()}</p>
            <p className={remainingBudget >= 0 ? "text-green-600" : "text-red-600"}>
              {remainingBudget >= 0 ? "Remaining Budget" : "Over Budget"}: ${Math.abs(remainingBudget).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Add Expense</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Category"
            value={newExpense.category}
            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
            className="border p-2 rounded w-40"
          />
          <input
            type="text"
            placeholder="Type"
            value={newExpense.type}
            onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
            className="border p-2 rounded w-40"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            className="border p-2 rounded w-40"
          />
          <button
            onClick={handleAddExpense}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">All Expenses</h2>
        {expenses.length === 0 && <p className="text-gray-500">No expenses added yet.</p>}
        {expenses.map((e, idx) => (
          <div key={e._id || idx} className="flex justify-between border-b py-2 text-sm">
            <span>{e.category || "Uncategorized"} - {e.type || "Unnamed"}</span>
            <span>${e.amount?.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold mt-3">
          <span>Total Expenses:</span>
          <span>${expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}</span>
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
