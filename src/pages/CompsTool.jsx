import React, { useState } from "react";
import MapView from "../components/MapView";
import PropertyForm from "../components/PropertyForm";
import CompTable from "../components/CompTable";
import ROICalculator from "../components/ROICalculator";
import ReportDownloader from "../components/ReportDownloader";
import fetchComps from "../utils/fetchAttomComps"; // FIXED: Importing from the new, correct file.

const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
    </div>
);

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
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (formData) => {
    setIsLoading(true);
    setError(null);
    setComps([]);
    setSubject(null);
    setSubjectMarker(null);
    
    try {
      const encodedAddress = encodeURIComponent(formData.address);
      const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;

      const geocodeRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}`
      );
      const geocodeJson = await geocodeRes.json();
      if (!geocodeJson.features?.length) {
        throw new Error("Address not found by Mapbox. Please try a more specific address.");
      }

      const [lng, lat] = geocodeJson.features[0].center;
      setCoords({ lat, lng });

      const fetchedComps = await fetchComps({ ...formData, lat, lng });
      setComps(fetchedComps);

      const firstComp = fetchedComps.length > 0 ? fetchedComps[0] : {};
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
      setSubjectMarker({ id: "subject", lat, lng, color: "#00BFFF" });

      if (fetchedComps.length === 0) {
        setError("Address found, but no comparable sales were returned from Attom for that area.");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-brand-dark-100">Comps Tool</h1>
        <p className="text-lg text-brand-dark-400 mt-1">
            Find and analyze comparable property sales using Attom Data.
        </p>
      </div>

      <div className="bg-brand-slate-100 rounded-lg p-6 border border-brand-dark-800">
        <PropertyForm onSubmit={handleSearch} isLoading={isLoading} />
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!isLoading && subject && (
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
