import React, { useState } from 'react';
import { getTokenHeader } from '../utils/api';
import { API_BASE_URL } from '../config';

const CommunicationTab = ({ lease, onUpdate }) => {
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Note: File upload logic will be added in a future step
  // const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject) {
      alert('Subject is required.');
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/management/leases/${lease._id}/communications`, {
        method: 'POST',
        headers: {
          ...getTokenHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, notes, category }),
      });

      if (!res.ok) {
        throw new Error('Failed to add communication.');
      }

      // Reset form and trigger a data refresh in the parent component
      setSubject('');
      setNotes('');
      setCategory('General Inquiry');
      onUpdate(); 
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/management/leases/${lease._id}/communications/${commId}`, {
        method: 'DELETE',
        headers: getTokenHeader(),
      });
      if (!res.ok) {
        throw new Error('Failed to delete communication.');
      }
      onUpdate(); // Refresh data
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Add Communication Form */}
      <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-sm border border-brand-gray-200">
        <h2 className="text-lg font-semibold text-brand-gray-800 border-b pb-2 mb-4">Add Communication Log</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-brand-gray-700">Subject</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-brand-gray-700">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2"
            >
              <option>General Inquiry</option>
              <option>Maintenance</option>
              <option>Payment Issue</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-brand-gray-700">Notes</label>
            <textarea
              id="notes"
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2"
            ></textarea>
          </div>
          {/* File input will be added here */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Communication'}
          </button>
        </form>
      </div>

      {/* Communication History */}
      <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-brand-gray-200">
        <h2 className="text-lg font-semibold text-brand-gray-800 mb-4">Communication History</h2>
        <div className="space-y-4">
          {lease.communications && lease.communications.length > 0 ? (
            [...lease.communications].sort((a, b) => new Date(b.date) - new Date(a.date)).map((comm) => (
              <div key={comm._id} className="p-3 border rounded-md bg-brand-gray-50 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-brand-gray-900">{comm.subject}</p>
                    <p className="text-sm text-brand-gray-600 mt-1">{comm.notes}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(comm._id)}
                    className="text-red-500 hover:text-red-700 font-semibold text-xs absolute top-2 right-2"
                    aria-label="Delete communication"
                  >
                    X
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-brand-gray-500">
                  <span>{formatDate(comm.date)}</span>
                  <span className="font-semibold bg-brand-gray-200 text-brand-gray-700 px-2 py-0.5 rounded-full">{comm.category}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-brand-gray-500 py-8">No communication logs yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationTab;