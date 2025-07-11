import React, { useState } from 'react';
import { getTokenHeader } from '../utils/api';
import { API_BASE_URL } from '../config';

const FormInput = (props) => (
  <input
    className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 placeholder-brand-gray-400 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition"
    {...props}
  />
);

const FormSelect = ({ children, ...props }) => (
  <select
    className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition"
    {...props}
  >
    {children}
  </select>
);

const FormLabel = ({ children }) => (
  <label className="block text-sm font-medium text-brand-gray-700 mb-1">{children}</label>
);

const AddTransactionModal = ({ isOpen, onClose, onSuccess, leaseId }) => {
  const [entryType, setEntryType] = useState("Payment");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Rent Payment',
    description: '',
    amount: '',
    dayOfMonth: ''
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEntryTypeChange = (e) => {
    const selected = e.target.value;
    setEntryType(selected);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: selected === 'Payment' ? 'Rent Payment' : 'Rent Charge',
      description: '',
      amount: '',
      dayOfMonth: ''
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { date, type, description, amount, dayOfMonth } = formData;

    if (!type || !amount) {
      setError('Please complete all required fields.');
      return;
    }

    if (entryType === 'Recurring Charge') {
      if (!description || !dayOfMonth || type === 'Rent Payment') {
        setError("Recurring charges require a description, valid day of month, and must not be a 'Rent Payment'.");
        return;
      }
    }

    setError('');
    setIsSubmitting(true);

    try {
      if (entryType === 'Recurring Charge') {
        const patchData = {
          recurringCharges: [
            {
              type,
              description,
              amount: Number(amount),
              dayOfMonth: Number(dayOfMonth)
            }
          ]
        };

        const res = await fetch(`${API_BASE_URL}/management/leases/${leaseId}`, {
          method: 'PATCH',
          headers: {
            ...getTokenHeader(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(patchData),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.msg || 'Failed to save recurring charge');
        }
      } else {
        let finalAmount = Number(amount);
        if (['Rent Charge', 'Late Fee', 'Other Charge'].includes(type)) {
          finalAmount = -Math.abs(finalAmount);
        } else {
          finalAmount = Math.abs(finalAmount);
        }

        const res = await fetch(`${API_BASE_URL}/management/leases/${leaseId}/transactions`, {
          method: 'POST',
          headers: getTokenHeader(),
          body: JSON.stringify({ date, type, description, amount: finalAmount }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.msg || 'Failed to add transaction.');
        }
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'Rent Payment',
      description: '',
      amount: '',
      dayOfMonth: ''
    });
    setError('');
    setEntryType('Payment');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold text-brand-gray-800 mb-4">Add Transaction</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FormLabel>Entry Type</FormLabel>
            <FormSelect value={entryType} onChange={handleEntryTypeChange}>
              <option value="Payment">Payment Received</option>
              <option value="One-Time Charge">One-Time Charge</option>
              <option value="Recurring Charge">Recurring Charge</option>
            </FormSelect>
          </div>

          {entryType !== 'Recurring Charge' && (
            <div>
              <FormLabel>Date</FormLabel>
              <FormInput name="date" type="date" value={formData.date} onChange={handleChange} required />
            </div>
          )}

          <div>
            <FormLabel>Transaction Type</FormLabel>
            <FormSelect name="type" value={formData.type} onChange={handleChange} required>
              <option value="Rent Payment">Rent Payment</option>
              <option value="Rent Charge">Rent Charge</option>
              <option value="Late Fee">Late Fee</option>
              <option value="Pet Fee">Pet Fee</option>
              <option value="Utility Fee">Utility Fee</option>
              <option value="Parking Fee">Parking Fee</option>
              <option value="Other Credit">Other Credit</option>
              <option value="Other Charge">Other Charge</option>
            </FormSelect>
          </div>

          <div>
            <FormLabel>Amount</FormLabel>
            <FormInput name="amount" type="number" step="0.01" placeholder="1500.00" value={formData.amount} onChange={handleChange} required />
          </div>

          <div>
            <FormLabel>Description</FormLabel>
            <FormInput name="description" type="text" placeholder="e.g., October Rent" value={formData.description} onChange={handleChange} />
          </div>

          {entryType === 'Recurring Charge' && (
            <div>
              <FormLabel>Day of Month (1–28)</FormLabel>
              <FormInput name="dayOfMonth" type="number" min="1" max="28" value={formData.dayOfMonth} onChange={handleChange} required />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={handleClose} disabled={isSubmitting} className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition disabled:bg-brand-gray-300">
              {isSubmitting ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
