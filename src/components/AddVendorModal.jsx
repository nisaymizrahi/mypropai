import React, { useState } from 'react';
import { createVendor } from '../utils/api';

const AddVendorModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', trade: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setFormData({ name: '', trade: '', email: '', phone: '' });
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.trade) {
      setError('Vendor Name and Trade are required.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await createVendor({
        name: formData.name,
        trade: formData.trade,
        contactInfo: { email: formData.email, phone: formData.phone }
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
        <h2 className="text-xl font-bold text-brand-gray-800">Add New Vendor</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Vendor/Company Name</label>
              <input name="name" type="text" value={formData.name} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium">Trade</label>
              <input name="trade" type="text" placeholder="e.g., Plumbing, Electrical" value={formData.trade} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone Number</label>
              <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={handleClose} disabled={isSubmitting} className="px-4 py-2 rounded-md border">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-brand-turquoise text-white px-4 py-2 rounded-md disabled:bg-opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendorModal;