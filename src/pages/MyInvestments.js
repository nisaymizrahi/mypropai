import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInvestments } from "../utils/api"; // ✅ use the token-aware API

function MyInvestments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const data = await getInvestments(); // ✅ uses Authorization header
        setInvestments(data);
      } catch (err) {
        setError("Failed to load investments");
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  if (loading) return <p>Loading investments...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Investments</h1>
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">Address</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Purchase Price</th>
              <th className="text-left px-4 py-2">Lot Size</th>
              <th className="text-left px-4 py-2">View</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((inv, idx) => (
              <tr key={inv._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-2">{inv.address}</td>
                <td className="px-4 py-2">{inv.type}</td>
                <td className="px-4 py-2">${inv.purchasePrice?.toLocaleString()}</td>
                <td className="px-4 py-2">{inv.lotSize || "—"} sqft</td>
                <td className="px-4 py-2">
                  <Link
                    to={`/investments/${inv._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyInvestments;
