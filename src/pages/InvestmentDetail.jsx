import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getInvestment,
  addBudgetLine,
  addExpense,
  getTokenHeader,
} from "../utils/api";

const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newBudget, setNewBudget] = useState({ category: "", description: "", amount: "" });
  const [newExpense, setNewExpense] = useState({ category: "", type: "", amount: "" });
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const data = await getInvestment(id);
      setInvestment(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load investment.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudgetLine = async () => {
    if (!newBudget.category || !newBudget.amount) return;
    const line = {
      category: newBudget.category,
      description: newBudget.description,
      amount: Number(newBudget.amount),
    };
    try {
      await addBudgetLine(id, line);
      await fetchData();
      setNewBudget({ category: "", description: "", amount: "" });
    } catch (err) {
      console.error("Add budget error:", err);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) return;
    const exp = {
      category: newExpense.category,
      type: newExpense.type,
      amount: Number(newExpense.amount),
      date: new Date(),
    };
    try {
      await addExpense(id, exp);
      await fetchData();
      setNewExpense({ category: "", type: "", amount: "" });
    } catch (err) {
      console.error("Add expense error:", err);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!investment) return null;

  const totalBudget = (investment.budget || []).reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalExpenses = (investment.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const profit = (investment.arv || 0) - (investment.purchasePrice || 0) - totalExpenses;

  const budgetMap = (investment.budget || []).reduce((map, b) => {
    map[b.category] = { ...b, expenses: [] };
    return map;
  }, {});
  (investment.expenses || []).forEach((e) => {
    const cat = e.category || "Other";
    if (!budgetMap[cat]) budgetMap[cat] = { category: cat, amount: 0, expenses: [] };
    budgetMap[cat].expenses.push(e);
  });

  const categories = Object.values(budgetMap);

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
        <h2 className="text-lg font-semibold mb-2">Budget Overview</h2>
        <p className="mb-2">Total Budget: ${totalBudget.toLocaleString()}</p>

        {categories.map((cat, idx) => {
          const used = cat.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
          const percent = cat.amount ? Math.min((used / cat.amount) * 100, 100).toFixed(0) : 0;
          const expanded = expandedCategory === cat.category;
          return (
            <div key={idx} className="border-b py-2">
              <div className="flex justify-between items-center">
                <div>
                  <strong>{cat.category}</strong>: ${used.toLocaleString()} / ${cat.amount.toLocaleString()} ({percent}%)
                </div>
                <button
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => setExpandedCategory(expanded ? null : cat.category)}
                >
                  {expanded ? "Hide" : "View"} Expenses
                </button>
              </div>
              {expanded && (
                <div className="mt-2 ml-4 space-y-1 text-sm">
                  {cat.expenses.length === 0 && <p className="text-gray-500">No expenses yet.</p>}
                  {cat.expenses.map((e, i) => (
                    <div key={i} className="flex justify-between border-b py-1">
                      <span>{e.type || "Unnamed"}</span>
                      <span>${e.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Add Budget Line</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Category"
            value={newBudget.category}
            onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
            className="border p-2 rounded w-36"
          />
          <input
            type="text"
            placeholder="Description"
            value={newBudget.description}
            onChange={(e) => setNewBudget({ ...newBudget, description: e.target.value })}
            className="border p-2 rounded w-64"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newBudget.amount}
            onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
            className="border p-2 rounded w-32"
          />
          <button
            onClick={handleAddBudgetLine}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Add Expense</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={newExpense.category}
            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
            className="border p-2 rounded w-40"
          >
            <option value="">Select Category</option>
            {categories.map((c, idx) => (
              <option key={idx} value={c.category}>{c.category}</option>
            ))}
            <option value="Other">Other</option>
          </select>
          <input
            type="text"
            placeholder="Type (optional)"
            value={newExpense.type}
            onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
            className="border p-2 rounded w-48"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            className="border p-2 rounded w-32"
          />
          <button
            onClick={handleAddExpense}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add
          </button>
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
