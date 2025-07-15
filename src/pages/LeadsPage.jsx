import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeads, updateLead, createLead } from '../utils/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const AddLeadModal = ({ isOpen, onClose, onSuccess }) => {
    const [address, setAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!address) return;
        setIsSaving(true);
        try {
            await createLead({ address });
            onSuccess();
            setAddress('');
            onClose();
        } catch (error) {
            console.error("Failed to create lead", error);
        } finally {
            setIsSaving(false);
        }
    };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Add New Lead</h3>
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter property address..."
                    className="w-full p-2 border rounded-md"
                />
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="px-4 py-2 rounded-md bg-brand-turquoise text-white disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Add Lead'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LeadsPage = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [columns, setColumns] = useState(null);
    const [loading, setLoading] = useState(true);

    const columnOrder = ['Potential', 'Analyzing', 'Offer Made', 'Under Contract', 'Closed - Won', 'Closed - Lost'];

    const fetchData = async () => {
        try {
            const leads = await getLeads();
            const initialColumns = columnOrder.reduce((acc, col) => {
                acc[col] = { id: col, title: col, leads: [] };
                return acc;
            }, {});

            leads.forEach(lead => {
                if (initialColumns[lead.status]) {
                    initialColumns[lead.status].leads.push(lead);
                }
            });
            setColumns(initialColumns);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOnDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        // Optimistic UI update
        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];
        const sourceLeads = [...sourceColumn.leads];
        const [movedLead] = sourceLeads.splice(source.index, 1);
        
        const newColumns = { ...columns };
        newColumns[source.droppableId] = { ...sourceColumn, leads: sourceLeads };

        if (source.droppableId === destination.droppableId) {
            newColumns[source.droppableId].leads.splice(destination.index, 0, movedLead);
        } else {
            const destLeads = [...destColumn.leads];
            destLeads.splice(destination.index, 0, movedLead);
            newColumns[destination.droppableId] = { ...destColumn, leads: destLeads };
        }
        setColumns(newColumns);

        // API call to update the lead's status
        try {
            await updateLead(draggableId, { status: destination.droppableId });
        } catch (error) {
            console.error("Failed to update lead status", error);
            // Revert UI on failure if needed
            fetchData();
        }
    };
    
    if (loading) return <div>Loading...</div>;

    return (
        <>
            <AddLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} />
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-gray-900">Leads Pipeline</h1>
                        <p className="text-lg text-brand-gray-500 mt-1">Track potential deals from start to finish.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md">
                        + Add New Lead
                    </button>
                </div>
                <DragDropContext onDragEnd={handleOnDragEnd}>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {columnOrder.map(columnId => {
                            const column = columns[columnId];
                            return (
                                <Droppable key={column.id} droppableId={column.id}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-100 rounded-lg p-3 w-72 flex-shrink-0">
                                            <h3 className="font-semibold mb-3">{column.title} ({column.leads.length})</h3>
                                            {column.leads.map((lead, index) => (
                                                <Draggable key={lead._id} draggableId={lead._id} index={index}>
                                                    {(provided) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-white p-3 mb-3 rounded-md shadow-sm border" onClick={() => navigate(`/leads/${lead._id}`)}>
                                                            <p className="font-medium">{lead.address}</p>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            );
                        })}
                    </div>
                </DragDropContext>
            </div>
        </>
    );
};

export default LeadsPage;