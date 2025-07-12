import React, { useState } from 'react';
// 1. IMPORT THE CORRECT FUNCTION
import { getAuthHeaders } from '../utils/api';
import { API_BASE_URL } from '../config';

const AddUnitModal = ({ isOpen, onClose, onUnitAdded, propertyId }) => {
  const [unitData, setUnitData] = useState({
    name: '',
    beds: '',
    baths: '',
    sqft: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUnitData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unitData.name) {
      setError('Unit name is required.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/management/${propertyId}/units`, {
        method: 'POST',
        // 2. USE THE NEW FUNCTION
        headers: getAuthHeaders(),
        body: JSON.stringify(unitData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || 'Failed to add unit.');
      }

      onUnitAdded(); // Signal to the parent page to refresh its data
      handleClose(); // Close and reset the modal
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUnitData({ name: '', beds: '', baths: '', sqft: '' });
    setError('');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold text-brand-gray-800 mb-4">Add New Unit</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-gray-700 mb-1">Unit Name / Number</label>
            <input
              name="name"
              type="text"
              placeholder="e.g., Apt 101, Unit B"
              value={unitData.name}
              onChange={handleChange}
              className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 mb-1">Beds</label>
              <input name="beds" type="number" value={unitData.beds} onChange={handleChange} className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 mb-1">Baths</label>
              <input name="baths" type="number" value={unitData.baths} onChange={handleChange} className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-gray-700 mb-1">Sqft</label>
              <input name="sqft" type="number" value={unitData.sqft} onChange={handleChange} className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2" />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={handleClose} disabled={isSubmitting} className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition disabled:bg-brand-gray-300">
              {isSubmitting ? 'Saving...' : 'Save Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUnitModal;