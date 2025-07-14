import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getInvestments } from "../utils/api";
import EmptyState from "../components/EmptyState"; // 1. IMPORT THE NEW COMPONENT

const MyInvestments = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const data = await getInvestments();
        setInvestments(data);
      } catch (err) {
        setError("Failed to load investments");
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  if (loading) {
    return (
        <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-turquoise"></div>
        </div>
    );
  }
  
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-brand-gray-900">My Investments</h1>
            <p className="text-lg text-brand-gray-500 mt-1">A list of your saved properties.</p>
        </div>
        <button 
            onClick={() => navigate('/investments/new')}
            className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition"
        >
            Add New Investment
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-brand-gray-200 overflow-hidden">
        {investments.length > 0 ? (
            <table className="min-w-full text-sm">
                <thead className="bg-brand-gray-50 border-b border-brand-gray-200">
                    <tr>
                    <th className="text-left px-6 py-3 font-semibold text-brand-gray-600">Address</th>
                    <th className="text-left px-6 py-3 font-semibold text-brand-gray-600">Type</th>
                    <th className="text-left px-6 py-3 font-semibold text-brand-gray-600">Purchase Price</th>
                    <th className="text-left px-6 py-3 font-semibold text-brand-gray-600">Property Size</th>
                    <th className="px-6 py-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-gray-200">
                    {investments.map((inv) => (
                    <tr key={inv._id} className="hover:bg-brand-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-brand-gray-800">{inv.address}</td>
                        <td className="px-6 py-4 text-brand-gray-600 capitalize">{inv.type}</td>
                        <td className="px-6 py-4 text-brand-gray-600">${inv.purchasePrice?.toLocaleString() || "N/A"}</td>
                        <td className="px-6 py-4 text-brand-gray-600">{inv.sqft ? `${inv.sqft.toLocaleString()} sqft` : "—"}</td>
                        <td className="px-6 py-4 text-right">
                        <Link
                            to={`/investments/${inv._id}`}
                            className="text-brand-turquoise-600 hover:text-brand-turquoise-700 font-semibold"
                        >
                            View Details
                        </Link>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            // 2. USE THE NEW EMPTY STATE COMPONENT
            <EmptyState
                icon="🏡"
                title="No Investments Yet"
                message="Get started by adding your first property to analyze and track."
                buttonText="Add New Investment"
                onButtonClick={() => navigate('/investments/new')}
            />
        )}
      </div>
    </div>
  );
}

export default MyInvestments;
