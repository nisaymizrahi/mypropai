import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import VendorDocumentsPanel from "../components/VendorDocumentsPanel";
import VendorFormModal from "../components/VendorFormModal";
import VendorProcurementPanel from "../components/VendorProcurementPanel";
import { deleteVendor, getVendors } from "../utils/api";
import {
  getVendorComplianceClasses,
  getVendorComplianceLabel,
  getVendorComplianceState,
  getVendorSpecialties,
  getVendorStatusClasses,
  getVendorStatusLabel,
  vendorMatchesSearch,
} from "../utils/vendors";
import {
  getVendorProcurementStateClasses,
  getVendorProcurementSummary,
} from "../utils/vendorProcurement";

const filterTabs = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "ready_to_assign", label: "Ready to assign" },
  { id: "preferred", label: "Preferred" },
  { id: "needs_packet", label: "Needs packet" },
  { id: "inactive", label: "Inactive" },
];

const detailTabs = [
  { id: "overview", label: "Overview" },
  { id: "procurement", label: "Procurement" },
  { id: "documents", label: "Documents" },
];

const sortOptions = [
  { id: "most_ready", label: "Most ready" },
  { id: "needs_packet", label: "Needs packet" },
  { id: "compliance_risk", label: "Compliance risk" },
  { id: "alphabetical", label: "A-Z" },
];

const CompactSummaryCell = ({ label, value, hint }) => (
  <div className="rounded-[20px] border border-ink-100 bg-white/86 px-4 py-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-base font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-1 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const OverviewItem = ({ label, value, hint }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-sm font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-1 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const matchesFilter = (vendor, filterId) => {
  if (!vendor || typeof vendor !== "object" || Array.isArray(vendor)) {
    return false;
  }

  const procurement = getVendorProcurementSummary(vendor);

  switch (filterId) {
    case "active":
      return vendor.status !== "inactive";
    case "ready_to_assign":
      return vendor.status !== "inactive" && procurement.assignmentReady;
    case "preferred":
      return vendor.status === "preferred";
    case "needs_packet":
      return (
        vendor.status !== "inactive" &&
        (!procurement.assignmentReady || procurement.blockingIssuesCount > 0)
      );
    case "inactive":
      return vendor.status === "inactive";
    case "all":
    default:
      return true;
  }
};

const getPrimaryContactLabel = (vendor = {}) =>
  vendor.contactInfo?.contactName ||
  vendor.contactInfo?.email ||
  vendor.contactInfo?.phone ||
  "Contact details pending";

const getPrimaryContactHint = (vendor = {}) => {
  const email = vendor.contactInfo?.email;
  const phone = vendor.contactInfo?.phone;

  if (email && phone) {
    return `${email} • ${phone}`;
  }

  return email || phone || "No email or phone on file";
};

const getServiceAreaLabel = (vendor = {}) => vendor.serviceArea || "Service area not set";

const getServiceAreaHint = (vendor = {}) =>
  vendor.contactInfo?.address || "No address or market coverage note saved";

const getVendorSignal = (vendor, procurement) => {
  if (!vendor || !procurement) {
    return {
      label: "No signal",
      detail: "Vendor data is unavailable right now.",
      classes: "border border-ink-100 bg-ink-50 text-ink-600",
    };
  }

  const complianceState = getVendorComplianceState(vendor);

  if (vendor.status === "inactive") {
    return {
      label: "Inactive vendor",
      detail: "Not in the current project rotation.",
      classes: "border border-ink-100 bg-ink-50 text-ink-600",
    };
  }

  if (complianceState === "missing") {
    return {
      label: "Missing compliance",
      detail: "Upload W-9 and insurance so the vendor can be assigned cleanly.",
      classes: "border border-clay-200 bg-clay-50 text-clay-700",
    };
  }

  if (complianceState === "expired") {
    return {
      label: "Expired compliance",
      detail: "Renew the vendor's expired compliance documents before active work or payout.",
      classes: "border border-clay-200 bg-clay-50 text-clay-700",
    };
  }

  if (procurement.blockingIssuesCount > 0) {
    return {
      label: procurement.nextActions[0] || "Needs packet",
      detail: `${procurement.blockingIssuesCount} blocking packet item${
        procurement.blockingIssuesCount === 1 ? "" : "s"
      } still need attention.`,
      classes: "border border-sand-200 bg-sand-50 text-sand-800",
    };
  }

  if (complianceState === "expiring" || procurement.renewalsDueCount > 0) {
    return {
      label: "Renewal watch",
      detail:
        procurement.nextActions[0] ||
        "One or more packet documents are nearing expiration and should be renewed soon.",
      classes: "border border-sand-200 bg-sand-50 text-sand-800",
    };
  }

  if (procurement.paymentReady) {
    return {
      label: "Ready to pay",
      detail: "Assignment packet and payment backup are in place for active work.",
      classes: "border border-verdigris-200 bg-verdigris-50 text-verdigris-700",
    };
  }

  if (procurement.assignmentReady) {
    return {
      label: "Ready to assign",
      detail: "Core onboarding and contract support are already on file.",
      classes: "border border-sky-200 bg-sky-50 text-sky-700",
    };
  }

  if (procurement.completedRequiredCount > 0) {
    return {
      label: "Packet in progress",
      detail: "Some onboarding is complete, but the packet still needs follow-through.",
      classes: "border border-ink-100 bg-ink-50 text-ink-600",
    };
  }

  return {
    label: "Start packet",
    detail: "Add bid, onboarding, and contract documents to move this vendor into active use.",
    classes: "border border-ink-100 bg-ink-50 text-ink-600",
  };
};

const getReadinessScore = (vendor) => {
  const procurement = getVendorProcurementSummary(vendor);
  const complianceState = getVendorComplianceState(vendor);

  let score = 0;

  if (vendor.status !== "inactive") {
    score += 26;
  }
  if (vendor.status === "preferred") {
    score += 18;
  }
  if (procurement.paymentReady) {
    score += 40;
  } else if (procurement.assignmentReady) {
    score += 28;
  } else if (procurement.completedRequiredCount > 0) {
    score += 14;
  }

  if (complianceState === "current") {
    score += 12;
  } else if (complianceState === "expiring") {
    score += 4;
  } else if (complianceState === "missing" || complianceState === "expired") {
    score -= 14;
  }

  score -= procurement.blockingIssuesCount * 8;
  score -= procurement.renewalsDueCount * 4;

  return score;
};

const getPacketPressureScore = (vendor) => {
  const procurement = getVendorProcurementSummary(vendor);
  const complianceState = getVendorComplianceState(vendor);

  return (
    procurement.blockingIssuesCount * 12 +
    procurement.renewalsDueCount * 6 +
    (procurement.assignmentReady ? 0 : 10) +
    (complianceState === "missing" || complianceState === "expired" ? 10 : 0) +
    (vendor.status === "inactive" ? -20 : 0)
  );
};

const getComplianceRiskScore = (vendor) => {
  const complianceState = getVendorComplianceState(vendor);
  const procurement = getVendorProcurementSummary(vendor);
  const riskByState = {
    missing: 32,
    expired: 30,
    expiring: 18,
    inactive: 8,
    current: 0,
  };

  return (riskByState[complianceState] || 0) + procurement.renewalsDueCount * 5;
};

const sortVendors = (vendors, sortId) =>
  [...vendors].sort((left, right) => {
    if (sortId === "alphabetical") {
      return String(left.name || "").localeCompare(String(right.name || ""));
    }

    const leftScore =
      sortId === "needs_packet"
        ? getPacketPressureScore(left)
        : sortId === "compliance_risk"
          ? getComplianceRiskScore(left)
          : getReadinessScore(left);
    const rightScore =
      sortId === "needs_packet"
        ? getPacketPressureScore(right)
        : sortId === "compliance_risk"
          ? getComplianceRiskScore(right)
          : getReadinessScore(right);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return String(left.name || "").localeCompare(String(right.name || ""));
  });

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [detailTab, setDetailTab] = useState("overview");
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState("most_ready");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [editingVendor, setEditingVendor] = useState(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const vendorData = await getVendors();
      setVendors(
        Array.isArray(vendorData)
          ? vendorData.filter(
              (vendor) => vendor && typeof vendor === "object" && !Array.isArray(vendor)
            )
          : []
      );
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load vendors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = useMemo(() => {
    const visibleVendors = vendors
      .filter((vendor) => matchesFilter(vendor, activeFilter))
      .filter((vendor) => vendorMatchesSearch(vendor, searchValue));

    return sortVendors(visibleVendors, sortBy);
  }, [activeFilter, searchValue, sortBy, vendors]);

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
    vendors.find((vendor) => vendor._id === selectedVendorId) || filteredVendors[0] || null;
  const selectedVendorProcurement = useMemo(
    () => getVendorProcurementSummary(selectedVendor || {}),
    [selectedVendor]
  );
  const selectedVendorSignal = useMemo(
    () => getVendorSignal(selectedVendor, selectedVendorProcurement),
    [selectedVendor, selectedVendorProcurement]
  );

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

  const readyToAssignCount = useMemo(
    () =>
      vendors.filter(
        (vendor) => vendor.status !== "inactive" && getVendorProcurementSummary(vendor).assignmentReady
      ).length,
    [vendors]
  );

  const needsPacketCount = useMemo(
    () =>
      vendors.filter((vendor) => {
        const summary = getVendorProcurementSummary(vendor);
        return (
          vendor.status !== "inactive" &&
          (!summary.assignmentReady || summary.blockingIssuesCount > 0)
        );
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
      return exists
        ? current.map((vendor) => (vendor._id === savedVendor._id ? savedVendor : vendor))
        : [savedVendor, ...current];
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
      "Delete this vendor? Historical project references and payment records will keep their prior data."
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

      <div className="space-y-5">
        <section className="surface-panel px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <span className="eyebrow">Vendor directory</span>
              <h1 className="mt-4 text-[2rem] font-medium tracking-tight text-ink-900">
                Manage vendors like a calm operating desk
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
                Keep trade coverage, compliance, procurement packet health, and document support in
                one clean directory that is easy to scan and easier to use.
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

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="workspace-counter-pill">{vendors.length} vendors</span>
            <span className="workspace-counter-pill">{readyToAssignCount} ready to assign</span>
            <span className="workspace-counter-pill">{needsPacketCount} need packet work</span>
            <span className="workspace-counter-pill">{complianceCount} compliance gaps</span>
            <span className="workspace-counter-pill">{specialtyCoverage} specialties covered</span>
          </div>

          <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="segmented-control max-w-full overflow-x-auto">
              {filterTabs.map((tab) => {
                const active = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`segmented-option whitespace-nowrap ${
                      active ? "segmented-option-active" : ""
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        active ? "bg-white/18 text-white" : "bg-ink-100 text-ink-600"
                      }`}
                    >
                      {tabCounts[tab.id] || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid w-full gap-3 xl:max-w-2xl xl:grid-cols-[minmax(0,1fr)_210px]">
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search vendor, specialty, contact, or market"
                className="auth-input workspace-search-input"
              />

              <label className="sr-only" htmlFor="vendor-sort">
                Sort vendors
              </label>
              <select
                id="vendor-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="auth-input"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[18px] border border-clay-200 bg-clay-50 px-5 py-4 text-sm text-clay-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="surface-panel px-6 py-14 text-center text-sm text-ink-500">
            Loading vendors...
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[350px_minmax(0,1fr)]">
            <section className="surface-panel px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Vendor roster
                  </p>
                  <p className="mt-1 text-sm text-ink-500">
                    {filteredVendors.length} matching vendor
                    {filteredVendors.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-semibold text-ink-500">
                  {sortOptions.find((option) => option.id === sortBy)?.label}
                </span>
              </div>

              {filteredVendors.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {filteredVendors.map((vendor) => {
                    const specialties = getVendorSpecialties(vendor);
                    const selected = vendor._id === selectedVendor?._id;
                    const procurement = getVendorProcurementSummary(vendor);
                    const signal = getVendorSignal(vendor, procurement);

                    return (
                      <button
                        key={vendor._id}
                        type="button"
                        onClick={() => {
                          setSelectedVendorId(vendor._id);
                          setDetailTab("overview");
                        }}
                        className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                          selected
                            ? "border-ink-900 bg-ink-50 shadow-[0_16px_28px_rgba(18,32,45,0.08)]"
                            : "border-ink-100 bg-white/92 hover:border-ink-200 hover:bg-white"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-ink-900">
                              {vendor.name}
                            </p>
                            <p className="mt-1 text-sm text-ink-500">
                              {specialties.join(" • ") || vendor.trade || "Specialty not set"}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorStatusClasses(
                              vendor.status
                            )}`}
                          >
                            {getVendorStatusLabel(vendor.status)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorComplianceClasses(
                              vendor
                            )}`}
                          >
                            {getVendorComplianceLabel(vendor)}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorProcurementStateClasses(
                              procurement.overallState
                            )}`}
                          >
                            {procurement.overallLabel}
                          </span>
                          {vendor.afterHoursAvailable ? (
                            <span className="rounded-full border border-ink-100 bg-white px-3 py-1 text-[11px] font-semibold text-ink-600">
                              After-hours
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 flex flex-col gap-2">
                          <p className="text-sm text-ink-500">{getPrimaryContactLabel(vendor)}</p>
                          <div className={`rounded-[16px] px-3 py-2 text-left ${signal.classes}`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                              {signal.label}
                            </p>
                            <p className="mt-1 text-sm leading-6">{signal.detail}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-[20px] border border-dashed border-ink-200 bg-ink-50/40 px-5 py-12 text-center">
                  <p className="text-lg font-medium text-ink-900">No vendors match this view.</p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    Try another filter, broaden the search, or add a vendor to get started.
                  </p>
                </div>
              )}
            </section>

            <section className="space-y-4">
              {selectedVendor ? (
                <>
                  <div className="surface-panel px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorStatusClasses(
                              selectedVendor.status
                            )}`}
                          >
                            {getVendorStatusLabel(selectedVendor.status)}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorComplianceClasses(
                              selectedVendor
                            )}`}
                          >
                            {getVendorComplianceLabel(selectedVendor)}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorProcurementStateClasses(
                              selectedVendorProcurement.overallState
                            )}`}
                          >
                            {selectedVendorProcurement.overallLabel}
                          </span>
                        </div>

                        <h2 className="mt-4 text-[1.9rem] font-medium tracking-tight text-ink-900">
                          {selectedVendor.name}
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
                          {selectedVendor.description ||
                            "No vendor summary has been added yet. Use notes to capture pricing position, quality, or assignment context."}
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
                          onClick={() => setDetailTab("procurement")}
                          className="secondary-action"
                        >
                          Open procurement
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailTab("documents")}
                          className="secondary-action"
                        >
                          Open documents
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVendor(selectedVendor);
                            setIsVendorModalOpen(true);
                          }}
                          className="ghost-action"
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

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <CompactSummaryCell
                        label="Primary contact"
                        value={getPrimaryContactLabel(selectedVendor)}
                        hint={getPrimaryContactHint(selectedVendor)}
                      />
                      <CompactSummaryCell
                        label="Service area"
                        value={getServiceAreaLabel(selectedVendor)}
                        hint={getServiceAreaHint(selectedVendor)}
                      />
                      <CompactSummaryCell
                        label="Packet coverage"
                        value={`${selectedVendorProcurement.completedRequiredCount}/${selectedVendorProcurement.requiredCount} on file`}
                        hint={
                          selectedVendorProcurement.paymentReady
                            ? "Assignment and payout support are currently in place."
                            : selectedVendorProcurement.assignmentReady
                              ? "Assignment packet is in place. Payment backup still needs follow-through."
                              : "Packet still needs onboarding or contract support."
                        }
                      />
                      <CompactSummaryCell
                        label="Primary signal"
                        value={selectedVendorSignal.label}
                        hint={selectedVendorSignal.detail}
                      />
                    </div>
                  </div>

                  <div
                    className={`rounded-[22px] border px-4 py-4 ${selectedVendorSignal.classes}`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Why this vendor is {selectedVendorProcurement.paymentReady ? "ready" : "blocked"}
                    </p>
                    <p className="mt-2 text-base font-semibold">{selectedVendorSignal.label}</p>
                    <p className="mt-1 text-sm leading-6">{selectedVendorSignal.detail}</p>
                  </div>

                  <div className="surface-panel flex flex-wrap items-center gap-2 px-3 py-3">
                    <div className="segmented-control">
                      {detailTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setDetailTab(tab.id)}
                          className={`segmented-option ${
                            detailTab === tab.id ? "segmented-option-active" : ""
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {detailTab === "overview" ? (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.1fr)]">
                      <div className="section-card p-6">
                        <span className="eyebrow">Contact</span>
                        <div className="mt-5 space-y-5">
                          <OverviewItem
                            label="Primary contact"
                            value={selectedVendor.contactInfo?.contactName || "Not set"}
                            hint="Main point of contact for scope walk, bid, and project updates."
                          />
                          <OverviewItem
                            label="Email"
                            value={selectedVendor.contactInfo?.email || "Not set"}
                            hint="Used for bid requests, COI follow-up, and formal packet collection."
                          />
                          <OverviewItem
                            label="Phone"
                            value={selectedVendor.contactInfo?.phone || "Not set"}
                            hint={
                              selectedVendor.afterHoursAvailable
                                ? "After-hours or emergency work is available."
                                : "Standard availability only."
                            }
                          />
                          <OverviewItem
                            label="Address"
                            value={selectedVendor.contactInfo?.address || "Not set"}
                          />
                        </div>
                      </div>

                      <div className="section-card p-6">
                        <span className="eyebrow">Readiness</span>
                        <div className="mt-5 space-y-5">
                          <OverviewItem
                            label="Vendor status"
                            value={getVendorStatusLabel(selectedVendor.status)}
                            hint="Controls whether the vendor should stay in active rotation."
                          />
                          <OverviewItem
                            label="Compliance"
                            value={getVendorComplianceLabel(selectedVendor)}
                            hint="W-9 and insurance coverage for assignment and payout readiness."
                          />
                          <OverviewItem
                            label="Procurement state"
                            value={selectedVendorProcurement.overallLabel}
                            hint={`${selectedVendorProcurement.completedRequiredCount}/${selectedVendorProcurement.requiredCount} required packet items currently covered.`}
                          />
                          <OverviewItem
                            label="Next best action"
                            value={
                              selectedVendorProcurement.nextActions[0] ||
                              "Packet is in healthy shape right now."
                            }
                            hint="Use Procurement for the full checklist and packet details."
                          />
                        </div>
                      </div>

                      <div className="section-card p-6">
                        <span className="eyebrow">Internal notes / summary</span>
                        <div className="mt-5 space-y-5">
                          <OverviewItem
                            label="Coverage summary"
                            value={
                              getVendorSpecialties(selectedVendor).join(" • ") ||
                              "No specialties saved"
                            }
                            hint={getServiceAreaLabel(selectedVendor)}
                          />
                          <OverviewItem
                            label="Description"
                            value={
                              selectedVendor.description ||
                              "No vendor description has been captured yet."
                            }
                          />
                          <OverviewItem
                            label="Internal notes"
                            value={
                              selectedVendor.notes ||
                              "No internal notes are saved for this vendor yet."
                            }
                            hint="Capture pricing posture, quality observations, onboarding concerns, or assignment rules here."
                          />
                        </div>
                      </div>
                    </div>
                  ) : detailTab === "procurement" ? (
                    <VendorProcurementPanel vendor={selectedVendor} />
                  ) : (
                    <VendorDocumentsPanel vendor={selectedVendor} onUpdated={handleVendorUpdated} />
                  )}
                </>
              ) : (
                <div className="surface-panel px-6 py-14 text-center">
                  <p className="text-lg font-medium text-ink-900">No vendor selected</p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    Add a vendor or pick one from the roster to view packet readiness and
                    documents.
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
