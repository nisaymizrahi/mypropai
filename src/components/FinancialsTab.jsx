import React, { useMemo, useState } from 'react';
// ✅ IMPORT STATEMENTS CORRECTED
import AddBudgetItemModal from './AddBudgetItemModal';
import BudgetItemRow from './BudgetItemRow';
import AddExpenseModal from './AddExpenseModal';
import EditBudgetItemModal from './EditBudgetItemModal';
import { deleteBudgetItem } from '../utils/api';

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