import React from "react";

// --- NEW: Reusable Stat Card Component ---
const StatCard = ({ title, value, className = "" }) => (
    <div className={`bg-brand-slate-200 p-3 rounded-lg ${className}`}>
        <p className="text-sm text-brand-dark-400">{title}</p>
        <p className="text-lg font-semibold text-brand-dark-100">{value}</p>
    </div>
);

// --- NEW: Reusable Table Component for Comps ---
const CompsDataTable = ({ title, comps }) => (
    <div>
        <h3 className="text-xl font-semibold text-brand-dark-100 mb-3">{title}</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="border-b border-brand-dark-700">
                    <tr>
                        <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Address</th>
                        <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Beds</th>
                        <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Baths</th>
                        <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Sqft</th>
                        <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Price</th>
                        <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Sale Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-brand-dark-300">Dist.</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-dark-800">
                    {comps.map((comp) => (
                        <tr key={comp.id} className="hover:bg-brand-slate-200/50 transition-colors">
                            <td className="px-4 py-3 text-brand-dark-200">{comp.address}</td>
                            <td className="px-4 py-3 text-brand-dark-200">{comp.beds || "—"}</td>
                            <td className="px-4 py-3 text-brand-dark-200">{comp.baths || "—"}</td>
                            <td className="px-4 py-3 text-brand-dark-200">{comp.sqft ? comp.sqft.toLocaleString() : "—"}</td>
                            <td className="px-4 py-3 font-semibold text-white">{comp.price > 0 ? `$${comp.price.toLocaleString()}` : "—"}</td>
                            <td className="px-4 py-3 text-brand-dark-200">{comp.saleDate ? new Date(comp.saleDate).toLocaleDateString() : "—"}</td>
                            <td className="px-4 py-3 text-brand-dark-200">{comp.distance?.toFixed(2)} mi</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const CompTable = ({ comps, subject }) => {
  if (!comps || !comps.length) return null;

  // --- NEW: Improved logic for filtering and calculations ---
  const soldComps = comps.filter((c) => c.price > 0 && c.saleDate);
  const unknownComps = comps.filter((c) => !(c.price > 0 && c.saleDate));
  const validComps = soldComps.filter(c => c.price > 0 && c.sqft > 0);

  // --- NEW: Gracefully handle cases with no valid comps to prevent division by zero ---
  const avgPrice = validComps.length > 0 ? Math.round(validComps.reduce((sum, c) => sum + c.price, 0) / validComps.length) : 0;
  const avgPPSF = validComps.length > 0 ? Math.round(validComps.reduce((sum, c) => sum + (c.price / c.sqft), 0) / validComps.length) : 0;
  const avgBeds = validComps.length > 0 ? (soldComps.reduce((sum, c) => sum + (c.beds || 0), 0) / soldComps.length).toFixed(1) : 0;
  const avgBaths = validComps.length > 0 ? (soldComps.reduce((sum, c) => sum + (c.baths || 0), 0) / soldComps.length).toFixed(1) : 0;
  const avgSqft = validComps.length > 0 ? Math.round(soldComps.reduce((sum, c) => sum + (c.sqft || 0), 0) / soldComps.length) : 0;
  const avgDist = validComps.length > 0 ? (soldComps.reduce((sum, c) => sum + (c.distance || 0), 0) / soldComps.length).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      {/* --- NEW: Redesigned Subject Property Card --- */}
      {subject && (
        <div>
            <h3 className="text-xl font-semibold text-brand-dark-100 mb-3">Subject Property</h3>
            <div className="bg-brand-slate-200 p-4 rounded-lg border border-brand-blue/50">
                <p className="font-bold text-lg text-white">{subject.address}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <p><strong>Beds:</strong> {subject.beds || "—"}</p>
                    <p><strong>Baths:</strong> {subject.baths || "—"}</p>
                    <p><strong>Sqft:</strong> {subject.sqft?.toLocaleString() || "—"}</p>
                    <p><strong>Price:</strong> {subject.price ? `$${subject.price.toLocaleString()}` : "—"}</p>
                </div>
            </div>
        </div>
      )}

      {/* --- NEW: Redesigned Averages Section using Stat Cards --- */}
      <div>
        <h3 className="text-xl font-semibold text-brand-dark-100 mb-3">Comps Averages</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Avg Sale Price" value={avgPrice > 0 ? `$${avgPrice.toLocaleString()}`: 'N/A'} />
          <StatCard title="Avg Price/Sqft" value={avgPPSF > 0 ? `$${avgPPSF}` : 'N/A'} />
          <StatCard title="Avg Beds" value={avgBeds > 0 ? avgBeds : 'N/A'} />
          <StatCard title="Avg Baths" value={avgBaths > 0 ? avgBaths : 'N/A'} />
          <StatCard title="Avg Sqft" value={avgSqft > 0 ? avgSqft.toLocaleString() : 'N/A'} />
          <StatCard title="Avg Distance" value={avgDist > 0 ? `${avgDist} mi` : 'N/A'} />
        </div>
      </div>

      {/* --- NEW: Redesigned Comps Tables --- */}
      {soldComps.length > 0 && (
        <CompsDataTable title="Sales Comparables" comps={soldComps} />
      )}


      {unknownComps.length > 0 && (
        <CompsDataTable title="Unknown Status Properties" comps={unknownComps} />
      )}
    </div>
  );
};

export default CompTable;
