import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  HomeModernIcon,
  RectangleStackIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import AISummaryCard from "../components/AISummaryCard";
import DashboardStatCard from "../components/DashboardStatCard";
import DealScoreCard from "../components/DealScoreCard";
import ProfitSnapshot from "../components/ProfitSnapshot";
import RiskIndicator from "../components/RiskIndicator";
import { useAuth } from "../context/AuthContext";
import { getDashboardSummary, getLeads } from "../utils/api";
import {
  DEAL_ASSET_PATHS,
  formatDealCompactCurrency,
  formatDealPercent,
  marketingDealShowcase,
  summarizeLeadPortfolio,
} from "../utils/dealIntelligence";

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

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryResult, leadsResult] = await Promise.allSettled([
          getDashboardSummary(),
          getLeads(),
        ]);

        if (summaryResult.status === "fulfilled") {
          setSummary(summaryResult.value);
        } else {
          throw summaryResult.reason;
        }

        if (leadsResult.status === "fulfilled") {
          setLeads(Array.isArray(leadsResult.value) ? leadsResult.value : []);
        }
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

  const showcasePortfolio = summarizeLeadPortfolio(
    marketingDealShowcase.map((analysis) => analysis.lead)
  );
  const livePortfolio = summarizeLeadPortfolio(leads);
  const portfolioSignals = livePortfolio.count ? livePortfolio : showcasePortfolio;
  const featuredDeal = portfolioSignals.featured;

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
    workspaceCounts.pipeline + workspaceCounts.acquisitions;
  const workspaceCoverageRate =
    propertyHub.workspaceCoverageRate ??
    kpis.workspaceCoverageRate ??
    (totalProperties > 0 ? (propertiesWithWorkspace / totalProperties) * 100 : 0);

  return (
    <div className="space-y-5">
      <section className="surface-panel-strong relative overflow-hidden px-5 py-6 sm:px-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,143,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_32%)]" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.06fr)_420px]">
          <div>
            <span className="eyebrow">Executive AI snapshot</span>
            <h2 className="page-hero-title">
              Good afternoon{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
            </h2>
            <p className="page-hero-copy">
              Your workspace spans{" "}
              <span className="font-semibold text-ink-900">{totalProperties}</span> property
              record{totalProperties === 1 ? "" : "s"} and{" "}
              <span className="font-semibold text-ink-900">{portfolioSignals.count}</span>{" "}
              modeled deal{portfolioSignals.count === 1 ? "" : "s"} worth reviewing.{" "}
              <span className="font-semibold text-ink-900">
                {workspaceCoverageRate.toFixed(0)}%
              </span>{" "}
              of the portfolio is already placed into an active workflow, while{" "}
              <span className="font-semibold text-ink-900">{standaloneProperties}</span> still need
              placement.
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
                  Average deal score
                </p>
                <p className="mt-3 text-[1.85rem] font-semibold text-ink-900">
                  {Math.round(portfolioSignals.averageScore || 0)}/100
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

          <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/75 p-4 shadow-soft backdrop-blur-sm">
            <img
              src={DEAL_ASSET_PATHS.marketing.preview}
              alt="Fliprop dashboard preview"
              className="h-full w-full rounded-[24px] object-cover"
            />
          </div>
        </div>

        {featuredDeal ? (
          <div className="relative mt-6 grid gap-4 xl:grid-cols-2">
            <DealScoreCard
              score={featuredDeal.score}
              verdict={featuredDeal.verdict}
              title="Featured live deal"
              label={featuredDeal.address}
              detail={`${featuredDeal.tone.label} with ${formatDealPercent(
                featuredDeal.roi
              )} ROI and ${formatDealCompactCurrency(featuredDeal.profit)} upside.`}
              assetPath={featuredDeal.assetPaths.score}
            />
            <AISummaryCard
              verdict={featuredDeal.verdict}
              headline={featuredDeal.aiSummary.headline}
              detail={featuredDeal.aiSummary.detail}
              recommendation={featuredDeal.aiSummary.recommendation}
              confidenceLabel={featuredDeal.aiSummary.confidenceLabel}
              bullets={featuredDeal.aiSummary.bullets}
              assetPath={featuredDeal.assetPaths.verdict}
            />
            <ProfitSnapshot
              purchasePrice={featuredDeal.purchasePrice}
              rehabCost={featuredDeal.rehabEstimate}
              arv={featuredDeal.arv}
              profit={featuredDeal.profit}
              roi={featuredDeal.roi}
              costBreakdown={featuredDeal.costBreakdown}
              assetPath={featuredDeal.assetPaths.profit}
            />
            <RiskIndicator
              risk={featuredDeal.riskLevel}
              flags={featuredDeal.riskFlags}
              assetPath={featuredDeal.assetPaths.risk}
            />
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Link to="/properties" className="block">
          <DashboardStatCard
          title="Total properties"
          value={totalProperties}
          detail="Canonical property records currently visible in the shared workspace."
          tone="neutral"
          eyebrow="Portfolio"
          icon={HomeModernIcon}
          progress={Math.min(totalProperties * 8, 100)}
        />
        </Link>
        <Link to="/properties" className="block">
          <DashboardStatCard
          title="Active workspaces"
          value={activeWorkspaces}
          detail="Combined deal and financial workspace placements across the portfolio."
          tone="warning"
          eyebrow="Coverage"
          icon={RectangleStackIcon}
          progress={workspaceCoverageRate}
        />
        </Link>
        <Link to="/properties" className="block">
          <DashboardStatCard
          title="Projected monthly rent"
          value={currencyFormatter.format(monthlyRent)}
          detail="Expected monthly rental income across the tracked portfolio."
          tone="success"
          eyebrow="Cashflow"
          icon={CurrencyDollarIcon}
        />
        </Link>
        <Link to="/properties" className="block">
          <DashboardStatCard
          title="Occupied unit rate"
          value={`${occupancyRate.toFixed(0)}%`}
          detail="Leased unit share across the tracked portfolio."
          tone={occupancyRate >= 90 ? "success" : occupancyRate >= 75 ? "warning" : "danger"}
          eyebrow="Leasing"
          icon={BuildingOffice2Icon}
          progress={occupancyRate}
        />
        </Link>
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
