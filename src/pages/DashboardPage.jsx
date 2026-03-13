import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BuildingOffice2Icon,
  ClockIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  RectangleStackIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";
import { getDashboardSummary } from "../utils/api";

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

const MetricCard = ({ title, value, detail, accent = "verdigris", icon: Icon, linkTo }) => {
  const accentClasses = {
    verdigris: "bg-verdigris-50 text-verdigris-700",
    clay: "bg-clay-50 text-clay-700",
    sand: "bg-sand-100 text-sand-700",
    ink: "bg-ink-100 text-ink-700",
  };

  return (
    <Link
      to={linkTo}
      className="metric-tile block p-4 sm:p-5 transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            {title}
          </p>
          <p className="mt-3 text-[1.8rem] font-semibold text-ink-900 sm:text-[2rem]">{value}</p>
          <p className="mt-2 text-sm leading-5 text-ink-500">{detail}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClasses[accent]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Link>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const summaryData = await getDashboardSummary();
        setSummary(summaryData);
      } catch (err) {
        setError(err.message || "Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="section-card px-6 py-10 text-center text-clay-700">
        {error}
      </div>
    );
  }
  if (!summary) {
    return (
      <div className="section-card px-6 py-10 text-center text-ink-500">
        No summary data available.
      </div>
    );
  }

  const { kpis = {}, recentActivity = {}, actionItems = {}, propertyHub = {} } = summary;
  const tasks = actionItems.tasks || [];
  const expenses = recentActivity.expenses || [];
  const occupancyRate = Number.isFinite(kpis.occupancyRate) ? kpis.occupancyRate : 0;
  const portfolioValue = kpis.portfolioValue || 0;
  const monthlyRent = kpis.monthlyRent || 0;
  const workspaceCounts = propertyHub.workspaceCounts || {
    pipeline: kpis.pipelineProperties || 0,
    acquisitions: kpis.acquisitionProperties || kpis.activeProjects || 0,
    management: kpis.managedProperties || 0,
  };
  const totalProperties = propertyHub.totalProperties ?? kpis.totalProperties ?? 0;
  const standaloneProperties = propertyHub.standaloneProperties ?? kpis.standaloneProperties ?? 0;
  const acquisitionWorkspaces = workspaceCounts.acquisitions || 0;
  const propertiesWithWorkspace =
    propertyHub.propertiesWithWorkspace ?? Math.max(totalProperties - standaloneProperties, 0);
  const activeWorkspaces =
    propertyHub.activeWorkspaces ??
    kpis.activeWorkspaces ??
    workspaceCounts.pipeline + workspaceCounts.acquisitions + workspaceCounts.management;
  const workspaceCoverageRate =
    propertyHub.workspaceCoverageRate ??
    kpis.workspaceCoverageRate ??
    (totalProperties > 0 ? (propertiesWithWorkspace / totalProperties) * 100 : 0);

  return (
    <div className="space-y-5">
      <section className="surface-panel-strong relative overflow-hidden px-5 py-6 sm:px-7">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <div>
            <span className="eyebrow">Executive snapshot</span>
            <h2 className="page-hero-title">
              Good afternoon{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
            </h2>
            <p className="page-hero-copy">
              You currently have{" "}
              <span className="font-semibold text-ink-900">
                {totalProperties}
              </span>{" "}
              property record{totalProperties === 1 ? "" : "s"} spanning{" "}
              <span className="font-semibold text-ink-900">
                {workspaceCounts.pipeline}
              </span>{" "}
              pipeline,{" "}
              <span className="font-semibold text-ink-900">{acquisitionWorkspaces}</span>{" "}
              acquisitions, and{" "}
              <span className="font-semibold text-ink-900">
                {workspaceCounts.management}
              </span>{" "}
              management workspace{workspaceCounts.management === 1 ? "" : "s"}.{" "}
              {standaloneProperties > 0 ? (
                <>
                  <span className="font-semibold text-ink-900">{standaloneProperties}</span>{" "}
                  still need placement into an active workflow.
                </>
              ) : (
                <>
                  <span className="font-semibold text-ink-900">
                    {workspaceCoverageRate.toFixed(0)}%
                  </span>{" "}
                  of the portfolio is already placed into a working operating context.
                </>
              )}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[20px] bg-ink-900 px-4 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Tracked value
                </p>
                <p className="mt-3 text-[1.85rem] font-semibold">
                  {currencyFormatter.format(portfolioValue)}
                </p>
              </div>
              <div className="rounded-[20px] border border-ink-100 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Needs placement
                </p>
                <p className="mt-3 text-[1.85rem] font-semibold text-ink-900">
                  {standaloneProperties}
                </p>
              </div>
              <div className="rounded-[20px] border border-ink-100 bg-sand-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Priority queue
                </p>
                <p className="mt-3 text-[1.85rem] font-semibold text-ink-900">{tasks.length}</p>
              </div>
            </div>
          </div>

          <div className="section-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Workspace coverage
                </p>
                <h3 className="mt-2 text-xl font-semibold text-ink-900">
                  Property placement
                </h3>
              </div>
              <div className="rounded-full bg-verdigris-50 px-4 py-2 text-sm font-semibold text-verdigris-700">
                {workspaceCoverageRate.toFixed(0)}% placed
              </div>
            </div>

            <div className="mt-6">
              <div className="h-3 w-full overflow-hidden rounded-full bg-sand-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#1f6f63_0%,#3b8f81_100%)]"
                  style={{ width: `${Math.max(workspaceCoverageRate, totalProperties > 0 ? 6 : 0)}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-ink-500">
                <span>Properties in a workspace</span>
                <span>{propertiesWithWorkspace}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-[18px] bg-sand-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Pipeline</span>
                <span className="text-sm font-semibold text-ink-900">
                  {workspaceCounts.pipeline}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">Acquisitions</span>
                <span className="text-sm font-semibold text-ink-900">{acquisitionWorkspaces}</span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-clay-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Management</span>
                <span className="text-sm font-semibold text-ink-900">
                  {workspaceCounts.management}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">Standalone</span>
                <span className="text-sm font-semibold text-ink-900">
                  {standaloneProperties}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <Link to="/properties" className="secondary-action w-full justify-center">
                <SparklesIcon className="mr-2 h-5 w-5" />
                Open property hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total properties"
          value={totalProperties}
          detail="Canonical property records currently visible in the shared workspace."
          accent="ink"
          icon={HomeModernIcon}
          linkTo="/properties"
        />
        <MetricCard
          title="Active workspaces"
          value={activeWorkspaces}
          detail="Combined pipeline, acquisitions, and management placements across the portfolio."
          accent="clay"
          icon={RectangleStackIcon}
          linkTo="/properties"
        />
        <MetricCard
          title="Gross monthly rent"
          value={currencyFormatter.format(monthlyRent)}
          detail="Expected monthly rental income currently under management."
          accent="verdigris"
          icon={CurrencyDollarIcon}
          linkTo="/management"
        />
        <MetricCard
          title="Occupancy rate"
          value={`${occupancyRate.toFixed(0)}%`}
          detail="Leased unit share across your current management portfolio."
          accent="sand"
          icon={BuildingOffice2Icon}
          linkTo="/management"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div className="section-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="eyebrow">Priority queue</span>
              <h3 className="mt-3 text-xl font-semibold text-ink-900">Action items that need attention</h3>
            </div>
            <Link to="/properties" className="secondary-action hidden sm:inline-flex">
              Open property hub
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task._id}
                  className="rounded-[18px] border border-ink-100 bg-white px-4 py-3.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{task.title}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-500">
                        Due {new Date(task.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-50 text-clay-700">
                      <ClockIcon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-5 py-10 text-center text-ink-500">
                No urgent tasks are coming due right now.
              </div>
            )}
          </div>
        </div>

        <div className="section-card p-5 sm:p-6">
          <span className="eyebrow">Cash movement</span>
          <h3 className="mt-3 text-xl font-semibold text-ink-900">Recent expenses</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Quick visibility into the latest spend flowing through the portfolio.
          </p>

          <div className="mt-5 space-y-3">
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between rounded-[18px] border border-ink-100 bg-white px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {expense.description}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-400">
                      Recent transaction
                    </p>
                  </div>
                  <span className="ml-4 text-sm font-semibold text-ink-900">
                    {currencyFormatter.format(expense.amount || 0)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-5 py-10 text-center text-ink-500">
                No recent expenses recorded.
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link to="/properties" className="secondary-action w-full">
              Open properties
            </Link>
            <Link to="/applications" className="secondary-action w-full">
              Review applications
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
