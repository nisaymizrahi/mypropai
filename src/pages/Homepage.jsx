import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import {
  faqItems,
  heroSignals,
  pricingPlans,
  productModules,
  resourceArticles,
  workflowPillars,
} from "../content/marketingContent";

const painPoints = [
  "Spreadsheets for the deal, another tool for tasks, and shared drives for everything else.",
  "Key pricing assumptions living in memory or buried in message threads.",
  "Execution and property ops losing the context that got the asset approved in the first place.",
];

const workflowSequence = ["Lead intake", "Comps and pricing", "Property workspace", "Tasks and vendors"];

const Homepage = () => {
  const featuredResources = resourceArticles.slice(0, 3);

  return (
    <MarketingLayout>
      <Seo
        title="Fliprop | Real Estate Workspace for Acquisitions and Operations"
        description="Fliprop helps real estate operators manage leads, comps, tasks, vendors, and property workflows from one workspace."
        path="/"
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_390px]">
        <div className="marketing-hero px-6 py-8 sm:px-8 sm:py-10 reveal-up">
          <span className="eyebrow">Real estate operating system</span>
          <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.4rem]">
            Run acquisitions, execution, and property operations from one workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
            Fliprop helps owners, operators, and lean teams keep lead flow, comps, vendors, tasks,
            documents, and property context in one place instead of across disconnected tools.
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
              to="/product"
              className="secondary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Explore the product"
              data-analytics-location="home_hero"
              data-analytics-category="product"
            >
              Explore the product
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {["Leads", "Comps", "Tasks", "Vendors", "Documents", "Billing"].map((item) => (
              <span key={item} className="glass-chip">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {heroSignals.map((signal) => (
              <div key={signal.label} className="metric-tile p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                  {signal.label}
                </p>
                <p className="mt-3 text-lg font-semibold text-ink-900">{signal.value}</p>
                <p className="mt-2 text-sm leading-6 text-ink-600">{signal.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="marketing-spotlight p-6 reveal-up" style={{ animationDelay: "90ms" }}>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
            Inside the workspace
          </p>
          <h2 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
            The public story now matches the product surface.
          </h2>
          <div className="soft-list mt-5">
            {productModules.slice(0, 4).map((module, index) => (
              <div key={module.title} className="py-4 first:pt-0 last:pb-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                  0{index + 1}
                </p>
                <h3 className="mt-2 text-base font-semibold text-ink-900">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-600">{module.summary}</p>
              </div>
            ))}
          </div>
          <div className="section-card mt-5 p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Clear pricing
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              Start on Starter for free. Upgrade to Pro for $49 per month when you want included AI
              comps reports and premium reporting workflows.
            </p>
          </div>

          <div className="marketing-mini-grid mt-5 p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Workflow path
            </p>
            <div className="mt-4 grid gap-3">
              {workflowSequence.map((step, index) => (
                <div key={step} className="marketing-mini-card flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink-900">{step}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="marketing-spotlight p-6">
          <span className="eyebrow">Why teams switch</span>
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
              <span className="eyebrow">Buyer language</span>
              <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
                Sell the system buyers actually need
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-ink-600">
              The homepage now leads with outcome language instead of internal design notes, which
              gives the signup CTA a much more believable path.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["One source of truth", "The same asset context follows the team from lead review into active work."],
              ["Less tool sprawl", "Deals, work, reporting, and account controls stop living in separate systems."],
              ["Clear monetization", "Starter is easy to start, and Pro is easy to justify when usage becomes recurring."],
            ].map(([title, detail]) => (
              <div key={title} className="section-card p-5">
                <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-600">{detail}</p>
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
            <span className="eyebrow">What teams centralize</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              Replace scattered files with one operating layer
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            The strongest SaaS story here is not abstract productivity. It is that your team can
            keep the whole property lifecycle tied to the same source of truth.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {productModules.map((module) => (
            <div key={module.title} className="section-card p-5">
              <h3 className="text-lg font-semibold text-ink-900">{module.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink-600">{module.summary}</p>
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
            <span className="eyebrow">{plan.badge}</span>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-[2.1rem] leading-none text-ink-900">{plan.name}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-ink-600">{plan.description}</p>
              </div>
              <p className="font-display text-[2rem] leading-none text-ink-900">
                {plan.price}
                <span className="font-sans text-base font-medium text-ink-500">{plan.cadence}</span>
              </p>
            </div>
            <div className="soft-list mt-5">
              {plan.features.map((feature) => (
                <div key={feature} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm leading-6 text-ink-600">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Editorial</span>
            <h2 className="mt-4 font-display text-[2.2rem] leading-none text-ink-900">
              Publish the playbooks your buyers are already searching for
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
            Start on Starter, centralize the workflow, and upgrade when recurring premium analysis
            is worth paying for every month.
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
              data-analytics-label="Review pricing"
              data-analytics-location="home_final_cta"
              data-analytics-category="pricing"
            >
              Review pricing
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default Homepage;
