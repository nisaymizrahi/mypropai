import React from "react";

const CompTable = ({ comps }) => {
  if (!comps.length) return null;

  const formatNumber = (num) =>
    num && num > 0 ? num.toLocaleString() : "N/A";

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString() : "N/A";

  return (
    <div className="bg-white rounded shadow p-4 overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Comparable Properties</h2>
      <table className="min-w-full table-auto text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="text-left px-4 py-2">Address</th>
            <th className="text-left px-4 py-2">Beds</th>
            <th className="text-left px-4 py-2">Baths</th>
            <th className="text-left px-4 py-2">Sqft</th>
            <th className="text-left px-4 py-2">Price</th>
            <th className="text-left px-4 py-2">Sale Date</th>
          </tr>
        </thead>
        <tbody>
          {comps.map((comp, index) => (
            <tr
              key={comp.id}
              className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="px-4 py-2">{comp.address || "N/A"}</td>
              <td className="px-4 py-2">{formatNumber(comp.beds)}</td>
              <td className="px-4 py-2">{formatNumber(comp.baths)}</td>
              <td className="px-4 py-2">{formatNumber(comp.sqft)}</td>
              <td className="px-4 py-2">
                ${formatNumber(comp.price)}
              </td>
              <td className="px-4 py-2">{formatDate(comp.saleDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CompTable;
