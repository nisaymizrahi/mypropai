import React, { useState } from 'react';
import { createBudgetItem } from '../utils/api';

const AddBudgetItemModal = ({ isOpen, onClose, onSuccess, investmentId }) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    budgetedAmount: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setFormData({ category: '', description: '', budgetedAmount: '' });
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.category || !formData.budgetedAmount) {
        setError('Category and Budgeted Amount are required.');
        return;
    }
    
    setIsSubmitting(true);

    try {
      await createBudgetItem({
        ...formData,
        investmentId,
        budgetedAmount: Number(formData.budgetedAmount),
      });
      onSuccess(); // Tell the parent component to refetch data
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
        <h2 className="text-xl font-bold text-brand-gray-800">Add Budget Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-brand-gray-700">Category Name</label>
                <input 
                    name="category" 
                    type="text" 
                    placeholder="e.g., Kitchen, Plumbing, Electrical" 
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-brand-gray-300 rounded-md p-2"
                    required 
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-brand-gray-700">Description</label>
                <input 
                    name="description" 
                    type="text" 
                    placeholder="(Optional) e.g., Cabinets, countertops, and flooring" 
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-brand-gray-300 rounded-md p-2"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-brand-gray-700">Budgeted Amount</label>
                <input 
                    name="budgetedAmount" 
                    type="number" 
                    placeholder="10000"
                    value={formData.budgetedAmount}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-brand-gray-300 rounded-md p-2"
                    required
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={handleClose} disabled={isSubmitting} className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition">
                Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition disabled:bg-brand-gray-300">
                {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddBudgetItemModal;