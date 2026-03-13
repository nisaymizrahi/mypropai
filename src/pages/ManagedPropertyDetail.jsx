import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  KeyIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import AddLeaseModal from "../components/AddLeaseModal";
import AddUnitModal from "../components/AddUnitModal";
import MaintenanceTab from "../components/MaintenanceTab";
import OperatingExpensesTab from "../components/OperatingExpensesTab";
import RentalPerformanceTab from "../components/RentalPerformanceTab";
import { API_BASE_URL } from "../config";
import {
  getArchivedLeases,
  getAuthHeaders,
  getMaintenanceTickets,
  getOperatingExpenses,
  getVendors,
} from "../utils/api";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const LoadingSpinner = () => (
  <div className="surface-panel flex items-center justify-center px-6 py-20">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-verdigris-100 border-t-verdigris-500" />
  </div>
);

const UnitCard = ({ unit, onAddLeaseClick, navigate }) => {
  const isVacant = unit.status === "Vacant";
  const lease = unit.currentLease;
  const hasLease = Boolean(lease?._id) && !isVacant;

  return (
    <div className="section-card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">Unit</p>
          <h3 className="mt-2 text-xl font-semibold text-ink-900">{unit.name}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isVacant ? "bg-clay-50 text-clay-700" : "bg-verdigris-50 text-verdigris-700"
          }`}
        >
          {unit.status}
        </span>
      </div>

      <div className="mt-5 flex-1 space-y-3">
        {isVacant ? (
          <div className="rounded-[20px] border border-dashed border-clay-200 bg-clay-50 px-4 py-5 text-sm leading-6 text-clay-700">
            This unit is currently vacant and ready for listing or a new tenant workflow.
          </div>
        ) : (
          <>
            <div className="rounded-[18px] bg-sand-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Tenant
              </p>
              <p className="mt-1 text-sm font-semibold text-ink-900">
                {lease?.tenant?.fullName || "N/A"}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Rent
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {currencyFormatter.format(lease?.rentAmount || 0)}
                </p>
              </div>
              <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Lease end
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  {lease?.endDate ? new Date(lease.endDate).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {isVacant ? (
          <>
            <button
              type="button"
              onClick={() => navigate(`/management/units/${unit._id}/listing`)}
              className="secondary-action w-full"
            >
              Manage listing
            </button>
            <button
              type="button"
              onClick={() => onAddLeaseClick(unit._id)}
              className="primary-action w-full"
            >
              Add tenant and lease
            </button>
          </>
        ) : hasLease ? (
          <button
            type="button"
            onClick={() => navigate(`/management/leases/${lease._id}`)}
            className="secondary-action w-full"
          >
            Open lease
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAddLeaseClick(unit._id)}
            className="secondary-action w-full"
          >
            Add lease details
          </button>
        )}
      </div>
    </div>
  );
};

const LeaseHistoryTab = ({ leases }) => (
  <div className="section-card p-6 sm:p-7">
    <div className="flex items-center justify-between gap-4">
      <div>
        <span className="eyebrow">Archive</span>
        <h3 className="mt-4 text-2xl font-semibold text-ink-900">Lease history</h3>
      </div>
      <div className="rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink-600">
        {leases.length} record(s)
      </div>
    </div>

    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            <th className="px-3 py-3">Unit</th>
            <th className="px-3 py-3">Tenant</th>
            <th className="px-3 py-3">Lease end</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {leases.length > 0 ? (
            leases.map((lease) => (
              <tr key={lease._id}>
                <td className="px-3 py-4 font-semibold text-ink-900">
                  {lease.unit?.name || "N/A"}
                </td>
                <td className="px-3 py-4 text-ink-600">
                  {lease.tenant?.fullName || "N/A"}
                </td>
                <td className="px-3 py-4 text-ink-600">
                  {new Date(lease.endDate).toLocaleDateString()}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="px-3 py-10 text-center text-ink-500">
                No archived leases for this property yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const ManagedPropertyDetail = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isAddLeaseModalOpen, setIsAddLeaseModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [activeTab, setActiveTab] = useState("units");
  const [tickets, setTickets] = useState([]);
  const [operatingExpenses, setOperatingExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [archivedLeases, setArchivedLeases] = useState([]);

  const handleOpenLeaseModal = (unitId) => {
    setSelectedUnitId(unitId);
    setIsAddLeaseModalOpen(true);
  };

  const fetchPropertyDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [propertyRes, ticketsData, expensesData, vendorsData, archivedLeasesData] =
        await Promise.all([
          fetch(`${API_BASE_URL}/management/property/${propertyId}`, {
            headers: getAuthHeaders(),
          }),
          getMaintenanceTickets(propertyId),
          getOperatingExpenses(propertyId),
          getVendors(),
          getArchivedLeases(propertyId),
        ]);

      if (!propertyRes.ok) {
        throw new Error("Failed to fetch property details.");
      }

      const propertyData = await propertyRes.json();
      setProperty(propertyData);
      setTickets(ticketsData);
      setOperatingExpenses(expensesData);
      setVendors(vendorsData);
      setArchivedLeases(archivedLeasesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchPropertyDetails();
  }, [fetchPropertyDetails]);

  const summary = useMemo(() => {
    const units = property?.units || [];
    const occupiedUnits = units.filter((unit) => unit.currentLease).length;
    const totalUnits = units.length;
    const vacantUnits = Math.max(0, totalUnits - occupiedUnits);
    const monthlyRent = units.reduce(
      (total, unit) => total + (unit.currentLease?.rentAmount || 0),
      0
    );
    const expiringLeases = units.filter((unit) => {
      if (!unit.currentLease?.endDate) {
        return false;
      }
      const endDate = new Date(unit.currentLease.endDate).getTime();
      const now = Date.now();
      const sixtyDaysFromNow = now + 1000 * 60 * 60 * 24 * 60;
      return endDate >= now && endDate <= sixtyDaysFromNow;
    }).length;

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits,
      monthlyRent,
      expiringLeases,
      occupancyRate: totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
    };
  }, [property]);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="section-card px-6 py-10 text-center text-clay-700">
        {error}
      </div>
    );
  }
  if (!property) {
    return (
      <div className="section-card px-6 py-10 text-center text-ink-500">
        Property not found.
      </div>
    );
  }

  const tabClassName = (tabName) =>
    `rounded-full px-4 py-2.5 text-sm font-semibold transition ${
      activeTab === tabName
        ? "bg-ink-900 text-white shadow-soft"
        : "bg-white/80 text-ink-500 ring-1 ring-ink-100 hover:bg-white hover:text-ink-900"
    }`;
  const propertyQuery = `?${new URLSearchParams({ propertyId }).toString()}`;

  return (
    <>
      <AddUnitModal
        isOpen={isAddUnitModalOpen}
        onClose={() => setIsAddUnitModalOpen(false)}
        onUnitAdded={fetchPropertyDetails}
        propertyId={propertyId}
      />
      <AddLeaseModal
        isOpen={isAddLeaseModalOpen}
        onClose={() => setIsAddLeaseModalOpen(false)}
        onSuccess={fetchPropertyDetails}
        unitId={selectedUnitId}
        propertyId={propertyId}
      />

      <div className="space-y-6">
        <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div>
              <span className="eyebrow">Property command center</span>
              <h2 className="page-hero-title">
                {property.address}
              </h2>
              <p className="page-hero-copy">
                Monitor occupancy, leasing readiness, maintenance, expenses, and performance from
                one property-level workspace.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUnitModalOpen(true)}
                  className="primary-action"
                >
                  Add unit
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/applications${propertyQuery}`)}
                  className="secondary-action"
                >
                  Review applications
                </button>
                {summary.vacantUnits > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate(`/applications/send${propertyQuery}`)}
                    className="secondary-action"
                  >
                    Send application link
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/management")}
                  className="secondary-action"
                >
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back to properties
                </button>
              </div>
            </div>

            <div className="section-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Occupancy signal
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink-900">
                    {summary.occupancyRate}% leased
                  </h3>
                </div>
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    property.isActive
                      ? "bg-verdigris-50 text-verdigris-700"
                      : "bg-sand-100 text-sand-700"
                  }`}
                >
                  {property.isActive ? "Active property" : "Archived property"}
                </span>
              </div>

              <div className="mt-8">
                <div className="h-3 w-full overflow-hidden rounded-full bg-sand-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#1f6f63_0%,#3b8f81_100%)]"
                    style={{ width: `${Math.max(summary.occupancyRate, 6)}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-ink-500">
                  <span>Vacancy exposure</span>
                  <span>{summary.vacantUnits} open unit(s)</span>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-sand-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Monthly rent
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink-900">
                    {currencyFormatter.format(summary.monthlyRent)}
                  </p>
                </div>
                <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Expiring soon
                  </p>
                  <p className="mt-1 text-lg font-semibold text-ink-900">
                    {summary.expiringLeases} lease(s)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="metric-tile p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Total units
                </p>
                <p className="mt-4 text-3xl font-semibold text-ink-900">{summary.totalUnits}</p>
                <p className="mt-3 text-sm leading-6 text-ink-500">
                  Current inventory represented in this property workspace.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-700">
                <BuildingOffice2Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="metric-tile p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Occupied
                </p>
                <p className="mt-4 text-3xl font-semibold text-ink-900">
                  {summary.occupiedUnits}
                </p>
                <p className="mt-3 text-sm leading-6 text-ink-500">
                  Units currently carrying an active lease and tenant assignment.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                <KeyIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="metric-tile p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Vacant
                </p>
                <p className="mt-4 text-3xl font-semibold text-ink-900">{summary.vacantUnits}</p>
                <p className="mt-3 text-sm leading-6 text-ink-500">
                  Units ready for leasing attention, listing updates, or new applications.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-50 text-clay-700">
                <WrenchScrewdriverIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="metric-tile p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Rent roll
                </p>
                <p className="mt-4 text-3xl font-semibold text-ink-900">
                  {currencyFormatter.format(summary.monthlyRent)}
                </p>
                <p className="mt-3 text-sm leading-6 text-ink-500">
                  Current monthly rent represented by active leases at this property.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand-100 text-sand-700">
                <CurrencyDollarIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
        </section>

        <section className="section-card p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setActiveTab("units")} className={tabClassName("units")}>
              Units
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("maintenance")}
              className={tabClassName("maintenance")}
            >
              Maintenance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("expenses")}
              className={tabClassName("expenses")}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("performance")}
              className={tabClassName("performance")}
            >
              Performance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={tabClassName("history")}
            >
              Lease history
            </button>
          </div>
        </section>

        <section>
          {activeTab === "units" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="eyebrow">Inventory</span>
                  <h3 className="mt-4 text-2xl font-semibold text-ink-900">Units and leasing status</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddUnitModalOpen(true)}
                  className="secondary-action hidden sm:inline-flex"
                >
                  Add another unit
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {property.units?.map((unit) => (
                  <UnitCard
                    key={unit._id}
                    unit={unit}
                    onAddLeaseClick={handleOpenLeaseModal}
                    navigate={navigate}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => setIsAddUnitModalOpen(true)}
                  className="section-card flex min-h-[280px] flex-col items-center justify-center border-dashed text-center text-ink-500 transition hover:border-verdigris-200 hover:text-verdigris-700"
                >
                  <span className="mb-4 text-5xl font-light">+</span>
                  <span className="text-lg font-semibold">Add new unit</span>
                  <span className="mt-2 max-w-xs text-sm leading-6 text-ink-400">
                    Expand this property roster and start tracking an additional rentable unit.
                  </span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <MaintenanceTab
              tickets={tickets}
              property={property}
              vendors={vendors}
              onUpdate={fetchPropertyDetails}
            />
          )}
          {activeTab === "expenses" && (
            <OperatingExpensesTab
              propertyId={propertyId}
              expenses={operatingExpenses}
              onUpdate={fetchPropertyDetails}
            />
          )}
          {activeTab === "performance" && (
            <RentalPerformanceTab
              property={property}
              operatingExpenses={operatingExpenses}
            />
          )}
          {activeTab === "history" && <LeaseHistoryTab leases={archivedLeases} />}
        </section>
      </div>
    </>
  );
};

export default ManagedPropertyDetail;
