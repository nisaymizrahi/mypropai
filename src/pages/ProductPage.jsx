import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";

import AISummaryCard from "../components/AISummaryCard";
import DealScoreCard from "../components/DealScoreCard";
import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import {
  DEAL_ASSET_PATHS,
  formatDealCompactCurrency,
  formatDealPercent,
  marketingDealShowcase,
} from "../utils/dealIntelligence";

const launchFlow = [
  {
    title: "Lead",
    detail: "Capture the address, seller context, asking price, and next step in one shared record.",
    icon: HomeModernIcon,
  },
  {
    title: "Deal analysis",
    detail: "Run comps, review the modeled spread, and decide whether the deal deserves real attention.",
    icon: ChartBarIcon,
  },
  {
    title: "Project workspace",
    detail: "Move the approved deal into scope, vendors, documents, and execution without rebuilding context.",
    icon: ClipboardDocumentListIcon,
  },
];

const reportHighlights = [
  "Modeled profit, ROI, and pricing comfort zone",
  "AI summary with a clear next recommendation",
  "Investor-ready PDF export for partners or lenders",
];

const workspaceHighlights = [
  {
    title: "Project memory stays attached",
    detail: "The lead story, pricing logic, and next work steps stay on the same property record.",
  },
  {
    title: "Execution stays simple",
    detail: "Tasks, vendors, notes, and documents live in one workspace instead of drifting across tools.",
  },
  {
    title: "You only pay for deeper analysis when it matters",
    detail: "Starter keeps the workspace free. Pro turns on recurring comps and premium reporting later.",
  },
];

function ProductPage() {
  const heroDeal = marketingDealShowcase[0];

  return (
    <MarketingLayout>
      <Seo
        title="Product | Fliprop"
        description="See how Fliprop helps fix-and-flip operators move from lead intake to comps to a rehab-ready project workspace."
        path="/product"
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_380px]">
        <div className="marketing-hero px-6 py-8 sm:px-8 sm:py-10">
          <span className="eyebrow">Product</span>
          <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.95] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.3rem]">
            Built for the cleanest lead to report to rehab-ready workspace flow.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
            Fliprop is for lean fix-and-flip operators who want one place to capture the lead,
            pressure-test the deal, and move the winner into active project execution.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/signup"
              className="primary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Start free"
              data-analytics-location="product_hero"
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
              data-analytics-location="product_hero"
              data-analytics-category="pricing"
            >
              See pricing
            </Link>
          </div>
        </div>

        <aside className="marketing-spotlight px-6 py-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
            What operators get
          </p>
          <div className="soft-list mt-5">
            {[
              "One record for the lead, the pricing case, and the next move",
              "Deal analysis with modeled ROI, profit, and AI guidance",
              "A project workspace for scope, vendors, documents, and execution",
            ].map((item) => (
              <div key={item} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm leading-6 text-ink-700">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-ink-100 bg-white/80 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
              Sample deal
            </p>
            <p className="mt-3 text-lg font-semibold text-ink-900">{heroDeal.address}</p>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              {heroDeal.score}/100 score with {formatDealPercent(heroDeal.roi)} ROI and{" "}
              {formatDealCompactCurrency(heroDeal.profit)} modeled upside.
            </p>
          </div>
        </aside>
      </section>

      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Launch flow</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              Three steps. One connected record.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            Each step exists to get a solo operator or lean team to a faster go or no-go decision,
            then into execution with less rework.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {launchFlow.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="section-card p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-600">{step.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="sample-report"
        className="surface-panel mt-6 scroll-mt-32 px-6 py-7 sm:px-8"
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <div>
            <span className="eyebrow">Sample report</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              Show the buy case before you ask the team to commit more time.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
              This is the proof asset visitors need to see. Fliprop turns a lead into a clear,
              decision-ready package with the score, verdict, modeled returns, and next action in
              one investor-friendly view.
            </p>

            <div className="soft-list mt-6">
              {reportHighlights.map((item) => (
                <div key={item} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verdigris-50 text-verdigris-700">
                    <CheckBadgeIcon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-6 text-ink-600">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-ink-100 bg-white/80 p-4">
              <img
                src={DEAL_ASSET_PATHS.marketing.preview}
                alt="Fliprop report and workspace preview"
                className="w-full rounded-[18px] border border-white/70 object-cover shadow-soft"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <DealScoreCard
              score={heroDeal.score}
              verdict={heroDeal.verdict}
              title="Investor-ready verdict"
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
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="surface-panel p-6">
          <span className="eyebrow">After approval</span>
          <h2 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
            Move the winning deal into a project workspace without starting over.
          </h2>
          <div className="soft-list mt-5">
            {workspaceHighlights.map((item) => (
              <div key={item.title} className="py-4 first:pt-0 last:pb-0">
                <h3 className="text-base font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel-strong p-6">
          <span className="eyebrow">Start the flow</span>
          <h2 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
            Open a free workspace and run the first deal end to end.
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-600">
            Bring in the lead first. Upgrade only when recurring deal analysis becomes part of the
            weekly routine.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="primary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Start free"
              data-analytics-location="product_final_cta"
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
              data-analytics-location="product_final_cta"
              data-analytics-category="pricing"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export default ProductPage;
