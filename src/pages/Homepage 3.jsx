import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

import AISummaryCard from "../components/AISummaryCard";
import DashboardStatCard from "../components/DashboardStatCard";
import DealScoreCard from "../components/DealScoreCard";
import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import {
  comparisonRows,
  faqItems,
  featureCollections,
  heroSignals,
  operatorProfiles,
  pricingFacts,
  pricingPlans,
  resourceArticles,
  workflowPillars,
} from "../content/marketingContent";
import {
  DEAL_ASSET_PATHS,
  formatDealCompactCurrency,
  formatDealPercent,
  marketingDealShowcase,
} from "../utils/dealIntelligence";

const painPoints = [
  "The deal starts in a spreadsheet, the rehab lives in another tool, and operations end up trapped in shared folders.",
  "Pricing assumptions get buried in calls, texts, and half-finished notes instead of staying attached to the property.",
  "Execution teams lose the context that justified the purchase in the first place.",
];

const heroModules = [
  "Potential properties",
  "AI comps",
  "Property workspace",
  "Financials",
  "Tasks",
  "Vendors",
  "Documents",
  "Billing",
];

const pipelineRows = [
  { address: "1278 Ashby Ave", stage: "Pricing", value: "$412k target", owner: "Call today" },
  { address: "60 Fairview Ln", stage: "Underwriting", value: "$535k ARV", owner: "Need scope" },
  { address: "9 River St", stage: "Offer sent", value: "$298k offer", owner: "Follow up Thu" },
];

const workspaceRows = [
  { label: "Recommended offer", value: "$398k - $412k" },
  { label: "Budget status", value: "Scope + bids active" },
  { label: "Next milestone", value: "Electrical walk" },
];

const billingRows = [
  { label: "Plan", value: "Pro trial" },
  { label: "Included credits", value: "50 / cycle" },
  { label: "Top-up price", value: "$9 / 10" },
];

const workflowSequence = [
  {
    title: "Capture the opportunity",
    detail: "Log the lead, seller context, target price, and next move.",
  },
  {
    title: "Price with confidence",
    detail: "Run comps, save the report, and keep the valuation story on the asset.",
  },
  {
    title: "Execute the work",
    detail: "Move into the property workspace with tasks, vendors, scope, and dates.",
  },
  {
    title: "Operate with memory",
    detail: "Keep documents, recurring work, settings, and billing in the same system.",
  },
];

const visualSystemAssets = [
  {
    title: "Analyze Deal button",
    detail: "High-contrast primary action for instant underwriting.",
    path: DEAL_ASSET_PATHS.ui.analyze,
  },
  {
    title: "Run Comps button",
    detail: "Secondary action for refreshing price support.",
    path: DEAL_ASSET_PATHS.ui.comps,
  },
  {
    title: "AI Insight card",
    detail: "Summary surface for the investor-facing recommendation.",
    path: DEAL_ASSET_PATHS.ui.insight,
  },
  {
    title: "Add Investment panel",
    detail: "Premium entry flow for pipeline creation.",
    path: DEAL_ASSET_PATHS.ui.investment,
  },
];

const chartAssets = [
  {
    title: "ROI chart style",
    detail: "Return comparisons that clarify strong, workable, and risky deals.",
    path: DEAL_ASSET_PATHS.charts.roi,
  },
  {
    title: "Profit breakdown pie",
    detail: "Acquisition, carry, rehab, and margin in one glance.",
    path: DEAL_ASSET_PATHS.charts.profit,
  },
  {
    title: "Rehab cost breakdown",
    detail: "Scope concentration and contingency exposure surfaced visually.",
    path: DEAL_ASSET_PATHS.charts.rehab,
  },
];

const WindowFrame = ({ eyebrow, icon: Icon, title, children, className = "" }) => (
  <div className={`marketing-window ${className}`}>
    <div className="marketing-window-toolbar">
      <span className="marketing-window-dot" />
      <span className="marketing-window-dot" />
      <span className="marketing-window-dot" />
      <span className="ml-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
        {eyebrow}
      </span>
    </div>
    <div className="marketing-window-body">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900">{title}</p>
          <p className="text-xs text-ink-500">Live workspace preview</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  </div>
);

const Homepage = () => {
  const featuredResources = resourceArticles.slice(0, 3);
  const heroDeal = marketingDealShowcase[0];
  const watchDeal = marketingDealShowcase[1];
  const riskyDeal = marketingDealShowcase[2];

  return (
    <MarketingLayout>
      <Seo
        title="Fliprop | Real Estate Workspace for Acquisitions and Operations"
        description="Fliprop helps real estate operators manage deals, comps, execution, documents, vendors, and ongoing property work from one workspace."
        path="/"
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_420px]">
        <div className="marketing-hero px-6 py-8 sm:px-8 sm:py-10 reveal-up">
          <span className="eyebrow">AI deal intelligence</span>
          <h1 className="mt-5 max-w-5xl font-display text-[3rem] leading-[0.95] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.5rem]">
            Analyze deals in seconds with a premium operator view.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
            Fliprop turns numbers and tables into visual underwriting: live deal scores, AI
            recommendation cards, profit snapshots, and chart-ready investor context in one clean
            real estate workspace.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="primary-action"
              data-testid="home-primary-cta"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Start free"
              data-analytics-location="home_hero"
              data-analytics-category="conversion"
            >
              Start free
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="secondary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="See pricing"
              data-analytics-location="home_hero"
              data-analytics-category="pricing"
            >
              See pricing
            </Link>
            <Link
              to="/compare/flipper-force"
              className="ghost-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Compare with Flipper Force"
              data-analytics-location="home_hero"
              data-analytics-category="comparison"
            >
              Compare with Flipper Force
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {heroModules.map((item) => (
              <span key={item} className="glass-chip">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="metric-tile p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                Featured deal
              </p>
              <p className="mt-3 text-lg font-semibold text-ink-900">{heroDeal.score}/100 score</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                {formatDealPercent(heroDeal.roi)} ROI and {formatDealCompactCurrency(heroDeal.profit)} upside.
              </p>
            </div>
            <div className="metric-tile p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                AI verdicts
              </p>
              <p className="mt-3 text-lg font-semibold text-ink-900">Good, watch, or stop</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                Users instantly see whether a deal deserves deeper diligence.
              </p>
            </div>
            <div className="metric-tile p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                Visual reporting
              </p>
              <p className="mt-3 text-lg font-semibold text-ink-900">Charts built for investors</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                ROI, profit, and rehab cost visuals replace spreadsheet scanning.
              </p>
            </div>
          </div>
        </div>

        <aside className="marketing-spotlight p-4 reveal-up" style={{ animationDelay: "90ms" }}>
          <img
            src={DEAL_ASSET_PATHS.marketing.hero}
            alt="Fliprop hero dashboard"
            className="w-full rounded-[28px] border border-white/70 object-cover shadow-soft"
          />
          <div className="mt-4 grid gap-3">
            <div className="marketing-mini-card">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                Instant readout
              </p>
              <p className="mt-3 text-lg font-semibold text-ink-900">
                {heroDeal.aiSummary.headline}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                {heroDeal.aiSummary.recommendation}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DashboardStatCard
                title="Deal score"
                value={`${heroDeal.score}/100`}
                detail={heroDeal.tone.label}
                tone="success"
                progress={heroDeal.score}
              />
              <DashboardStatCard
                title="Modeled ROI"
                value={formatDealPercent(heroDeal.roi)}
                detail="Fast investor-facing signal"
                tone="neutral"
                progress={Math.min(Math.max(heroDeal.roi, 0), 100)}
              />
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_390px]">
        <div className="grid gap-4">
          <DealScoreCard
            score={heroDeal.score}
            verdict={heroDeal.verdict}
            title="Deal analysis visual"
            label={heroDeal.address}
            detail={`${heroDeal.tone.label} with ${formatDealPercent(heroDeal.roi)} ROI and ${formatDealCompactCurrency(
              heroDeal.profit
            )} upside.`}
            assetPath={heroDeal.assetPaths.score}
          />
          <AISummaryCard
            verdict={heroDeal.verdict}
            headline={heroDeal.aiSummary.headline}
            detail={heroDeal.aiSummary.detail}
            recommendation={heroDeal.aiSummary.recommendation}
            confidenceLabel={heroDeal.aiSummary.confidenceLabel}
            bullets={heroDeal.aiSummary.bullets}
            assetPath={heroDeal.assetPaths.verdict}
          />
        </div>

        <div className="grid gap-4">
          <DashboardStatCard
            title="Strong opportunities"
            value={heroDeal.score}
            detail={`${heroDeal.address} is the cleanest buy-box example in the showcase.`}
            eyebrow="Good deal"
            tone="success"
            progress={heroDeal.score}
          />
          <DashboardStatCard
            title="Moderate risk"
            value={`${watchDeal.score}/100`}
            detail={watchDeal.aiSummary.recommendation}
            eyebrow="Watch deal"
            tone="warning"
            progress={watchDeal.score}
          />
          <DashboardStatCard
            title="Not profitable"
            value={`${riskyDeal.score}/100`}
            detail={riskyDeal.aiSummary.recommendation}
            eyebrow="Bad deal"
            tone="danger"
            progress={riskyDeal.score}
          />
        </div>
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Visual system</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              Premium UI components around the deal workflow
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            The asset library now covers button states, AI summary surfaces, add-investment flows,
            and dashboard cards instead of generic placeholders.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visualSystemAssets.map((asset) => (
            <div key={asset.title} className="section-card overflow-hidden p-4">
              <img src={asset.path} alt={asset.title} className="h-40 w-full rounded-[22px] object-cover" />
              <h3 className="mt-4 text-base font-semibold text-ink-900">{asset.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">{asset.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="surface-panel px-6 py-7 sm:px-8">
          <span className="eyebrow">Charts</span>
          <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
            Visualize the economics, not just the inputs
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {chartAssets.map((asset) => (
              <div key={asset.title} className="section-card overflow-hidden p-4">
                <img src={asset.path} alt={asset.title} className="h-40 w-full rounded-[22px] object-cover" />
                <h3 className="mt-4 text-base font-semibold text-ink-900">{asset.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-600">{asset.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="marketing-spotlight overflow-hidden p-4">
            <img
              src={DEAL_ASSET_PATHS.marketing.beforeAfter}
              alt="Before and after renovation concept"
              className="w-full rounded-[28px] object-cover"
            />
            <div className="px-2 pb-2 pt-4">
              <p className="text-base font-semibold text-ink-900">Before / after renovation concept</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                Show the value creation story alongside the underwriting, not in a separate deck.
              </p>
            </div>
          </div>
          <div className="surface-panel overflow-hidden p-4">
            <img
              src={DEAL_ASSET_PATHS.marketing.listings}
              alt="Property listing cards"
              className="w-full rounded-[28px] object-cover"
            />
            <div className="px-2 pb-2 pt-4">
              <p className="text-base font-semibold text-ink-900">Property listing cards</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                Good, medium, and bad deals are visibly distinct the moment the page loads.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Product previews</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              See the workspace in action
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            Preview the pipeline, property workspace, and billing model in one clear view.
          </p>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_1fr_0.9fr]">
          <WindowFrame eyebrow="Pipeline" icon={ChartBarIcon} title="Potential properties">
            <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
              <div className="space-y-3">
                {[
                  ["Active leads", "24"],
                  ["At pricing", "7"],
                  ["Offers live", "3"],
                ].map(([label, value]) => (
                  <div key={label} className="marketing-window-card">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
                      {label}
                    </p>
                    <p className="mt-3 font-display text-[2rem] leading-none text-ink-900">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {pipelineRows.map((row) => (
                  <div key={row.address} className="marketing-window-row">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{row.address}</p>
                      <p className="mt-1 text-xs text-ink-500">{row.owner}</p>
                    </div>
                    <div className="text-right">
                      <span className="marketing-window-pill">{row.stage}</span>
                      <p className="mt-2 text-sm font-medium text-ink-700">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </WindowFrame>

          <WindowFrame eyebrow="Workspace" icon={BuildingOffice2Icon} title="Property command center">
            <div className="flex flex-wrap gap-2">
              {["Overview", "Financials", "Work", "Documents", "Analysis", "Settings"].map((tab) => (
                <span key={tab} className="marketing-window-pill">
                  {tab}
                </span>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {workspaceRows.map((row) => (
                <div key={row.label} className="marketing-window-row">
                  <p className="text-sm text-ink-600">{row.label}</p>
                  <p className="text-sm font-semibold text-ink-900">{row.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 marketing-window-card">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
                This week
              </p>
              <div className="mt-3 space-y-2">
                {[
                  "Finalize electrical bid",
                  "Review saved comps report",
                  "Update task owners before closing",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-ink-600">
                    <span className="h-2 w-2 rounded-full bg-verdigris-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </WindowFrame>

          <WindowFrame eyebrow="Billing" icon={CreditCardIcon} title="Plans and premium actions">
            <div className="space-y-3">
              {billingRows.map((row) => (
                <div key={row.label} className="marketing-window-row">
                  <p className="text-sm text-ink-600">{row.label}</p>
                  <p className="text-sm font-semibold text-ink-900">{row.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 marketing-window-card">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink-900">Credits remaining</p>
                <p className="text-sm font-semibold text-verdigris-700">42</p>
              </div>
              <div className="marketing-window-meter mt-3">
                <span style={{ width: "68%" }} />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {["Buy 10-credit top-up", "Open billing portal", "Buy 10-credit pack"].map((item) => (
                <div key={item} className="marketing-window-row">
                  <p className="text-sm font-medium text-ink-700">{item}</p>
                </div>
              ))}
            </div>
          </WindowFrame>
        </div>
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Best fit</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              The teams most likely to sign up
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            Fliprop works best for teams that want deal context, execution, and billing in one
            place.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {operatorProfiles.map((profile) => (
            <div key={profile.title} className="section-card p-5">
              <h3 className="text-lg font-semibold text-ink-900">{profile.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-600">{profile.summary}</p>
              <div className="soft-list mt-4">
                {profile.bullets.map((bullet) => (
                  <div key={bullet} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm leading-6 text-ink-600">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="marketing-spotlight p-6">
          <span className="eyebrow">Why teams move</span>
          <div className="soft-list mt-5">
            {painPoints.map((point) => (
              <div key={point} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm leading-6 text-ink-600">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Fliprop vs Flipper Force</span>
              <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
                Clearer than a dense tool stack
              </h2>
            </div>
            <Link
              to="/compare/flipper-force"
              className="secondary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Open full comparison"
              data-analytics-location="home_comparison"
              data-analytics-category="comparison"
            >
              Open full comparison
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {comparisonRows.map((row) => (
              <div key={row.label} className="section-card p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                  {row.label}
                </p>
                <p className="mt-4 text-sm font-semibold leading-6 text-ink-900">Fliprop</p>
                <p className="mt-2 text-sm leading-6 text-ink-600">{row.fliprop}</p>
                <p className="mt-4 text-sm font-semibold leading-6 text-ink-900">Category default</p>
                <p className="mt-2 text-sm leading-6 text-ink-600">{row.market}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {workflowPillars.map((pillar) => (
          <div key={pillar.title} className="surface-panel p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              {pillar.title}
            </p>
            <h2 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
              {pillar.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-600">{pillar.description}</p>
            <div className="soft-list mt-5">
              {pillar.bullets.map((bullet) => (
                <div key={bullet} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm leading-6 text-ink-600">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Platform coverage</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              One workspace across the work that matters
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            Leads, execution, property context, and billing all stay connected in the same system.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCollections.map((collection) => (
            <div key={collection.title} className="section-card p-5">
              <h3 className="text-lg font-semibold text-ink-900">{collection.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-600">{collection.description}</p>
              <div className="soft-list mt-4">
                {collection.bullets.map((bullet) => (
                  <div key={bullet} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm leading-6 text-ink-600">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Pricing preview</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              Simple plans, flexible premium usage
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            Fliprop is easier to adopt because the plan structure is simple: start free, move to Pro
            when recurring analysis makes sense, and add credits when needed.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pricingFacts.map((fact) => (
            <div key={fact.label} className="marketing-mini-card">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                {fact.label}
              </p>
              <p className="mt-4 font-display text-[2rem] leading-none text-ink-900">{fact.value}</p>
              <p className="mt-3 text-sm leading-6 text-ink-600">{fact.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {pricingPlans.map((plan) => (
            <div
              key={plan.key}
              className={`p-6 ${plan.key === "pro" ? "surface-panel-strong" : "section-card"}`}
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="eyebrow">{plan.badge}</span>
                  <h3 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
                    {plan.name}
                  </h3>
                </div>
                <p className="font-display text-[2rem] leading-none text-ink-900">
                  {plan.price}
                  <span className="font-sans text-base font-medium text-ink-500">{plan.cadence}</span>
                </p>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink-600">{plan.description}</p>
              <div className="soft-list mt-5">
                {plan.features.map((feature) => (
                  <div key={feature} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm leading-6 text-ink-600">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Editorial</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              Practical guides for the work behind every deal
            </h2>
          </div>
          <Link
            to="/resources"
            className="secondary-action"
            data-analytics-event="marketing_cta_click"
            data-analytics-label="View resource library"
            data-analytics-location="home_editorial_header"
            data-analytics-category="content"
          >
            View resource library
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {featuredResources.map((article) => (
            <Link
              key={article.slug}
              to={`/resources/${article.slug}`}
              className="section-card marketing-link-card block p-5"
              data-analytics-event="resource_article_open"
              data-analytics-label={article.title}
              data-analytics-location="home_editorial_grid"
              data-analytics-category="content"
              data-analytics-slug={article.slug}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                {article.category} • {article.readTime}
              </p>
              <h3 className="mt-4 font-display text-[1.8rem] leading-none text-ink-900">
                {article.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-ink-600">{article.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="surface-panel p-6">
          <span className="eyebrow">FAQ</span>
          <div className="soft-list mt-5">
            {faqItems.map((item) => (
              <div key={item.question} className="py-4 first:pt-0 last:pb-0">
                <h3 className="text-base font-semibold text-ink-900">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel-strong p-6">
          <span className="eyebrow">Start the workspace</span>
          <h2 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
            Get the team into one system before the work spreads further.
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-600">
            Start on Starter, centralize the workflow, and turn on Pro when recurring analysis and
            premium reporting become part of the weekly process.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="primary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Start free"
              data-analytics-location="home_final_cta"
              data-analytics-category="conversion"
            >
              Start free
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/compare/flipper-force"
              className="secondary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="See full comparison"
              data-analytics-location="home_final_cta"
              data-analytics-category="comparison"
            >
              See full comparison
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Homepage;
