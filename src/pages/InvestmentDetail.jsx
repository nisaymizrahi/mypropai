import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getInvestment,
  addBudgetLine,
  addExpense,
  updateBudgetLine,
  updateExpense,
  deleteExpense,
  deleteInvestment,
  deleteBudgetLine,
  uploadReceipt,
  getTokenHeader, // NEW: Import this function
} from "../utils/api";
import { API_BASE_URL } from '../config'; // NEW: Import the base URL

// --- Reusable UI Components ---
const FormInput = (props) => <input className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 placeholder-brand-gray-400 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition" {...props} />;
const FormSelect = ({ children, ...props }) => <select className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition" {...props}>{children}</select>;
const PrimaryButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition ${className}`} {...props}>{children}</button>;
const SecondaryButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition ${className}`} {...props}>{children}</button>;
const DangerButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-md transition ${className}`} {...props}>{children}</button>;

// --- Deal Analysis Sub-Components ---
const StatCard = ({ title, value, tooltip }) => (
    <div className="bg-brand-gray-50 p-4 rounded-lg border border-brand-gray-200 text-center" title={tooltip}>
        <p className="text-sm text-brand-gray-500">{title}</p>
        <p className="text-2xl font-bold text-brand-turquoise-600">{value}</p>
    </div>
);

const DealAnalysisDashboard = ({ investment, onUpdate }) => {
    const [dealAnalysis, setDealAnalysis] = useState(investment.dealAnalysis || {});
    const [financingDetails, setFinancingDetails] = useState(investment.financingDetails || {});

    const handleDealChange = (e) => {
        const { name, value, type, checked } = e.target;
        const [section, field] = name.split('.');
        const updatedValue = type === 'checkbox' ? checked : value;

        if (section === 'dealAnalysis') {
            setDealAnalysis(prev => ({ ...prev, [field]: updatedValue }));
        } else if (section === 'financingDetails') {
            setFinancingDetails(prev => ({ ...prev, [field]: updatedValue }));
        }
    };
    
    const handleNestedChange = (e) => {
        const { name, value, type, checked } = e.target;
        const [section, nestedField, field] = name.split('.');
        const updatedValue = type === 'checkbox' ? checked : value;
        
        if (section === 'dealAnalysis') {
            setDealAnalysis(prev => ({
                ...prev,
                [nestedField]: { ...prev[nestedField], [field]: updatedValue }
            }));
        }
    };

    const handleSave = () => {
        onUpdate({ dealAnalysis, financingDetails });
    };

    const calculations = useMemo(() => {
        const arv = Number(investment.arv) || 0;
        const purchasePrice = Number(investment.purchasePrice) || 0;
        const totalBudget = (investment.budget || []).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        
        const buyingCosts = Number(dealAnalysis.buyingCosts) || 0;
        const financingCosts = Number(dealAnalysis.financingCosts) || 0;
        const holdingCosts = (Number(dealAnalysis.holdingCosts?.monthlyAmount) || 0) * (Number(dealAnalysis.holdingCosts?.durationMonths) || 0);
        
        let sellingCosts = 0;
        if (dealAnalysis.sellingCosts?.isPercentage) {
            sellingCosts = arv * ((Number(dealAnalysis.sellingCosts?.value) || 0) / 100);
        } else {
            sellingCosts = Number(dealAnalysis.sellingCosts?.value) || 0;
        }

        const totalSoftCosts = buyingCosts + financingCosts + holdingCosts + sellingCosts;
        const totalProjectCost = purchasePrice + totalBudget + totalSoftCosts;
        const projectedNetProfit = arv - totalProjectCost;

        const loanAmount = Number(financingDetails.loanAmount) || 0;
        const downPayment = financingDetails.useFinancing ? purchasePrice - loanAmount : purchasePrice;
        const totalCashNeeded = downPayment + buyingCosts + financingCosts + totalBudget;
        
        const projectedROI = totalCashNeeded > 0 ? (projectedNetProfit / totalCashNeeded) * 100 : 0;

        return { projectedNetProfit, projectedROI, totalCashNeeded, totalSoftCosts };
    }, [investment, dealAnalysis, financingDetails]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-brand-gray-800 mb-2">Deal Costs</h3>
                    <div className="space-y-2">
                        <div><label className="text-xs text-brand-gray-500">Buying Costs</label><FormInput name="dealAnalysis.buyingCosts" type="number" value={dealAnalysis.buyingCosts || ''} onChange={handleDealChange} placeholder="$" /></div>
                        <div><label className="text-xs text-brand-gray-500">Financing Costs</label><FormInput name="dealAnalysis.financingCosts" type="number" value={dealAnalysis.financingCosts || ''} onChange={handleDealChange} placeholder="$" /></div>
                        <div>
                            <label className="text-xs text-brand-gray-500">Selling Costs</label>
                            <div className="flex items-center gap-2">
                                <FormInput name="dealAnalysis.sellingCosts.value" type="number" value={dealAnalysis.sellingCosts?.value || ''} onChange={handleNestedChange} />
                                <FormSelect name="dealAnalysis.sellingCosts.isPercentage" value={dealAnalysis.sellingCosts?.isPercentage || false} onChange={handleNestedChange}>
                                    <option value={true}>%</option>
                                    <option value={false}>$</option>
                                </FormSelect>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-brand-gray-500">Holding Costs</label>
                            <div className="flex items-center gap-2">
                                <FormInput name="dealAnalysis.holdingCosts.monthlyAmount" type="number" value={dealAnalysis.holdingCosts?.monthlyAmount || ''} onChange={handleNestedChange} placeholder="$ / month" />
                                <FormInput name="dealAnalysis.holdingCosts.durationMonths" type="number" value={dealAnalysis.holdingCosts?.durationMonths || ''} onChange={handleNestedChange} placeholder="months" />
                            </div>
                        </div>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-brand-gray-800 mb-2">Financing</h3>
                    <div className="space-y-2">
                        <div><label className="text-xs text-brand-gray-500">Loan Amount</label><FormInput name="financingDetails.loanAmount" type="number" value={financingDetails.loanAmount || ''} onChange={handleDealChange} placeholder="$" /></div>
                    </div>
                </div>
                <PrimaryButton onClick={handleSave} className="w-full">Save Analysis</PrimaryButton>
            </div>
            <div className="md:col-span-2 bg-brand-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-brand-gray-800 mb-4">Financial Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Projected Net Profit" value={`$${calculations.projectedNetProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} tooltip="ARV - Total Project Cost" />
                    <StatCard title="Projected ROI" value={`${calculations.projectedROI.toFixed(1)}%`} tooltip="(Net Profit / Total Cash Needed) * 100" />
                    <StatCard title="Total Cash Needed" value={`$${calculations.totalCashNeeded.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} tooltip="Down Payment + Buying/Financing Costs + Renovation Budget" />
                </div>
                <div className="text-sm space-y-2">
                    <div className="flex justify-between border-b pb-1"><span className="text-brand-gray-500">After Repair Value (ARV)</span><span>+ ${Number(investment.arv || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-brand-gray-500">Purchase Price</span><span>- ${Number(investment.purchasePrice || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-brand-gray-500">Renovation Budget</span><span>- ${((investment.budget || []).reduce((sum, b) => sum + (Number(b.amount) || 0), 0)).toLocaleString()}</span></div>
                    <div className="flex justify-between border-b pb-1"><span className="text-brand-gray-500">Total Deal Costs</span><span>- ${calculations.totalSoftCosts.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-lg pt-1"><span className="text-brand-gray-800">Projected Net Profit</span><span>${calculations.projectedNetProfit.toLocaleString()}</span></div>
                </div>
            </div>
        </div>
    );
};

// --- Add Expense Modal ---
const AddExpenseModal = ({ isOpen, onClose, categories, investmentId, onExpenseAdded }) => {
    const [newExpense, setNewExpense] = useState({ category: '', description: '', amount: '', vendor: '', notes: '' });
    const [receiptFile, setReceiptFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e) => setReceiptFile(e.target.files[0]);
    const handleChange = (e) => setNewExpense({ ...newExpense, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        setError('');
        if (!newExpense.category || !newExpense.amount || !newExpense.description) {
            setError('Please fill in description, category, and amount.');
            return;
        }
        setIsUploading(true);
        let receiptUrl = '';
        try {
            if (receiptFile) {
                const uploadResult = await uploadReceipt(receiptFile);
                receiptUrl = uploadResult.receiptUrl;
            }
            const expenseData = { ...newExpense, amount: Number(newExpense.amount), receiptUrl, date: new Date() };
            await addExpense(investmentId, expenseData);
            onExpenseAdded();
            onClose();
        } catch (err) {
            setError(err.message || "An error occurred.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg space-y-4">
                <h2 className="text-xl font-bold text-brand-gray-800">Add New Expense</h2>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-xs text-brand-gray-500">Description</label><FormInput name="description" type="text" placeholder="e.g., New Cabinets" value={newExpense.description} onChange={handleChange} /></div>
                    <div><label className="text-xs text-brand-gray-500">Amount</label><FormInput name="amount" type="number" placeholder="2500" value={newExpense.amount} onChange={handleChange} /></div>
                    <div><label className="text-xs text-brand-gray-500">Category</label><FormSelect name="category" value={newExpense.category} onChange={handleChange}><option value="">Select Category</option>{categories.map((c, i) => (<option key={i} value={c.category}>{c.category}</option>))}<option value="Other">Other</option></FormSelect></div>
                    <div><label className="text-xs text-brand-gray-500">Vendor</label><FormInput name="vendor" type="text" placeholder="e.g., Home Depot" value={newExpense.vendor} onChange={handleChange} /></div>
                </div>
                <div><label className="text-xs text-brand-gray-500">Notes</label><FormInput name="notes" type="text" placeholder="Optional notes..." value={newExpense.notes} onChange={handleChange} /></div>
                <div><label className="text-xs text-brand-gray-500">Upload Receipt (PDF/Image)</label><FormInput type="file" onChange={handleFileChange} accept="image/*,application/pdf" /></div>
                <div className="flex justify-end gap-4 pt-4">
                    <SecondaryButton onClick={onClose} disabled={isUploading}>Cancel</SecondaryButton>
                    <PrimaryButton onClick={handleSubmit} disabled={isUploading}>{isUploading ? 'Saving...' : 'Save Expense'}</PrimaryButton>
                </div>
            </div>
        </div>
    );
};


// --- Main Investment Detail Page Component ---
const InvestmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newBudget, setNewBudget] = useState({ category: "", description: "", amount: "" });
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [editingBudgetIndex, setEditingBudgetIndex] = useState(null);
  const [editingBudgetData, setEditingBudgetData] = useState({ category: '', amount: '' });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if(!loading) setLoading(true);
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
    } catch (err) { console.error("Add budget error:", err); }
  };

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
        await updateBudgetLine(id, index, { category: editingBudgetData.category, amount: Number(editingBudgetData.amount) });
        await fetchData();
        handleCancelEdit();
    } catch (err) { console.error("Update budget error:", err); }
  };

  const handleDeleteBudget = async (index) => {
    if (window.confirm("Are you sure you want to delete this budget category?")) {
        try {
            await deleteBudgetLine(id, index);
            await fetchData();
        } catch (err) { console.error("Delete budget error:", err); }
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm("Are you sure you want to delete this expense? This cannot be undone.")) {
        try {
            // This needs a new API endpoint to delete an expense by its own _id
            // await deleteExpenseById(id, expenseId);
            console.log("Deleting expense... (API function needed)");
            await fetchData();
        } catch (err) { console.error("Delete expense error:", err); }
    }
  };
  
  const handleDeleteInvestment = async () => {
    if (window.confirm("Are you sure you want to delete this entire investment? This action cannot be undone.")) {
        try {
            await deleteInvestment(id);
            navigate("/investments");
        } catch (err) { console.error("Delete investment error:", err); setError("Failed to delete investment."); }
    }
  };

  const handleUpdateAnalysis = async (updateData) => {
      try {
          // FIXED: This now uses the imported functions and will work correctly.
          await fetch(`${API_BASE_URL}/investments/${id}`, {
              method: 'PATCH',
              headers: getTokenHeader(),
              body: JSON.stringify(updateData)
          });
          await fetchData();
      } catch (err) {
          console.error("Failed to update deal analysis", err);
      }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;
  if (!investment) return null;
  
  const totalBudget = (investment.budget || []).reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalExpenses = (investment.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const budgetSpentPercentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  return (
    <>
    <AddExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} categories={investment.budget || []} investmentId={id} onExpenseAdded={fetchData} />
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-brand-gray-900">Project Hub</h1>
            <p className="text-brand-gray-500">{investment.address}</p>
        </div>
        <div className="space-x-2">
            <SecondaryButton onClick={() => navigate(`/investments/${id}/edit`)}>Edit Property</SecondaryButton>
            <DangerButton onClick={handleDeleteInvestment}>Delete</DangerButton>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-brand-gray-800">Property Info</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-4 gap-x-6 text-sm">
            <div><strong className="block text-brand-gray-500">Type</strong> {investment.type}</div>
            <div><strong className="block text-brand-gray-500">Property Type</strong> {investment.propertyType}</div>
            {investment.unitCount > 0 && <div><strong className="block text-brand-gray-500">Units</strong> {investment.unitCount}</div>}
            <div><strong className="block text-brand-gray-500">Bedrooms</strong> {investment.bedrooms}</div>
            <div><strong className="block text-brand-gray-500">Bathrooms</strong> {investment.bathrooms}</div>
            <div><strong className="block text-brand-gray-500">Year Built</strong> {investment.yearBuilt}</div>
            <div><strong className="block text-brand-gray-500">Purchase Price</strong> ${investment.purchasePrice?.toLocaleString()}</div>
            {investment.arv && <div><strong className="block text-brand-gray-500">ARV</strong> ${investment.arv?.toLocaleString()}</div>}
        </div>
      </div>

      <DealAnalysisDashboard investment={investment} onUpdate={handleUpdateAnalysis} />

      <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200 space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-brand-gray-800">Renovation Tracker</h2>
            <PrimaryButton onClick={() => setIsExpenseModalOpen(true)}>Add Expense</PrimaryButton>
        </div>
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-brand-gray-500">Budget Progress</span>
                <span className="font-semibold">${totalExpenses.toLocaleString()} / ${totalBudget.toLocaleString()}</span>
            </div>
            <div className="w-full bg-brand-gray-200 rounded-full h-2.5">
                <div className="bg-brand-turquoise h-2.5 rounded-full" style={{ width: `${budgetSpentPercentage}%` }}></div>
            </div>
        </div>
        
        {investment.budget.map((cat, idx) => {
          const isEditing = editingBudgetIndex === idx;
          const expensesForCategory = investment.expenses.filter(e => e.category === cat.category);
          const used = expensesForCategory.reduce((sum, e) => sum + (e.amount || 0), 0);
          const expanded = expandedCategory === cat.category;

          return (
            <div key={idx} className="border-t border-brand-gray-200 pt-4">
              {isEditing ? (
                <div className="bg-brand-gray-50 p-4 rounded-md">
                    <div className="flex gap-4 items-end">
                        <div className="flex-grow"><label className="text-xs text-brand-gray-500">Category</label><FormInput value={editingBudgetData.category} onChange={(e) => setEditingBudgetData({...editingBudgetData, category: e.target.value})} /></div>
                        <div className="flex-grow"><label className="text-xs text-brand-gray-500">Amount</label><FormInput type="number" value={editingBudgetData.amount} onChange={(e) => setEditingBudgetData({...editingBudgetData, amount: e.target.value})} /></div>
                        <PrimaryButton onClick={() => handleSaveBudgetEdit(cat.index)}>Save</PrimaryButton>
                        <SecondaryButton onClick={handleCancelEdit}>Cancel</SecondaryButton>
                    </div>
                </div>
              ) : (
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
                  {expensesForCategory.length === 0 && <p className="text-brand-gray-400 italic">No expenses for this category.</p>}
                  {expensesForCategory.map((e, i) => (
                    <div key={e._id || i} className="flex justify-between items-center py-1 border-b border-brand-gray-100">
                      <div>
                        <p className="text-brand-gray-800">{e.description || "Unnamed Expense"}</p>
                        {e.vendor && <p className="text-xs text-brand-gray-500">Vendor: {e.vendor}</p>}
                        {e.receiptUrl && <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-turquoise hover:underline">View Receipt</a>}
                      </div>
                      <div className="flex items-center">
                        <span className="text-brand-gray-800">${e.amount?.toLocaleString()}</span>
                        <button onClick={() => handleDeleteExpense(e._id)} className="ml-4 text-red-400 hover:text-red-600 font-bold">&times;</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t border-brand-gray-200">
            <h3 className="font-semibold mb-2 text-brand-gray-700">Add Budget Category</h3>
            <div className="flex flex-wrap gap-2 items-end">
                <div className="flex-grow min-w-[150px]"><label className="text-xs text-brand-gray-500">Category</label><FormInput type="text" placeholder="e.g., Kitchen" value={newBudget.category} onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })} /></div>
                <div className="flex-grow min-w-[100px]"><label className="text-xs text-brand-gray-500">Amount</label><FormInput type="number" placeholder="10000" value={newBudget.amount} onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })} /></div>
                <PrimaryButton onClick={handleAddBudgetLine}>Add Budget</PrimaryButton>
            </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default InvestmentDetail;
