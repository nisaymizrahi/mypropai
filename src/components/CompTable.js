// client/src/components/CompTable.js
import React from "react";

const StatCard = ({ title, value, className = "" }) => (
  <div className={`bg-brand-slate-200 p-3 rounded-lg ${className}`}>
    <p className="text-sm text-brand-dark-400">{title}</p>
    <p className="text-lg font-semibold text-brand-dark-100">{value}</p>
  </div>
);

const CompsDataTable = ({ title, comps }) => (
  <div>
    <h3 className="text-xl font-semibold text-brand-dark-100 mb-3">{title}</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-brand-dark-700">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Address</th>
            <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Status</th>
            <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Beds</th>
            <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Baths</th>
            <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Sqft</th>
            <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Price</th>
            <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Market Date</th>
            <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Dist.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-dark-800">
          {comps.map((comp) => (
            <tr key={comp.id} className="hover:bg-brand-slate-200/50 transition-colors">
              <td className="px-4 py-3 text-brand-dark-200">{comp.address}</td>
              <td className="px-4 py-3 text-brand-dark-200">{comp.status || "—"}</td>
              <td className="px-4 py-3 text-brand-dark-200">{comp.beds ?? "—"}</td>
              <td className="px-4 py-3 text-brand-dark-200">{comp.baths ?? "—"}</td>
              <td className="px-4 py-3 text-brand-dark-200">
                {comp.sqft ? comp.sqft.toLocaleString() : "—"}
              </td>
              <td className="px-4 py-3 font-semibold text-white">
                {comp.price > 0 ? `$${comp.price.toLocaleString()}` : "—"}
              </td>
              <td className="px-4 py-3 text-brand-dark-200">
                {comp.saleDate ? new Date(comp.saleDate).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-3 text-brand-dark-200">
                {typeof comp.distance === "number" ? comp.distance.toFixed(2) : "—"} mi
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const CompTable = ({ comps, subject }) => {
  if (!comps || !comps.length) return null;

  const pricedComps = comps.filter((c) => c.price > 0);
  const validComps = pricedComps.filter((c) => c.price > 0 && c.sqft > 0);
  const withBeds = comps.filter((c) => typeof c.beds === "number");
  const withBaths = comps.filter((c) => typeof c.baths === "number");
  const withSqft = comps.filter((c) => typeof c.sqft === "number");
  const withDistance = comps.filter((c) => typeof c.distance === "number");

  const avgPrice =
    pricedComps.length > 0
      ? Math.round(pricedComps.reduce((sum, c) => sum + c.price, 0) / pricedComps.length)
      : 0;

  const avgPPSF =
    validComps.length > 0
      ? Math.round(validComps.reduce((sum, c) => sum + c.price / c.sqft, 0) / validComps.length)
      : 0;

  const avgBeds =
    withBeds.length > 0
      ? (withBeds.reduce((sum, c) => sum + (c.beds || 0), 0) / withBeds.length).toFixed(1)
      : 0;

  const avgBaths =
    withBaths.length > 0
      ? (withBaths.reduce((sum, c) => sum + (c.baths || 0), 0) / withBaths.length).toFixed(1)
      : 0;

  const avgSqft =
    withSqft.length > 0
      ? Math.round(withSqft.reduce((sum, c) => sum + (c.sqft || 0), 0) / withSqft.length)
      : 0;

  const avgDist =
    withDistance.length > 0
      ? (withDistance.reduce((sum, c) => sum + (c.distance || 0), 0) / withDistance.length).toFixed(2)
      : 0;

  return (
    <div className="space-y-6">
      {subject && (
        <div>
          <h3 className="text-xl font-semibold text-brand-dark-100 mb-3">Subject Property</h3>
          <div className="bg-brand-slate-200 p-4 rounded-lg border border-brand-blue/50">
            <p className="font-bold text-lg text-white">{subject.address}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
              <p>
                <strong>Beds:</strong> {subject.beds ?? "—"}
              </p>
              <p>
                <strong>Baths:</strong> {subject.baths ?? "—"}
              </p>
              <p>
                <strong>Sqft:</strong> {subject.sqft?.toLocaleString() ?? "—"}
              </p>
              <p>
                <strong>Price:</strong>{" "}
                {subject.price ? `$${subject.price.toLocaleString()}` : "—"}
              </p>
              <p>
                <strong>Status:</strong> {subject.status || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold text-brand-dark-100 mb-3">Comps Snapshot</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Comparable Count" value={comps.length.toLocaleString()} />
          <StatCard title="Avg Comp Price" value={avgPrice > 0 ? `$${avgPrice.toLocaleString()}` : "N/A"} />
          <StatCard title="Avg Price/Sqft" value={avgPPSF > 0 ? `$${avgPPSF}` : "N/A"} />
          <StatCard title="Avg Beds" value={withBeds.length > 0 ? avgBeds : "N/A"} />
          <StatCard title="Avg Baths" value={withBaths.length > 0 ? avgBaths : "N/A"} />
          <StatCard title="Avg Sqft" value={withSqft.length > 0 ? avgSqft.toLocaleString() : "N/A"} />
          <StatCard title="Avg Distance" value={withDistance.length > 0 ? `${avgDist} mi` : "N/A"} className="col-span-2 md:col-span-1" />
        </div>
      </div>

      <CompsDataTable title="Comparable Properties" comps={comps} />
    </div>
  );
};

export default CompTable;
