import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTokenHeader } from "../utils/api";

const EditInvestment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [investment, setInvestment] = useState(null);
  const [message, setMessage] = useState("");

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

        <input
          type="text"
          placeholder="Address"
          value={investment.address}
          onChange={(e) => handleChange("address", e.target.value)}
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="number"
          placeholder="Size (Sqft)"
          value={investment.sqft || ""}
          onChange={(e) => handleChange("sqft", e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Lot Size"
          value={investment.lotSize || ""}
          onChange={(e) => handleChange("lotSize", e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Purchase Price"
          value={investment.purchasePrice || ""}
          onChange={(e) => handleChange("purchasePrice", e.target.value)}
          className="w-full p-2 border rounded"
        />

        {investment.type === "flip" && (
          <input
            type="number"
            placeholder="ARV (After Repair Value)"
            value={investment.arv || ""}
            onChange={(e) => handleChange("arv", e.target.value)}
            className="w-full p-2 border rounded"
          />
        )}

        {investment.type === "rent" && (
          <input
            type="number"
            placeholder="Projected Monthly Rent"
            value={investment.rentEstimate || ""}
            onChange={(e) => handleChange("rentEstimate", e.target.value)}
            className="w-full p-2 border rounded"
          />
        )}

        <input
          type="number"
          placeholder="Renovation Budget"
          value={investment.initialBudget || ""}
          onChange={(e) => handleChange("initialBudget", e.target.value)}
          className="w-full p-2 border rounded"
        />

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
