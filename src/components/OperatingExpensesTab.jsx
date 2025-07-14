import React, { useState, useMemo } from 'react';
import AddOperatingExpenseModal from './AddOperatingExpenseModal';

const OperatingExpensesTab = ({ propertyId, expenses, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const totalExpenses = useMemo(() => {
        return expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, [expenses]);

    return (
        <>
            <AddOperatingExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={onUpdate}
                propertyId={propertyId}
            />

            <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-brand-gray-800">Operating Expenses</h3>
                        <p className="text-sm text-brand-gray-500">
                            Total logged expenses: ${totalExpenses.toLocaleString()}
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md"
                    >
                        Log Expense
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-brand-gray-50">
                            <tr>
                                <th className="text-left p-3 font-semibold">Date</th>
                                <th className="text-left p-3 font-semibold">Category</th>
                                <th className="text-left p-3 font-semibold">Description</th>
                                <th className="text-right p-3 font-semibold">Amount</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {expenses.length > 0 ? expenses.map(expense => (
                                <tr key={expense._id} className="hover:bg-brand-gray-50">
                                    <td className="p-3">{new Date(expense.date).toLocaleDateString()}</td>
                                    <td className="p-3"><span className="px-2 py-1 text-xs font-medium bg-gray-200 rounded-full">{expense.category}</span></td>
                                    <td className="p-3 font-medium">{expense.description}</td>
                                    <td className="p-3 text-right font-mono">${expense.amount.toLocaleString()}</td>
                                    <td className="p-3 text-right">
                                        <button className="text-xs text-blue-600 hover:underline">Edit</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center p-8 text-brand-gray-500">
                                        No operating expenses have been logged for this property.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default OperatingExpensesTab;