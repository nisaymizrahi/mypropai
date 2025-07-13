import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../utils/api';
import { API_BASE_URL } from '../config';

const EditCommunicationModal = ({ isOpen, onClose, onSuccess, communication, leaseId }) => {
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When the modal opens, populate the form with the existing data
  useEffect(() => {
    if (communication) {
      setSubject(communication.subject);
      setNotes(communication.notes || '');
    }
  }, [communication]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject) {
      setError('Subject is required.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/management/leases/${leaseId}/communications/${communication._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ subject, notes }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || 'Failed to update communication.');
      }

      onSuccess(); // Tell the parent component to refresh data
      onClose();   // Close the modal

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !communication) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold text-brand-gray-800 mb-4">Edit Communication Log</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-subject" className="block text-sm font-medium text-brand-gray-700">Subject</label>
            <input
              type="text"
              id="edit-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="edit-notes" className="block text-sm font-medium text-brand-gray-700">Notes</label>
            <textarea
              id="edit-notes"
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2"
            ></textarea>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition">
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

export default EditCommunicationModal;