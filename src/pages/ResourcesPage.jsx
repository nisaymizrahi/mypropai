import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import { resourceArticles, resourcesIntro } from "../content/marketingContent";

function ResourcesPage() {
  const [featuredArticle, ...libraryArticles] = resourceArticles;

  return (
    <MarketingLayout>
      <Seo
        title="Resources | Fliprop"
        description="Editorial playbooks for acquisitions, rehab planning, and property workspace workflows from the Fliprop team."
        path="/resources"
      />

      <section className="marketing-hero px-6 py-8 sm:px-8 sm:py-10">
        <span className="eyebrow">Resources</span>
        <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.2rem]">
          Editorial playbooks for operators who want sharper decisions and calmer execution.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
          These guides are built around the same acquisition, execution, and workspace workflows
          Fliprop is designed to support inside the product.
        </p>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Link
          to={`/resources/${featuredArticle.slug}`}
          className="marketing-spotlight marketing-link-card block px-6 py-7"
          data-analytics-event="resource_article_open"
          data-analytics-label={featuredArticle.title}
          data-analytics-location="resources_featured"
          data-analytics-category="content"
          data-analytics-slug={featuredArticle.slug}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
            Featured guide
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-verdigris-700">
            {featuredArticle.category} • {featuredArticle.readTime}
          </p>
          <h2 className="mt-4 font-display text-[2.3rem] leading-none text-ink-900">
            {featuredArticle.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
            {featuredArticle.summary}
          </p>
          <span className="secondary-action mt-6 inline-flex">
            Read the guide
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </span>
        </Link>

        <aside className="surface-panel p-6">
          <span className="eyebrow">Why this section exists</span>
          <div className="soft-list mt-5">
            {resourcesIntro.map((item) => (
              <div key={item} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm leading-6 text-ink-600">{item}</p>
              </div>
            ))}
          </div>
          <div className="section-card mt-5 p-5">
            <h3 className="text-base font-semibold text-ink-900">Turn the playbook into workflow</h3>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              Read the process here, then use Fliprop to manage the same work in a shared workspace.
            </p>
            <Link
              to="/signup"
              className="primary-action mt-4"
              data-analytics-event="marketing_cta_click"
              data-analytics-label="Start free"
              data-analytics-location="resources_sidebar"
              data-analytics-category="conversion"
            >
              Start free
            </Link>
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {libraryArticles.map((article) => (
          <Link
            key={article.slug}
            to={`/resources/${article.slug}`}
            className="surface-panel marketing-link-card block p-6"
            data-analytics-event="resource_article_open"
            data-analytics-label={article.title}
            data-analytics-location="resources_library"
            data-analytics-category="content"
            data-analytics-slug={article.slug}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              {article.category}
            </p>
            <h2 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
              {article.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-ink-600">{article.summary}</p>
            <p className="mt-4 text-sm font-medium text-verdigris-700">{article.readTime}</p>
          </Link>
        ))}
      </section>
    </MarketingLayout>
  );
}

export default ResourcesPage;
