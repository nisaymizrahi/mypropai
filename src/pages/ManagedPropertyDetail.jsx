// [No changes to imports except the two new tab stubs]
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAuthHeaders, getMaintenanceTickets, getOperatingExpenses, getVendors, getArchivedLeases } from '../utils/api';
import { API_BASE_URL } from '../config';
import AddUnitModal from '../components/AddUnitModal';
import AddLeaseModal from '../components/AddLeaseModal';
import MaintenanceTab from '../components/MaintenanceTab';
import OperatingExpensesTab from '../components/OperatingExpensesTab';
import RentalPerformanceTab from '../components/RentalPerformanceTab';

// New placeholder components
const PropertyInfoTab = ({ property }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
    <h3 className="text-xl font-semibold text-brand-gray-800">Property Information</h3>
    <p><strong>Address:</strong> {property.address}</p>
    <p><strong>Estimated Value:</strong> ${property.financials?.currentValue?.toLocaleString() || 'N/A'}</p>
    <h4 className="mt-4 font-semibold text-brand-gray-700">Mortgage Info</h4>
    <p><strong>Loan Amount:</strong> ${property.financials?.mortgage?.loanAmount?.toLocaleString() || 'N/A'}</p>
    <p><strong>Interest Rate:</strong> {property.financials?.mortgage?.interestRate || 'N/A'}%</p>
    <p><strong>Loan Term:</strong> {property.financials?.mortgage?.loanTerm || 'N/A'} years</p>
  </div>
);

const DocumentsTab = ({ property }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Documents</h3>
    <p className="text-brand-gray-600">Each unit will have its own folder here in the future. File uploads and previews coming soon.</p>
  </div>
);

// (Keep all your other code exactly as-is down to the tab selector...)

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
  const [vendors, setVendors] = useState([]);
  const [archivedLeases, setArchivedLeases] = useState([]);

  const handleOpenLeaseModal = (unitId) => {
    setSelectedUnitId(unitId);
    setIsAddLeaseModalOpen(true);
  };

  const fetchPropertyDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [propertyRes, ticketsData, expensesData, vendorsData, archivedLeasesData] = await Promise.all([
        fetch(`${API_BASE_URL}/management/property/${propertyId}`, { headers: getAuthHeaders() }),
        getMaintenanceTickets(propertyId),
        getOperatingExpenses(propertyId),
        getVendors(),
        getArchivedLeases(propertyId)
      ]);

      if (!propertyRes.ok) {
        throw new Error('Failed to fetch property details.');
      }

      const propertyData = await propertyRes.json();
      setProperty(propertyData);
      setTickets(ticketsData);
      setOperatingExpenses(expensesData);
      setVendors(vendorsData);
      setArchivedLeases(archivedLeasesData);
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
    <button onClick={() => setActiveTab(tabName)} className={`flex-shrink-0 px-4 py-2 rounded-md font-semibold ${activeTab === tabName ? 'bg-brand-turquoise text-white' : 'bg-white border border-brand-gray-300 text-brand-gray-700'}`}>
      {label}
    </button>
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
          <TabButton tabName="info" label="Property Info" />
          <TabButton tabName="documents" label="Documents" />
          <TabButton tabName="history" label="Lease History" />
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

        {activeTab === 'info' && (
          <PropertyInfoTab property={property} />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab property={property} />
        )}

        {activeTab === 'history' && (
          <LeaseHistoryTab leases={archivedLeases} />
        )}
      </div>
    </>
  );
};

export default ManagedPropertyDetail;
