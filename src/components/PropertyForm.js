// client/src/components/PropertyForm.js
import React, { useState } from "react";

const PropertyForm = ({ onSubmit, loading }) => {
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState(1);
  const [minBeds, setMinBeds] = useState("");
  const [maxBeds, setMaxBeds] = useState("");
  const [minBaths, setMinBaths] = useState("");
  const [maxBaths, setMaxBaths] = useState("");
  const [minSqft, setMinSqft] = useState("");
  const [maxSqft, setMaxSqft] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      address: address.trim(),
      radius: Number(radius) || 1,
      minBeds: minBeds ? Number(minBeds) : undefined,
      maxBeds: maxBeds ? Number(maxBeds) : undefined,
      minBaths: minBaths ? Number(minBaths) : undefined,
      maxBaths: maxBaths ? Number(maxBaths) : undefined,
      minSqft: minSqft ? Number(minSqft) : undefined,
      maxSqft: maxSqft ? Number(maxSqft) : undefined,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-lg shadow p-4 grid gap-4 md:grid-cols-12"
    >
      <div className="md:col-span-5">
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          type="text"
          placeholder="123 Main St, City, ST"
          className="w-full border rounded px-3 py-2"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          (Autocomplete coming in M2 – using Mapbox Geocoder UI)
        </p>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium mb-1">Radius (mi)</label>
        <input
          type="number"
          min="0.25"
          step="0.25"
          className="w-full border rounded px-3 py-2"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
        />
      </div>

      <div className="md:col-span-5 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Min Beds</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Beds</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={maxBeds}
            onChange={(e) => setMaxBeds(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Min Baths</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={minBaths}
            onChange={(e) => setMinBaths(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Baths</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={maxBaths}
            onChange={(e) => setMaxBaths(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Min Sqft</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={minSqft}
            onChange={(e) => setMinSqft(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max Sqft</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={maxSqft}
            onChange={(e) => setMaxSqft(e.target.value)}
          />
        </div>
      </div>

      <div className="md:col-span-12 text-right">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search Comps"}
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;
