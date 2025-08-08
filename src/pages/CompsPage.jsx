// client/src/pages/CompsPage.jsx
import React, { useState } from "react";
import MapView from "../components/MapView";
import PropertyForm from "../components/PropertyForm";
import CompTable from "../components/CompTable";
import ROICalculator from "../components/ROICalculator";
import ReportDownloader from "../components/ReportDownloader";
import { geocodeAddress, fetchComps } from "../utils/api";

const CompsPage = () => {
  const [coords, setCoords] = useState({ lat: 40.7484, lng: -73.9857 }); // default: Manhattan
  const [comps, setComps] = useState([]);
  const [subject, setSubject] = useState(null);
  const [subjectMarker, setSubjectMarker] = useState(null);
  const [roiData, setRoiData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (form) => {
    setLoading(true);
    try {
      // 1) Geocode
      const geo = await geocodeAddress(form.address);
      if (!geo.features?.length) {
        throw new Error("No geocoding results");
      }
      const [lng, lat] = geo.features[0].center;
      setCoords({ lat, lng });

      // 2) Fetch comps from server
      const results = await fetchComps({ lat, lng, radius: form.radius || 1 });

      // 3) (Optional) apply client-side filtering for min/max ranges
      const filtered = results.filter((c) => {
        const okBeds =
          (!form.minBeds || (c.beds ?? 0) >= form.minBeds) &&
          (!form.maxBeds || (c.beds ?? 0) <= form.maxBeds);
        const okBaths =
          (!form.minBaths || (c.baths ?? 0) >= form.minBaths) &&
          (!form.maxBaths || (c.baths ?? 0) <= form.maxBaths);
        const okSqft =
          (!form.minSqft || (c.sqft ?? 0) >= form.minSqft) &&
          (!form.maxSqft || (c.sqft ?? 0) <= form.maxSqft);
        return okBeds && okBaths && okSqft;
      });

      setComps(filtered);

      // 4) Basic "subject" autofill from the first comp if available
      const first = filtered[0] || {};
      setSubject({
        address: form.address,
        lat,
        lng,
        beds: first.beds,
        baths: first.baths,
        sqft: first.sqft,
        price: first.price,
        saleDate: first.saleDate,
      });

      setSubjectMarker({ id: "subject", lat, lng, color: "#0077ff" });
    } catch (err) {
      alert("Search failed. Check the address or your API keys.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-purple-700 mb-6 text-center">
          MyPropAI — Sales Comps Tool (MVP)
        </h1>

        <div className="mb-6">
          <PropertyForm onSubmit={handleSearch} loading={loading} />
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <MapView
            latitude={coords.lat}
            longitude={coords.lng}
            markers={subjectMarker ? [subjectMarker, ...comps] : comps}
            zoom={14}
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
