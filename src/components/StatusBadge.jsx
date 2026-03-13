import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "../utils/api";

const statusStyles = {
  "Not Started": "border border-ink-200 bg-white text-ink-700",
  "In Progress": "border border-sand-200 bg-sand-50 text-sand-700",
  Completed: "border border-verdigris-200 bg-verdigris-50 text-verdigris-700",
  Sold: "border border-clay-200 bg-clay-50 text-clay-700",
  Archived: "border border-ink-100 bg-ink-50 text-ink-500",
};

const statusOptions = ["Not Started", "In Progress", "Completed", "Sold", "Archived"];

const StatusBadge = ({ investment, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(investment?.status || "Not Started");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedStatus(investment?.status || "Not Started");
  }, [investment?.status]);

  const handleChange = async (event) => {
    const nextStatus = event.target.value;
    const previousStatus = selectedStatus;
    setSelectedStatus(nextStatus);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/investments/${investment._id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || payload.error || "Failed to update status");
      }

      toast.success("Project status updated");
      onUpdate?.();
    } catch (err) {
      setSelectedStatus(previousStatus);
      toast.error(err.message || "Failed to update status");
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
        className="auth-input min-w-[170px] py-2.5 text-sm"
        disabled={loading}
      >
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      disabled={loading}
      className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${statusStyles[selectedStatus] || statusStyles["Not Started"]}`}
      title="Click to change status"
    >
      {loading ? "Updating..." : selectedStatus}
    </button>
  );
};

export default StatusBadge;
