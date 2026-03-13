import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  HomeModernIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import EmptyState from "../components/EmptyState";
import { getInvestments } from "../utils/api";
import {
  canStartManagement,
  getInvestmentStrategyLabel,
  normalizeInvestmentStrategy,
} from "../utils/propertyStrategy";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getStatusClassName = (status) => {
  switch (status) {
    case "Completed":
      return "border border-verdigris-200 bg-verdigris-50 text-verdigris-700";
    case "In Progress":
      return "border border-sand-200 bg-sand-50 text-sand-700";
    case "Sold":
      return "border border-clay-200 bg-clay-50 text-clay-700";
    case "Archived":
      return "border border-ink-100 bg-ink-50 text-ink-500";
    default:
      return "border border-ink-200 bg-white text-ink-700";
  }
};

const MyInvestments = () => {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const data = await getInvestments();
        setInvestments(data);
      } catch (err) {
        setError(err.message || "Failed to load investments.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  const activeProjects = investments.filter(
    (investment) => !["Archived", "Sold"].includes(investment.status)
  ).length;
  const managementReady = investments.filter(
    (investment) => canStartManagement(investment) && !investment.managedProperty
  ).length;
  const inManagement = investments.filter((investment) => Boolean(investment.managedProperty)).length;
  const averageProgress = investments.length
    ? Math.round(
        investments.reduce((sum, investment) => sum + Number(investment.progress || 0), 0) /
          investments.length
      )
    : 0;

  if (loading) {
    return (
      <div className="surface-panel flex items-center justify-center px-6 py-20">
        <div className="flex items-center gap-4 text-ink-500">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-200 border-t-verdigris-500" />
          <p className="text-sm font-medium">Loading your investment pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="section-card px-6 py-10 text-center text-clay-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_360px]">
          <div>
            <span className="eyebrow">Acquisitions workspace</span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight text-ink-900 sm:text-5xl">
              Manage every investment with a cleaner, more executive-grade portfolio view.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600 sm:text-lg">
              Track acquisition assumptions, project progress, and management readiness across your
              pipeline without losing the operational context.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-verdigris-200 bg-verdigris-50 px-4 py-2 text-sm font-medium text-verdigris-700">
                {activeProjects} active project{activeProjects === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-ink-200 bg-white/90 px-4 py-2 text-sm font-medium text-ink-700">
                {managementReady} management-ready
              </span>
              <span className="rounded-full border border-sand-200 bg-sand-50 px-4 py-2 text-sm font-medium text-sand-700">
                {averageProgress}% average progress
              </span>
            </div>
          </div>

          <div className="section-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
                <BuildingOffice2Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Portfolio action
                </p>
                <p className="mt-1 text-lg font-semibold text-ink-900">Start a new acquisition profile</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-ink-500">
              Add a property, capture underwriting assumptions, and turn it into a management-ready
              asset when the project is stabilized.
            </p>

            <button
              type="button"
              onClick={() => navigate("/properties/new?workspace=acquisitions")}
              className="primary-action mt-6 w-full"
            >
              Add new property
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-tile p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
            <HomeModernIcon className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
            Total projects
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink-900">{investments.length}</p>
          <p className="mt-2 text-sm text-ink-500">All acquisitions currently in your workspace.</p>
        </div>

        <div className="metric-tile p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sand-100 text-sand-700">
            <ChartBarIcon className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
            Active pipeline
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink-900">{activeProjects}</p>
          <p className="mt-2 text-sm text-ink-500">Projects not yet sold or archived.</p>
        </div>

        <div className="metric-tile p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay-50 text-clay-600">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
            Management ready
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink-900">{managementReady}</p>
          <p className="mt-2 text-sm text-ink-500">Eligible to move into active property operations.</p>
        </div>

        <div className="metric-tile p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-50 text-ink-700">
            <BuildingOffice2Icon className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
            In management
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink-900">{inManagement}</p>
          <p className="mt-2 text-sm text-ink-500">Investments already linked to operations.</p>
        </div>
      </section>

      {investments.length > 0 ? (
        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Investment roster</span>
              <h2 className="mt-4 text-3xl font-semibold text-ink-900">Your active pipeline</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Each project card keeps the acquisition story, progress, and next operating move in
                view.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {investments.map((investment) => {
              const strategy = normalizeInvestmentStrategy(investment.strategy || investment.type);
              const progress = Number(investment.progress || 0);
              const status = investment.status || "Not Started";

              return (
                <div key={investment._id} className="section-card overflow-hidden border-white/70 p-0">
                  <div className="relative h-44 overflow-hidden border-b border-white/60 bg-gradient-to-br from-sand-100 via-white to-verdigris-50">
                    {investment.coverImage ? (
                      <img
                        src={investment.coverImage}
                        alt={investment.address}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(232,220,193,0.45),_transparent_34%),linear-gradient(135deg,_rgba(31,111,99,0.12),_rgba(255,255,255,0.92))]" />
                    )}

                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink-900/70 via-ink-900/25 to-transparent px-5 py-4 text-white">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                          {getInvestmentStrategyLabel(strategy)}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold">{investment.address}</h3>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${getStatusClassName(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5 p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] border border-ink-100 bg-white/85 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Purchase
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink-900">
                          {formatCurrency(investment.purchasePrice)}
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-ink-100 bg-white/85 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                          ARV / future value
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink-900">
                          {formatCurrency(investment.arv || investment.purchasePrice)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] border border-ink-100 bg-white/85 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Property type
                        </p>
                        <p className="mt-2 text-sm font-semibold capitalize text-ink-900">
                          {investment.propertyType || "Not specified"}
                        </p>
                      </div>
                      <div className="rounded-[22px] border border-ink-100 bg-white/85 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Progress
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink-900">{progress}% complete</p>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                        <span>Project progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-ink-100">
                        <div
                          className="h-2.5 rounded-full bg-gradient-to-r from-verdigris-700 via-verdigris-500 to-sand-300 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {investment.managedProperty ? (
                        <span className="rounded-full border border-verdigris-200 bg-verdigris-50 px-3 py-1 text-xs font-semibold text-verdigris-700">
                          In management
                        </span>
                      ) : canStartManagement(investment) ? (
                        <span className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1 text-xs font-semibold text-sand-700">
                          Ready for management
                        </span>
                      ) : (
                        <span className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-600">
                          Acquisition stage
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link to={`/investments/${investment._id}`} className="primary-action">
                        Open project hub
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => navigate(`/investments/${investment._id}/edit`)}
                        className="ghost-action"
                      >
                        Edit details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <EmptyState
          icon="🏡"
          title="No investments yet"
          message="Start your first acquisition profile and turn it into a cleaner project hub for underwriting, budgeting, and operations."
          buttonText="Add new investment"
          onButtonClick={() => navigate("/investments/new")}
        />
      )}
    </div>
  );
};

export default MyInvestments;
