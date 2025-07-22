import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getInvestments } from "../utils/api";
import EmptyState from "../components/EmptyState";

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
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-gray-900">My Investments</h1>
          <p className="text-lg text-brand-gray-500 mt-1">Track and analyze your properties.</p>
        </div>
        <button
          onClick={() => navigate("/investments/new")}
          className="bg-brand-turquoise hover:bg-brand-turquoise-600 text-white font-semibold px-4 py-2 rounded-md transition"
        >
          Add New Investment
        </button>
      </div>

      {investments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {investments.map((inv) => (
            <div key={inv._id} className="bg-white rounded-lg shadow-sm border border-brand-gray-200 overflow-hidden">
              {inv.coverImage && (
                <img src={inv.coverImage} alt="Property" className="w-full h-40 object-cover" />
              )}
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-brand-gray-800">{inv.address}</h2>
                    <p className="text-sm text-brand-gray-500 capitalize">{inv.type}</p>
                  </div>
                  {inv.status && (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 border border-gray-300">
                      {inv.status}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-brand-gray-600">
                  <div><strong>ARV:</strong> ${inv.arv?.toLocaleString() || "N/A"}</div>
                  <div><strong>Purchase:</strong> ${inv.purchasePrice?.toLocaleString() || "N/A"}</div>
                  <div><strong>Rent:</strong> ${inv.rentEstimate?.toLocaleString() || "—"}</div>
                  <div><strong>Progress:</strong> {inv.progress || 0}%</div>
                </div>

                <div className="w-full bg-brand-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-brand-turquoise h-2 rounded-full transition-all"
                    style={{ width: `${inv.progress || 0}%` }}
                  />
                </div>

                <div className="pt-2 text-right">
                  <Link
                    to={`/investments/${inv._id}`}
                    className="text-brand-turquoise hover:text-brand-turquoise-700 font-semibold text-sm"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🏡"
          title="No Investments Yet"
          message="Get started by adding your first property."
          buttonText="Add New Investment"
          onButtonClick={() => navigate("/investments/new")}
        />
      )}
    </div>
  );
};

export default MyInvestments;
