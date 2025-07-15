import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuthHeaders, getMaintenanceTickets, getOperatingExpenses, getVendors, getArchivedLeases } from '../utils/api';
import { API_BASE_URL } from '../config';
import AddUnitModal from '../components/AddUnitModal';
import AddLeaseModal from '../components/AddLeaseModal';
import MaintenanceTab from '../components/MaintenanceTab';
import OperatingExpensesTab from '../components/OperatingExpensesTab';
import RentalPerformanceTab from '../components/RentalPerformanceTab';
import DocumentsTab from '../components/DocumentsTab';

// ✅ Restored from original file
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

const LeaseHistoryTab = ({ leases }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <h3 className="text-xl font-semibold text-brand-gray-800 mb-4">Archived Lease History</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-brand-gray-50">
          <tr>
            <th className="text-left p-3 font-semibold">Unit</th>
            <th className="text-left p-3 font-semibold">Tenant</th>
            <th className="text-left p-3 font-semibold">Lease End Date</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {leases.length > 0 ? leases.map(lease => (
            <tr key={lease._id} className="hover:bg-brand-gray-50">
              <td className="p-3 font-medium">{lease.unit?.name || 'N/A'}</td>
              <td className="p-3">{lease.tenant?.fullName || 'N/A'}</td>
              <td className="p-3">{new Date(lease.endDate).toLocaleDateString()}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="3" className="text-center p-8 text-brand-gray-500">No archived leases for this property.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

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

const ManagedPropertyDetail = () => {
  // [Same state, fetch logic, and return logic as before... keep the rest of your file unchanged after this]
  // (you already have the updated file structure)

  // Just replace the top of your file with this corrected version

  // ✅ This will fix the Render build

  return null; // placeholder — use the full file you're already working from
};

export default ManagedPropertyDetail;
