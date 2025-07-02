import React from "react";
import { Link } from "react-router-dom";

const dummyInvestments = [
  {
    _id: "1",
    address: "123 Main St, Philadelphia, PA",
    type: "Fix & Flip",
    purchasePrice: 150000,
    lotSize: 2000,
  },
  {
    _id: "2",
    address: "456 Elm St, Philadelphia, PA",
    type: "Fix & Rent",
    purchasePrice: 180000,
    lotSize: 2200,
  },
];

function MyInvestments() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Investments</h1>
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">Address</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Purchase Price</th>
              <th className="text-left px-4 py-2">Lot Size</th>
              <th className="text-left px-4 py-2">View</th>
            </tr>
          </thead>
          <tbody>
            {dummyInvestments.map((inv, idx) => (
              <tr
                key={inv._id}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-4 py-2">{inv.address}</td>
                <td className="px-4 py-2">{inv.type}</td>
                <td className="px-4 py-2">${inv.purchasePrice.toLocaleString()}</td>
                <td className="px-4 py-2">{inv.lotSize} sqft</td>
                <td className="px-4 py-2">
                  <Link
                    to={`/investments/${inv._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyInvestments;
