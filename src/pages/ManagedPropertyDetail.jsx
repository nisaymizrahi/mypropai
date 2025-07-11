import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTokenHeader } from '../utils/api';
import { API_BASE_URL } from '../config';
import AddUnitModal from '../components/AddUnitModal';
import AddLeaseModal from '../components/AddLeaseModal';

// --- Reusable Components ---

const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div>
    </div>
);

// FINAL FIX: This component now correctly uses the navigate function.
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

            <div className="mt-auto">
                {isVacant ? (
                    <button 
                        onClick={() => onAddLeaseClick(unit._id)}
                        className="w-full bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-3 py-1.5 rounded-md text-sm transition">
                        Add Tenant & Lease
                    </button>
                ) : (
                    <button 
                        // CORRECTED: This now correctly calls navigate
                        onClick={() => navigate(`/leases/${unit.currentLease._id}`)}
                        className="w-full bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-3 py-1.5 rounded-md border border-brand-gray-300 text-sm transition">
                        View Lease
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Main Page Component ---

const ManagedPropertyDetail = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isAddLeaseModalOpen, setIsAddLeaseModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  const fetchPropertyDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/management/${propertyId}`, {
        headers: getTokenHeader(),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch property details.');
      }
      const data = await res.json();
      setProperty(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchPropertyDetails();
  }, [fetchPropertyDetails]);

  const handleUnitAdded = () => {
    fetchPropertyDetails();
  };

  const handleOpenLeaseModal = (unitId) => {
    setSelectedUnitId(unitId);
    setIsAddLeaseModalOpen(true);
  };
  
  const handleLeaseAdded = () => {
    fetchPropertyDetails();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <p className="text-red-500 text-center p-4">{error}</p>;
  }

  if (!property) {
    return <p className="text-center p-4">Property not found.</p>;
  }

  return (
    <>
        <AddUnitModal
            isOpen={isAddUnitModalOpen}
            onClose={() => setIsAddUnitModalOpen(false)}
            onUnitAdded={handleUnitAdded}
            propertyId={propertyId}
        />
        <AddLeaseModal
            isOpen={isAddLeaseModalOpen}
            onClose={() => setIsAddLeaseModalOpen(false)}
            onSuccess={handleLeaseAdded}
            unitId={selectedUnitId}
            propertyId={propertyId}
        />

        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-brand-gray-900">
                        {property.address}
                    </h1>
                    <p className="text-lg text-brand-gray-500 mt-1">
                        Management Dashboard
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAddUnitModalOpen(true)}
                        className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition"
                    >
                        Add Unit
                    </button>
                    <button
                        onClick={() => navigate('/management')}
                        className="bg-white hover:bg-brand-gray-100 text-brand-gray-700 font-semibold px-4 py-2 rounded-md border border-brand-gray-300 transition"
                    >
                        &larr; Back to All Properties
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {property.units && property.units.map(unit => (
                    <UnitCard 
                        key={unit._id} 
                        unit={unit} 
                        onAddLeaseClick={handleOpenLeaseModal}
                        navigate={navigate} // Pass the navigate function to the card
                    />
                ))}
                <div 
                    onClick={() => setIsAddUnitModalOpen(true)}
                    className="bg-white rounded-lg border-2 border-dashed border-brand-gray-300 flex items-center justify-center text-brand-gray-400 hover:border-brand-turquoise hover:text-brand-turquoise cursor-pointer transition min-h-[150px]"
                >
                    <div className="text-center">
                        <span className="text-4xl font-light">+</span>
                        <p className="font-semibold">Add New Unit</p>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};

export default ManagedPropertyDetail;