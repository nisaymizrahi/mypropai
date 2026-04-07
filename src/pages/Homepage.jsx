import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";

import AISummaryCard from "../components/AISummaryCard";
import DealScoreCard from "../components/DealScoreCard";
import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import { faqItems, pricingFacts, pricingModel, pricingPlans } from "../content/marketingContent";
import {
  DEAL_ASSET_PATHS,
  formatDealCompactCurrency,
  formatDealPercent,
  marketingDealShowcase,
} from "../utils/dealIntelligence";

const heroSignals = [
  "Start free on Starter",
  `${pricingModel.proTrialDays}-day Pro trial when you are ready`,
  "Pipeline, analysis, and execution stay connected",
];

const trustPillars = [
  {
    title: "Free to start",
    detail:
      "Open the workspace on Starter and keep the pipeline organized before you decide to pay for recurring analysis.",
  },
  {
    title: "Decision-ready analysis",
    detail:
      "Comps, modeled returns, and AI guidance turn a promising lead into a clearer yes, no, or revisit decision.",
  },
  {
    title: "One workspace continuity",
    detail:
      "The lead story, the buy case, and the project workspace stay on the same record instead of getting rebuilt in separate tools.",
  },
];

const workflowPillars = [
  {
    title: "Capture the lead",
    detail:
      "Bring the address, seller context, price target, and next move into one clean pipeline from the start.",
    icon: HomeModernIcon,
  },
  {
    title: "Run the analysis",
    detail:
      "Pressure-test the deal with comps, modeled returns, and AI guidance before the team commits more time.",
    icon: ChartBarIcon,
  },
  {
    title: "Move into execution",
    detail:
      "Carry the winning deal into scope, vendors, documents, and tasks without rebuilding the context.",
    icon: ClipboardDocumentListIcon,
  },
];

const productProofPoints = [
  {
    title: "Lead context stays attached",
    detail:
      "Seller notes, pricing assumptions, and the next action stay with the property instead of living in scattered messages and sheets.",
  },
  {
    title: "Analysis becomes decision-ready",
    detail:
      "Comps, verdicts, and investor-ready reporting help a small team make faster calls with fewer handoff gaps.",
  },
  {
    title: "Execution starts with memory",
    detail:
      "When a deal moves forward, scope, vendors, tasks, and documents inherit the same story instead of starting from zero.",
  },
];

const Homepage = () => {
  const heroDeal = marketingDealShowcase[0];
  const quickFaq = faqItems.slice(0, 3);
  const pricingPreviewFacts = pricingFacts.slice(0, 3);

  return (
    <MarketingLayout>
      <Seo
        title="Fliprop | Investor Workspace From Lead Review to Project Execution"
        description="Fliprop helps real-estate investors capture leads, run decision-ready analysis, and move winning deals into project execution without losing context."
        path="/"
      />

      <section className="homepage-hero-shell reveal-up">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] xl:items-center">
          <div className="max-w-[34rem]">
            <span className="eyebrow">Investor operating system</span>
            <h1 className="mt-6 max-w-5xl font-display text-[3rem] leading-[0.92] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.7rem]">
              Fliprop keeps every deal moving from first look to active project in one investor-ready workspace.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
              Capture the lead, pressure-test the buy case, and move the winner into execution without
              rebuilding the story in another tool.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
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
                to="/product#sample-report"
                className="secondary-action"
                data-analytics-event="marketing_cta_click"
                data-analytics-label="See sample report"
                data-analytics-location="home_hero"
                data-analytics-category="proof"
              >
                See sample report
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {heroSignals.map((item) => (
                <span key={item} className="glass-chip">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="homepage-hero-canvas reveal-up" style={{ animationDelay: "100ms" }}>
            <div className="marketing-window overflow-hidden">
              <div className="marketing-window-toolbar">
                <span className="marketing-window-dot" />
                <span className="marketing-window-dot" />
                <span className="marketing-window-dot" />
                <p className="ml-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
                  Product preview
                </p>
                <span className="ml-auto marketing-window-pill">Live sample workflow</span>
              </div>

              <div className="homepage-hero-canvas-body">
                <div className="homepage-hero-media">
                  <img
                    src={DEAL_ASSET_PATHS.marketing.hero}
                    alt="Fliprop deal and workspace preview"
                    className="homepage-hero-image"
                  />

                  <div className="homepage-hero-overlay">
                    <div className="flex flex-wrap gap-2">
                      {["Lead", "Analysis", "Execution"].map((item) => (
                        <span key={item} className="marketing-window-pill">
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
                          Sample deal
                        </p>
                        <p className="mt-2 text-xl font-semibold text-white sm:text-[1.65rem]">
                          {heroDeal.address}
                        </p>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-white/78">
                          {heroDeal.aiSummary.headline}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-white/16 bg-white/10 px-4 py-3 text-right backdrop-blur-sm">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
                          Deal score
                        </p>
                        <p className="mt-2 text-[1.85rem] font-semibold leading-none text-white">
                          {heroDeal.score}
                          <span className="ml-1 text-sm font-medium text-white/72">/100</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="homepage-hero-metric">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
                          Modeled return
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {formatDealPercent(heroDeal.roi)} ROI with{" "}
                          {formatDealCompactCurrency(heroDeal.profit)} upside
                        </p>
                      </div>
                      <div className="homepage-hero-metric">
                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
                          Next move
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          Review the report, align the team, and move the deal into execution.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="homepage-proof-rail surface-panel px-6 py-5 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {trustPillars.map((item) => (
            <div key={item.title} className="homepage-proof-item">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
                {item.title}
              </p>
              <p className="mt-3 text-base font-semibold text-ink-900">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] xl:items-start">
        <div className="px-1 py-3">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-5 max-w-xl font-display text-[2.4rem] leading-[0.97] text-ink-900">
            A cleaner path from incoming deal to active project.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-ink-600 sm:text-base">
            Each part of the workflow has one job: capture the opportunity, make the decision, and
            move forward without losing the operating memory.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {workflowPillars.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="section-card p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-lg font-semibold text-ink-900">{step.title}</p>
                <p className="mt-3 text-sm leading-6 text-ink-600">{step.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.74fr)_minmax(0,1.26fr)] xl:items-start">
          <div className="max-w-xl">
            <span className="eyebrow">Product proof</span>
            <h2 className="mt-5 font-display text-[2.35rem] leading-[0.97] text-ink-900">
              Show the buy case before the team commits more time.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink-600 sm:text-base">
              Fliprop turns a promising lead into a clearer decision package, then keeps the same
              record alive as the project moves into active execution.
            </p>

            <div className="soft-list mt-6">
              {productProofPoints.map((item) => (
                <div key={item.title} className="py-4 first:pt-0 last:pb-0">
                  <h3 className="text-base font-semibold text-ink-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-600">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/product"
                className="secondary-action"
                data-analytics-event="marketing_cta_click"
                data-analytics-label="Explore the product"
                data-analytics-location="home_product_proof"
                data-analytics-category="product"
              >
                Explore the product
              </Link>
              <Link
                to="/product#sample-report"
                className="ghost-action"
                data-analytics-event="marketing_cta_click"
                data-analytics-label="Open sample report"
                data-analytics-location="home_product_proof"
                data-analytics-category="proof"
              >
                Open sample report
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <DealScoreCard
              score={heroDeal.score}
              verdict={heroDeal.verdict}
              title="Decision-ready analysis"
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

      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] xl:items-start">
          <div className="max-w-xl">
            <span className="eyebrow">Pricing preview</span>
            <h2 className="mt-5 font-display text-[2.35rem] leading-[0.97] text-ink-900">
              Start free on Starter. Turn on Pro when analysis becomes a weekly habit.
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink-600 sm:text-base">
              The pricing story stays simple on purpose: get the workspace organized first, then
              upgrade when recurring comps and reporting earn their place.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="primary-action"
                data-analytics-event="marketing_cta_click"
                data-analytics-label="Start free"
                data-analytics-location="home_pricing_preview"
                data-analytics-category="conversion"
              >
                Start free
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="secondary-action"
                data-analytics-event="marketing_cta_click"
                data-analytics-label="See full pricing"
                data-analytics-location="home_pricing_preview"
                data-analytics-category="pricing"
              >
                See full pricing
              </Link>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {pricingPreviewFacts.map((fact) => (
                <div key={fact.label} className="premium-inline-stat">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
                    {fact.label}
                  </p>
                  <p className="mt-3 text-[1.55rem] font-semibold leading-none text-ink-900">
                    {fact.value}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-ink-600">{fact.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pricingPlans.map((plan) => (
              <div
                key={plan.key}
                className={`homepage-plan-card ${plan.key === "pro" ? "homepage-plan-card-featured" : ""}`}
              >
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <span className="eyebrow">{plan.badge}</span>
                    <h3 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
                      {plan.name}
                    </h3>
                  </div>
                  <p className="font-display text-[1.85rem] leading-none text-ink-900">
                    {plan.price}
                    <span className="font-sans text-base font-medium text-ink-500">{plan.cadence}</span>
                  </p>
                </div>

                <p className="mt-4 text-sm leading-6 text-ink-600">{plan.description}</p>

                <div className="soft-list mt-5">
                  {plan.features.slice(0, 2).map((feature) => (
                    <div key={feature} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verdigris-50 text-verdigris-700">
                        <CheckBadgeIcon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm leading-6 text-ink-600">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="max-w-3xl">
          <span className="eyebrow">FAQ</span>
          <h2 className="mt-5 font-display text-[2.2rem] leading-[0.98] text-ink-900">
            A few quick answers before you start.
          </h2>
        </div>

        <div className="soft-list mt-6">
          {quickFaq.map((item) => (
            <div key={item.question} className="py-4 first:pt-0 last:pb-0">
              <h3 className="text-base font-semibold text-ink-900">{item.question}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="homepage-final-cta surface-panel-strong px-6 py-8 sm:px-8 sm:py-9">
        <div className="max-w-3xl">
          <span className="eyebrow">Start clean</span>
          <h2 className="mt-5 font-display text-[2.35rem] leading-[0.97] text-ink-900">
            Bring your first lead into Fliprop and keep the whole deal story in one place.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
            Start on Starter, run the workflow once, and upgrade only when recurring analysis becomes
            part of the weekly operating rhythm.
          </p>

          <div className="mt-7">
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
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Homepage;
