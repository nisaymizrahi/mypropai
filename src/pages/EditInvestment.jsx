// src/pages/EditInvestment.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTokenHeader } from "../utils/api";

const EditInvestment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [investment, setInvestment] = useState(null);
  const [message, setMessage] = useState("");

  const propertyTypes = [
    "Single Family",
    "Multi-Family",
    "Condo",
    "Townhouse",
    "Mixed Use",
    "Commercial",
    "Lot",
    "Other"
  ];

  const allowsUnits = (type) => ["Multi-Family", "Mixed Use", "Commercial"].includes(type);

  useEffect(() => {
    const fetchInvestment = async () => {
      try {
        const res = await fetch(`https://mypropai-server.onrender.com/api/investments/${id}`, {
          headers: getTokenHeader(),
        });

        if (!res.ok) throw new Error("Failed to fetch investment");

        const data = await res.json();
        setInvestment(data);
      } catch (err) {
        setMessage("❌ Error loading investment.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestment();
  }, [id]);

  const handleChange = (field, value) => {
    setInvestment((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch(`https://mypropai-server.onrender.com/api/investments/${id}`, {
        method: "PATCH",
        headers: getTokenHeader(),
        body: JSON.stringify(investment),
      });

      if (!res.ok) throw new Error("Failed to update investment");
      setMessage("✅ Investment updated!");
      navigate(`/investments/${id}`);
    } catch (err) {
      setMessage("❌ " + err.message);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!investment) return <div className="p-6 text-red-600">Investment not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Edit Investment</h2>
      {message && <p className="mb-4 text-sm text-blue-600">{message}</p>}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="font-medium">Investment Type</label>
          <select
            value={investment.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="flip">Fix and Flip</option>
            <option value="rent">Fix and Rent</option>
          </select>
        </div>

        <div>
          <label className="font-medium">Property Type</label>
          <select
            value={investment.propertyType || ""}
            onChange={(e) => handleChange("propertyType", e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Type</option>
            {propertyTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {allowsUnits(investment.propertyType) && (
          <div>
            <label className="font-medium">Unit Count</label>
            <input
              type="number"
              value={investment.unitCount || ""}
              onChange={(e) => handleChange("unitCount", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        <div>
          <label className="font-medium">Address</label>
          <input
            type="text"
            value={investment.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-medium">Bedrooms</label>
            <input
              type="number"
              value={investment.bedrooms || ""}
              onChange={(e) => handleChange("bedrooms", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="font-medium">Bathrooms</label>
            <input
              type="number"
              value={investment.bathrooms || ""}
              onChange={(e) => handleChange("bathrooms", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="font-medium">Year Built</label>
          <input
            type="number"
            value={investment.yearBuilt || ""}
            onChange={(e) => handleChange("yearBuilt", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-medium">Size (Sqft)</label>
            <input
              type="number"
              value={investment.sqft || ""}
              onChange={(e) => handleChange("sqft", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="font-medium">Lot Size (Sqft)</label>
            <input
              type="number"
              value={investment.lotSize || ""}
              onChange={(e) => handleChange("lotSize", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="font-medium">Purchase Price</label>
          <input
            type="number"
            value={investment.purchasePrice || ""}
            onChange={(e) => handleChange("purchasePrice", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        {investment.type === "flip" && (
          <div>
            <label className="font-medium">ARV (After Repair Value)</label>
            <input
              type="number"
              value={investment.arv || ""}
              onChange={(e) => handleChange("arv", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        {investment.type === "rent" && (
          <div>
            <label className="font-medium">Projected Monthly Rent</label>
            <input
              type="number"
              value={investment.rentEstimate || ""}
              onChange={(e) => handleChange("rentEstimate", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditInvestment;
