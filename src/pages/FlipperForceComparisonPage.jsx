import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import {
  comparisonPageHighlights,
  comparisonPageRows,
  comparisonSourceNote,
  pricingModel,
} from "../content/marketingContent";

const publicSources = [
  {
    label: "Flipper Force features",
    href: "https://flipperforce.com/house-flipping-software-features",
  },
  {
    label: "Flipper Force Rookie plan",
    href: "https://flipperforce.com/upgrade/free-rookie-plan",
  },
  {
    label: "Flipper Force team pricing",
    href: "https://flipperforce.com/upgrade/teams",
  },
];

function FlipperForceComparisonPage() {
  return (
    <MarketingLayout>
      <Seo
        title="Fliprop vs Flipper Force | Compare Real Estate Software"
        description="Compare Fliprop and Flipper Force across pricing, workflow fit, feature emphasis, and the kind of real estate team each platform serves best."
        path="/compare/flipper-force"
      />

      <section className="marketing-hero px-6 py-8 sm:px-8 sm:py-10">
        <span className="eyebrow">Comparison</span>
        <h1 className="mt-5 max-w-5xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.2rem]">
          Fliprop vs Flipper Force
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
          Flipper Force is a real category player for house flippers and rehabbers. Fliprop is the
          better fit when you want a calmer operator workspace that spans acquisitions, execution,
          property operations, and flexible premium usage without forcing a heavy tier decision early.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            to="/signup"
            className="primary-action"
            data-analytics-event="marketing_cta_click"
            data-analytics-label="Start free"
            data-analytics-location="compare_hero"
            data-analytics-category="conversion"
          >
            Start free
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
          <Link
            to="/pricing"
            className="secondary-action"
            data-analytics-event="marketing_cta_click"
            data-analytics-label="Review pricing"
            data-analytics-location="compare_hero"
            data-analytics-category="pricing"
          >
            Review pricing
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {comparisonPageHighlights.map((item) => (
          <div key={item.title} className="surface-panel p-6">
            <h2 className="text-lg font-semibold text-ink-900">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink-600">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Side-by-side</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              The clearest differences in one place
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            This comparison is meant to help buyers pick the better business fit, not pretend the
            tools are identical.
          </p>
        </div>

        <div className="mt-6 overflow-x-auto rounded-[20px] border border-ink-100 bg-white/75">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] border-b border-ink-100 bg-white/80 px-5 py-4 text-sm font-semibold text-ink-900">
              <div>Category</div>
              <div className="pl-4">Fliprop</div>
              <div className="pl-4">Flipper Force public pages</div>
            </div>

            {comparisonPageRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] border-b border-ink-100 px-5 py-4 text-sm last:border-b-0"
              >
                <div className="pr-4 font-medium leading-6 text-ink-900">{row.label}</div>
                <div className="pl-4 leading-6 text-ink-600">{row.fliprop}</div>
                <div className="pl-4 leading-6 text-ink-600">{row.flipperForce}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="surface-panel p-6">
          <span className="eyebrow">Choose Fliprop if...</span>
          <div className="soft-list mt-5">
            {[
              "You want a professional, more editorial buyer experience instead of a dense flipping-software layout.",
              "You need one workspace for acquisitions, rehab execution, property operations, and billing controls.",
              `You want to start free, move to ${pricingModel.proMonthlyPrice}/month Pro, and scale premium usage through credits instead of jumping between plan families.`,
            ].map((item) => (
              <div key={item} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm leading-6 text-ink-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel p-6">
          <span className="eyebrow">Consider Flipper Force if...</span>
          <div className="soft-list mt-5">
            {[
              "Your team wants a feature-dense house-flipping tool with public emphasis on rehab estimating, field updates, materials, and accounting.",
              "You prefer choosing between separate analysis-only and all-in-one team tiers up front.",
              "Your workflow is tightly centered on classic flip and BRRRR analysis plus rehab project management.",
            ].map((item) => (
              <div key={item} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm leading-6 text-ink-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Public references</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              Source pages used for the comparison
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">{comparisonSourceNote}</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {publicSources.map((source) => (
            <a
              key={source.href}
              href={source.href}
              target="_blank"
              rel="noreferrer"
              className="section-card marketing-link-card block p-5"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                External source
              </p>
              <h3 className="mt-4 text-lg font-semibold text-ink-900">{source.label}</h3>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-verdigris-700">
                Open source
                <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="surface-panel-strong mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Next step</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              If you want the cleaner operating-system approach, start with Fliprop.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-600">
              The fastest way to evaluate the fit is to open a Starter workspace, explore the
              product, and upgrade only when recurring premium analysis becomes useful.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="primary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Create your workspace"
              data-analytics-location="compare_final_cta"
              data-analytics-category="conversion"
            >
              Create your workspace
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/product"
              className="secondary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="See the product"
              data-analytics-location="compare_final_cta"
              data-analytics-category="product"
            >
              See the product
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export default FlipperForceComparisonPage;
