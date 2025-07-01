import React, { useState } from "react";

const PropertyForm = ({ onSubmit }) => {
  const [address, setAddress] = useState("");
  const [distance, setDistance] = useState(0.5);
  const [propertyType, setPropertyType] = useState("");
  const [bedsMin, setBedsMin] = useState("");
  const [bedsMax, setBedsMax] = useState("");
  const [bathsMin, setBathsMin] = useState("");
  const [bathsMax, setBathsMax] = useState("");
  const [sqftMin, setSqftMin] = useState("");
  const [sqftMax, setSqftMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [soldInLastMonths, setSoldInLastMonths] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    onSubmit({
      address,
      distance: parseFloat(distance), // ✅ FIXED: ensure distance is a number
      propertyType,
      bedsMin,
      bedsMax,
      bathsMin,
      bathsMax,
      sqftMin,
      sqftMax,
      priceMin,
      priceMax,
      soldInLastMonths,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-2">
      <input
        type="text"
        placeholder="Enter address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <label className="block text-sm font-medium text-gray-700 mt-2">
        Search Radius (miles)
      </label>
      <input
        type="number"
        step="0.1"
        min="0.1"
        value={distance}
        onChange={(e) => setDistance(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="e.g. 0.5, 1, 2"
      />

      <select
        value={propertyType}
        onChange={(e) => setPropertyType(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">All Types</option>
        <option value="SFR">Single Family</option>
        <option value="CONDO">Condo</option>
        <option value="APT">Apartment</option>
        <option value="MULTI">Multi-Family</option>
      </select>

      <div className="grid grid-cols-2 gap-2">
        <input type="number" value={bedsMin} onChange={(e) => setBedsMin(e.target.value)} placeholder="Min Beds" className="p-2 border rounded" />
        <input type="number" value={bedsMax} onChange={(e) => setBedsMax(e.target.value)} placeholder="Max Beds" className="p-2 border rounded" />
        <input type="number" value={bathsMin} onChange={(e) => setBathsMin(e.target.value)} placeholder="Min Baths" className="p-2 border rounded" />
        <input type="number" value={bathsMax} onChange={(e) => setBathsMax(e.target.value)} placeholder="Max Baths" className="p-2 border rounded" />
        <input type="number" value={sqftMin} onChange={(e) => setSqftMin(e.target.value)} placeholder="Min Sqft" className="p-2 border rounded" />
        <input type="number" value={sqftMax} onChange={(e) => setSqftMax(e.target.value)} placeholder="Max Sqft" className="p-2 border rounded" />
        <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Min Price" className="p-2 border rounded" />
        <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Max Price" className="p-2 border rounded" />
      </div>

      <select
        value={soldInLastMonths}
        onChange={(e) => setSoldInLastMonths(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">Sold Anytime</option>
        <option value="1">Last 1 Month</option>
        <option value="6">Last 6 Months</option>
        <option value="12">Last 1 Year</option>
        <option value="24">Last 2 Years</option>
        <option value="60">Last 5 Years</option>
      </select>

      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        Search Comps
      </button>
    </form>
  );
};

export default PropertyForm;
