import React, { useState, useEffect } from 'react';
import { createMaintenanceTicket } from '../utils/api';

const AddMaintenanceTicketModal = ({ isOpen, onClose, onSuccess, property }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        unitId: '',
    });
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFiles([...e.target.files]);
    };

    const handleClose = () => {
        setFormData({ title: '', description: '', priority: 'Medium', unitId: '' });
        setFiles([]);
        setError('');
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title || !formData.unitId) {
            setError('A Title and selecting a Unit/Tenant are required.');
            return;
        }

        setIsSubmitting(true);
        
        const selectedUnit = property.units.find(u => u._id === formData.unitId);
        
        const submissionData = new FormData();
        submissionData.append('propertyId', property._id);
        submissionData.append('unitId', formData.unitId);
        submissionData.append('tenantId', selectedUnit.tenant._id);
        submissionData.append('title', formData.title);
        submissionData.append('description', formData.description);
        submissionData.append('priority', formData.priority);
        
        files.forEach(file => {
            submissionData.append('photos', file);
        });

        try {
            await createMaintenanceTicket(submissionData);
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
                <h2 className="text-xl font-bold text-brand-gray-800">Create Maintenance Ticket</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Unit / Tenant</label>
                        <select name="unitId" value={formData.unitId} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required>
                            <option value="">Select a unit...</option>
                            {property?.units.filter(u => u.status === 'Occupied').map(unit => (
                                <option key={unit._id} value={unit._id}>
                                    {unit.name} - ({unit.tenant?.fullName || 'N/A'})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Title</label>
                        <input name="title" type="text" placeholder="e.g., Leaky Faucet in Kitchen" value={formData.title} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Description</label>
                        <textarea name="description" rows="3" placeholder="Provide details about the issue..." value={formData.description} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Priority</label>
                            <select name="priority" value={formData.priority} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Attach Photos</label>
                            <input type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm" multiple />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md">{error}</p>}

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={handleClose} disabled={isSubmitting} className="px-4 py-2 rounded-md border">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="bg-brand-turquoise text-white px-4 py-2 rounded-md disabled:bg-opacity-50">
                            {isSubmitting ? 'Creating...' : 'Create Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMaintenanceTicketModal;