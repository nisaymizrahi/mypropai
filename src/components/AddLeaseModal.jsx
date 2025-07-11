import React, { useState } from 'react';
import { getTokenHeader } from '../utils/api';
import { API_BASE_URL } from '../config';

const FormInput = (props) => (
    <input 
        className="w-full bg-brand-gray-50 border border-brand-gray-300 rounded-md p-2 text-brand-gray-800 placeholder-brand-gray-400 focus:ring-2 focus:ring-brand-turquoise focus:border-brand-turquoise outline-none transition"
        {...props} 
    />
);

const FormLabel = ({ children }) => (
    <label className="block text-sm font-medium text-brand-gray-700 mb-1">{children}</label>
);

const AddLeaseModal = ({ isOpen, onClose, onSuccess, unitId, propertyId }) => {
  const [formData, setFormData] = useState({
    // Tenant Fields
    fullName: '',
    email: '',
    phone: '',
    contactNotes: '',
    // Lease Fields
    startDate: '',
    endDate: '',
    rentAmount: '',
    securityDeposit: '',
    leaseNotes: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const submissionData = {
        ...formData,
        rentAmount: Number(formData.rentAmount) || 0,
        securityDeposit: Number(formData.securityDeposit) || 0,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/management/units/${unitId}/lease`, {
        method: 'POST',
        headers: getTokenHeader(),
        body: JSON.stringify(submissionData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || 'Failed to add lease and tenant.');
      }
      
      onSuccess(); // Signal to the parent page to refresh
      handleClose(); // Close and reset the modal

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ fullName: '', email: '', phone: '', contactNotes: '', startDate: '', endDate: '', rentAmount: '', securityDeposit: '', leaseNotes: '' });
    setError('');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-xl font-bold text-brand-gray-800 mb-6">Add Tenant & Lease</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tenant Information Section */}
            <div>
                <h3 className="text-lg font-semibold text-brand-gray-700 mb-2 border-b pb-2">Tenant Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                        <FormLabel>Full Name</FormLabel>
                        <FormInput name="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleChange} required />
                    </div>
                    <div>
                        <FormLabel>Email Address</FormLabel>
                        <FormInput name="email" type="email" placeholder="john.doe@example.com" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div>
                        <FormLabel>Phone Number</FormLabel>
                        <FormInput name="phone" placeholder="(555) 123-4567" value={formData.phone} onChange={handleChange} />
                    </div>
                </div>
            </div>

            {/* Lease Information Section */}
            <div>
                <h3 className="text-lg font-semibold text-brand-gray-700 mb-2 border-b pb-2">Lease Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    <div>
                        <FormLabel>Lease Start Date</FormLabel>
                        <FormInput name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                    </div>
                    <div>
                        <FormLabel>Lease End Date</FormLabel>
                        <FormInput name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
                    </div>
                    <div>
                        <FormLabel>Monthly Rent Amount</FormLabel>
                        <FormInput name="rentAmount" type="number" placeholder="1500" value={formData.rentAmount} onChange={handleChange} required />
                    </div>
                    <div>
                        <FormLabel>Security Deposit</FormLabel>
                        <FormInput name="securityDeposit" type="number" placeholder="1500" value={formData.securityDeposit} onChange={handleChange} />
                    </div>
                </div>
            </div>
            
            {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md">{error}</p>}

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={handleClose} disabled={isSubmitting} className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition">
                Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition disabled:bg-brand-gray-300">
                {isSubmitting ? 'Saving...' : 'Save Lease & Tenant'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeaseModal;