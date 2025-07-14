import React, { useState } from 'react';
import { createOperatingExpense } from '../utils/api';

const AddOperatingExpenseModal = ({ isOpen, onClose, onSuccess, propertyId }) => {
  const [formData, setFormData] = useState({
    description: '',
    category: 'Utilities',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setReceiptFile(e.target.files[0]);
  };

  const handleClose = () => {
    setFormData({ description: '', category: 'Utilities', amount: '', date: new Date().toISOString().split('T')[0] });
    setReceiptFile(null);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.category || !formData.amount) {
      setError('All fields are required.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    const expenseData = new FormData();
    expenseData.append('propertyId', propertyId);
    expenseData.append('description', formData.description);
    expenseData.append('category', formData.category);
    expenseData.append('amount', formData.amount);
    expenseData.append('date', formData.date);
    if (receiptFile) {
      expenseData.append('receipt', receiptFile);
    }

    try {
      await createOperatingExpense(expenseData);
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
        <h2 className="text-xl font-bold text-brand-gray-800">Log Operating Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input name="date" type="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required>
                <option>Utilities</option>
                <option>Property Taxes</option>
                <option>Insurance</option>
                <option>Repairs</option>
                <option>Maintenance</option>
                <option>Management Fee</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input name="description" type="text" placeholder="e.g., Monthly Electric Bill, Lawn Care" value={formData.description} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <input name="amount" type="number" step="0.01" placeholder="150.00" value={formData.amount} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Attach Receipt (Optional)</label>
            <input type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm" />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={handleClose} disabled={isSubmitting} className="px-4 py-2 rounded-md border">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-brand-turquoise text-white px-4 py-2 rounded-md disabled:bg-opacity-50">
              {isSubmitting ? 'Saving...' : 'Log Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOperatingExpenseModal;