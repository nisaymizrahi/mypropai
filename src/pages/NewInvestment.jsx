import React, { useState } from "react";
import { createInvestment } from "../utils/api";

const NewInvestment = () => {
  const [type, setType] = useState("flip");
  const [address, setAddress] = useState("");
  const [size, setSize] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [unitCount, setUnitCount] = useState("");
  const [arv, setArv] = useState("");
  const [rentEstimate, setRentEstimate] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await createInvestment({
        type,
        address,
        sqft: Number(size),
        lotSize: Number(lotSize),
        purchasePrice: Number(purchasePrice),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        yearBuilt: Number(yearBuilt),
        propertyType,
        unitCount: ["multi-family", "mixed-use", "commercial"].includes(propertyType) ? Number(unitCount) : undefined,
        arv: type === "flip" ? Number(arv) : undefined,
        rentEstimate: type === "rent" ? Number(rentEstimate) : undefined,
      });

      setMessage("✅ Investment saved!");
      setAddress("");
      setSize("");
      setLotSize("");
      setPurchasePrice("");
      setBedrooms("");
      setBathrooms("");
      setYearBuilt("");
      setPropertyType("");
      setUnitCount("");
      setArv("");
      setRentEstimate("");
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Add New Investment</h2>

      {message && <p className="mb-4 text-sm text-blue-600">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-medium">Investment Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="flip">Fix and Flip</option>
            <option value="rent">Fix and Rent</option>
          </select>
        </div>

        <div>
          <label className="font-medium">Property Type</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Type</option>
            <option value="single-family">Single Family</option>
            <option value="multi-family">Multi-Family</option>
            <option value="mixed-use">Mixed Use</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
            <option value="other">Other</option>
          </select>
        </div>

        {propertyType && ["multi-family", "mixed-use", "commercial"].includes(propertyType) && (
          <input
            type="number"
            placeholder="Number of Units"
            value={unitCount}
            onChange={(e) => setUnitCount(e.target.value)}
            className="w-full p-2 border rounded"
          />
        )}

        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Size (Sqft)"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Lot Size"
          value={lotSize}
          onChange={(e) => setLotSize(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Purchase Price"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Bedrooms"
          value={bedrooms}
          onChange={(e) => setBedrooms(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Bathrooms"
          value={bathrooms}
          onChange={(e) => setBathrooms(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Year Built"
          value={yearBuilt}
          onChange={(e) => setYearBuilt(e.target.value)}
          className="w-full p-2 border rounded"
        />

        {type === "flip" && (
          <input
            type="number"
            placeholder="ARV (After Repair Value)"
            value={arv}
            onChange={(e) => setArv(e.target.value)}
            className="w-full p-2 border rounded"
          />
        )}

        {type === "rent" && (
          <input
            type="number"
            placeholder="Projected Monthly Rent"
            value={rentEstimate}
            onChange={(e) => setRentEstimate(e.target.value)}
            className="w-full p-2 border rounded"
          />
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Save Investment
        </button>
      </form>
    </div>
  );
};

export default NewInvestment;
