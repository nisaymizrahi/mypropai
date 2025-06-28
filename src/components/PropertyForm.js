import React, { useState } from "react";

const PropertyForm = ({ onSubmit }) => {
  const [address, setAddress] = useState("");
  const [distance, setDistance] = useState(1);
  const [propertyType, setPropertyType] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    onSubmit({ address, distance, propertyType });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-2">
      <input
        type="text"
        placeholder="Enter property address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <select
        value={propertyType}
        onChange={(e) => setPropertyType(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">All Property Types</option>
        <option value="SFR">Single Family</option>
        <option value="CONDO">Condo</option>
        <option value="APT">Apartment</option>
        <option value="MULTI">Multi-Family</option>
      </select>

      <input
        type="number"
        value={distance}
        onChange={(e) => setDistance(e.target.value)}
        className="w-full p-2 border rounded"
        min="0.1"
        step="0.1"
        placeholder="Search radius (miles)"
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Search Comps
      </button>
    </form>
  );
};

export default PropertyForm;
