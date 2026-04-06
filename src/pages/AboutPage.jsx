import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import { aboutPrinciples, productModules, resourcesIntro } from "../content/marketingContent";

function AboutPage() {
  const timeline = [
    ["The product got real first", "Lead tracking, comps, tasks, vendors, billing, and property workflows already exist in the app."],
    ["Now the public story is catching up", "The website is being reshaped around buyer outcomes, pricing clarity, and editorial depth."],
    ["The next step is trust at first glance", "Analytics, content, and stronger conversion surfaces make the product feel more investable."],
  ];

  return (
    <MarketingLayout>
      <Seo
        title="About | Fliprop"
        description="Learn how Fliprop is positioning itself as a professional SaaS workspace for acquisitions, execution, and property operations."
        path="/about"
      />

      <section className="marketing-hero px-6 py-8 sm:px-8 sm:py-10">
        <span className="eyebrow">About Fliprop</span>
        <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.2rem]">
          We are turning a capable real estate workspace into a company buyers can trust quickly.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
          The product already supports lead tracking, comps, execution planning, tasks, vendors, and
          property work. The next step is to present it with the clarity, editorial depth, and
          professional structure people expect from a real SaaS product.
        </p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {aboutPrinciples.map((principle) => (
          <div key={principle.title} className="surface-panel p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Principle
            </p>
            <h2 className="mt-4 text-lg font-semibold text-ink-900">{principle.title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink-600">{principle.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="surface-panel p-6">
          <span className="eyebrow">What exists today</span>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {productModules.map((module) => (
              <div key={module.title} className="section-card p-5">
                <h3 className="text-lg font-semibold text-ink-900">{module.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-600">{module.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="marketing-spotlight p-6">
          <span className="eyebrow">Why editorial matters</span>
          <div className="soft-list mt-5">
            {resourcesIntro.map((line) => (
              <div key={line} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm leading-6 text-ink-600">{line}</p>
              </div>
            ))}
          </div>
          <div className="section-card mt-5 p-5">
            <h3 className="text-base font-semibold text-ink-900">The goal</h3>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              Make the public experience feel as intentional as the product itself, then use helpful
              resources to bring the right buyers into the signup flow.
            </p>
            <Link
              to="/resources"
              className="secondary-action mt-4"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Visit resources"
              data-analytics-location="about_sidebar"
              data-analytics-category="content"
            >
              Visit resources
            </Link>
          </div>
        </aside>
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Progression</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              How the company narrative is evolving
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-600">
            The strongest version of the brand is the one that matches the product surface, the
            pricing model, and the educational content buyers need before they trust the signup flow.
          </p>
        </div>

        <div className="marketing-timeline mt-6 space-y-5">
          {timeline.map(([title, detail]) => (
            <div key={title} className="marketing-timeline-item">
              <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-panel mt-6 px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Next step</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              The best way to evaluate Fliprop is to start with the workspace.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="primary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Create your workspace"
              data-analytics-location="about_final_cta"
              data-analytics-category="conversion"
            >
              Create your workspace
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="secondary-action"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Review pricing"
              data-analytics-location="about_final_cta"
              data-analytics-category="pricing"
            >
              Review pricing
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

export default AboutPage;
