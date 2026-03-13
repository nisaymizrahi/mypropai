import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders } from '../utils/api';
import { API_BASE_URL } from '../config';

const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-turquoise mx-auto"></div>
);

const PromotePropertyModal = ({ isOpen, onClose, onPromoteSuccess }) => {
  const [unmanaged, setUnmanaged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const navigate = useNavigate();

  const fetchUnmanagedProperties = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/management/unmanaged-properties`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('Could not fetch properties.');
      }
      const data = await res.json();
      setUnmanaged(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUnmanagedProperties();
    }
  }, [isOpen, fetchUnmanagedProperties]);

  const handlePromote = async () => {
    if (!selected) {
        setError('Please select a property to continue.');
        return;
    }
    setIsPromoting(true);
    setError('');
    try {
        const res = await fetch(`${API_BASE_URL}/management/promote/${selected}`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        if(!res.ok) {
            const errData = await res.json();
            throw new Error(errData.msg || 'Failed to promote property.');
        }
        onPromoteSuccess(); // This will tell the parent page to refresh its list
        onClose(); // Close the modal on success
    } catch (err) {
        setError(err.message);
    } finally {
        setIsPromoting(false);
        setSelected(null);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-brand-gray-800">Add a Property to Management</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        
        {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded">{error}</p>}
        
        <div className="max-h-64 overflow-y-auto border rounded-md">
            {loading ? <LoadingSpinner /> : unmanaged.length > 0 ? (
                <ul className="divide-y">
                    {unmanaged.map(prop => (
                        <li 
                            key={prop._id}
                            onClick={() => setSelected(prop._id)}
                            className={`p-3 cursor-pointer ${selected === prop._id ? 'bg-brand-turquoise-100' : 'hover:bg-brand-gray-100'}`}
                        >
                            <div className="font-medium text-brand-gray-800">{prop.address}</div>
                            <div className="mt-1 text-sm text-brand-gray-500">
                              {prop.strategyLabel}
                              {prop.propertyType ? ` • ${prop.propertyType}` : ''}
                              {prop.unitCount ? ` • ${prop.unitCount} unit${prop.unitCount === 1 ? '' : 's'}` : ''}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-5 text-center text-gray-500">
                  <p>No unmanaged Fix &amp; Rent or Rental properties found.</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/properties/new?workspace=management');
                    }}
                    className="mt-4 bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition"
                  >
                    Create Managed Property
                  </button>
                </div>
            )}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button onClick={onClose} disabled={isPromoting} className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition">
            Cancel
          </button>
          <button onClick={handlePromote} disabled={isPromoting || !selected} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition disabled:bg-brand-gray-300">
            {isPromoting ? 'Adding...' : 'Add Property'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotePropertyModal;
