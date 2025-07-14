import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthHeaders, getMaintenanceTickets, getOperatingExpenses, getVendors } from '../utils/api';
import { API_BASE_URL } from '../config';
import AddUnitModal from '../components/AddUnitModal';
import AddLeaseModal from '../components/AddLeaseModal';
import MaintenanceTab from '../components/MaintenanceTab';
import OperatingExpensesTab from '../components/OperatingExpensesTab';
import RentalPerformanceTab from '../components/RentalPerformanceTab';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div>
    </div>
);

const UnitCard = ({ unit, onAddLeaseClick, navigate }) => {
    const isVacant = unit.status === 'Vacant';
    
    return (
        <div className="bg-white rounded-lg shadow-sm border border-brand-gray-200 p-4 flex flex-col">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-brand-gray-800">{unit.name}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isVacant ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {unit.status}
                </span>
            </div>
            
            <div className="text-sm text-brand-gray-600 flex-grow space-y-2 mb-4">
                {isVacant ? (
                    <p className="italic text-brand-gray-400">This unit is currently vacant.</p>
                ) : (
                    <div>
                        <p><strong>Tenant:</strong> {unit.currentLease?.tenant?.fullName || 'N/A'}</p>
                        <p><strong>Rent:</strong> ${unit.currentLease?.rentAmount?.toLocaleString() || 'N/A'}</p>
                        <p><strong>Lease Ends:</strong> {unit.currentLease?.endDate ? new Date(unit.currentLease.endDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                )}
            </div>

            <div className="mt-auto space-y-2">
                {isVacant ? (
                    <>
                        <button 
                            onClick={() => navigate(`/management/units/${unit._id}/listing`)}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-1.5 rounded-md text-sm transition">
                            Manage Listing
                        </button>
                        <button 
                            onClick={() => onAddLeaseClick(unit._id)}
                            className="w-full bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-3 py-1.5 rounded-md text-sm transition">
                            Add Tenant & Lease
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => navigate(`/management/leases/${unit.currentLease._id}`)}
                        className="w-full bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-3 py-1.5 rounded-md border border-brand-gray-300 text-sm transition">
                        View Lease
                    </button>
                )}
            </div>
        </div>
    );
};

const ManagedPropertyDetail = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isAddLeaseModalOpen, setIsAddLeaseModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const [activeTab, setActiveTab] = useState('units');
  const [tickets, setTickets] = useState([]);
  const [operatingExpenses, setOperatingExpenses] = useState([]);
  const [vendors, setVendors] = useState([]); // Add state for vendors

  const handleOpenLeaseModal = (unitId) => {
    setSelectedUnitId(unitId);
    setIsAddLeaseModalOpen(true);
  };

  const fetchPropertyDetails = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all data, including vendors
      const [propertyRes, ticketsData, expensesData, vendorsData] = await Promise.all([
          fetch(`${API_BASE_URL}/management/${propertyId}`, { headers: getAuthHeaders() }),
          getMaintenanceTickets(propertyId),
          getOperatingExpenses(propertyId),
          getVendors()
      ]);

      if (!propertyRes.ok) {
        throw new Error('Failed to fetch property details.');
      }
      const propertyData = await propertyRes.json();
      setProperty(propertyData);
      setTickets(ticketsData);
      setOperatingExpenses(expensesData);
      setVendors(vendorsData); // Set vendors state

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchPropertyDetails();
  }, [fetchPropertyDetails]);

  const handleUnitAdded = () => fetchPropertyDetails();
  const handleLeaseAdded = () => fetchPropertyDetails();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center p-4">{error}</p>;
  if (!property) return <p className="text-center p-4">Property not found.</p>;

  const TabButton = ({ tabName, label }) => (
    <button onClick={() => setActiveTab(tabName)} className={`flex-shrink-0 px-4 py-2 rounded-md font-semibold ${activeTab === tabName ? 'bg-brand-turquoise text-white' : 'bg-white border border-brand-gray-300 text-brand-gray-700'}`}>{label}</button>
  );

  return (
    <>
        <AddUnitModal isOpen={isAddUnitModalOpen} onClose={() => setIsAddUnitModalOpen(false)} onUnitAdded={handleUnitAdded} propertyId={propertyId} />
        <AddLeaseModal isOpen={isAddLeaseModalOpen} onClose={() => setIsAddLeaseModalOpen(false)} onSuccess={handleLeaseAdded} unitId={selectedUnitId} propertyId={propertyId} />

        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">{property.address}</h1>
                    <p className="text-lg text-brand-gray-500 mt-1">Management Dashboard</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={() => setIsAddUnitModalOpen(true)} className="flex-1 bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition">Add Unit</button>
                    <button onClick={() => navigate('/management')} className="flex-1 bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition">Back</button>
                </div>
            </div>
            
            <div className="flex gap-2 mb-6 border-b overflow-x-auto pb-2">
                <TabButton tabName="units" label="Units" />
                <TabButton tabName="maintenance" label="Maintenance" />
                <TabButton tabName="expenses" label="Expenses" />
                <TabButton tabName="performance" label="Performance" />
            </div>

            {activeTab === 'units' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {property.units && property.units.map(unit => (
                        <UnitCard key={unit._id} unit={unit} onAddLeaseClick={handleOpenLeaseModal} navigate={navigate} />
                    ))}
                    <div onClick={() => setIsAddUnitModalOpen(true)} className="bg-white rounded-lg border-2 border-dashed border-brand-gray-300 flex items-center justify-center text-brand-gray-400 hover:border-brand-turquoise hover:text-brand-turquoise cursor-pointer transition min-h-[150px]">
                        <div className="text-center">
                            <span className="text-4xl font-light">+</span>
                            <p className="font-semibold">Add New Unit</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'maintenance' && (
                <MaintenanceTab 
                    tickets={tickets}
                    property={property}
                    vendors={vendors} 
                    onUpdate={fetchPropertyDetails}
                />
            )}
            
            {activeTab === 'expenses' && (
                <OperatingExpensesTab
                    propertyId={propertyId}
                    expenses={operatingExpenses}
                    onUpdate={fetchPropertyDetails}
                />
            )}

            {activeTab === 'performance' && (
                <RentalPerformanceTab
                    property={property}
                    operatingExpenses={operatingExpenses}
                />
            )}
        </div>
    </>
  );
};

export default ManagedPropertyDetail;
