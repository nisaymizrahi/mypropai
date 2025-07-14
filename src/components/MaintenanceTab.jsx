import React, { useState, useMemo } from 'react';
import AddMaintenanceTicketModal from './AddMaintenanceTicketModal';
import MaintenanceTicketDetailModal from './MaintenanceTicketDetailModal'; // 1. IMPORT THE DETAIL MODAL

const StatusBadge = ({ status }) => {
    const statusColors = {
        'New': 'bg-blue-100 text-blue-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'On Hold': 'bg-gray-100 text-gray-800',
        'Awaiting Parts': 'bg-purple-100 text-purple-800',
        'Complete': 'bg-green-100 text-green-800',
    };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    );
};

const MaintenanceTab = ({ tickets = [], vendors = [], property, onUpdate }) => {
    const [statusFilter, setStatusFilter] = useState('Open');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    // 2. ADD STATE FOR THE DETAIL MODAL
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);


    const filteredTickets = useMemo(() => {
        if (statusFilter === 'All') {
            return tickets;
        }
        if (statusFilter === 'Open') {
            return tickets.filter(t => t.status !== 'Complete');
        }
        return tickets.filter(t => t.status === statusFilter);
    }, [tickets, statusFilter]);

    // 3. ADD HANDLER TO OPEN THE DETAIL MODAL
    const handleOpenDetailModal = (ticket) => {
        setSelectedTicket(ticket);
        setIsDetailModalOpen(true);
    };

    return (
        <>
            <AddMaintenanceTicketModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={onUpdate}
                property={property}
            />
            {/* 4. RENDER THE DETAIL MODAL */}
            <MaintenanceTicketDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                onUpdate={onUpdate}
                ticket={selectedTicket}
                vendors={vendors}
            />

            <div className="bg-white p-6 rounded-lg shadow-sm border border-brand-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-semibold text-brand-gray-800">Maintenance Hub</h3>
                        <p className="text-sm text-brand-gray-500">Tracking {filteredTickets.length} ticket(s) for this property.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="text-xs font-medium text-brand-gray-500">Filter by Status</label>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="mt-1 block w-full border border-brand-gray-300 rounded-md shadow-sm p-2 text-sm"
                            >
                                <option value="Open">Open</option>
                                <option value="All">All</option>
                                <option value="New">New</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Complete">Complete</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-brand-turquoise text-white font-semibold px-4 py-2 rounded-md self-end"
                        >
                            Create Ticket
                        </button>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {filteredTickets.length > 0 ? (
                        filteredTickets.map(ticket => (
                            <div key={ticket._id} className="p-4 border rounded-lg hover:shadow-md transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-brand-gray-900">{ticket.title}</p>
                                        <p className="text-sm text-brand-gray-600">
                                            Unit: {ticket.unit?.name || 'N/A'} | Tenant: {ticket.tenant?.fullName || 'N/A'}
                                        </p>
                                    </div>
                                    <StatusBadge status={ticket.status} />
                                </div>
                                <p className="text-sm text-brand-gray-700 mt-2">{ticket.description}</p>
                                <div className="text-right mt-2">
                                    {/* 5. WIRE UP THE BUTTON */}
                                    <button onClick={() => handleOpenDetailModal(ticket)} className="text-sm font-semibold text-brand-turquoise hover:underline">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-brand-gray-500 py-12">No maintenance tickets match your filter.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default MaintenanceTab;