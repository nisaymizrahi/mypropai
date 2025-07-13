import React, { useState, useEffect } from 'react';
import { updateExpense } from '../utils/api';

const EditExpenseModal = ({ isOpen, onClose, onSuccess, expense, vendors = [] }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    vendor: '',
    date: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount || '',
        vendor: expense.vendor?._id || '', // Handle populated vs unpopulated vendor
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        notes: expense.notes || '',
      });
    }
  }, [expense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    onClose();
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.description || !formData.amount) {
        setError('Description and Amount are required.');
        return;
    }
    
    setIsSubmitting(true);

    try {
      await updateExpense(expense._id, {
          ...formData,
          amount: Number(formData.amount)
      });
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
        <h2 className="text-xl font-bold text-brand-gray-800">Edit Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-brand-gray-700">Description</label>
                    <input name="description" type="text" value={formData.description} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-gray-700">Amount</label>
                    <input name="amount" type="number" value={formData.amount} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-gray-700">Vendor</label>
                    <select name="vendor" value={formData.vendor} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
                        <option value="">Select Vendor (Optional)</option>
                        {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-brand-gray-700">Date</label>
                    <input name="date" type="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-gray-700">Notes</label>
                <textarea name="notes" rows="2" value={formData.notes} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2"></textarea>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md">{error}</p>}
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

export default EditExpenseModal;