import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HomeModernIcon } from "@heroicons/react/24/outline";

import WorkspaceDataTable from "../components/WorkspaceDataTable";
import { getProperties } from "../utils/api";

const SummaryCard = ({ label, value, detail }) => (
  <div className="metric-tile p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-4 text-3xl font-semibold text-ink-900">{value}</p>
    <p className="mt-3 text-sm leading-6 text-ink-500">{detail}</p>
  </div>
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
  if (!value) return "—";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "—";
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

  return bits.join(" • ") || "Shared property profile not filled out yet";
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

const isInPropertyWorkspace = (property) =>
  Boolean(
    property?.workspaces?.pipeline?.inPropertyWorkspace &&
      property?.workspaces?.pipeline?.status === "Closed - Won"
  );

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getProperties();
        setProperties(data);
      } catch (fetchError) {
        setError(fetchError.message || "Failed to load property workspaces.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const workspaceProperties = useMemo(
    () => properties.filter((property) => isInPropertyWorkspace(property)),
    [properties]
  );

  const summary = useMemo(
    () => ({
      total: workspaceProperties.length,
      listed: workspaceProperties.filter(
        (property) =>
          Boolean(property.sharedProfile.listingStatus) ||
          Boolean(property.sharedProfile.sellerAskingPrice)
      ).length,
      updatedRecently: workspaceProperties.filter((property) => {
        if (!property.updatedAt) return false;
        const updatedAt = new Date(property.updatedAt).valueOf();
        if (!Number.isFinite(updatedAt)) return false;
        return updatedAt >= Date.now() - 1000 * 60 * 60 * 24 * 30;
      }).length,
    }),
    [workspaceProperties]
  );

  const visibleProperties = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return workspaceProperties;
    }

    return workspaceProperties.filter((property) => {
      const haystack = [
        property.title,
        property.propertyKey,
        property.sharedProfile.propertyType,
        formatPropertyDetails(property),
        formatListingSummary(property),
        property.workspaces.pipeline?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [searchValue, workspaceProperties]);

  const propertyColumns = useMemo(
    () => [
      {
        id: "property",
        label: "Property",
        sortValue: (property) => property.title || property.propertyKey,
        render: (property) => (
          <div>
            <Link
              to={`/properties/${encodeURIComponent(property.propertyKey)}`}
              className="font-semibold text-ink-900 transition hover:text-verdigris-700"
            >
              {property.title}
            </Link>
            <p className="mt-1 text-sm text-ink-500">{property.propertyKey}</p>
            {formatListingSummary(property) ? (
              <p className="mt-2 text-sm font-medium text-verdigris-700">
                {formatListingSummary(property)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "source",
        label: "Source lead",
        sortValue: (property) => property.updatedAt || "",
        render: (property) => (
          <div>
            <p className="font-medium text-ink-800">Closed - Won</p>
            <p className="mt-1 text-sm text-ink-500">
              Moved into Property Workspace
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-400">
              Updated {formatDate(property.updatedAt)}
            </p>
          </div>
        ),
      },
      {
        id: "profile",
        label: "Property details",
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
        id: "actions",
        label: "Action",
        align: "right",
        render: (property) => (
          <div className="flex justify-end">
            <Link
              to={`/properties/${encodeURIComponent(property.propertyKey)}`}
              className="inline-flex items-center rounded-full bg-ink-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-ink-800"
            >
              Open property
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="section-card px-6 py-10 text-center text-ink-500">
        Loading property workspaces...
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
            <span className="eyebrow">Property Workspace</span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900">
              Closed deals you intentionally moved here.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
              This page only shows properties that were moved into Property Workspace from a
              Closed - Won lead. Use the lead record when you want to move another property in.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/leads" className="secondary-action">
                Open leads
              </Link>
            </div>
          </div>

          <div className="section-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Property workspaces
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink-900">{summary.total}</h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                <HomeModernIcon className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">Currently listed</span>
                <span className="text-sm font-semibold text-ink-900">{summary.listed}</span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-sand-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Updated in 30 days</span>
                <span className="text-sm font-semibold text-ink-900">{summary.updatedRecently}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Property workspaces"
          value={summary.total}
          detail="Properties currently visible in this dedicated workspace."
        />
        <SummaryCard
          label="Listed properties"
          value={summary.listed}
          detail="Workspaces still carrying live sale status or asking price data."
        />
        <SummaryCard
          label="Updated recently"
          value={summary.updatedRecently}
          detail="Properties touched in the last 30 days."
        />
      </section>

      <WorkspaceDataTable
        title="Property Workspace"
        description="Search the moved property list and open the right workspace without extra filters."
        columns={propertyColumns}
        rows={visibleProperties}
        rowKey={(property) => property.propertyKey}
        defaultSort={{ columnId: "property", direction: "asc" }}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        searchPlaceholder="Search address, property type, or details"
        toolbarContent={
          <div className="flex justify-end">
            <div className="rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink-600">
              Showing {visibleProperties.length} of {workspaceProperties.length}
            </div>
          </div>
        }
        emptyTitle={
          workspaceProperties.length === 0
            ? "No properties in Property Workspace yet"
            : "No properties match this search"
        }
        emptyDescription={
          workspaceProperties.length === 0
            ? "Move a Closed - Won lead into Property Workspace from the lead detail screen."
            : "Try a different search term to find the property you want."
        }
        emptyActions={
          workspaceProperties.length === 0 ? (
            <Link to="/leads" className="primary-action">
              Open leads
            </Link>
          ) : null
        }
      />
    </div>
  );
};

export default PropertiesPage;
