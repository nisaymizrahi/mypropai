import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { deleteVendor } from "../utils/api";
import AddVendorModal from "./AddVendorModal";
import EditVendorModal from "./EditVendorModal";

const MetricTile = ({ label, value, hint }) => (
  <div className="metric-tile p-5">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const TeamTab = ({ vendors = [], onUpdate }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const activeCount = useMemo(
    () => vendors.filter((vendor) => vendor.isActive !== false).length,
    [vendors]
  );
  const tradeCount = useMemo(
    () => new Set(vendors.map((vendor) => vendor.trade).filter(Boolean)).size,
    [vendors]
  );

  const handleOpenEditModal = (vendor) => {
    setEditingVendor(vendor);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (vendorId) => {
    const confirmed = window.confirm(
      "Delete this vendor from the project directory? Historical expenses will stay linked in the ledger."
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteVendor(vendorId);
      toast.success("Vendor removed");
      onUpdate?.();
    } catch (error) {
      toast.error(error.message || "Failed to delete vendor");
    }
  };

  return (
    <>
      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={onUpdate}
      />
      <EditVendorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={onUpdate}
        vendor={editingVendor}
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricTile label="Total vendors" value={vendors.length} />
          <MetricTile label="Active vendors" value={activeCount} />
          <MetricTile label="Trades covered" value={tradeCount} hint="Distinct specialties across the roster." />
        </div>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Project directory</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Team and vendors</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Keep contractors, specialists, and core project contacts organized in one place.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="primary-action"
            >
              Add vendor
            </button>
          </div>

          {vendors.length === 0 ? (
            <div className="mt-8 rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
              No vendors have been added yet. Build the project roster before assigning tasks and
              logging trade-specific expenses.
            </div>
          ) : (
            <div className="mt-8 grid gap-4 xl:grid-cols-2">
              {vendors.map((vendor) => (
                <div key={vendor._id} className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-ink-900">{vendor.name}</p>
                      <p className="mt-1 text-sm font-medium text-ink-500">
                        {vendor.trade || "Trade not specified"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        vendor.isActive === false
                          ? "border border-clay-200 bg-clay-50 text-clay-700"
                          : "border border-verdigris-200 bg-verdigris-50 text-verdigris-700"
                      }`}
                    >
                      {vendor.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                        Email
                      </p>
                      <p className="mt-2 text-sm text-ink-700">
                        {vendor.contactInfo?.email || "No email added"}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                        Phone
                      </p>
                      <p className="mt-2 text-sm text-ink-700">
                        {vendor.contactInfo?.phone || "No phone added"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[18px] border border-ink-100 bg-ink-50/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Notes
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-600">
                      {vendor.notes || "No notes saved for this vendor yet."}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(vendor)}
                      className="secondary-action"
                    >
                      Edit details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(vendor._id)}
                      className="ghost-action text-clay-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default TeamTab;
