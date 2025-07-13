import React, { useState } from 'react';
import { createProjectTask } from '../utils/api';

const AddTaskModal = ({ isOpen, onClose, onSuccess, investmentId, vendors = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    assignee: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setFormData({ title: '', startDate: '', endDate: '', assignee: '' });
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title || !formData.startDate || !formData.endDate) {
        setError('Title, Start Date, and End Date are required.');
        return;
    }
    
    setIsSubmitting(true);

    try {
      await createProjectTask({
        ...formData,
        investmentId,
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
        <h2 className="text-xl font-bold text-brand-gray-800">Add New Schedule Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-brand-gray-700">Task Title</label>
                <input name="title" type="text" placeholder="e.g., Demolition, Install Drywall" value={formData.title} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-brand-gray-700">Start Date</label>
                    <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-gray-700">End Date</label>
                    <input name="endDate" type="date" value={formData.endDate} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-gray-700">Assign To (Optional)</label>
                <select name="assignee" value={formData.assignee} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
                    <option value="">Select a Vendor</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.name} ({v.trade})</option>)}
                </select>
            </div>
            {/* We can add a 'dependencies' selector here in a future step */}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={handleClose} disabled={isSubmitting} className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition">
                Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition disabled:bg-brand-gray-300">
                {isSubmitting ? 'Saving...' : 'Save Task'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;