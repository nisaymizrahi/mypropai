import React, { useState, useEffect } from 'react';
import { updateMaintenanceTicket } from '../utils/api';

const MaintenanceTicketDetailModal = ({ isOpen, onClose, ticket, vendors, onUpdate }) => {
    const [status, setStatus] = useState('');
    const [priority, setPriority] = useState('');
    const [assignedVendor, setAssignedVendor] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (ticket) {
            setStatus(ticket.status || 'New');
            setPriority(ticket.priority || 'Medium');
            setAssignedVendor(ticket.assignedVendor?._id || '');
        }
    }, [ticket]);

    const handleUpdate = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            const updateData = { status, priority, assignedVendor };
            await updateMaintenanceTicket(ticket._id, updateData);
            setMessage('Ticket updated successfully!');
            onUpdate(); // Refresh the list in the parent component
        } catch (error) {
            setMessage(error.message || 'Failed to update ticket.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !ticket) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-brand-gray-800">{ticket.title}</h2>
                        <p className="text-sm text-brand-gray-500">
                            For: {ticket.unit?.name} ({ticket.tenant?.fullName})
                        </p>
                    </div>
                    <button onClick={onClose} className="text-2xl font-bold">&times;</button>
                </div>

                <div className="border-t pt-4">
                    <p className="text-sm">{ticket.description}</p>
                </div>
                
                {ticket.photos && ticket.photos.length > 0 && (
                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-sm mb-2">Attached Photos</h4>
                        <div className="flex space-x-4 overflow-x-auto">
                            {ticket.photos.map(photo => (
                                <a key={photo._id} href={photo.url} target="_blank" rel="noopener noreferrer">
                                    <img src={photo.url} alt="Maintenance issue" className="h-24 w-24 object-cover rounded-md" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                    <div>
                        <label className="block text-sm font-medium">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                            <option>New</option>
                            <option>In Progress</option>
                            <option>Awaiting Parts</option>
                            <option>On Hold</option>
                            <option>Complete</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Priority</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Assign Vendor</label>
                        <select value={assignedVendor} onChange={(e) => setAssignedVendor(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                            <option value="">None</option>
                            {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                        </select>
                    </div>
                </div>
                
                {message && <p className={`text-sm text-center p-2 rounded-md ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</p>}

                <div className="flex justify-end gap-4 pt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md border">Close</button>
                    <button onClick={handleUpdate} disabled={isSaving} className="bg-brand-turquoise text-white px-4 py-2 rounded-md disabled:bg-opacity-50">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceTicketDetailModal;