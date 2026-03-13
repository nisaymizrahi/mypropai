import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseIcon,
  BuildingOffice2Icon,
  HomeModernIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import WorkspaceDataTable from "../components/WorkspaceDataTable";
import { getProperties } from "../utils/api";

const FILTERS = [
  { value: "all", label: "All properties" },
  { value: "pipeline", label: "Leads" },
  { value: "acquisitions", label: "Investments" },
  { value: "management", label: "Managed properties" },
];

const workspaceStyles = {
  pipeline: "bg-sand-100 text-ink-700",
  acquisitions: "bg-verdigris-50 text-verdigris-700",
  management: "bg-clay-50 text-clay-700",
};

const SummaryCard = ({ label, value, detail }) => (
  <div className="metric-tile p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-4 text-3xl font-semibold text-ink-900">{value}</p>
    <p className="mt-3 text-sm leading-6 text-ink-500">{detail}</p>
  </div>
);

const formatPropertyDetails = (property) => {
  const bits = [
    property.sharedProfile.propertyType || null,
    property.sharedProfile.squareFootage
      ? `${property.sharedProfile.squareFootage.toLocaleString()} sqft`
      : null,
    property.sharedProfile.bedrooms ? `${property.sharedProfile.bedrooms} bd` : null,
    property.sharedProfile.bathrooms ? `${property.sharedProfile.bathrooms} ba` : null,
    property.sharedProfile.unitCount
      ? `${property.sharedProfile.unitCount} unit${property.sharedProfile.unitCount === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean);

  return bits.join(" • ") || "Shared property profile not filled out yet";
};

const countActiveWorkspaces = (property) =>
  ["pipeline", "acquisitions", "management"].filter((workspaceKey) => property.workspaces[workspaceKey])
    .length;

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const data = await getProperties();
        setProperties(data);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to load properties.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const summary = useMemo(
    () => ({
      total: properties.length,
      pipeline: properties.filter((property) => property.workspaces.pipeline).length,
      acquisitions: properties.filter((property) => property.workspaces.acquisitions).length,
      management: properties.filter((property) => property.workspaces.management).length,
    }),
    [properties]
  );

  const filteredProperties = useMemo(() => {
    if (filter === "all") {
      return properties;
    }

    return properties.filter((property) => property.workspaces[filter]);
  }, [filter, properties]);

  const visibleProperties = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return filteredProperties;
    }

    return filteredProperties.filter((property) => {
      const haystack = [
        property.title,
        property.placement,
        property.propertyKey,
        property.sharedProfile.propertyType,
        formatPropertyDetails(property),
        property.workspaces.pipeline?.status,
        property.workspaces.acquisitions?.strategyLabel,
        property.workspaces.management?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [filteredProperties, searchValue]);

  const propertyColumns = useMemo(
    () => [
      {
        id: "property",
        label: "Property",
        sortValue: (property) => property.title || property.placement || property.propertyKey,
        render: (property) => (
          <div>
            <Link
              to={`/properties/${encodeURIComponent(property.propertyKey)}`}
              className="font-semibold text-ink-900 transition hover:text-verdigris-700"
            >
              {property.title}
            </Link>
            <p className="mt-1 text-sm text-ink-500">{property.placement}</p>
          </div>
        ),
      },
      {
        id: "profile",
        label: "Shared profile",
        sortValue: (property) => property.sharedProfile.propertyType || "",
        render: (property) => (
          <div>
            <p className="font-medium text-ink-800">
              {property.sharedProfile.propertyType || "Profile not filled out"}
            </p>
            <p className="mt-1 text-sm text-ink-500">{formatPropertyDetails(property)}</p>
          </div>
        ),
      },
      {
        id: "workspaces",
        label: "Active workspaces",
        sortValue: (property) => countActiveWorkspaces(property),
        render: (property) => (
          <div className="flex flex-wrap gap-2">
            {property.workspaces.pipeline ? (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${workspaceStyles.pipeline}`}>
                Leads: {property.workspaces.pipeline.status}
              </span>
            ) : null}
            {property.workspaces.acquisitions ? (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${workspaceStyles.acquisitions}`}>
                Investments: {property.workspaces.acquisitions.strategyLabel}
              </span>
            ) : null}
            {property.workspaces.management ? (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${workspaceStyles.management}`}>
                Managed: {property.workspaces.management.status}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "actions",
        label: "Shortcuts",
        align: "right",
        render: (property) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              to={`/properties/${encodeURIComponent(property.propertyKey)}`}
              className="inline-flex items-center rounded-full bg-ink-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-ink-800"
            >
              Open property
            </Link>
            {property.workspaces.pipeline?.path ? (
              <Link
                to={property.workspaces.pipeline.path}
                className="inline-flex items-center rounded-full bg-sand-100 px-3.5 py-2 text-xs font-semibold text-ink-700 transition hover:bg-sand-200"
              >
                <UsersIcon className="mr-1.5 h-3.5 w-3.5" />
                Lead
              </Link>
            ) : null}
            {property.workspaces.acquisitions?.path ? (
              <Link
                to={property.workspaces.acquisitions.path}
                className="inline-flex items-center rounded-full bg-verdigris-50 px-3.5 py-2 text-xs font-semibold text-verdigris-700 transition hover:bg-verdigris-100"
              >
                <BriefcaseIcon className="mr-1.5 h-3.5 w-3.5" />
                Investment
              </Link>
            ) : null}
            {property.workspaces.management?.path ? (
              <Link
                to={property.workspaces.management.path}
                className="inline-flex items-center rounded-full bg-clay-50 px-3.5 py-2 text-xs font-semibold text-clay-700 transition hover:bg-clay-100"
              >
                <BuildingOffice2Icon className="mr-1.5 h-3.5 w-3.5" />
                Managed Properties
              </Link>
            ) : null}
          </div>
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="section-card px-6 py-10 text-center text-ink-500">
        Loading properties...
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-card px-6 py-10 text-center text-clay-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Unified property hub</span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900">
              One property record, multiple workspaces.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
              See where each property lives across pipeline, acquisitions, and management, then
              open the shared workspace to edit the common property profile once.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/properties/new?workspace=pipeline" className="secondary-action">
                Start in pipeline
              </Link>
              <Link to="/properties/new" className="primary-action">
                New property
              </Link>
              <Link to="/properties/new?workspace=management" className="secondary-action">
                Start in management
              </Link>
            </div>
          </div>

          <div className="section-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Property records
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink-900">{summary.total}</h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                <HomeModernIcon className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">In pipeline</span>
                <span className="text-sm font-semibold text-ink-900">{summary.pipeline}</span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-sand-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">In acquisitions</span>
                <span className="text-sm font-semibold text-ink-900">{summary.acquisitions}</span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-clay-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">In management</span>
                <span className="text-sm font-semibold text-ink-900">{summary.management}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total properties"
          value={summary.total}
          detail="Canonical property records currently visible in the workspace."
        />
        <SummaryCard
          label="Lead workspaces"
          value={summary.pipeline}
          detail="Properties carrying seller or lead workflow activity."
        />
        <SummaryCard
          label="Investment workspaces"
          value={summary.acquisitions}
          detail="Properties with underwriting, strategy, or project execution."
        />
        <SummaryCard
          label="Managed property workspaces"
          value={summary.management}
          detail="Properties currently active in operations and leasing."
        />
      </section>

      <WorkspaceDataTable
        title="Properties"
        description="Filter by workspace, search shared details, and open the right record without scanning large cards."
        columns={propertyColumns}
        rows={visibleProperties}
        rowKey={(property) => property.propertyKey}
        defaultSort={{ columnId: "property", direction: "asc" }}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder="Search property name, placement, type, or workspace"
        toolbarContent={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filterOption) => (
                <button
                  key={filterOption.value}
                  type="button"
                  onClick={() => setFilter(filterOption.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    filter === filterOption.value
                      ? "bg-ink-900 text-white"
                      : "bg-sand-50 text-ink-600 hover:bg-sand-100"
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>

            <div className="rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink-600">
              Showing {visibleProperties.length} of {filteredProperties.length}
            </div>
          </div>
        }
        emptyTitle={
          filteredProperties.length === 0
            ? "No properties in this view yet"
            : "No properties match this search"
        }
        emptyDescription={
          filteredProperties.length === 0
            ? "Start with a standalone property record, or add a lead to seed a new shared asset."
            : "Try a different workspace filter or search term to pull the right properties into view."
        }
        emptyActions={
          filteredProperties.length === 0 ? (
            <>
              <Link to="/properties/new?workspace=pipeline" className="secondary-action">
                Start in pipeline
              </Link>
              <Link to="/properties/new" className="primary-action">
                New property
              </Link>
              <Link to="/properties/new?workspace=management" className="secondary-action">
                Start in management
              </Link>
            </>
          ) : null
        }
      />
    </div>
  );
};

export default PropertiesPage;
