import React from "react";

const CompTable = ({ comps, subject }) => {
  if (!comps.length) return null;

  // Split comps into groups
  const soldComps = comps.filter((c) => c.price > 0 && c.saleDate);
  const unknownComps = comps.filter((c) => !(c.price > 0 && c.saleDate));

  const validComps = soldComps.filter(c => c.price > 0 && c.sqft > 0);
  const avgPrice = Math.round(validComps.reduce((sum, c) => sum + c.price, 0) / validComps.length);
  const avgPPSF = Math.round(validComps.reduce((sum, c) => sum + (c.price / c.sqft), 0) / validComps.length);
  const avgBeds = (soldComps.reduce((sum, c) => sum + (c.beds || 0), 0) / soldComps.length).toFixed(1);
  const avgBaths = (soldComps.reduce((sum, c) => sum + (c.baths || 0), 0) / soldComps.length).toFixed(1);
  const avgSqft = Math.round(soldComps.reduce((sum, c) => sum + (c.sqft || 0), 0) / soldComps.length);
  const avgDist = (soldComps.reduce((sum, c) => sum + (c.distance || 0), 0) / soldComps.length).toFixed(2);

  const renderTable = (compsToShow) => (
    <table className="min-w-full table-auto text-sm">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="text-left px-4 py-2">Address</th>
          <th className="text-left px-4 py-2">Beds</th>
          <th className="text-left px-4 py-2">Baths</th>
          <th className="text-left px-4 py-2">Sqft</th>
          <th className="text-left px-4 py-2">Price</th>
          <th className="text-left px-4 py-2">Sale Date</th>
          <th className="text-left px-4 py-2">Distance</th>
        </tr>
      </thead>
      <tbody>
        {compsToShow.map((comp, index) => (
          <tr
            key={comp.id}
            className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
          >
            <td className="px-4 py-2">{comp.address}</td>
            <td className="px-4 py-2">{comp.beds || "—"}</td>
            <td className="px-4 py-2">{comp.baths || "—"}</td>
            <td className="px-4 py-2">{comp.sqft ? comp.sqft.toLocaleString() : "—"}</td>
            <td className="px-4 py-2">{comp.price > 0 ? `$${comp.price.toLocaleString()}` : "—"}</td>
            <td className="px-4 py-2">{comp.saleDate ? new Date(comp.saleDate).toLocaleDateString() : "—"}</td>
            <td className="px-4 py-2">{comp.distance?.toFixed(2)} mi</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="bg-white rounded shadow p-4 overflow-x-auto space-y-6">
      {/* Subject Property */}
      {subject && (
        <div className="bg-blue-50 p-4 rounded shadow">
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Subject Property</h3>
          <p><strong>Address:</strong> {subject.address}</p>
          <p><strong>Beds:</strong> {subject.beds || "—"}, <strong>Baths:</strong> {subject.baths || "—"}</p>
          <p><strong>Sqft:</strong> {subject.sqft?.toLocaleString() || "—"}</p>
          <p><strong>Price:</strong> {subject.price ? `$${subject.price.toLocaleString()}` : "—"}</p>
          <p><strong>Sale Date:</strong> {subject.saleDate ? new Date(subject.saleDate).toLocaleDateString() : "—"}</p>
        </div>
      )}

      {/* Averages */}
      <div className="bg-green-50 p-4 rounded shadow">
        <h3 className="text-lg font-semibold text-green-700 mb-2">Comps Averages</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div><strong>Avg Sale Price:</strong> ${avgPrice.toLocaleString()}</div>
          <div><strong>Avg Price/Sqft:</strong> ${avgPPSF}</div>
          <div><strong>Avg Beds:</strong> {avgBeds}</div>
          <div><strong>Avg Baths:</strong> {avgBaths}</div>
          <div><strong>Avg Sqft:</strong> {avgSqft.toLocaleString()}</div>
          <div><strong>Avg Distance:</strong> {avgDist} mi</div>
        </div>
      </div>

      {/* Group 1: Sales Comparables */}
      {soldComps.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Sales Comparables</h2>
          {renderTable(soldComps)}
        </div>
      )}

      {/* Group 2: Unknown Status */}
      {unknownComps.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Unknown Status Properties</h2>
          {renderTable(unknownComps)}
        </div>
      )}
    </div>
  );
};

export default CompTable;
