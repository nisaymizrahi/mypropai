import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getInvestment,
  addBudgetLine,
  addExpense,
  updateBudgetLine,
  updateExpense,
  deleteExpense,
  deleteInvestment, // Ensure this is imported
} from "../utils/api";

const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newBudget, setNewBudget] = useState({ category: "", description: "", amount: "", status: "Not Started" });
  const [newExpense, setNewExpense] = useState({ category: "", label: "", amount: "" });
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
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

  // Budget Handlers
  const handleAddBudgetLine = async () => {
    if (!newBudget.category || !newBudget.amount) return;
    const line = { ...newBudget, amount: Number(newBudget.amount) };
    try {
      await addBudgetLine(id, line);
      await fetchData(); // Refresh data
      setNewBudget({ category: "", description: "", amount: "", status: "Not Started" });
    } catch (err) {
      console.error("Add budget error:", err);
    }
  };

  const handleUpdateBudgetField = async (index, field, value) => {
    try {
      await updateBudgetLine(id, index, { [field]: value });
      await fetchData(); // Refresh data
    } catch (err) {
      console.error("Update budget line error:", err);
    }
  };

  // Expense Handlers
  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) return;
    const exp = {
      category: newExpense.category,
      label: newExpense.label, // Changed from 'type' to 'label' to match original
      amount: Number(newExpense.amount),
      date: new Date(),
    };
    try {
      await addExpense(id, exp);
      await fetchData(); // Refresh data
      setNewExpense({ category: "", label: "", amount: "" });
    } catch (err) {
      console.error("Add expense error:", err);
    }
  };
  
  const handleUpdateExpense = async (expenseIndex, field, value) => {
    try {
      await updateExpense(id, expenseIndex, { [field]: value });
      await fetchData(); // Refresh data
    } catch (err) {
      console.error("Update expense error:", err);
    }
  };

  const handleDeleteExpense = async (expenseIndex) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await deleteExpense(id, expenseIndex);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error("Delete expense error:", err);
    }
  };
  
  // Investment Handlers
  const handleDeleteInvestment = async () => {
    if (!window.confirm("Are you sure you want to delete this entire investment? This action cannot be undone.")) return;
    try {
      await deleteInvestment(id);
      navigate("/investments"); // Navigate back to the list after deletion
    } catch (err) {
      console.error("Delete investment error:", err);
      setError("Failed to delete investment.");
    }
  };


  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!investment) return null;
  
  // Calculations
  const totalBudget = (investment.budget || []).reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalExpenses = (investment.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const profit = (investment.arv || 0) - (investment.purchasePrice || 0) - totalExpenses;

  // Data mapping for display
  const budgetMap = (investment.budget || []).reduce((map, b, idx) => {
    map[b.category] = { ...b, expenses: [], index: idx };
    return map;
  }, {});

  (investment.expenses || []).forEach((e, i) => {
    const cat = e.category || "Other";
    if (!budgetMap[cat]) {
      budgetMap[cat] = { category: cat, amount: 0, expenses: [], index: -1 };
    }
    budgetMap[cat].expenses.push({ ...e, index: i });
  });

  const categories = Object.values(budgetMap);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Investment Detail</h1>
        <div className="space-x-2">
            <button
              onClick={() => navigate(`/investments/${id}/edit`)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Edit Property
            </button>
            <button
                onClick={handleDeleteInvestment}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
                Delete Investment
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow space-y-2">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Property Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
          <p><strong>Address:</strong> {investment.address}</p>
          <p><strong>Type:</strong> {investment.type}</p>
          <p><strong>Property Type:</strong> {investment.propertyType}</p>
          {investment.unitCount > 0 && <p><strong>Units:</strong> {investment.unitCount}</p>}
          <p><strong>Bedrooms:</strong> {investment.bedrooms}</p>
          <p><strong>Bathrooms:</strong> {investment.bathrooms}</p>
          <p><strong>Year Built:</strong> {investment.yearBuilt}</p>
          <p><strong>Purchase Price:</strong> ${investment.purchasePrice?.toLocaleString()}</p>
          <p><strong>Lot Size:</strong> {investment.lotSize} sqft</p>
          <p><strong>Property Size:</strong> {investment.sqft} sqft</p>
          {investment.arv && <p><strong>ARV:</strong> ${investment.arv?.toLocaleString()}</p>}
          {investment.rentEstimate && <p><strong>Rent Estimate:</strong> ${investment.rentEstimate?.toLocaleString()}</p>}
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Renovation Budget & Expenses</h2>
        <p className="text-sm mb-2">Total Budget: ${totalBudget.toLocaleString()}</p>
        
        {/* Budget Categories & Expenses */}
        {categories.map((cat, idx) => {
          const used = cat.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
          const expanded = expandedCategory === cat.category;
          return (
            <div key={idx} className="border-b pb-2 mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">{cat.category}</span> — ${used.toLocaleString()} / ${cat.amount.toLocaleString()}
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
                    <div key={i} className="flex justify-between items-center border-b py-1">
                      <span>{e.label || "Unnamed"}</span>
                      <div className="flex items-center">
                        <span>${e.amount?.toLocaleString()}</span>
                        <button onClick={() => handleDeleteExpense(e.index)} className="ml-4 text-red-500 hover:text-red-700">
                          &#x2715;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Budget Line Form */}
        <div>
          <h3 className="font-semibold mb-1">Add Budget Line</h3>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <input type="text" placeholder="Category" value={newBudget.category} onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })} className="border p-2 rounded w-36" />
            <input type="text" placeholder="Description (optional)" value={newBudget.description} onChange={(e) => setNewBudget({ ...newBudget, description: e.target.value })} className="border p-2 rounded w-64" />
            <input type="number" placeholder="Amount" value={newBudget.amount} onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })} className="border p-2 rounded w-32" />
            <button onClick={handleAddBudgetLine} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Add Budget
            </button>
          </div>
        </div>

        {/* Add Expense Form */}
        <div>
          <h3 className="font-semibold mt-4 mb-1">Add Expense</h3>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} className="border p-2 rounded w-40">
              <option value="">Select Category</option>
              {categories.map((c, idx) => (
                <option key={idx} value={c.category}>{c.category}</option>
              ))}
              <option value="Other">Other</option>
            </select>
            <input type="text" placeholder="Expense Label" value={newExpense.label} onChange={(e) => setNewExpense({ ...newExpense, label: e.target.value })} className="border p-2 rounded w-48" />
            <input type="number" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} className="border p-2 rounded w-32" />
            <button onClick={handleAddExpense} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Add Expense
            </button>
          </div>
        </div>
      </div>

      <div className={`p-4 rounded shadow text-lg font-semibold ${profit >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
        Profit Estimate: ${profit.toLocaleString()}
      </div>
    </div>
  );
};

export default InvestmentDetail;
