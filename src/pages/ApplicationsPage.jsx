import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  HomeModernIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { getApplicationsForProperty } from "../utils/api";

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

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasProperty, setHasProperty] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const propertyId = localStorage.getItem("activePropertyId");
    if (!propertyId) {
      setHasProperty(false);
      return;
    }

    setHasProperty(true);

    const fetchApplications = async () => {
      try {
        setLoading(true);
        const res = await getApplicationsForProperty(propertyId);
        setApplications(res);
      } catch (err) {
        toast.error(err.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Leasing pipeline</span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900">
              Review rental applications with clearer status and faster next steps.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
              Keep application review tied to the active property, understand where each applicant
              sits in the pipeline, and send fresh application links whenever a vacant unit opens.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/applications/send")}
                className="primary-action"
              >
                Send application
              </button>
              <button
                type="button"
                onClick={() => navigate("/management")}
                className="secondary-action"
              >
                Open properties
              </button>
            </div>
          </div>

          <div className="section-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Active property status
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-ink-900">
                  {hasProperty ? "Property selected" : "No property selected"}
                </h3>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                <HomeModernIcon className="h-7 w-7" />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-[18px] bg-sand-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Total applications
                </p>
                <p className="mt-1 text-lg font-semibold text-ink-900">{summary.total}</p>
              </div>
              <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Review queue
                </p>
                <p className="mt-1 text-lg font-semibold text-ink-900">{summary.pending}</p>
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
                Applications currently visible for the active property.
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

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Application roster</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Applicants for the active property</h3>
          </div>
          <button
            type="button"
            onClick={() => navigate("/applications/send")}
            className="secondary-action"
          >
            Send another application
          </button>
        </div>

        {!hasProperty ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-ink-200 bg-sand-50 px-5 py-12 text-center text-ink-500">
            No property is currently active. Open a property first so MyPropAI knows which application pipeline to show.
          </div>
        ) : applications.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-ink-200 bg-sand-50 px-5 py-12 text-center text-ink-500">
            No applications found yet. Send a rental application link to start building the queue.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {applications.map((application) => (
              <Link
                key={application._id}
                to={`/applications/${application._id}`}
                className="rounded-[24px] border border-ink-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-luxe"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-ink-900">
                      {application.applicantInfo?.fullName || "Unnamed applicant"}
                    </p>
                    <p className="mt-1 text-sm text-ink-500">
                      Unit {application.unit?.name || "Unknown"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusStyles[application.status] || "bg-ink-100 text-ink-700"
                    }`}
                  >
                    {application.status}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Email
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-ink-900">
                      {application.applicantInfo?.email || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-ink-100 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Phone
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink-900">
                      {application.applicantInfo?.phone || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 inline-flex items-center text-sm font-semibold text-verdigris-700">
                  Open application
                  <ArrowRightIcon className="ml-1.5 h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ApplicationsPage;
