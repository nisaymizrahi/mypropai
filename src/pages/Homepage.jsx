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
import { faqItems, pricingFacts, pricingPlans } from "../content/marketingContent";
import {
  DEAL_ASSET_PATHS,
  formatDealCompactCurrency,
  formatDealPercent,
  marketingDealShowcase,
} from "../utils/dealIntelligence";

const launchSteps = [
  {
    title: "Add the lead",
    detail: "Capture the address, seller context, target price, and next move in one place.",
    icon: HomeModernIcon,
  },
  {
    title: "Run deal analysis",
    detail: "Use comps and AI guidance to decide whether the deal deserves real attention.",
    icon: ChartBarIcon,
  },
  {
    title: "Open the project workspace",
    detail: "Carry the deal into scope, vendors, documents, and execution without rebuilding context.",
    icon: ClipboardDocumentListIcon,
  },
];

const launchModules = [
  {
    title: "Lead",
    detail: "Seller notes, pricing context, and the next step stay attached to the property from day one.",
  },
  {
    title: "Deal analysis",
    detail: "Comps, verdicts, and investor-ready reporting turn a quick review into a decision-ready package.",
  },
  {
    title: "Project workspace",
    detail: "Tasks, scope, vendors, financial context, and documents stay in one project record after the deal moves forward.",
  },
];

const proofCards = [
  {
    eyebrow: "Concrete outcome",
    title: "Stop losing the deal story after the buy box says yes.",
    detail: "Fliprop keeps the lead, the pricing case, and the project workspace connected so execution starts with context instead of guesswork.",
  },
  {
    eyebrow: "Built for launch",
    title: "Free workspace first. Paid analysis when it earns its place.",
    detail: "Starter gets the flow organized. Pro turns on recurring comps and premium reporting when the team is ready.",
  },
];

const proofQuote =
  "This is the shape fix-and-flip teams want right now: one clean path from lead review to decision to active project.";

const Homepage = () => {
  const heroDeal = marketingDealShowcase[0];
  const quickFaq = faqItems.slice(0, 3);

  return (
    <MarketingLayout>
      <Seo
        title="Fliprop | Lead to Rehab-Ready Workspace for Fix-and-Flip Operators"
        description="Fliprop helps fix-and-flip operators capture leads, run AI comps, and move approved deals into a rehab-ready workspace without losing context."
        path="/"
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_420px]">
        <div className="marketing-hero px-6 py-8 sm:px-8 sm:py-10 reveal-up">
          <span className="eyebrow">Fix-and-flip launch flow</span>
          <h1 className="mt-5 max-w-5xl font-display text-[3rem] leading-[0.94] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.5rem]">
            Take a deal from lead to rehab-ready workspace without rebuilding it in three tools.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
            Fliprop gives lean fix-and-flip teams one clear workflow: capture the lead, run comps
            and AI analysis, then move the approved deal into scope, vendors, documents, and next
            steps.
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

          <div className="mt-7 flex flex-wrap gap-2.5">
            {[
              "Lead -> deal analysis -> project workspace",
              "Starter is free",
              "Investor-ready PDF exports",
              "Built for lean fix-and-flip teams",
            ].map((item) => (
              <span key={item} className="glass-chip">
                {item}
              </span>
            ))}
          </div>
        </div>

        <aside className="marketing-spotlight p-4 reveal-up" style={{ animationDelay: "90ms" }}>
          <img
            src={DEAL_ASSET_PATHS.marketing.hero}
            alt="Fliprop deal and workspace preview"
            className="w-full rounded-[28px] border border-white/70 object-cover shadow-soft"
          />
          <div className="mt-4 grid gap-3">
            <div className="marketing-mini-card">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                Sample deal
              </p>
              <p className="mt-3 text-lg font-semibold text-ink-900">{heroDeal.score}/100 score</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                {formatDealPercent(heroDeal.roi)} ROI and {formatDealCompactCurrency(heroDeal.profit)} upside.
              </p>
            </div>
            <div className="marketing-mini-card">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                Why users trust it
              </p>
              <p className="mt-3 text-base font-semibold text-ink-900">{heroDeal.aiSummary.headline}</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                The same record keeps the verdict, report, and next project step together.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
          <div className="section-card p-5">
            <span className="eyebrow">Sample report</span>
            <h2 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
              Show the buy case before the team commits more time.
            </h2>
            <p className="mt-4 text-sm leading-6 text-ink-600">
              Open a sample deal report to see the verdict, modeled ROI, recommendation, and investor-ready
              package users get before they move into project execution.
            </p>
            <Link
              to="/product#sample-report"
              className="secondary-action mt-6"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Open sample report"
              data-analytics-location="home_proof_strip"
              data-analytics-category="proof"
            >
              Open sample report
            </Link>
          </div>

          <div className="section-card p-5">
            <span className="eyebrow">Trust signal</span>
            <p className="mt-4 text-lg font-semibold text-ink-900">{proofQuote}</p>
            <div className="mt-5 space-y-3">
              {proofCards.map((card) => (
                <div key={card.title} className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
                    {card.eyebrow}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-ink-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-ink-600">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card p-5">
            <span className="eyebrow">How it works</span>
            <div className="mt-4 space-y-4">
              {launchSteps.map((step, index) => (
                <div key={step.title} className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-400">
                    Step {index + 1}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-ink-900">{step.title}</p>
                  <p className="mt-2 text-sm leading-6 text-ink-600">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.02fr)_420px]">
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

        <div className="grid gap-4">
          {launchModules.map((module) => (
            <div key={module.title} className="surface-panel p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                  <CheckBadgeIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-ink-900">{module.title}</p>
                  <p className="mt-2 text-sm leading-6 text-ink-600">{module.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-panel px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Simple pricing</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              Start free, then turn on recurring analysis when the deal volume justifies it.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            Fliprop keeps the launch decision simple: get the workspace organized first, then pay
            for deeper analysis only when it becomes repeatable.
          </p>
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
                {plan.features.slice(0, 4).map((feature) => (
                  <div key={feature} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm leading-6 text-ink-600">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="surface-panel p-6">
          <span className="eyebrow">FAQ</span>
          <div className="soft-list mt-5">
            {quickFaq.map((item) => (
              <div key={item.question} className="py-4 first:pt-0 last:pb-0">
                <h3 className="text-base font-semibold text-ink-900">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel-strong p-6">
          <span className="eyebrow">Start the launch flow</span>
          <h2 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
            Bring the first lead into Fliprop and run the whole path in one workspace.
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-600">
            Start on Starter, run the first deal, and upgrade only when recurring analysis becomes
            a real weekly habit.
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
              to="/pricing"
              className="secondary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="See pricing"
              data-analytics-location="home_final_cta"
              data-analytics-category="pricing"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Homepage;
