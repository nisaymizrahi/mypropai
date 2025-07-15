import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "../utils/api";
import { API_BASE_URL } from '../config';
import PromotePropertyModal from '../components/PromotePropertyModal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div>
  </div>
);

const ManagementDashboard = () => {
  const [managedProperties, setManagedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchManagedProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/management`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch managed properties.");
      const data = await res.json();
      setManagedProperties(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagedProperties();
  }, [fetchManagedProperties]);

  const handlePromoteSuccess = () => fetchManagedProperties();

  const getPortfolioSummary = () => {
    const totalUnits = managedProperties.reduce((acc, prop) => acc + prop.units.length, 0);
    const totalOccupied = managedProperties.reduce((acc, prop) => (
      acc + prop.units.filter(u => u.currentLease).length
    ), 0);
    const totalVacant = totalUnits - totalOccupied;

    return {
      totalProperties: managedProperties.length,
      totalUnits,
      totalOccupied,
      totalVacant,
    };
  };

  const summary = getPortfolioSummary();

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500 text-center p-4">{error}</p>;

  return (
    <>
      <PromotePropertyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPromoteSuccess={handlePromoteSuccess}
      />

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-brand-gray-900">
              Property Management
            </h1>
            <p className="text-lg text-brand-gray-500 mt-1">
              Oversee your portfolio of managed rental properties.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition"
          >
            Add Managed Property
          </button>
        </div>

        {/* 🔢 Portfolio Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm text-brand-gray-500">Properties</h3>
            <p className="text-2xl font-bold text-brand-gray-800">{summary.totalProperties}</p>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm text-brand-gray-500">Total Units</h3>
            <p className="text-2xl font-bold text-brand-gray-800">{summary.totalUnits}</p>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm text-brand-gray-500">Occupied Units</h3>
            <p className="text-2xl font-bold text-green-700">{summary.totalOccupied}</p>
          </div>
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm text-brand-gray-500">Vacant Units</h3>
            <p className="text-2xl font-bold text-red-600">{summary.totalVacant}</p>
          </div>
        </div>

        {/* 📊 Charts Section (Placeholder for future visualizations) */}
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h3 className="text-lg font-semibold text-brand-gray-800 mb-2">Portfolio Trends</h3>
          <p className="text-brand-gray-500 text-sm">Add charts here: rent collected, occupancy %, etc.</p>
        </div>

        {/* 📋 Property Table */}
        <div className="bg-white shadow-sm rounded-lg border border-brand-gray-200 overflow-hidden">
          {managedProperties.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead className="bg-brand-gray-50 border-b border-brand-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-brand-gray-600">Address</th>
                  <th className="text-left px-6 py-3 font-semibold text-brand-gray-600">Units</th>
                  <th className="text-left px-6 py-3 font-semibold text-brand-gray-600">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-200">
                {managedProperties.map((prop) => (
                  <tr key={prop._id} className="hover:bg-brand-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-brand-gray-800">{prop.address}</td>
                    <td className="px-6 py-4 text-brand-gray-600">{prop.units.length}</td>
                    <td className="px-6 py-4 text-brand-gray-600">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${prop.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {prop.isActive ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/management/${prop._id}`)}
                        className="text-brand-turquoise-600 hover:text-brand-turquoise-700 font-semibold"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center p-12">
              <h3 className="text-lg font-medium text-brand-gray-800">No Managed Properties Found</h3>
              <p className="text-brand-gray-500 mt-1">
                Click "Add Managed Property" to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ManagementDashboard;
