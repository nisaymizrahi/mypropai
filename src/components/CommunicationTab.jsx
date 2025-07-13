import React, { useState, useMemo } from 'react';
import { getAuthHeaders } from '../utils/api';
import { API_BASE_URL } from '../config';
import EditCommunicationModal from './EditCommunicationModal';

// A small, self-contained component for editing the status of a communication entry.
const StatusEditor = ({ communication, leaseId, onUpdate }) => {
  const [currentStatus, setCurrentStatus] = useState(communication.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setIsUpdating(true);
    setCurrentStatus(newStatus);

    try {
      const res = await fetch(`${API_BASE_URL}/management/leases/${leaseId}/communications/${communication._id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status.');
      }
      onUpdate();
    } catch (err) {
      alert(err.message);
      setCurrentStatus(communication.status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <select
      value={currentStatus}
      onChange={handleStatusChange}
      disabled={isUpdating}
      className="text-xs border border-brand-gray-300 rounded-full px-2 py-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      <option>Not Started</option>
      <option>In Progress</option>
      <option>Finished</option>
      <option>Closed</option>
    </select>
  );
};


const CommunicationTab = ({ lease, onUpdate }) => {
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingComm, setEditingComm] = useState(null);

  // 1. ADD STATE FOR FILTERS AND SEARCH
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject) {
      alert('Subject is required.');
      return;
    }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('notes', notes);
    formData.append('category', category);
    if (file) {
      formData.append('attachment', file);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/management/leases/${lease._id}/communications`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to add communication.');
      }

      setSubject('');
      setNotes('');
      setCategory('General Inquiry');
      setFile(null);
      if (document.getElementById('attachment-file-input')) {
        document.getElementById('attachment-file-input').value = null;
      }
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
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to delete communication.');
      }
      onUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenEditModal = (comm) => {
    setEditingComm(comm);
    setIsEditModalOpen(true);
  };

  // 2. FILTERING LOGIC
  const filteredCommunications = useMemo(() => {
    return (lease.communications || [])
      .filter(comm => {
        if (statusFilter === 'All') return true;
        return comm.status === statusFilter;
      })
      .filter(comm => {
        if (categoryFilter === 'All') return true;
        return comm.category === categoryFilter;
      })
      .filter(comm => {
        if (!searchTerm) return true;
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          comm.subject.toLowerCase().includes(lowerSearchTerm) ||
          (comm.notes && comm.notes.toLowerCase().includes(lowerSearchTerm))
        );
      });
  }, [lease.communications, statusFilter, categoryFilter, searchTerm]);


  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  return (
    <>
      <EditCommunicationModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          onUpdate();
        }}
        communication={editingComm}
        leaseId={lease._id}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-sm border border-brand-gray-200 h-fit">
          <h2 className="text-lg font-semibold text-brand-gray-800 border-b pb-2 mb-4">Add Communication Log</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-brand-gray-700">Subject</label>
              <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-brand-gray-700">Category</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2" >
                <option>General Inquiry</option>
                <option>Maintenance</option>
                <option>Payment Issue</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-brand-gray-700">Notes</label>
              <textarea id="notes" rows="4" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2" ></textarea>
            </div>
            <div>
              <label htmlFor="attachment-file-input" className="block text-sm font-medium text-brand-gray-700">Attachment</label>
              <input id="attachment-file-input" type="file" onChange={(e) => setFile(e.target.files[0])} className="mt-1 block w-full text-sm text-brand-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-turquoise-100 file:text-brand-turquoise-700 hover:file:bg-brand-turquoise-200" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50" >
              {isSubmitting ? 'Saving...' : 'Save Communication'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-brand-gray-200">
          <h2 className="text-lg font-semibold text-brand-gray-800 mb-4">Communication History</h2>
          
          {/* 3. ADD THE FILTER AND SEARCH UI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 border bg-brand-gray-50 rounded-lg">
            <input
              type="text"
              placeholder="Search subject or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:col-span-3 w-full border border-brand-gray-300 rounded-md shadow-sm p-2"
            />
            <div>
                <label className="block text-xs font-medium text-brand-gray-500">Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2 text-sm">
                    <option>All</option>
                    <option>General Inquiry</option>
                    <option>Maintenance</option>
                    <option>Payment Issue</option>
                    <option>Other</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-brand-gray-500">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2 text-sm">
                    <option>All</option>
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Finished</option>
                    <option>Closed</option>
                </select>
            </div>
          </div>

          <div className="space-y-4">
            {/* 4. MAP OVER THE NEW FILTERED ARRAY */}
            {filteredCommunications.length > 0 ? (
              filteredCommunications
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((comm) => (
                <div key={comm._id} className="p-3 border rounded-md bg-brand-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-brand-gray-900">{comm.subject}</p>
                      {comm.notes && <p className="text-sm text-brand-gray-600 mt-1 whitespace-pre-wrap">{comm.notes}</p>}
                      {comm.attachmentUrl && 
                        <a href={comm.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-blue hover:underline mt-2 block font-medium">
                          View Attachment
                        </a>
                      }
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        <button onClick={() => handleOpenEditModal(comm)} className="text-blue-600 hover:text-blue-800 text-xs font-semibold" aria-label="Edit communication">
                            Edit
                        </button>
                        <button onClick={() => handleDelete(comm._id)} className="text-red-500 hover:text-red-700 text-lg font-bold" aria-label="Delete communication">
                            &times;
                        </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <div className="text-xs text-brand-gray-500">
                      <span>{formatDate(comm.date)}</span>
                      <span className="mx-2">|</span>
                      <span className="font-semibold bg-brand-gray-200 text-brand-gray-700 px-2 py-0.5 rounded-full">{comm.category}</span>
                    </div>
                    <StatusEditor communication={comm} leaseId={lease._id} onUpdate={onUpdate} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-brand-gray-500 py-8">No communication logs match your filters.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunicationTab;
