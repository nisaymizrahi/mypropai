import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRightIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  HomeModernIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import WorkspaceDataTable from "../components/WorkspaceDataTable";
import { getApplications, getManagedProperties } from "../utils/api";

const statusStyles = {
  "Pending Payment": "bg-sand-100 text-sand-700",
  "Pending Screening": "bg-clay-50 text-clay-700",
  "Under Review": "bg-ink-100 text-ink-700",
  Approved: "bg-verdigris-50 text-verdigris-700",
  Denied: "bg-clay-100 text-clay-800",
};

const LoadingSpinner = () => (
  <div className="surface-panel flex items-center justify-center px-6 py-20">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-verdigris-100 border-t-verdigris-500" />
  </div>
);

const buildPropertyQuery = (propertyId) =>
  propertyId ? `?${new URLSearchParams({ propertyId }).toString()}` : "";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In progress" },
  { value: "Approved", label: "Approved" },
  { value: "Denied", label: "Denied" },
];

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [managedProperties, setManagedProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const propertyIdParam = searchParams.get("propertyId") || "";

  useEffect(() => {
    let isMounted = true;

    const fetchManagedProperties = async () => {
      try {
        setPropertiesLoading(true);
        const data = await getManagedProperties();
        if (!isMounted) {
          return;
        }
        setManagedProperties(data || []);
      } catch (err) {
        if (isMounted) {
          toast.error(err.message || "Failed to load managed properties");
        }
      } finally {
        if (isMounted) {
          setPropertiesLoading(false);
        }
      }
    };

    fetchManagedProperties();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPropertyId = useMemo(() => {
    if (managedProperties.some((property) => property._id === propertyIdParam)) {
      return propertyIdParam;
    }

    return "";
  }, [managedProperties, propertyIdParam]);

  useEffect(() => {
    if (propertiesLoading) {
      return;
    }

    if (selectedPropertyId !== propertyIdParam) {
      setSearchParams(selectedPropertyId ? { propertyId: selectedPropertyId } : {}, { replace: true });
    }
  }, [propertiesLoading, propertyIdParam, selectedPropertyId, setSearchParams]);

  useEffect(() => {
    if (propertiesLoading) {
      return;
    }

    let isMounted = true;

    const fetchApplications = async () => {
      try {
        setApplications([]);
        setApplicationsLoading(true);
        const data = await getApplications({
          propertyId: selectedPropertyId || undefined,
        });
        if (isMounted) {
          setApplications(data || []);
        }
      } catch (err) {
        if (isMounted) {
          toast.error(err.message || "Failed to load applications");
        }
      } finally {
        if (isMounted) {
          setApplicationsLoading(false);
        }
      }
    };

    fetchApplications();

    return () => {
      isMounted = false;
    };
  }, [propertiesLoading, selectedPropertyId]);

  const selectedProperty = useMemo(
    () => managedProperties.find((property) => property._id === selectedPropertyId) || null,
    [managedProperties, selectedPropertyId]
  );

  const propertySummary = useMemo(() => {
    const propertiesToSummarize = selectedProperty ? [selectedProperty] : managedProperties;
    const units = propertiesToSummarize.flatMap((property) => property.units || []);
    const occupiedUnits = units.filter((unit) => unit.currentLease || unit.status === "Occupied").length;
    const totalUnits = units.length;

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits: Math.max(0, totalUnits - occupiedUnits),
    };
  }, [managedProperties, selectedProperty]);

  const summary = useMemo(() => {
    const pending = applications.filter((application) =>
      ["Pending Payment", "Pending Screening", "Under Review"].includes(application.status)
    ).length;
    const approved = applications.filter((application) => application.status === "Approved").length;
    const denied = applications.filter((application) => application.status === "Denied").length;

    return {
      total: applications.length,
      pending,
      approved,
      denied,
    };
  }, [applications]);

  const visibleApplications = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    return applications.filter((application) => {
      if (statusFilter === "in_progress") {
        if (!["Pending Payment", "Pending Screening", "Under Review"].includes(application.status)) {
          return false;
        }
      } else if (statusFilter !== "all" && application.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        application.applicantInfo?.fullName,
        application.applicantInfo?.email,
        application.applicantInfo?.phone,
        application.unit?.name || application.unitNameSnapshot,
        application.property?.address || application.propertyAddressSnapshot,
        application.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [applications, searchValue, statusFilter]);

  const propertyQuery = buildPropertyQuery(selectedPropertyId);

  const applicationColumns = useMemo(
    () => [
      {
        id: "applicant",
        label: "Applicant",
        sortValue: (application) => application.applicantInfo?.fullName || "",
        render: (application) => (
          <div>
            <Link
              to={`/applications/${application._id}${propertyQuery}`}
              className="font-semibold text-ink-900 transition hover:text-verdigris-700"
            >
              {application.applicantInfo?.fullName || "Unnamed applicant"}
            </Link>
            <p className="mt-1 text-sm text-ink-500">
              {application.applicantInfo?.email || "No email on file"}
            </p>
          </div>
        ),
      },
      {
        id: "placement",
        label: "Property / Unit",
        sortValue: (application) =>
          `${application.property?.address || application.propertyAddressSnapshot || ""} ${
            application.unit?.name || application.unitNameSnapshot || ""
          }`,
        render: (application) => (
          <div>
            <p className="font-medium text-ink-800">
              {application.unit?.name ||
                application.unitNameSnapshot ||
                (application.applicationScope === "property" ? "No unit selected" : "General application")}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              {application.property?.address ||
                application.propertyAddressSnapshot ||
                "Portfolio-wide application"}
            </p>
          </div>
        ),
      },
      {
        id: "status",
        label: "Status",
        sortValue: (application) => application.status || "",
        render: (application) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              statusStyles[application.status] || "bg-ink-100 text-ink-700"
            }`}
          >
            {application.status}
          </span>
        ),
      },
      {
        id: "contact",
        label: "Phone",
        sortValue: (application) => application.applicantInfo?.phone || "",
        render: (application) => (
          <span className="text-sm text-ink-700">
            {application.applicantInfo?.phone || "N/A"}
          </span>
        ),
      },
      {
        id: "open",
        label: "Open",
        align: "right",
        render: (application) => (
          <Link
            to={`/applications/${application._id}${propertyQuery}`}
            className="inline-flex items-center text-sm font-semibold text-verdigris-700 transition hover:text-verdigris-800"
          >
            Open
            <ArrowRightIcon className="ml-1.5 h-4 w-4" />
          </Link>
        ),
      },
    ],
    [propertyQuery]
  );

  const handlePropertyChange = (event) => {
    const nextPropertyId = event.target.value;
    setSearchParams(nextPropertyId ? { propertyId: nextPropertyId } : {});
  };

  if (propertiesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Leasing pipeline</span>
            <h2 className="page-hero-title">
              Review rental applications with clearer status and property context.
            </h2>
            <p className="page-hero-copy">
              Start from the full leasing queue, then narrow to a single property only when you
              want a tighter review view.
            </p>

            {managedProperties.length > 0 && (
              <div className="mt-6 max-w-sm">
                <label htmlFor="property" className="auth-label">
                  Property
                </label>
                <select
                  id="property"
                  className="auth-input"
                  value={selectedPropertyId}
                  onChange={handlePropertyChange}
                >
                  <option value="">All properties</option>
                  {managedProperties.map((property) => (
                    <option key={property._id} value={property._id}>
                      {property.address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(`/applications/send${propertyQuery}`)}
                className="primary-action"
              >
                Send application
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(selectedPropertyId ? `/management/${selectedPropertyId}` : "/management")
                }
                className="secondary-action"
              >
                {selectedPropertyId ? "Open property" : "Open properties"}
              </button>
            </div>
          </div>

          <div className="section-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Current view
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink-900">
                  {selectedProperty
                    ? selectedProperty.address
                    : managedProperties.length > 0
                      ? "All managed properties"
                      : "No managed properties"}
                </h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                <HomeModernIcon className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-[18px] bg-sand-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Units tracked
                </p>
                <p className="mt-1 text-lg font-semibold text-ink-900">
                  {propertySummary.totalUnits}
                </p>
              </div>
              <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Vacant units
                </p>
                <p className="mt-1 text-lg font-semibold text-ink-900">
                  {propertySummary.vacantUnits}
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
                Total
              </p>
              <p className="mt-4 text-3xl font-semibold text-ink-900">{summary.total}</p>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Applications currently visible in this queue view.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-700">
              <ClipboardDocumentListIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="metric-tile p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                In progress
              </p>
              <p className="mt-4 text-3xl font-semibold text-ink-900">{summary.pending}</p>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Applications still moving through payment, screening, or review.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand-100 text-sand-700">
              <UserGroupIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="metric-tile p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Approved
              </p>
              <p className="mt-4 text-3xl font-semibold text-ink-900">{summary.approved}</p>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Applicants who have cleared review and are ready for the next move.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
              <DocumentCheckIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="metric-tile p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Denied
              </p>
              <p className="mt-4 text-3xl font-semibold text-ink-900">{summary.denied}</p>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                Applications that have been closed out and removed from the queue.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-50 text-clay-700">
              <ArrowRightIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      {managedProperties.length === 0 ? (
        <WorkspaceDataTable
          title="Application roster"
          description="Keep leasing attached to the right property and unit so the review queue stays clean."
          columns={applicationColumns}
          rows={[]}
          rowKey={(application) => application._id}
          emptyTitle="No managed properties yet"
          emptyDescription="Start management on a property first so leasing can stay tied to a real address and unit roster."
          emptyActions={
            <>
              <button
                type="button"
                onClick={() => navigate("/properties/new?workspace=management")}
                className="primary-action"
              >
                Create managed property
              </button>
              <button
                type="button"
                onClick={() => navigate("/properties")}
                className="secondary-action"
              >
                Open property hub
              </button>
            </>
          }
        />
      ) : applicationsLoading ? (
        <div className="section-card p-5 sm:p-6">
          <h3 className="text-xl font-semibold text-ink-900 sm:text-2xl">Application roster</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Loading applicants for {selectedProperty?.address || "your portfolio"}.
          </p>
          <div className="mt-5 rounded-[20px] border border-ink-100 bg-white px-5 py-10">
            <LoadingSpinner />
          </div>
        </div>
      ) : (
        <WorkspaceDataTable
          title={
            selectedProperty
              ? `Applicants for ${selectedProperty.address}`
              : "Application roster"
          }
          description="Search faster, sort by the signal you need, and keep the leasing queue easy to scan."
          columns={applicationColumns}
          rows={visibleApplications}
          rowKey={(application) => application._id}
          defaultSort={{ columnId: "applicant", direction: "asc" }}
          searchValue={searchValue}
          onSearchValueChange={setSearchValue}
          searchPlaceholder="Search applicant name, email, phone, unit, or status"
          toolbarContent={
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((filterOption) => (
                  <button
                    key={filterOption.value}
                    type="button"
                    onClick={() => setStatusFilter(filterOption.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      statusFilter === filterOption.value
                        ? "bg-ink-900 text-white"
                        : "bg-sand-50 text-ink-600 hover:bg-sand-100"
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-full bg-sand-100 px-4 py-2 text-sm font-semibold text-ink-600">
                  Showing {visibleApplications.length} of {applications.length}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/applications/send${propertyQuery}`)}
                  className="secondary-action"
                >
                  Send another application
                </button>
              </div>
            </div>
          }
          emptyTitle={
            applications.length === 0
              ? selectedProperty
                ? "No applications for this property yet"
                : "No applications yet"
              : "No applicants match this view"
          }
          emptyDescription={
            applications.length === 0
              ? selectedProperty
                ? "Send a rental application link to start building the queue for this property."
                : "Send a rental application link to start building your leasing queue."
              : "Try another status or search term to pull the right applicants back into view."
          }
          emptyActions={
            applications.length === 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/applications/send${propertyQuery}`)}
                  className="primary-action"
                >
                  Send application
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(selectedPropertyId ? `/management/${selectedPropertyId}` : "/management")
                  }
                  className="secondary-action"
                >
                  {selectedPropertyId ? "Open property" : "Open properties"}
                </button>
              </>
            ) : null
          }
        />
      )}
    </div>
  );
};

export default ApplicationsPage;
