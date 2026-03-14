import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { deleteVendor, getVendors } from "../utils/api";
import VendorDocumentsPanel from "../components/VendorDocumentsPanel";
import VendorFormModal from "../components/VendorFormModal";
import {
  formatVendorDate,
  getVendorComplianceClasses,
  getVendorComplianceLabel,
  getVendorComplianceState,
  getVendorSpecialties,
  getVendorStatusClasses,
  getVendorStatusLabel,
  vendorMatchesSearch,
} from "../utils/vendors";

const filterTabs = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "preferred", label: "Preferred" },
  { id: "needs_compliance", label: "Needs compliance" },
  { id: "inactive", label: "Inactive" },
];

const detailTabs = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
];

const MetricTile = ({ label, value, hint }) => (
  <div className="metric-tile p-5">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const matchesFilter = (vendor, filterId) => {
  const complianceState = getVendorComplianceState(vendor);

  switch (filterId) {
    case "active":
      return vendor.status !== "inactive";
    case "preferred":
      return vendor.status === "preferred";
    case "needs_compliance":
      return complianceState === "missing" || complianceState === "expired" || complianceState === "expiring";
    case "inactive":
      return vendor.status === "inactive";
    case "all":
    default:
      return true;
  }
};

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [detailTab, setDetailTab] = useState("overview");
  const [searchValue, setSearchValue] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [editingVendor, setEditingVendor] = useState(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const vendorData = await getVendors();
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load vendors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = useMemo(
    () =>
      vendors
        .filter((vendor) => matchesFilter(vendor, activeFilter))
        .filter((vendor) => vendorMatchesSearch(vendor, searchValue))
        .sort((left, right) => String(left.name || "").localeCompare(String(right.name || ""))),
    [activeFilter, searchValue, vendors]
  );

  useEffect(() => {
    if (filteredVendors.length === 0) {
      setSelectedVendorId("");
      return;
    }

    if (!filteredVendors.some((vendor) => vendor._id === selectedVendorId)) {
      setSelectedVendorId(filteredVendors[0]._id);
    }
  }, [filteredVendors, selectedVendorId]);

  const selectedVendor =
    vendors.find((vendor) => vendor._id === selectedVendorId) ||
    filteredVendors[0] ||
    null;

  const specialtyCoverage = useMemo(
    () => new Set(vendors.flatMap((vendor) => getVendorSpecialties(vendor))).size,
    [vendors]
  );

  const complianceCount = useMemo(
    () =>
      vendors.filter((vendor) => {
        const state = getVendorComplianceState(vendor);
        return state === "missing" || state === "expired" || state === "expiring";
      }).length,
    [vendors]
  );

  const tabCounts = useMemo(
    () =>
      filterTabs.reduce((accumulator, tab) => {
        accumulator[tab.id] = vendors.filter((vendor) => matchesFilter(vendor, tab.id)).length;
        return accumulator;
      }, {}),
    [vendors]
  );

  const handleVendorSaved = (savedVendor) => {
    setVendors((current) => {
      const exists = current.some((vendor) => vendor._id === savedVendor._id);
      const next = exists
        ? current.map((vendor) => (vendor._id === savedVendor._id ? savedVendor : vendor))
        : [savedVendor, ...current];
      return next;
    });
    setSelectedVendorId(savedVendor._id);
    setIsVendorModalOpen(false);
    setEditingVendor(null);
  };

  const handleVendorUpdated = (updatedVendor) => {
    setVendors((current) =>
      current.map((vendor) => (vendor._id === updatedVendor._id ? updatedVendor : vendor))
    );
    setSelectedVendorId(updatedVendor._id);
  };

  const handleDeleteVendor = async (vendorId) => {
    const confirmed = window.confirm(
      "Delete this vendor? Historical project references and expense records will keep their prior data."
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteVendor(vendorId);
      setVendors((current) => current.filter((vendor) => vendor._id !== vendorId));
      toast.success("Vendor removed.");
    } catch (deleteError) {
      toast.error(deleteError.message || "Failed to delete vendor.");
    }
  };

  return (
    <>
      <VendorFormModal
        isOpen={isVendorModalOpen}
        onClose={() => {
          setIsVendorModalOpen(false);
          setEditingVendor(null);
        }}
        onSaved={handleVendorSaved}
        vendor={editingVendor}
      />

      <div className="space-y-6">
        <section className="surface-panel-strong px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <span className="eyebrow">Vendor directory</span>
              <h1 className="mt-4 text-[2.5rem] font-medium tracking-tight text-ink-900">
                Keep vendors ready to assign
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
                Track specialties, contacts, service coverage, compliance documents, and assignment
                readiness from one vendor hub.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingVendor(null);
                setIsVendorModalOpen(true);
              }}
              className="primary-action"
            >
              Add vendor
            </button>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Total vendors" value={vendors.length} />
            <MetricTile
              label="Preferred"
              value={vendors.filter((vendor) => vendor.status === "preferred").length}
            />
            <MetricTile label="Needs compliance" value={complianceCount} />
            <MetricTile label="Specialties covered" value={specialtyCoverage} />
          </div>
        </section>

        <section className="section-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeFilter === tab.id
                      ? "bg-ink-900 text-white"
                      : "border border-ink-100 bg-white text-ink-600 hover:bg-ink-50"
                  }`}
                >
                  {tab.label} ({tabCounts[tab.id] || 0})
                </button>
              ))}
            </div>

            <div className="w-full xl:max-w-sm">
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search vendor, specialty, contact, service area"
                className="auth-input"
              />
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[16px] border border-clay-200 bg-clay-50 px-5 py-4 text-sm text-clay-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="section-card px-6 py-12 text-center text-sm text-ink-500">
            Loading vendors...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="section-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Vendor list
                  </p>
                  <p className="mt-1 text-sm text-ink-500">
                    {filteredVendors.length} matching vendor{filteredVendors.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {filteredVendors.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {filteredVendors.map((vendor) => {
                    const specialties = getVendorSpecialties(vendor);
                    const selected = vendor._id === selectedVendor?._id;

                    return (
                      <button
                        key={vendor._id}
                        type="button"
                        onClick={() => {
                          setSelectedVendorId(vendor._id);
                          setDetailTab("overview");
                        }}
                        className={`w-full rounded-[20px] border px-4 py-4 text-left transition ${
                          selected
                            ? "border-ink-900 bg-ink-50"
                            : "border-ink-100 bg-white hover:border-ink-200"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-ink-900">{vendor.name}</p>
                            <p className="mt-1 text-sm text-ink-500">
                              {specialties.join(" • ") || vendor.trade || "Specialty not set"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorStatusClasses(vendor.status)}`}
                          >
                            {getVendorStatusLabel(vendor.status)}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorComplianceClasses(vendor)}`}
                          >
                            {getVendorComplianceLabel(vendor)}
                          </span>
                          {vendor.afterHoursAvailable ? (
                            <span className="rounded-full border border-ink-100 bg-white px-3 py-1 text-[11px] font-semibold text-ink-600">
                              After-hours
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-4 text-sm text-ink-500">
                          {vendor.contactInfo?.contactName || vendor.contactInfo?.email || vendor.contactInfo?.phone || "Contact details pending"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-[20px] border border-dashed border-ink-200 bg-ink-50/40 px-5 py-10 text-center">
                  <p className="text-lg font-medium text-ink-900">No vendors match this view.</p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    Try a different filter, or add your first vendor.
                  </p>
                </div>
              )}
            </section>

            <section className="space-y-4">
              {selectedVendor ? (
                <>
                  <div className="section-card px-6 py-6 sm:px-7">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorStatusClasses(selectedVendor.status)}`}
                          >
                            {getVendorStatusLabel(selectedVendor.status)}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorComplianceClasses(selectedVendor)}`}
                          >
                            {getVendorComplianceLabel(selectedVendor)}
                          </span>
                        </div>
                        <h2 className="mt-4 text-[2rem] font-medium tracking-tight text-ink-900">
                          {selectedVendor.name}
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
                          {selectedVendor.description || "No vendor description added yet."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {getVendorSpecialties(selectedVendor).map((specialty) => (
                            <span
                              key={specialty}
                              className="rounded-full border border-ink-100 bg-white px-3 py-1 text-sm font-medium text-ink-600"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVendor(selectedVendor);
                            setIsVendorModalOpen(true);
                          }}
                          className="secondary-action"
                        >
                          Edit vendor
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(selectedVendor._id)}
                          className="ghost-action text-clay-700"
                        >
                          Delete vendor
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <MetricTile
                        label="Primary contact"
                        value={selectedVendor.contactInfo?.contactName || "Not set"}
                        hint={selectedVendor.contactInfo?.email || "No email"}
                      />
                      <MetricTile
                        label="Phone"
                        value={selectedVendor.contactInfo?.phone || "Not set"}
                        hint={selectedVendor.afterHoursAvailable ? "After-hours available" : "Standard hours"}
                      />
                      <MetricTile
                        label="Service area"
                        value={selectedVendor.serviceArea || "Not set"}
                        hint={selectedVendor.contactInfo?.address || "No address"}
                      />
                      <MetricTile
                        label="Documents"
                        value={(selectedVendor.documents || []).length}
                        hint={`Updated ${formatVendorDate(selectedVendor.updatedAt, "recently")}`}
                      />
                    </div>
                  </div>

                  <div className="section-card flex flex-wrap items-center gap-2 p-1.5">
                    {detailTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setDetailTab(tab.id)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          detailTab === tab.id
                            ? "bg-ink-900 text-white"
                            : "border border-ink-100 bg-white text-ink-600 hover:bg-ink-50"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {detailTab === "overview" ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="section-card p-6">
                        <span className="eyebrow">Contact</span>
                        <div className="mt-5 space-y-4 text-sm">
                          <div>
                            <p className="font-semibold text-ink-900">Contact name</p>
                            <p className="mt-1 text-ink-500">
                              {selectedVendor.contactInfo?.contactName || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">Email</p>
                            <p className="mt-1 text-ink-500">
                              {selectedVendor.contactInfo?.email || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">Phone</p>
                            <p className="mt-1 text-ink-500">
                              {selectedVendor.contactInfo?.phone || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">Address</p>
                            <p className="mt-1 text-ink-500">
                              {selectedVendor.contactInfo?.address || "Not set"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="section-card p-6">
                        <span className="eyebrow">Assignment readiness</span>
                        <div className="mt-5 space-y-4 text-sm">
                          <div>
                            <p className="font-semibold text-ink-900">Compliance status</p>
                            <p className="mt-1 text-ink-500">{getVendorComplianceLabel(selectedVendor)}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">After-hours availability</p>
                            <p className="mt-1 text-ink-500">
                              {selectedVendor.afterHoursAvailable ? "Available" : "Not marked for after-hours work"}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">Service area</p>
                            <p className="mt-1 text-ink-500">
                              {selectedVendor.serviceArea || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900">Internal notes</p>
                            <p className="mt-1 text-ink-500">
                              {selectedVendor.notes || "No internal notes saved yet."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <VendorDocumentsPanel vendor={selectedVendor} onUpdated={handleVendorUpdated} />
                  )}
                </>
              ) : (
                <div className="section-card px-6 py-12 text-center">
                  <p className="text-lg font-medium text-ink-900">No vendor selected</p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    Add a vendor or pick one from the list to view details and documents.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
};

export default VendorsPage;
