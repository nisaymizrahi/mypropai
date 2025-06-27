import React, { useState } from "react";

const PropertyForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    address: "",
    bedsMin: "",
    bedsMax: "",
    bathsMin: "",
    bathsMax: "",
    sqftMin: "",
    sqftMax: "",
    distance: "1"
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow rounded p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
    >
      <input
        name="address"
        placeholder="Search Address"
        value={formData.address}
        onChange={handleChange}
        required
        className="col-span-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
      />

      <input
        name="bedsMin"
        placeholder="Min Beds"
        value={formData.bedsMin}
        onChange={handleChange}
        className="px-3 py-2 border border-gray-300 rounded"
      />
      <input
        name="bedsMax"
        placeholder="Max Beds"
        value={formData.bedsMax}
        onChange={handleChange}
        className="px-3 py-2 border border-gray-300 rounded"
      />

      <input
        name="bathsMin"
        placeholder="Min Baths"
        value={formData.bathsMin}
        onChange={handleChange}
        className="px-3 py-2 border border-gray-300 rounded"
      />
      <input
        name="bathsMax"
        placeholder="Max Baths"
        value={formData.bathsMax}
        onChange={handleChange}
        className="px-3 py-2 border border-gray-300 rounded"
      />

      <input
        name="sqftMin"
        placeholder="Min Sqft"
        value={formData.sqftMin}
        onChange={handleChange}
        className="px-3 py-2 border border-gray-300 rounded"
      />
      <input
        name="sqftMax"
        placeholder="Max Sqft"
        value={formData.sqftMax}
        onChange={handleChange}
        className="px-3 py-2 border border-gray-300 rounded"
      />

      <input
        name="distance"
        placeholder="Distance (miles)"
        value={formData.distance}
        onChange={handleChange}
        className="px-3 py-2 border border-gray-300 rounded"
      />

      <button
        type="submit"
        className="col-span-full px-4 py-2 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 transition"
      >
        Search Comps
      </button>
    </form>
  );
};

export default PropertyForm;
