import React, { useMemo } from 'react';

const PrimaryButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-3 py-1 rounded-md text-xs transition ${className}`} {...props}>{children}</button>;
const SecondaryButton = ({ onClick, children, className = '', ...props }) => <button onClick={onClick} className={`bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-3 py-1 rounded-md border border-brand-gray-300 text-xs transition ${className}`} {...props}>{children}</button>;

const BudgetItemRow = ({ item, expenses, onAddExpense, onEdit, onDelete }) => {
  
  const actualSpent = useMemo(() => 
    expenses
      .filter(e => e.budgetItem === item._id)
      .reduce((sum, e) => sum + e.amount, 0),
    [expenses, item]
  );

  const remaining = item.budgetedAmount - actualSpent;
  const spentPercentage = item.budgetedAmount > 0 ? (actualSpent / item.budgetedAmount) * 100 : 0;

  return (
    <div className="p-4 border rounded-lg bg-brand-gray-50/50 space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-brand-gray-900">{item.category}</h4>
          <p className="text-sm text-brand-gray-600">{item.description}</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <PrimaryButton onClick={onAddExpense}>Add Expense</PrimaryButton>
          <SecondaryButton onClick={onEdit}>Edit</SecondaryButton>
          {/* ✅ WIRE UP THE DELETE BUTTON */}
          <button onClick={onDelete} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-brand-gray-500">Budget</p>
          <p className="font-semibold">${item.budgetedAmount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-brand-gray-500">Actual</p>
          <p className="font-semibold">${actualSpent.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-brand-gray-500">Remaining</p>
          <p className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${remaining.toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <div className="w-full bg-brand-gray-200 rounded-full h-2.5">
          <div 
            className="bg-brand-turquoise h-2.5 rounded-full" 
            style={{ width: `${Math.min(spentPercentage, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default BudgetItemRow;