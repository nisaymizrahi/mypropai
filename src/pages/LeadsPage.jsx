import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeads, updateLead, createLead, getLeadSummary } from '../utils/api';
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

// New Stat Card component for the dashboard KPIs
const StatCard = ({ title, value }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
        <p className="text-sm font-medium text-brand-gray-500">{title}</p>
        <p className="mt-1 text-3xl font-semibold text-brand-gray-900">{value}</p>
    </div>
);


const LeadsPage = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [columns, setColumns] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    const columnOrder = ['Potential', 'Analyzing', 'Offer Made', 'Under Contract', 'Closed - Won', 'Closed - Lost'];

    const fetchData = async () => {
        try {
            // Fetch both lists and summary data in parallel
            const [leadsData, summaryData] = await Promise.all([
                getLeads(),
                getLeadSummary()
            ]);
            
            setSummary(summaryData);

            const initialColumns = columnOrder.reduce((acc, col) => {
                acc[col] = { id: col, title: col, leads: [] };
                return acc;
            }, {});

            leadsData.forEach(lead => {
                if (initialColumns[lead.status]) {
                    initialColumns[lead.status].leads.push(lead);
                }
            });
            setColumns(initialColumns);
        } catch (error) {
            console.error("Failed to fetch leads data", error);
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

        // Optimistic UI update logic...
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
        
        try {
            await updateLead(draggableId, { status: destination.droppableId });
            // Refetch summary data after a status change to update KPIs
            const summaryData = await getLeadSummary();
            setSummary(summaryData);
        } catch (error) {
            console.error("Failed to update lead status", error);
            fetchData(); // Revert on failure
        }
    };
    
    if (loading) return <div>Loading...</div>;

    return (
        <>
            <AddLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-gray-900">Leads Dashboard</h1>
                        <p className="text-lg text-brand-gray-500 mt-1">Your deal pipeline at a glance.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md">
                        + Add New Lead
                    </button>
                </div>

                {/* KPI Header */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Total Active Leads" value={summary.totalLeads} />
                        <StatCard title="Analyzing" value={summary.analyzingCount} />
                        <StatCard title="Under Contract" value={summary.underContractCount} />
                        <StatCard title="Closing Ratio" value={`${summary.closingRatio.toFixed(1)}%`} />
                    </div>
                )}
                
                {/* Kanban Board */}
                <DragDropContext onDragEnd={handleOnDragEnd}>
                    {/* UPDATED: This now uses a responsive grid instead of flex scroll */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {columnOrder.map(columnId => {
                            const column = columns[columnId];
                            return (
                                <Droppable key={column.id} droppableId={column.id}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-100 rounded-lg p-3">
                                            <h3 className="font-semibold mb-3">{column.title} ({column.leads.length})</h3>
                                            <div className="space-y-3 min-h-[100px]">
                                                {column.leads.map((lead, index) => (
                                                    <Draggable key={lead._id} draggableId={lead._id} index={index}>
                                                        {(provided) => (
                                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-white p-3 rounded-md shadow-sm border cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/leads/${lead._id}`)}>
                                                                <p className="font-medium text-sm">{lead.address}</p>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
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