import React, { useState } from "react";

// --- NEW: Reusable styled input component for consistency ---
const FormInput = ({ ...props }) => (
    <input 
        className="w-full bg-brand-slate-200 border border-brand-dark-700 rounded-md p-2 text-brand-dark-100 placeholder-brand-dark-500 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition"
        {...props} 
    />
);

const FormSelect = ({ children, ...props }) => (
    <select 
        className="w-full bg-brand-slate-200 border border-brand-dark-700 rounded-md p-2 text-brand-dark-100 placeholder-brand-dark-500 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition appearance-none"
        {...props}
    >
        {children}
    </select>
);


const PropertyForm = ({ onSubmit, isLoading }) => {
  const [address, setAddress] = useState("123 Main St, Anytown, USA");
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
  const [soldInLastMonths, setSoldInLastMonths] = useState("12");

  // --- NEW: State to toggle advanced filters ---
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address.trim() || isLoading) return;
    onSubmit({
      address,
      distance: parseFloat(distance),
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* --- Main Search Bar --- */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-grow">
          <label htmlFor="address" className="block text-sm font-medium text-brand-dark-300 mb-1">Property Address</label>
          <FormInput
            id="address"
            type="text"
            placeholder="Enter a property address to find comps"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div className="flex-shrink-0">
          <label htmlFor="distance" className="block text-sm font-medium text-brand-dark-300 mb-1">Radius (mi)</label>
          <FormInput
            id="distance"
            type="number"
            step="0.1"
            min="0.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="w-full sm:w-28"
          />
        </div>
      </div>

      {/* --- Filter Toggle --- */}
      <div className="text-center">
        <button 
          type="button" 
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-brand-blue hover:underline"
        >
          {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
        </button>
      </div>

      {/* --- Collapsible Advanced Filters --- */}
      {showFilters && (
        <div className="space-y-4 pt-4 border-t border-brand-dark-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-brand-dark-300 mb-1">Property Type</label>
                    <FormSelect value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                        <option value="">All Types</option>
                        <option value="SFR">Single Family</option>
                        <option value="CONDO">Condo</option>
                        <option value="APT">Apartment</option>
                        <option value="MULTI">Multi-Family</option>
                    </FormSelect>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-dark-300 mb-1">Sold In</label>
                    <FormSelect value={soldInLastMonths} onChange={(e) => setSoldInLastMonths(e.target.value)}>
                        <option value="">Anytime</option>
                        <option value="1">Last 1 Month</option>
                        <option value="6">Last 6 Months</option>
                        <option value="12">Last 1 Year</option>
                        <option value="24">Last 2 Years</option>
                        <option value="60">Last 5 Years</option>
                    </FormSelect>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-brand-dark-300 mb-1">Beds</label>
                    <div className="flex gap-2">
                        <FormInput type="number" value={bedsMin} onChange={(e) => setBedsMin(e.target.value)} placeholder="Min" />
                        <FormInput type="number" value={bedsMax} onChange={(e) => setBedsMax(e.target.value)} placeholder="Max" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-dark-300 mb-1">Baths</label>
                    <div className="flex gap-2">
                        <FormInput type="number" value={bathsMin} onChange={(e) => setBathsMin(e.target.value)} placeholder="Min" />
                        <FormInput type="number" value={bathsMax} onChange={(e) => setBathsMax(e.target.value)} placeholder="Max" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-dark-300 mb-1">Sqft</label>
                    <div className="flex gap-2">
                        <FormInput type="number" value={sqftMin} onChange={(e) => setSqftMin(e.target.value)} placeholder="Min" />
                        <FormInput type="number" value={sqftMax} onChange={(e) => setSqftMax(e.target.value)} placeholder="Max" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-dark-300 mb-1">Price</label>
                    <div className="flex gap-2">
                        <FormInput type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Min" />
                        <FormInput type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Max" />
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- Submit Button --- */}
      <div className="pt-4">
        <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-brand-blue text-white font-semibold p-3 rounded-lg hover:bg-sky-500 disabled:bg-brand-dark-600 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? 'Searching...' : 'Search Comps'}
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;
