// client/src/components/ReportDownloader.js
import React from "react";

const toCsv = (comps = []) => {
  const header = ["Address", "Beds", "Baths", "Sqft", "Price", "SaleDate", "Lat", "Lng", "Distance(mi)"];
  const rows = comps.map((c) => [
    c.address || "",
    c.beds ?? "",
    c.baths ?? "",
    c.sqft ?? "",
    c.price ?? "",
    c.saleDate ? new Date(c.saleDate).toISOString().slice(0, 10) : "",
    c.lat ?? "",
    c.lng ?? "",
    typeof c.distance === "number" ? c.distance.toFixed(2) : "",
  ]);
  return [header, ...rows].map((r) => r.join(",")).join("\n");
};

const ReportDownloader = ({ comps = [], roiData }) => {
  const downloadCSV = () => {
    const csv = toCsv(comps);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mypropai-comps-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadROI = () => {
    const blob = new Blob([JSON.stringify(roiData || {}, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mypropai-roi-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={downloadCSV} className="px-4 py-2 rounded bg-green-600 text-white">
        Download Comps CSV
      </button>
      <button onClick={downloadROI} className="px-4 py-2 rounded bg-blue-600 text-white">
        Download ROI JSON
      </button>
    </div>
  );
};

export default ReportDownloader;
