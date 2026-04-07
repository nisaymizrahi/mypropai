import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";

import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import { addOnProducts, faqItems, pricingPlans } from "../content/marketingContent";

function PricingPage() {
  return (
    <MarketingLayout>
      <Seo
        title="Pricing | Fliprop"
        description="Compare Fliprop Starter and Pro, including the $49/month Pro plan, included AI comps reports, and one-off add-ons."
        path="/pricing"
      />

      <section className="marketing-hero px-6 py-8 sm:px-8 sm:py-10">
        <span className="eyebrow">Pricing</span>
        <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.2rem]">
          Start with the workspace. Pay for premium analysis when the workflow justifies it.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
          Starter gets teams into the operating system quickly. Pro adds recurring AI workflows,
          included comps reports, and simpler subscription management for teams that use the premium
          tools often.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            ["Start free", "Starter gives operators the core workspace with no subscription friction."],
            ["Upgrade cleanly", "Pro stays simple at $49 per month with included premium workflows."],
            ["Buy as needed", "Usage-based add-ons keep occasional premium actions flexible."],
          ].map(([title, detail]) => (
            <div key={title} className="marketing-mini-card">
              <h2 className="text-base font-semibold text-ink-900">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-600">{detail}</p>
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
                <p className="mt-3 text-sm leading-6 text-ink-600">{plan.description}</p>
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

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Usage-based add-ons</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              Buy premium actions one at a time when needed
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            This pricing model is helpful for teams that want the operating system now and only
            occasional premium analysis later.
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
                <p className="font-display text-[2rem] leading-none text-ink-900">{product.price}</p>
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
          <span className="eyebrow">Ready to start</span>
          <h2 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
            Open a Starter workspace now and upgrade later.
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-600">
            The cleanest path is to get the team into one system, then turn on Pro when premium
            analysis becomes recurring instead of occasional.
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
