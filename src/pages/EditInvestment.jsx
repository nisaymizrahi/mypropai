import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTokenHeader } from "../utils/api";

const EditInvestment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [investment, setInvestment] = useState(null);
  const [message, setMessage] = useState("");

  const multiUnitTypes = ["multifamily", "mixed-use", "commercial"];

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
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow space-y-4">
      <h2 className="text-2xl font-bold mb-2">Edit Investment</h2>

      {message && <p className="mb-2 text-sm text-blue-600">{message}</p>}

      <form onSubmit={handleSave} className="space-y-4">

        <div>
          <label className="block font-medium mb-1">Property Type</label>
          <select
            value={investment.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Type</option>
            <option value="single-family">Single Family</option>
            <option value="multifamily">Multifamily</option>
            <option value="townhouse">Townhouse</option>
            <option value="condo">Condominium</option>
            <option value="commercial">Commercial</option>
            <option value="mixed-use">Mixed Use</option>
            <option value="lot">Vacant Lot</option>
          </select>
        </div>

        {multiUnitTypes.includes(investment.type) && (
          <div>
            <label className="block font-medium mb-1">Units</label>
            <input
              type="number"
              placeholder="Number of Units"
              value={investment.units || ""}
              onChange={(e) => handleChange("units", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        <div>
          <label className="block font-medium mb-1">Address</label>
          <input
            type="text"
            value={investment.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Size (Sqft)</label>
            <input
              type="number"
              value={investment.sqft || ""}
              onChange={(e) => handleChange("sqft", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Lot Size (Sqft)</label>
            <input
              type="number"
              value={investment.lotSize || ""}
              onChange={(e) => handleChange("lotSize", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Bedrooms</label>
            <input
              type="number"
              value={investment.bedrooms || ""}
              onChange={(e) => handleChange("bedrooms", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Bathrooms</label>
            <input
              type="number"
              value={investment.bathrooms || ""}
              onChange={(e) => handleChange("bathrooms", e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Year Built</label>
          <input
            type="number"
            value={investment.yearBuilt || ""}
            onChange={(e) => handleChange("yearBuilt", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Purchase Price</label>
          <input
            type="number"
            value={investment.purchasePrice || ""}
            onChange={(e) => handleChange("purchasePrice", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">ARV (After Repair Value)</label>
          <input
            type="number"
            value={investment.arv || ""}
            onChange={(e) => handleChange("arv", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Projected Monthly Rent</label>
          <input
            type="number"
            value={investment.rentEstimate || ""}
            onChange={(e) => handleChange("rentEstimate", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Renovation Budget</label>
          <input
            type="number"
            value={investment.initialBudget || ""}
            onChange={(e) => handleChange("initialBudget", e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 mt-4"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditInvestment;
