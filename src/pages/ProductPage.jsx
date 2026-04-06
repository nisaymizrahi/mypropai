import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import { productModules, workflowPillars } from "../content/marketingContent";

const moduleIcons = [
  UsersIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
];

function ProductPage() {
  const platformLayers = [
    ["Acquisition context", "Lead notes, pricing, comps, and next moves stay attached to the opportunity."],
    ["Execution layer", "Tasks, vendors, schedules, and operating follow-up keep the work moving."],
    ["Property memory", "Documents, financial context, and settings remain attached to the asset."],
    ["Account controls", "Billing, plan changes, and user access are part of the same system."],
  ];

  return (
    <MarketingLayout>
      <Seo
        title="Product | Fliprop"
        description="See how Fliprop helps real estate teams manage acquisitions, comps, vendors, tasks, and property operations from one workspace."
        path="/product"
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
        <div className="marketing-hero px-6 py-8 sm:px-8 sm:py-10">
          <span className="eyebrow">Product overview</span>
          <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.3rem]">
            The operating system for teams moving from deal flow to live property work.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
            Fliprop is designed for operators who need lead tracking, comps, execution planning,
            tasks, vendors, and account controls to live in one calm workspace.
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
              "Lead pipeline and pricing context",
              "Property workspace and asset memory",
              "AI comps reports and premium analysis",
              "Tasks, calendars, vendors, and billing",
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
            The product story lands better when buyers can see how deal context, work, property
            memory, and account controls fit together.
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
            <span className="eyebrow">Core modules</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              Built around the product that already does the work
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            These are the pieces the workspace already connects, which means the marketing story can
            now describe a real operating system instead of vague future-state software.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
