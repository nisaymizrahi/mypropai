import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";

import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import {
  addOnProducts,
  faqItems,
  planComparisonRows,
  pricingFacts,
  pricingModel,
  pricingPlans,
} from "../content/marketingContent";

const valueSummary = [
  {
    title: "Free workspace first",
    detail: "Capture leads, organize the project, and get the operating flow in place without subscription friction.",
  },
  {
    title: "Upgrade only when ready",
    detail: `Pro is ${pricingModel.proMonthlyPrice}/month and is meant for operators who need recurring comps and reporting every week.`,
  },
  {
    title: "Usage stays flexible",
    detail: "Extra comps can still be purchased later, so occasional users do not get pushed into a heavier plan too early.",
  },
];

function PricingPage() {
  return (
    <MarketingLayout>
      <Seo
        title="Pricing | Fliprop"
        description={`Fliprop pricing for fix-and-flip operators: free Starter, ${pricingModel.proMonthlyPrice}/month Pro, and extra comps credits when needed.`}
        path="/pricing"
      />

      <section className="marketing-hero px-6 py-8 sm:px-8 sm:py-10">
        <span className="eyebrow">Pricing</span>
        <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.2rem]">
          Start with the workspace for free. Pay for deeper analysis when it becomes repeatable.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
          Fliprop is priced for lean fix-and-flip teams: get the lead-to-project workflow organized
          first, then activate Pro when deal analysis becomes a weekly habit instead of a one-off
          need.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            to="/signup"
            className="primary-action"
            data-analytics-event="marketing_cta_click"
            data-analytics-label="Start free"
            data-analytics-location="pricing_hero"
            data-analytics-category="conversion"
          >
            Start free
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Link>
          <Link
            to="/product"
            className="secondary-action"
            data-analytics-event="marketing_cta_click"
            data-analytics-label="See the product"
            data-analytics-location="pricing_hero"
            data-analytics-category="product"
          >
            See the product
          </Link>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {valueSummary.map((item) => (
            <div key={item.title} className="marketing-mini-card">
              <h2 className="text-base font-semibold text-ink-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        {pricingPlans.map((plan) => (
          <div
            key={plan.key}
            className={`p-6 ${plan.key === "pro" ? "surface-panel-strong" : "surface-panel"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="eyebrow">{plan.badge}</span>
                <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
                  {plan.name}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-ink-600">{plan.description}</p>
              </div>
              <div className="rounded-[22px] bg-white px-5 py-4 text-right shadow-soft">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                  Price
                </p>
                <p className="mt-3 font-display text-[2.2rem] leading-none text-ink-900">
                  {plan.price}
                  <span className="font-sans text-base font-medium text-ink-500">{plan.cadence}</span>
                </p>
              </div>
            </div>

            <div className="soft-list mt-6">
              {plan.features.map((feature) => (
                <div key={feature} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verdigris-50 text-verdigris-700">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-6 text-ink-600">{feature}</p>
                </div>
              ))}
            </div>

            <Link
              to={plan.ctaTo}
              className="primary-action mt-6"
              data-analytics-event="marketing_cta_click"
              data-analytics-label={plan.ctaLabel}
              data-analytics-location={`pricing_plan_${plan.key}`}
              data-analytics-category="conversion"
            >
              {plan.ctaLabel}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pricingFacts.map((fact) => (
          <div key={fact.label} className="surface-panel p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              {fact.label}
            </p>
            <p className="mt-4 font-display text-[2rem] leading-none text-ink-900">{fact.value}</p>
            <p className="mt-3 text-sm leading-6 text-ink-600">{fact.detail}</p>
          </div>
        ))}
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Plan comparison</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              The core workflow stays available on both plans
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            The real difference is whether you need recurring premium analysis and included comps
            credits every billing cycle.
          </p>
        </div>

        <div className="mt-6 overflow-x-auto rounded-[20px] border border-ink-100 bg-white/75">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] border-b border-ink-100 bg-white/80 px-5 py-4 text-sm font-semibold text-ink-900">
              <div>Capability</div>
              <div className="text-center">Starter</div>
              <div className="text-center">Pro</div>
            </div>

            {planComparisonRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.7fr)_minmax(0,0.7fr)] border-b border-ink-100 px-5 py-4 text-sm last:border-b-0"
              >
                <div className="pr-4 leading-6 text-ink-700">{row.label}</div>
                <div className="text-center leading-6 text-ink-600">{row.starter}</div>
                <div className="text-center leading-6 text-ink-600">{row.pro}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Extra comps later</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              Credits stay available when you need more volume
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            We keep this lower on the page on purpose. Operators should understand the workflow and
            plan fit first, then the add-on math.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {addOnProducts.map((product) => (
            <div key={product.name} className="section-card p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                One-time purchase
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-ink-900">{product.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink-600">{product.detail}</p>
                </div>
                <p className="text-right font-display text-[1.7rem] leading-none text-ink-900">
                  {product.price}
                </p>
              </div>
            </div>
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
          <span className="eyebrow">Start clean</span>
          <h2 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
            Open a free workspace now and decide on Pro later.
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-600">
            The fastest path is still the simplest one: bring in the lead, run the first deal, then
            upgrade only when premium analysis becomes recurring.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="primary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Start free"
              data-analytics-location="pricing_final_cta"
              data-analytics-category="conversion"
            >
              Start free
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/product"
              className="secondary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="See the product"
              data-analytics-location="pricing_final_cta"
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

export default PricingPage;
