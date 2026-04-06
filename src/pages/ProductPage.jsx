import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  DocumentTextIcon,
  HomeModernIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import {
  comparisonRows,
  featureCollections,
  productModules,
  workflowPillars,
} from "../content/marketingContent";

const moduleIcons = [
  HomeModernIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  SparklesIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  CreditCardIcon,
];

function ProductPage() {
  const platformLayers = [
    [
      "Acquisition context",
      "Lead notes, pricing, comps, and next moves stay attached to the opportunity.",
    ],
    [
      "Execution layer",
      "Tasks, vendors, schedules, and scope keep the work moving after the deal is approved.",
    ],
    [
      "Property memory",
      "Documents, financial context, and settings remain attached to the asset instead of scattering.",
    ],
    [
      "Billing controls",
      "Subscription access, credits, and upgrades stay inside the same system the team already uses.",
    ],
  ];

  return (
    <MarketingLayout>
      <Seo
        title="Product | Fliprop"
        description="See how Fliprop helps real estate teams manage acquisitions, comps, vendors, tasks, execution, and property operations from one workspace."
        path="/product"
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
        <div className="marketing-hero px-6 py-8 sm:px-8 sm:py-10">
          <span className="eyebrow">Product overview</span>
          <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.3rem]">
            The operating system for teams moving from deal flow to active property work.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
            Fliprop connects pipeline, pricing, analysis, rehab execution, documents, and account
            controls so the same property context can follow the team all the way through.
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
              data-analytics-label="Compare plans"
              data-analytics-location="product_hero"
              data-analytics-category="pricing"
            >
              Compare plans
            </Link>
          </div>
        </div>

        <aside className="marketing-spotlight px-6 py-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
            What the workspace connects
          </p>
          <div className="soft-list mt-5">
            {[
              "Potential properties, seller context, and pricing notes",
              "AI comps reports and premium investment reporting",
              "Property workspaces with financials, work, documents, and settings",
              "Tasks, calendar, vendors, credits, and subscription controls",
            ].map((item) => (
              <div key={item} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm leading-6 text-ink-700">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="marketing-spotlight px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Platform architecture</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              One system, four layers of context
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            The strongest product story here is that pricing evidence, work execution, asset memory,
            and billing controls stay attached to the same property record.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {platformLayers.map(([title, detail]) => (
            <div key={title} className="marketing-mini-card">
              <h3 className="text-base font-semibold text-ink-900">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-600">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Why it lands better</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              Built to feel more premium than a dense category dashboard
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            The product depth matters, but the story matters too. Buyers should understand why
            Fliprop is different before they even open the account.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {comparisonRows.map((row) => (
            <div key={row.label} className="section-card p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                {row.label}
              </p>
              <p className="mt-4 text-sm font-semibold text-ink-900">Fliprop</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">{row.fliprop}</p>
              <p className="mt-4 text-sm font-semibold text-ink-900">Category default</p>
              <p className="mt-2 text-sm leading-6 text-ink-600">{row.market}</p>
            </div>
          ))}
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
            <span className="eyebrow">Feature collections</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              Organized around the real work of operating a property business
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            Fliprop is strongest when the product surface is grouped around concrete buyer jobs, not
            abstract feature buckets.
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
            <span className="eyebrow">Core modules</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              The product surface, shown clearly
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            This is the platform story buyers should be able to see in a single scan.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {productModules.map((module, index) => {
            const Icon = moduleIcons[index % moduleIcons.length];

            return (
              <div key={module.title} className="section-card p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{module.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-600">{module.summary}</p>
              </div>
            );
          })}
        </div>
      </section>
    </MarketingLayout>
  );
}

export default ProductPage;
