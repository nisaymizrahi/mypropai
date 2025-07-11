import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  getTokenHeader,
} from "../utils/api";
import { API_BASE_URL } from '../config';

// --- Reusable UI Components ---
const FormInput = (props) => <input className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 placeholder-brand-gray-400 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition" {...props} />;
const FormSelect = ({ children, ...props }) => <select className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition" {...props}>{children}</select>;
const PrimaryButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition ${className}`} {...props}>{children}</button>;
const SecondaryButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition ${className}`} {...props}>{children}</button>;
const DangerButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-md transition ${className}`} {...props}>{children}</button>;
const Tooltip = ({ text }) => <span className="ml-1 text-brand-gray-400 cursor-help" title={text}>(?)</span>;

// --- Deal Analysis Sub-Components ---
const StatCard = ({ title, value, tooltip }) => (
    <div className="bg-brand-gray-50 p-4 rounded-lg border border-brand-gray-200 text-center" title={tooltip}>
        <p className="text-sm text-brand-gray-500">{title}</p>
        <p className="text-2xl font-bold text-brand-turquoise-600">{value}</p>
    </div>
);

// --- Smart Deal Analysis Dashboard ---
const DealAnalysisDashboard = ({ investment, onUpdate }) => {
    const [dealData, setDealData] = useState({
        dealAnalysis: investment.dealAnalysis || {},
        financingDetails: investment.financingDetails || {},
        rentalAnalysis: investment.rentalAnalysis || {}
    });

    useEffect(() => {
        setDealData({
            dealAnalysis: investment.dealAnalysis || {},
            financingDetails: investment.financingDetails || {},
            rentalAnalysis: investment.rentalAnalysis || {}
        });
    }, [investment]);

    const handleDebouncedUpdate = useCallback(
        debounce((updatedData) => onUpdate(updatedData), 1500),
        [onUpdate]
    );

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const keys = name.split('.');
        const updatedValue = type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value);

        setDealData(prev => {
            const newState = JSON.parse(JSON.stringify(prev)); // Deep copy for nested objects
            let current = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = updatedValue;
            handleDebouncedUpdate(newState);
            return newState;
        });
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
            <h2 className="text-xl font-semibold text-brand-gray-800 mb-4">Deal Analysis</h2>
            {investment.type === 'flip' ? 
                <FlipAnalysisView investment={investment} dealData={dealData} onChange={handleChange} /> : 
                <RentAnalysisView investment={investment} dealData={dealData} onChange={handleChange} />
            }
        </div>
    );
};

// --- Flip Analysis View ---
const FlipAnalysisView = ({ investment, dealData, onChange }) => {
    const calculations = useMemo(() => {
        const arv = Number(investment.arv) || 0;
        const purchasePrice = Number(investment.purchasePrice) || 0;
        const totalBudget = (investment.budget || []).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        
        const buyingCosts = Number(dealData.dealAnalysis.buyingCosts) || 0;
        const financingCosts = Number(dealData.dealAnalysis.financingCosts) || 0;
        const holdingCosts = (Number(dealData.dealAnalysis.holdingCosts?.monthlyAmount) || 0) * (Number(dealData.dealAnalysis.holdingCosts?.durationMonths) || 0);
        
        let sellingCosts = 0;
        if (dealData.dealAnalysis.sellingCosts?.isPercentage) {
            sellingCosts = arv * ((Number(dealData.dealAnalysis.sellingCosts?.value) || 0) / 100);
        } else {
            sellingCosts = Number(dealData.dealAnalysis.sellingCosts?.value) || 0;
        }

        const totalSoftCosts = buyingCosts + financingCosts + holdingCosts + sellingCosts;
        const totalProjectCost = purchasePrice + totalBudget + totalSoftCosts;
        const projectedNetProfit = arv - totalProjectCost;

        const loanAmount = Number(dealData.financingDetails.purchaseLoan?.loanAmount) || 0;
        const downPayment = purchasePrice - loanAmount;
        const totalCashNeeded = downPayment + buyingCosts + financingCosts + totalBudget;
        
        const projectedROI = totalCashNeeded > 0 ? (projectedNetProfit / totalCashNeeded) * 100 : 0;

        return { projectedNetProfit, projectedROI, totalCashNeeded, totalSoftCosts };
    }, [investment, dealData]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-brand-gray-800 mb-2">Deal Costs</h3>
                    <div className="space-y-2">
                        <div><label className="text-xs text-brand-gray-500">Buying Costs</label><FormInput name="dealAnalysis.buyingCosts" type="number" value={dealData.dealAnalysis.buyingCosts || ''} onChange={onChange} placeholder="$" /></div>
                        <div>
                            <label className="text-xs text-brand-gray-500">Selling Costs</label>
                            <div className="flex items-center gap-2">
                                <FormInput name="dealAnalysis.sellingCosts.value" type="number" value={dealData.dealAnalysis.sellingCosts?.value || ''} onChange={onChange} />
                                <FormSelect name="dealAnalysis.sellingCosts.isPercentage" value={dealData.dealAnalysis.sellingCosts?.isPercentage || false} onChange={onChange}><option value={true}>%</option><option value={false}>$</option></FormSelect>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-brand-gray-500">Holding Costs</label>
                            <div className="flex items-center gap-2">
                                <FormInput name="dealAnalysis.holdingCosts.monthlyAmount" type="number" value={dealData.dealAnalysis.holdingCosts?.monthlyAmount || ''} onChange={onChange} placeholder="$ / month" />
                                <FormInput name="dealAnalysis.holdingCosts.durationMonths" type="number" value={dealData.dealAnalysis.holdingCosts?.durationMonths || ''} onChange={onChange} placeholder="months" />
                            </div>
                        </div>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-brand-gray-800 mb-2">Financing</h3>
                    <div className="space-y-2">
                        <div><label className="text-xs text-brand-gray-500">Purchase Loan Amount</label><FormInput name="financingDetails.purchaseLoan.loanAmount" type="number" value={dealData.financingDetails.purchaseLoan?.loanAmount || ''} onChange={onChange} placeholder="$" /></div>
                        <div><label className="text-xs text-brand-gray-500">Financing Costs (Points, Fees)</label><FormInput name="dealAnalysis.financingCosts" type="number" value={dealData.dealAnalysis.financingCosts || ''} onChange={onChange} placeholder="$" /></div>
                    </div>
                </div>
                <PrimaryButton onClick={() => {}} className="w-full">Download Analysis</PrimaryButton>
            </div>
            <div className="md:col-span-2 bg-brand-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-brand-gray-800 mb-4">Flip Financial Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Projected Net Profit" value={`$${calculations.projectedNetProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} tooltip="ARV - Total Project Cost" />
                    <StatCard title="Cash-on-Cash ROI" value={`${calculations.projectedROI.toFixed(1)}%`} tooltip="(Net Profit / Total Cash Needed) * 100" />
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

// --- Rent Analysis View ---
const RentAnalysisView = ({ investment, dealData, onChange }) => {
    const calculations = useMemo(() => {
        const grossRent = Number(investment.rentEstimate) || 0;
        const purchasePrice = Number(investment.purchasePrice) || 0;
        const totalBudget = (investment.budget || []).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        const buyingCosts = Number(dealData.dealAnalysis.buyingCosts) || 0;
        
        const vacancy = grossRent * ((Number(dealData.rentalAnalysis.vacancyRate) || 0) / 100);
        const repairs = grossRent * ((Number(dealData.rentalAnalysis.repairsMaintenanceRate) || 0) / 100);
        const capex = grossRent * ((Number(dealData.rentalAnalysis.capitalExpendituresRate) || 0) / 100);
        const management = grossRent * ((Number(dealData.rentalAnalysis.managementFeeRate) || 0) / 100);
        const taxes = (Number(dealData.rentalAnalysis.propertyTaxes) || 0) / 12;
        const insurance = (Number(dealData.rentalAnalysis.insurance) || 0) / 12;
        const other = Number(dealData.rentalAnalysis.otherMonthlyCosts) || 0;
        const totalOpEx = vacancy + repairs + capex + management + taxes + insurance + other;
        
        const P = Number(dealData.financingDetails.refinanceLoan?.loanAmount) || 0;
        const r = ((Number(dealData.financingDetails.refinanceLoan?.interestRate) || 0) / 100) / 12;
        const n = (Number(dealData.financingDetails.refinanceLoan?.loanTerm) || 0) * 12;
        const M = n > 0 && r > 0 ? P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
        
        const netOperatingIncome = (grossRent - totalOpEx) * 12;
        const monthlyCashFlow = grossRent - totalOpEx - M;
        
        const capRate = purchasePrice > 0 ? (netOperatingIncome / purchasePrice) * 100 : 0;
        
        const totalCashToClose = purchasePrice + totalBudget + buyingCosts - (Number(dealData.financingDetails.purchaseLoan?.loanAmount) || 0);
        const cashOnCashROI = totalCashToClose > 0 ? ((monthlyCashFlow * 12) / totalCashToClose) * 100 : 0;
        
        return { monthlyCashFlow, cashOnCashROI, capRate, monthlyMortgage: M, totalOpEx };
    }, [investment, dealData]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-brand-gray-800 mb-2">Operating Expenses</h3>
                    <div className="space-y-2">
                        <div><label className="text-xs text-brand-gray-500">Vacancy<Tooltip text="Percentage of gross rent set aside for times the unit is empty."/></label><FormInput name="rentalAnalysis.vacancyRate" type="number" value={dealData.rentalAnalysis.vacancyRate || ''} onChange={onChange} placeholder="% of rent" /></div>
                        <div><label className="text-xs text-brand-gray-500">Repairs & Maintenance<Tooltip text="Percentage of gross rent for routine repairs."/></label><FormInput name="rentalAnalysis.repairsMaintenanceRate" type="number" value={dealData.rentalAnalysis.repairsMaintenanceRate || ''} onChange={onChange} placeholder="% of rent" /></div>
                        <div><label className="text-xs text-brand-gray-500">Capital Expenditures (CapEx)<Tooltip text="Percentage of gross rent for large future items like a new roof or HVAC."/></label><FormInput name="rentalAnalysis.capitalExpendituresRate" type="number" value={dealData.rentalAnalysis.capitalExpendituresRate || ''} onChange={onChange} placeholder="% of rent" /></div>
                        <div><label className="text-xs text-brand-gray-500">Management Fee<Tooltip text="Percentage of gross rent paid to a property manager."/></label><FormInput name="rentalAnalysis.managementFeeRate" type="number" value={dealData.rentalAnalysis.managementFeeRate || ''} onChange={onChange} placeholder="% of rent" /></div>
                        <div><label className="text-xs text-brand-gray-500">Property Taxes (Annual)</label><FormInput name="rentalAnalysis.propertyTaxes" type="number" value={dealData.rentalAnalysis.propertyTaxes || ''} onChange={onChange} placeholder="$ per year" /></div>
                        <div><label className="text-xs text-brand-gray-500">Insurance (Annual)</label><FormInput name="rentalAnalysis.insurance" type="number" value={dealData.rentalAnalysis.insurance || ''} onChange={onChange} placeholder="$ per year" /></div>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-brand-gray-800 mb-2">Refinance Mortgage</h3>
                     <div className="space-y-2">
                        <div><label className="text-xs text-brand-gray-500">Loan Amount</label><FormInput name="financingDetails.refinanceLoan.loanAmount" type="number" value={dealData.financingDetails.refinanceLoan?.loanAmount || ''} onChange={onChange} placeholder="$" /></div>
                        <div><label className="text-xs text-brand-gray-500">Interest Rate</label><FormInput name="financingDetails.refinanceLoan.interestRate" type="number" value={dealData.financingDetails.refinanceLoan?.interestRate || ''} onChange={onChange} placeholder="%" /></div>
                        <div><label className="text-xs text-brand-gray-500">Loan Term</label><FormInput name="financingDetails.refinanceLoan.loanTerm" type="number" value={dealData.financingDetails.refinanceLoan?.loanTerm || ''} onChange={onChange} placeholder="Years" /></div>
                    </div>
                </div>
                <PrimaryButton onClick={() => {}} className="w-full">Download Analysis</PrimaryButton>
            </div>
            <div className="md:col-span-2 bg-brand-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-brand-gray-800 mb-4">Rental Financial Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Monthly Cash Flow" value={`$${calculations.monthlyCashFlow.toFixed(2)}`} tooltip="Monthly Rent - (Total OpEx + Mortgage)" />
                    <StatCard title="Cash-on-Cash ROI" value={`${calculations.cashOnCashROI.toFixed(1)}%`} tooltip="(Annual Cash Flow / Total Cash to Close) * 100" />
                    <StatCard title="Cap Rate" value={`${calculations.capRate.toFixed(1)}%`} tooltip="(Net Operating Income / Purchase Price) * 100" />
                </div>
                 <div className="text-sm space-y-2">
                    <div className="flex justify-between border-b pb-1"><span className="text-brand-gray-500">Gross Monthly Rent</span><span>+ ${Number(investment.rentEstimate || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-brand-gray-500">Total Operating Expenses</span><span>- ${calculations.totalOpEx.toFixed(2)}</span></div>
                    <div className="flex justify-between border-b pb-1"><span className="text-brand-gray-500">Monthly Mortgage (P&I)</span><span>- ${calculations.monthlyMortgage.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-lg pt-1"><span className="text-brand-gray-800">Total Monthly Cash Flow</span><span>${calculations.monthlyCashFlow.toFixed(2)}</span></div>
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
          await fetch(`${API_BASE_URL}/investments/${id}`, {
              method: 'PATCH',
              headers: getTokenHeader(),
              body: JSON.stringify(updateData)
          });
          // We optimistically update the local state, but refetch to be safe.
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
                        <PrimaryButton onClick={() => handleSaveBudgetEdit(idx)}>Save</PrimaryButton>
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
                    <button onClick={() => handleDeleteBudget(idx)} className="text-xs text-red-500 hover:underline">Delete</button>
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

// --- NEW: Debounce function to delay API calls while typing ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

export default InvestmentDetail;
