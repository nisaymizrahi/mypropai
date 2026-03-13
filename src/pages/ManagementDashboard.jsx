import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";

import PromotePropertyModal from "../components/PromotePropertyModal";
import { API_BASE_URL } from "../config";
import { getAuthHeaders } from "../utils/api";

const LoadingSpinner = () => (
  <div className="surface-panel flex items-center justify-center px-6 py-20">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-verdigris-100 border-t-verdigris-500" />
  </div>
);

const SummaryCard = ({ label, value, detail, accent = "verdigris" }) => {
  const accentStyles = {
    verdigris: "bg-verdigris-50 text-verdigris-700",
    clay: "bg-clay-50 text-clay-700",
    sand: "bg-sand-100 text-sand-700",
    ink: "bg-ink-100 text-ink-700",
  };

  return (
    <div className="metric-tile p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            {label}
          </p>
          <p className="mt-4 text-3xl font-semibold text-ink-900">{value}</p>
          <p className="mt-3 text-sm leading-6 text-ink-500">{detail}</p>
        </div>
        <div className={`h-3 w-3 rounded-full ${accentStyles[accent]}`} />
      </div>
    </div>
  );
};

const ManagementDashboard = () => {
  const [managedProperties, setManagedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchManagedProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/management`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch managed properties.");
      }

      const data = await res.json();
      setManagedProperties(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagedProperties();
  }, [fetchManagedProperties]);

  const summary = useMemo(() => {
    const totalProperties = managedProperties.length;
    const totalUnits = managedProperties.reduce(
      (count, property) => count + (property.units?.length || 0),
      0
    );
    const totalOccupied = managedProperties.reduce(
      (count, property) =>
        count + (property.units || []).filter((unit) => unit.currentLease).length,
      0
    );
    const totalVacant = Math.max(0, totalUnits - totalOccupied);
    const activeProperties = managedProperties.filter((property) => property.isActive).length;
    const occupancyRate = totalUnits > 0 ? Math.round((totalOccupied / totalUnits) * 100) : 0;
    const vacancyWatch = managedProperties.filter((property) =>
      (property.units || []).some((unit) => !unit.currentLease)
    );

    return {
      totalProperties,
      totalUnits,
      totalOccupied,
      totalVacant,
      activeProperties,
      occupancyRate,
      vacancyWatch,
    };
  }, [managedProperties]);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="section-card px-6 py-10 text-center text-clay-700">
        {error}
      </div>
    );
  }

  return (
    <>
      <PromotePropertyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPromoteSuccess={fetchManagedProperties}
      />

      <div className="space-y-6">
        <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div>
              <span className="eyebrow">Operations command</span>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900">
                Property operations at a glance
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
                Keep occupancy, vacancies, and operational coverage organized across your managed
                assets with clearer signal and faster action.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="primary-action"
                >
                  Add managed property
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/applications")}
                  className="secondary-action"
                >
                  Review applications
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
                    {summary.occupancyRate}% occupied
                  </h3>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                  <BuildingOffice2Icon className="h-7 w-7" />
                </div>
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
                  <span>{summary.totalVacant} open unit(s)</span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                  <span className="text-sm font-medium text-ink-600">Active properties</span>
                  <span className="text-sm font-semibold text-ink-900">
                    {summary.activeProperties}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[18px] bg-sand-50 px-4 py-3">
                  <span className="text-sm font-medium text-ink-600">Assets with vacancy</span>
                  <span className="text-sm font-semibold text-ink-900">
                    {summary.vacancyWatch.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Properties"
            value={summary.totalProperties}
            detail="Managed assets currently tracked in your operations workspace."
            accent="ink"
          />
          <SummaryCard
            label="Total units"
            value={summary.totalUnits}
            detail="Units currently represented across the active management portfolio."
            accent="sand"
          />
          <SummaryCard
            label="Occupied units"
            value={summary.totalOccupied}
            detail="Units presently under lease or carrying an active tenant assignment."
            accent="verdigris"
          />
          <SummaryCard
            label="Vacant units"
            value={summary.totalVacant}
            detail="Open units that likely need leasing attention or listing support."
            accent="clay"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="section-card p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="eyebrow">Portfolio roster</span>
                <h3 className="mt-4 text-2xl font-semibold text-ink-900">
                  Managed properties
                </h3>
              </div>
              <div className="hidden rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink-600 sm:block">
                {summary.totalProperties} total
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {managedProperties.length > 0 ? (
                managedProperties.map((property) => {
                  const unitCount = property.units?.length || 0;
                  const occupiedCount = (property.units || []).filter((unit) => unit.currentLease)
                    .length;
                  const propertyOccupancy =
                    unitCount > 0 ? Math.round((occupiedCount / unitCount) * 100) : 0;

                  return (
                    <div
                      key={property._id}
                      className="rounded-[24px] border border-ink-100 bg-white p-5 shadow-soft"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-ink-900">{property.address}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-400">
                            {unitCount} unit(s)
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            property.isActive
                              ? "bg-verdigris-50 text-verdigris-700"
                              : "bg-sand-100 text-sand-700"
                          }`}
                        >
                          {property.isActive ? "Active" : "Archived"}
                        </span>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between text-sm text-ink-500">
                          <span>Occupancy</span>
                          <span className="font-semibold text-ink-900">
                            {occupiedCount}/{unitCount || 0}
                          </span>
                        </div>
                        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-sand-100">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#1f6f63_0%,#3b8f81_100%)]"
                            style={{ width: `${Math.max(propertyOccupancy, 8)}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-ink-500">
                          {Math.max(0, unitCount - occupiedCount)} vacancy slot(s)
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/management/${property._id}`)}
                          className="inline-flex items-center text-sm font-semibold text-verdigris-700 hover:text-verdigris-800"
                        >
                          Open property
                          <ArrowRightIcon className="ml-1.5 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink-200 bg-sand-50 px-5 py-12 text-center text-ink-500 lg:col-span-2">
                  No managed properties yet. Add one to start tracking occupancy, units, and
                  operations.
                </div>
              )}
            </div>
          </div>

          <div className="section-card p-6 sm:p-7">
            <span className="eyebrow">Focus list</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Vacancy watch</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Assets with open units that may need listing, leasing, or applicant review.
            </p>

            <div className="mt-6 space-y-3">
              {summary.vacancyWatch.length > 0 ? (
                summary.vacancyWatch.map((property) => {
                  const unitCount = property.units?.length || 0;
                  const occupiedCount = (property.units || []).filter((unit) => unit.currentLease)
                    .length;
                  const vacantCount = Math.max(0, unitCount - occupiedCount);

                  return (
                    <button
                      key={property._id}
                      type="button"
                      onClick={() => navigate(`/management/${property._id}`)}
                      className="flex w-full items-center justify-between rounded-[20px] border border-ink-100 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">
                          {property.address}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-400">
                          {vacantCount} open unit(s)
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay-50 text-clay-700">
                        <HomeModernIcon className="h-5 w-5" />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-5 py-10 text-center text-ink-500">
                  Everything is currently leased with no vacancy hotspots to review.
                </div>
              )}
            </div>

            <div className="mt-6 rounded-[24px] bg-ink-900 px-5 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                    Portfolio posture
                  </p>
                  <p className="mt-3 text-2xl font-semibold">
                    Stable operations with targeted leasing needs
                  </p>
                </div>
                <ChartBarIcon className="h-7 w-7 text-white/75" />
              </div>
              <p className="mt-4 text-sm leading-6 text-white/68">
                Use the roster on the left to open property-level command centers and keep open units moving.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ManagementDashboard;
