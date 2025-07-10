import React, { useState } from "react";
import MapView from "../components/MapView";
import PropertyForm from "../components/PropertyForm";
import CompTable from "../components/CompTable";
import ROICalculator from "../components/ROICalculator";
import ReportDownloader from "../components/ReportDownloader";
import fetchRealtorComps from "../utils/fetchRealtorComps";

// --- NEW: Loading Spinner Component ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
    </div>
);

// --- NEW: Error Message Component ---
const ErrorMessage = ({ message }) => (
    <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">
        <p><strong>Error:</strong> {message}</p>
    </div>
)

const CompsTool = () => {
  const [coords, setCoords] = useState({ lat: 40.7484, lng: -73.9857 });
  const [comps, setComps] = useState([]);
  const [subject, setSubject] = useState(null);
  const [subjectMarker, setSubjectMarker] = useState(null);
  const [roiData, setRoiData] = useState(null);
  
  // --- NEW: State for loading and error handling ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (formData) => {
    setIsLoading(true); // Start loading
    setError(null); // Clear previous errors
    
    try {
      const encodedAddress = encodeURIComponent(formData.address);
      const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;

      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}`
      );
      const json = await res.json();
      if (!json.features?.length) {
        throw new Error("Address not found. Please try a more specific address.");
      }

      const [lng, lat] = json.features[0].center;
      setCoords({ lat, lng });

      const fetchedComps = await fetchRealtorComps(lat, lng, formData);
      setComps(fetchedComps);

      const firstComp = fetchedComps[0] || {};
      setSubject({
        address: formData.address,
        lat,
        lng,
        beds: firstComp.beds,
        baths: firstComp.baths,
        sqft: firstComp.sqft,
        price: firstComp.price,
        saleDate: firstComp.saleDate,
      });

      setSubjectMarker({ id: "subject", lat, lng, color: "#00BFFF" }); // Use brand-blue color
    } catch (err) {
      console.error(err);
      setError(err.message || "An unknown error occurred."); // Set error message for display
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    // NEW: Removed old layout classes
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-dark-100">Comps Tool</h1>
        <p className="text-lg text-brand-dark-400 mt-1">
            Find and analyze comparable property sales.
        </p>
      </div>

      {/* NEW: Component sections wrapped in styled cards */}
      <div className="bg-brand-slate-100 rounded-lg p-6 border border-brand-dark-800">
        <PropertyForm onSubmit={handleSearch} isLoading={isLoading} />
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {/* Only show results if a search has been performed and there are no errors */}
      {!isLoading && !error && (comps.length > 0 || subject) && (
        <>
          <div className="bg-brand-slate-100 rounded-lg p-4 border border-brand-dark-800">
            <MapView
              latitude={coords.lat}
              longitude={coords.lng}
              markers={subjectMarker ? [subjectMarker, ...comps] : comps}
              zoom={15}
            />
          </div>

          <div className="bg-brand-slate-100 rounded-lg p-6 border border-brand-dark-800">
            <CompTable comps={comps} subject={subject} />
          </div>

          <div className="bg-brand-slate-100 rounded-lg p-6 border border-brand-dark-800">
            <ROICalculator onCalculate={setRoiData} />
          </div>

          <div className="text-center pb-8">
            <ReportDownloader comps={comps} subject={subject} roiData={roiData} />
          </div>
        </>
      )}
    </div>
  );
};

export default CompsTool;
