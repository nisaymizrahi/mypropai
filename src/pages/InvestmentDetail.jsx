import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getInvestment,
  addBudgetLine,
  addExpense,
  updateBudgetLine,
  updateExpense,
  deleteExpense,
  deleteInvestment,
  deleteBudgetLine, // NEW: Import the delete function
} from "../utils/api";

// --- Reusable styled components ---
const FormInput = (props) => (
    <input 
        className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 placeholder-brand-gray-400 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition"
        {...props} 
    />
);

const FormSelect = ({ children, ...props }) => (
    <select 
        className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition appearance-none"
        {...props}
    >
        {children}
    </select>
);

const PrimaryButton = ({ onClick, children, className = '', ...props }) => (
    <button onClick={onClick} className={`bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition ${className}`} {...props}>
        {children}
    </button>
);

const SecondaryButton = ({ onClick, children, className = '', ...props }) => (
     <button onClick={onClick} className={`bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition ${className}`} {...props}>
        {children}
    </button>
);

const DangerButton = ({ onClick, children, className = '', ...props }) => (
    <button onClick={onClick} className={`bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-md transition ${className}`} {...props}>
        {children}
    </button>
);


const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newBudget, setNewBudget] = useState({ category: "", description: "", amount: "" });
  const [newExpense, setNewExpense] = useState({ category: "", label: "", amount: "" });
  const [expandedCategory, setExpandedCategory] = useState(null);

  // --- NEW: State for inline editing of budget items ---
  const [editingBudgetIndex, setEditingBudgetIndex] = useState(null);
  const [editingBudgetData, setEditingBudgetData] = useState({ category: '', amount: '' });

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

  const handleAddBudgetLine = async () => {
    if (!newBudget.category || !newBudget.amount) return;
    try {
      await addBudgetLine(id, { ...newBudget, amount: Number(newBudget.amount) });
      await fetchData();
      setNewBudget({ category: "", description: "", amount: "" });
    } catch (err) {
      console.error("Add budget error:", err);
    }
  };

  // --- NEW: Handlers for editing and deleting budget lines ---
  const handleEditBudgetClick = (index, budgetItem) => {
    setEditingBudgetIndex(index);
    setEditingBudgetData({ category: budgetItem.category, amount: budgetItem.amount });
  };

  const handleCancelEdit = () => {
    setEditingBudgetIndex(null);
    setEditingBudgetData({ category: '', amount: '' });
  };

  const handleSaveBudgetEdit = async (index) => {
    try {
        await updateBudgetLine(id, index, {
            category: editingBudgetData.category,
            amount: Number(editingBudgetData.amount)
        });
        await fetchData();
        handleCancelEdit(); // Exit edit mode
    } catch (err) {
        console.error("Update budget error:", err);
    }
  };

  const handleDeleteBudget = async (index) => {
    if (window.confirm("Are you sure you want to delete this budget category?")) {
        try {
            await deleteBudgetLine(id, index);
            await fetchData();
        } catch (err) {
            console.error("Delete budget error:", err);
        }
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) return;
    try {
      await addExpense(id, { ...newExpense, amount: Number(newExpense.amount), date: new Date() });
      await fetchData();
      setNewExpense({ category: "", label: "", amount: "" });
    } catch (err) {
      console.error("Add expense error:", err);
    }
  };

  const handleDeleteExpense = async (expenseIndex) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await deleteExpense(id, expenseIndex);
      await fetchData();
    } catch (err) {
      console.error("Delete expense error:", err);
    }
  };
  
  const handleDeleteInvestment = async () => {
    if (!window.confirm("Are you sure you want to delete this entire investment? This action cannot be undone.")) return;
    try {
      await deleteInvestment(id);
      navigate("/investments");
    } catch (err) {
      console.error("Delete investment error:", err);
      setError("Failed to delete investment.");
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
    if (!budgetMap[cat]) {
      budgetMap[cat] = { category: cat, amount: 0, expenses: [], index: -1 };
    }
    budgetMap[cat].expenses.push({ ...e, index: i });
  });

  const categories = Object.values(budgetMap);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-brand-gray-900">Investment Detail</h1>
            <p className="text-brand-gray-500">{investment.address}</p>
        </div>
        <div className="space-x-2">
            <SecondaryButton onClick={() => navigate(`/investments/${id}/edit`)}>Edit Property</SecondaryButton>
            <DangerButton onClick={handleDeleteInvestment}>Delete</DangerButton>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-brand-gray-800">Property Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
            <div><strong className="block text-brand-gray-500">Type</strong> {investment.type}</div>
            <div><strong className="block text-brand-gray-500">Property Type</strong> {investment.propertyType}</div>
            {investment.unitCount > 0 && <div><strong className="block text-brand-gray-500">Units</strong> {investment.unitCount}</div>}
            <div><strong className="block text-brand-gray-500">Bedrooms</strong> {investment.bedrooms}</div>
            <div><strong className="block text-brand-gray-500">Bathrooms</strong> {investment.bathrooms}</div>
            <div><strong className="block text-brand-gray-500">Year Built</strong> {investment.yearBuilt}</div>
            <div><strong className="block text-brand-gray-500">Purchase Price</strong> ${investment.purchasePrice?.toLocaleString()}</div>
            <div><strong className="block text-brand-gray-500">Lot Size (sqft)</strong> {investment.lotSize?.toLocaleString()}</div>
            <div><strong className="block text-brand-gray-500">Property Size (sqft)</strong> {investment.sqft?.toLocaleString()}</div>
            {investment.arv && <div><strong className="block text-brand-gray-500">ARV</strong> ${investment.arv?.toLocaleString()}</div>}
            {investment.rentEstimate && <div><strong className="block text-brand-gray-500">Rent Estimate</strong> ${investment.rentEstimate?.toLocaleString()}</div>}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200 space-y-4">
        <h2 className="text-xl font-semibold text-brand-gray-800">Renovation Budget & Expenses</h2>
        <p className="text-sm text-brand-gray-500">Total Budget: <strong className="text-brand-gray-800">${totalBudget.toLocaleString()}</strong></p>
        
        {categories.map((cat, idx) => {
          const used = cat.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
          const expanded = expandedCategory === cat.category;
          const isEditing = editingBudgetIndex === idx;

          return (
            <div key={idx} className="border-t border-brand-gray-200 pt-4">
              {isEditing ? (
                // --- NEW: Editing State UI ---
                <div className="bg-brand-gray-50 p-4 rounded-md">
                    <div className="flex gap-4 items-end">
                        <div className="flex-grow"><label className="text-xs text-brand-gray-500">Category</label><FormInput value={editingBudgetData.category} onChange={(e) => setEditingBudgetData({...editingBudgetData, category: e.target.value})} /></div>
                        <div className="flex-grow"><label className="text-xs text-brand-gray-500">Amount</label><FormInput type="number" value={editingBudgetData.amount} onChange={(e) => setEditingBudgetData({...editingBudgetData, amount: e.target.value})} /></div>
                        <PrimaryButton onClick={() => handleSaveBudgetEdit(cat.index)}>Save</PrimaryButton>
                        <SecondaryButton onClick={handleCancelEdit}>Cancel</SecondaryButton>
                    </div>
                </div>
              ) : (
                // --- Original Display State UI with new buttons ---
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-brand-gray-800">{cat.category} — <span className="text-brand-gray-500">${used.toLocaleString()} / ${cat.amount.toLocaleString()}</span></div>
                  <div className="flex items-center gap-4">
                    <button className="text-sm text-brand-turquoise hover:underline" onClick={() => setExpandedCategory(expanded ? null : cat.category)}>
                      {expanded ? "Hide" : "View"} Expenses
                    </button>
                    <button onClick={() => handleEditBudgetClick(idx, cat)} className="text-xs text-blue-500 hover:underline">Edit</button>
                    <button onClick={() => handleDeleteBudget(cat.index)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </div>
              )}
              {expanded && (
                <div className="mt-3 ml-4 pl-4 border-l-2 border-brand-gray-200 space-y-2 text-sm">
                  {cat.expenses.length === 0 && <p className="text-brand-gray-400 italic">No expenses for this category.</p>}
                  {cat.expenses.map((e, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span>{e.label || "Unnamed Expense"}</span>
                      <div className="flex items-center">
                        <span className="text-brand-gray-800">${e.amount?.toLocaleString()}</span>
                        <button onClick={() => handleDeleteExpense(e.index)} className="ml-4 text-red-400 hover:text-red-600 font-bold">&times;</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t border-brand-gray-200">
            <h3 className="font-semibold mb-2 text-brand-gray-700">Add Budget Line</h3>
            <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-grow min-w-[150px]"><label className="text-xs text-brand-gray-500">Category</label><FormInput type="text" placeholder="e.g., Kitchen" value={newBudget.category} onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })} /></div>
                <div className="flex-grow min-w-[100px]"><label className="text-xs text-brand-gray-500">Amount</label><FormInput type="number" placeholder="10000" value={newBudget.amount} onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })} /></div>
                <PrimaryButton onClick={handleAddBudgetLine}>Add Budget</PrimaryButton>
            </div>
        </div>

        <div className="pt-4 border-t border-brand-gray-200">
            <h3 className="font-semibold mb-2 text-brand-gray-700">Add Expense</h3>
            <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-grow min-w-[150px]"><label className="text-xs text-brand-gray-500">Category</label><FormSelect value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}><option value="">Select Category</option>{categories.map((c, i) => (<option key={i} value={c.category}>{c.category}</option>))}<option value="Other">Other</option></FormSelect></div>
                <div className="flex-grow min-w-[150px]"><label className="text-xs text-brand-gray-500">Expense Label</label><FormInput type="text" placeholder="e.g., New Cabinets" value={newExpense.label} onChange={(e) => setNewExpense({ ...newExpense, label: e.target.value })} /></div>
                <div className="flex-grow min-w-[100px]"><label className="text-xs text-brand-gray-500">Amount</label><FormInput type="number" placeholder="2500" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} /></div>
                <PrimaryButton onClick={handleAddExpense}>Add Expense</PrimaryButton>
            </div>
        </div>
      </div>

      <div className={`p-4 rounded-lg text-lg font-semibold text-center ${profit >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        Profit Estimate: ${profit.toLocaleString()}
      </div>
    </div>
  );
};

export default InvestmentDetail;
