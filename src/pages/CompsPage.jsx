// src/pages/CompsPage.jsx
import React, { useState } from "react";
import MapView from "../components/MapView";
import PropertyForm from "../components/PropertyForm";
import CompTable from "../components/CompTable";
import ROICalculator from "../components/ROICalculator";
import ReportDownloader from "../components/ReportDownloader";
import fetchAttomComps from "../utils/fetchAttomComps";

const CompsPage = () => {
  const [coords, setCoords] = useState({ lat: 40.7484, lng: -73.9857 });
  const [comps, setComps] = useState([]);
  const [subject, setSubject] = useState(null);
  const [subjectMarker, setSubjectMarker] = useState(null);
  const [roiData, setRoiData] = useState(null);

  const handleSearch = async (formData) => {
    const encodedAddress = encodeURIComponent(formData.address);
    const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;

    try {
      // 1) Geocode with Mapbox
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}`
      );
      const json = await res.json();

      if (!json.features || json.features.length === 0) {
        throw new Error("No results from Mapbox");
      }

      const [lng, lat] = json.features[0].center;
      setCoords({ lat, lng });

      // 2) Get comps from protected backend
      const results = await fetchAttomComps(lat, lng, formData);
      setComps(results || []);

      // 3) Seed subject details from first comp if your form doesn't include them
      const firstComp = (results && results[0]) || {};
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

      setSubjectMarker({ id: "subject", lat, lng, color: "#0077ff" });
    } catch (err) {
      alert("Address not found or comp fetch failed.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-purple-700 mb-6 text-center">
          Fliprop: Real Estate Comp Tool
        </h1>

        <div className="mb-6">
          <PropertyForm onSubmit={handleSearch} />
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <MapView
            latitude={coords.lat}
            longitude={coords.lng}
            markers={subjectMarker ? [subjectMarker, ...comps] : comps}
            zoom={15}
          />
        </div>

        <div className="mb-6">
          <CompTable comps={comps} subject={subject} />
        </div>

        <div className="mb-6">
          <ROICalculator onCalculate={setRoiData} />
        </div>

        <div className="mb-12">
          <ReportDownloader comps={comps} roiData={roiData} />
        </div>
      </div>
    </div>
  );
};

export default CompsPage;
