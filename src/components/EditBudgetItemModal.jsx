import React, { useState, useEffect } from 'react';
import { updateBudgetItem } from '../utils/api';

const EditBudgetItemModal = ({ isOpen, onClose, onSuccess, budgetItem }) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    budgetedAmount: '',
    status: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When the modal opens or the specific item changes, pre-fill the form
  useEffect(() => {
    if (budgetItem) {
      setFormData({
        category: budgetItem.category || '',
        description: budgetItem.description || '',
        budgetedAmount: budgetItem.budgetedAmount || '',
        status: budgetItem.status || 'Not Started'
      });
    }
  }, [budgetItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
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
      // Create a payload with only the fields we want to update
      const updateData = {
        ...formData,
        budgetedAmount: Number(formData.budgetedAmount)
      };

      await updateBudgetItem(budgetItem._id, updateData);
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
        <h2 className="text-xl font-bold text-brand-gray-800">Edit Budget Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-brand-gray-700">Category Name</label>
                <input name="category" type="text" value={formData.category} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-brand-gray-700">Description</label>
                <input name="description" type="text" value={formData.description} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
            </div>
             <div>
                <label className="block text-sm font-medium text-brand-gray-700">Budgeted Amount</label>
                <input name="budgetedAmount" type="number" value={formData.budgetedAmount} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-gray-700">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Awaiting Materials</option>
                    <option>Complete</option>
                    <option>On Hold</option>
                </select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={handleClose} disabled={isSubmitting} className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition">
                Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition disabled:bg-brand-gray-300">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudgetItemModal;