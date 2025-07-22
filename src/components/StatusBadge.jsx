import React, { useState } from "react";
import { getAuthHeaders } from "../utils/api";

const statusColors = {
  "Not Started": "bg-gray-200 text-gray-800",
  "In Progress": "bg-yellow-200 text-yellow-900",
  "Completed": "bg-green-200 text-green-800",
  "Sold": "bg-blue-200 text-blue-800",
  "Archived": "bg-gray-100 text-gray-500",
};

const statusOptions = [
  "Not Started",
  "In Progress",
  "Completed",
  "Sold",
  "Archived",
];

const StatusBadge = ({ investment, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(investment.status || "Not Started");
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);
    setLoading(true);

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/investments/${investment._id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      onUpdate?.();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setEditing(false);
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <select
        value={selectedStatus}
        onChange={handleChange}
        className="border px-2 py-1 rounded-md text-sm"
      >
        {statusOptions.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      disabled={loading}
      className={`text-xs font-medium px-3 py-1 rounded-md inline-block cursor-pointer border ${statusColors[selectedStatus] || "bg-gray-200 text-gray-800"}`}
      title="Click to change status"
    >
      {selectedStatus}
    </button>
  );
};

export default StatusBadge;
