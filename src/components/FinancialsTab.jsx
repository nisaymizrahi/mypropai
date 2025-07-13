import React, { useMemo, useState, useEffect } from 'react';
import AddBudgetItemModal from './AddBudgetItemModal';
import BudgetItemRow from './BudgetItemRow';
import EditBudgetItemModal from './EditBudgetItemModal';
import { deleteBudgetItem, createExpense } from '../utils/api'; // Import createExpense here

// --- AddExpenseModal code is now inside this file ---
const AddExpenseModal = ({ isOpen, onClose, onSuccess, investmentId, budgetItemId, vendors = [] }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setFormData({
            description: '', amount: '', vendor: '',
            date: new Date().toISOString().split('T')[0], notes: '',
        });
        setReceiptFile(null);
        setError('');
    }
  }, [isOpen, budgetItemId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setReceiptFile(e.target.files[0]);
  };

  const handleClose = () => onClose();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      setError('Description and Amount are required.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    const expenseData = new FormData();
    expenseData.append('investmentId', investmentId);
    expenseData.append('budgetItemId', budgetItemId);
    expenseData.append('description', formData.description);
    expenseData.append('amount', formData.amount);
    expenseData.append('date', formData.date);
    if(formData.vendor) expenseData.append('vendor', formData.vendor);
    if(formData.notes) expenseData.append('notes', formData.notes);
    if(receiptFile) expenseData.append('receipt', receiptFile);

    try {
      await createExpense(expenseData);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg space-y-4">
        <h2 className="text-xl font-bold text-brand-gray-800">Add Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <input name="description" type="text" value={formData.description} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Amount</label>
                    <input name="amount" type="number" value={formData.amount} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Vendor</label>
                    <select name="vendor" value={formData.vendor} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
                        <option value="">Select Vendor</option>
                        {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Date</label>
                    <input name="date" type="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium">Notes</label>
                <textarea name="notes" rows="2" value={formData.notes} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2"></textarea>
            </div>
             <div>
                <label className="block text-sm font-medium">Upload Receipt</label>
                <input type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={handleClose} disabled={isSubmitting} className="px-4 py-2 rounded-md border">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-brand-turquoise text-white px-4 py-2 rounded-md disabled:bg-opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};


// --- Main FinancialsTab Component ---
const PrimaryButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition ${className}`} {...props}>{children}</button>;

const StatCard = ({ title, value, colorClass = 'text-brand-gray-800' }) => (
    <div className="bg-brand-gray-50 p-4 rounded-lg border border-brand-gray-200">
        <p className="text-sm text-brand-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
);

const FinancialsTab = ({ investment, budgetItems, expenses, vendors, onUpdate }) => {
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [selectedBudgetItemId, setSelectedBudgetItemId] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBudgetItem, setEditingBudgetItem] = useState(null);

    const financialSummary = useMemo(() => {
        const totalBudget = budgetItems.reduce((sum, item) => sum + item.budgetedAmount, 0);
        const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
        const remainingBudget = totalBudget - totalSpent;
        return { totalBudget, totalSpent, remainingBudget };
    }, [budgetItems, expenses]);

    const handleOpenExpenseModal = (budgetItemId) => {
        setSelectedBudgetItemId(budgetItemId);
        setIsExpenseModalOpen(true);
    };

    const handleOpenEditModal = (budgetItem) => {
        setEditingBudgetItem(budgetItem);
        setIsEditModalOpen(true);
    };

    const handleDeleteBudgetItem = async (budgetItemId) => {
        if (window.confirm('Are you sure you want to delete this budget category? This will also delete all expenses linked to it.')) {
            try {
                await deleteBudgetItem(budgetItemId);
                onUpdate();
            } catch (error) {
                alert(`Failed to delete budget item: ${error.message}`);
            }
        }
    };

    return (
        <>
            <AddBudgetItemModal 
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                onSuccess={onUpdate}
                investmentId={investment._id}
            />
            <AddExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSuccess={onUpdate}
                investmentId={investment._id}
                budgetItemId={selectedBudgetItemId}
                vendors={vendors}
            />
            <EditBudgetItemModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={onUpdate}
                budgetItem={editingBudgetItem}
            />

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Total Budget" value={`$${financialSummary.totalBudget.toLocaleString()}`} />
                    <StatCard title="Total Spent" value={`$${financialSummary.totalSpent.toLocaleString()}`} />
                    <StatCard title="Remaining Budget" value={`$${financialSummary.remainingBudget.toLocaleString()}`} colorClass={financialSummary.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'} />
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-brand-gray-800">Budget vs. Actuals</h3>
                        <PrimaryButton onClick={() => setIsBudgetModalOpen(true)}>Add Budget Category</PrimaryButton>
                    </div>

                    <div className="space-y-4">
                        {budgetItems.length > 0 ? (
                            budgetItems.map(item => (
                                <BudgetItemRow 
                                    key={item._id} 
                                    item={item}
                                    expenses={expenses}
                                    onAddExpense={() => handleOpenExpenseModal(item._id)}
                                    onEdit={() => handleOpenEditModal(item)}
                                    onDelete={() => handleDeleteBudgetItem(item._id)}
                                />
                            ))
                        ) : (
                            <p className="text-center text-brand-gray-500 py-8">No budget items have been added yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default FinancialsTab;