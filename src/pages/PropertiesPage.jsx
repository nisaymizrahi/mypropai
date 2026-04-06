import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HomeModernIcon } from "@heroicons/react/24/outline";

import WorkspaceDataTable from "../components/WorkspaceDataTable";
import { getProperties } from "../utils/api";
import { buildPropertyWorkspacePath } from "../utils/propertyWorkspaceNavigation";

const propertyViewOptions = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "setup", label: "Needs setup" },
];

const FilterButton = ({ label, count, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-ink-900 text-white"
        : "bg-white text-ink-600 ring-1 ring-ink-100 hover:bg-ink-50"
    }`}
  >
    <span>{label}</span>
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs ${
        isActive ? "bg-white/15 text-white" : "bg-sand-50 text-ink-500"
      }`}
    >
      {count}
    </span>
  </button>
);

const StatusPill = ({ label, tone }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>
);

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const formatDate = (value) => {
  if (!value) return "No recent update";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "No recent update";
  return parsed.toLocaleDateString();
};

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

  return bits.join(" • ") || "Add core property details";
};

const formatListingSummary = (property) => {
  if (!property.sharedProfile.listingStatus && !property.sharedProfile.sellerAskingPrice) {
    return "";
  }

  const bits = [property.sharedProfile.listingStatus || "For sale"];
  if (property.sharedProfile.sellerAskingPrice) {
    bits.push(formatCurrency(property.sharedProfile.sellerAskingPrice));
  }

  return bits.join(" • ");
};

const getPropertyWorkspaceState = (property) => {
  const hasPipeline = Boolean(property?.workspaces?.pipeline);
  const isActive = Boolean(property?.workspaces?.pipeline?.inPropertyWorkspace);
  const hasAcquisitions = Boolean(property?.workspaces?.acquisitions);
  const needsSetup = !isActive && !hasAcquisitions;

  if (isActive && hasAcquisitions) {
    return {
      headline: "Ready",
      detail: "All main workspace tabs are available.",
      tone: "bg-verdigris-50 text-verdigris-700",
      actionLabel: "Open workspace",
      actionPath: buildPropertyWorkspacePath(property.propertyKey),
      needsSetup,
    };
  }

  if (hasAcquisitions) {
    return {
      headline: hasPipeline ? "Needs analysis" : "Financials ready",
      detail: hasPipeline
        ? "Activate the linked lead for comps and reports."
        : "Add a lead when you want analysis.",
      tone: "bg-sky-50 text-sky-700",
      actionLabel: hasPipeline ? "Open settings" : "Open workspace",
      actionPath: hasPipeline
        ? buildPropertyWorkspacePath(property.propertyKey, "settings")
        : buildPropertyWorkspacePath(property.propertyKey),
      needsSetup,
    };
  }

  if (isActive) {
    return {
      headline: "Needs financials",
      detail: "Add financials for budgets, documents, and execution.",
      tone: "bg-sand-50 text-ink-700",
      actionLabel: "Open workspace",
      actionPath: buildPropertyWorkspacePath(property.propertyKey),
      needsSetup,
    };
  }

  if (hasPipeline) {
    return {
      headline: "Activate analysis",
      detail: "Turn on the linked lead inside Property Workspace.",
      tone: "bg-sand-50 text-ink-700",
      actionLabel: "Open settings",
      actionPath: buildPropertyWorkspacePath(property.propertyKey, "settings"),
      needsSetup,
    };
  }

  return {
    headline: "Needs setup",
    detail: "Start here, then add a lead or financials when needed.",
    tone: "bg-clay-50 text-clay-700",
    actionLabel: "Open settings",
    actionPath: buildPropertyWorkspacePath(property.propertyKey, "settings"),
    needsSetup,
  };
};

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [viewFilter, setViewFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getProperties();
        setProperties(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to load properties.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const summary = useMemo(() => {
    const listed = properties.filter(
      (property) =>
        Boolean(property.sharedProfile.listingStatus) ||
        Boolean(property.sharedProfile.sellerAskingPrice)
    ).length;
    const ready = properties.filter((property) => !getPropertyWorkspaceState(property).needsSetup).length;
    const needsSetup = properties.length - ready;

    return {
      total: properties.length,
      ready,
      needsSetup,
      listed,
    };
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (viewFilter === "ready") {
      return properties.filter((property) => !getPropertyWorkspaceState(property).needsSetup);
    }

    if (viewFilter === "setup") {
      return properties.filter((property) => getPropertyWorkspaceState(property).needsSetup);
    }

    return properties;
  }, [properties, viewFilter]);

  const visibleProperties = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return filteredProperties;
    }

    return filteredProperties.filter((property) => {
      const state = getPropertyWorkspaceState(property);
      const haystack = [
        property.title,
        property.propertyKey,
        property.sharedProfile.propertyType,
        formatPropertyDetails(property),
        formatListingSummary(property),
        state.headline,
        state.detail,
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
        sortValue: (property) => property.title || property.propertyKey,
        render: (property) => (
          <div>
            <Link
              to={buildPropertyWorkspacePath(property.propertyKey)}
              className="font-semibold text-ink-900 transition hover:text-verdigris-700"
            >
              {property.title}
            </Link>
            <p className="mt-1 text-sm text-ink-500">{property.propertyKey}</p>
            <p className="mt-2 text-sm text-ink-500">{formatPropertyDetails(property)}</p>
            {formatListingSummary(property) ? (
              <p className="mt-2 text-sm font-medium text-verdigris-700">
                {formatListingSummary(property)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "status",
        label: "Status",
        sortValue: (property) => getPropertyWorkspaceState(property).headline,
        render: (property) => {
          const state = getPropertyWorkspaceState(property);

          return (
            <div className="space-y-2">
              <StatusPill label={state.headline} tone={state.tone} />
              <p className="text-sm text-ink-500">{state.detail}</p>
            </div>
          );
        },
      },
      {
        id: "updated",
        label: "Updated",
        sortValue: (property) => property.updatedAt || property.createdAt || "",
        render: (property) => (
          <div>
            <p className="font-medium text-ink-800">{formatDate(property.updatedAt || property.createdAt)}</p>
            <p className="mt-1 text-sm text-ink-500">
              {property.workspaces?.pipeline?.status || "No lead stage"}
            </p>
          </div>
        ),
      },
      {
        id: "actions",
        label: "Action",
        align: "right",
        render: (property) => {
          const state = getPropertyWorkspaceState(property);

          return (
            <div className="flex justify-end">
              <Link
                to={state.actionPath}
                className="inline-flex items-center rounded-full bg-ink-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-ink-800"
              >
                {state.actionLabel}
              </Link>
            </div>
          );
        },
      },
    ],
    []
  );

  if (loading) {
    return <div className="section-card px-6 py-10 text-center text-ink-500">Loading properties...</div>;
  }

  if (error) {
    return <div className="section-card px-6 py-10 text-center text-clay-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_320px]">
          <div>
            <span className="eyebrow">Properties</span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900">
              One clean home for every property.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
              Open ready workspaces fast, spot what still needs setup, and keep every record easy to find.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/properties/new" className="primary-action">
                Add property
              </Link>
              <Link to="/leads" className="secondary-action">
                Open leads
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

            <div className="mt-7 space-y-3">
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">Ready</span>
                <span className="text-sm font-semibold text-ink-900">{summary.ready}</span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-sand-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Needs setup</span>
                <span className="text-sm font-semibold text-ink-900">{summary.needsSetup}</span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">Listed</span>
                <span className="text-sm font-semibold text-ink-900">{summary.listed}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WorkspaceDataTable
        title="Property records"
        description="Search and jump to the next action."
        columns={propertyColumns}
        rows={visibleProperties}
        rowKey={(property) => property.propertyKey}
        defaultSort={{ columnId: "updated", direction: "desc" }}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder="Search address, key, property type, or status"
        toolbarContent={
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {propertyViewOptions.map((option) => {
                const count =
                  option.id === "ready"
                    ? summary.ready
                    : option.id === "setup"
                      ? summary.needsSetup
                      : summary.total;

                return (
                  <FilterButton
                    key={option.id}
                    label={option.label}
                    count={count}
                    isActive={option.id === viewFilter}
                    onClick={() => setViewFilter(option.id)}
                  />
                );
              })}
            </div>

            <div className="rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink-600">
              Showing {visibleProperties.length} of {filteredProperties.length}
            </div>
          </div>
        }
        emptyTitle={
          properties.length === 0
            ? "No properties yet"
            : viewFilter === "ready"
              ? "No ready properties match this search"
              : viewFilter === "setup"
                ? "No setup-needed properties match this search"
                : "No properties match this search"
        }
        emptyDescription={
          properties.length === 0
            ? "Add the first property to start the workspace."
            : "Try a different search term or switch filters."
        }
        emptyActions={
          properties.length === 0 ? (
            <Link to="/properties/new" className="primary-action">
              Add property
            </Link>
          ) : null
        }
      />
    </div>
  );
};

export default PropertiesPage;
