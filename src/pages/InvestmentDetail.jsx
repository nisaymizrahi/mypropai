import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getInvestment,
  addBudgetLine,
  addExpense,
  updateBudgetLine,
  updateExpense,
  deleteExpense,
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

  useEffect(() => { fetchData(); }, [id]);

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
    const line = { ...newBudget, amount: Number(newBudget.amount) };
    try {
      await addBudgetLine(id, line);
      await fetchData();
      setNewBudget({ category: "", description: "", amount: "", status: "Not Started" });
    } catch (err) {
      console.error("Add budget error:", err);
    }
  };

  const handleUpdateBudgetField = async (index, field, value) => {
    try {
      await updateBudgetLine(id, index, { [field]: value });
      await fetchData();
    } catch (err) {
      console.error("Update budget line error:", err);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) return;
    const exp = {
      category: newExpense.category,
      label: newExpense.label,
      amount: Number(newExpense.amount),
      date: new Date(),
    };
    try {
      await addExpense(id, exp);
      await fetchData();
      setNewExpense({ category: "", label: "", amount: "" });
    } catch (err) {
      console.error("Add expense error:", err);
    }
  };

  const handleUpdateExpense = async (index, field, value) => {
    try {
      await updateExpense(id, index, { [field]: value });
      await fetchData();
    } catch (err) {
      console.error("Update expense error:", err);
    }
  };

  const handleDeleteExpense = async (index) => {
    try {
      await deleteExpense(id, index);
      await fetchData();
    } catch (err) {
      console.error("Delete expense error:", err);
    }
  };

  const handleDeleteInvestment = async () => {
    if (!window.confirm("Are you sure you want to delete this investment?")) return;
    try {
      await fetch(`https://mypropai-server.onrender.com/api/investments/${id}`, {
        method: "DELETE",
        headers: { "Authorization": getInvestment(id).Authorization }
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("Delete investment error:", err);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!investment) return null;

  const totalBudget = (investment.budget || []).reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalExpenses = (investment.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const profit = (investment.arv || 0) - (investment.purchasePrice || 0) - totalExpenses;

  const budgetMap = (investment.budget || []).reduce((map, b, idx) => {
    map[b.category] = { ...b, expenses: [], index: idx };
    return map;
  }, {});
  (investment.expenses || []).forEach((e, i) => {
    const cat = e.category || "Other";
    if (!budgetMap[cat]) budgetMap[cat] = { category: cat, amount: 0, expenses: [], index: -1 };
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
          >Edit Property</button>
          <button
            onClick={handleDeleteInvestment}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >Delete</button>
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

      {/* You can now add back the Budget + Expense logic below as you had it */}
      {/* ... */}

      <div className={`p-4 rounded shadow text-lg font-semibold ${
        profit >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
      >
        Profit Estimate: ${profit.toLocaleString()}
      </div>
    </div>
  );
};

export default InvestmentDetail;
