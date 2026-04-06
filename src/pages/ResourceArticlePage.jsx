import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

import MarketingLayout from "../components/MarketingLayout";
import Seo from "../components/Seo";
import { getResourceBySlug, resourceArticles } from "../content/marketingContent";

function ResourceArticlePage() {
  const { slug } = useParams();
  const article = getResourceBySlug(slug);

  if (!article) {
    return <Navigate to="/resources" replace />;
  }

  const relatedArticles = resourceArticles.filter((item) => item.slug !== article.slug).slice(0, 2);

  return (
    <MarketingLayout>
      <Seo
        title={`${article.title} | Fliprop Resources`}
        description={article.summary}
        path={`/resources/${article.slug}`}
      />

      <section className="surface-panel-strong px-6 py-8 sm:px-8 sm:py-10">
        <Link to="/resources" className="ghost-action">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to resources
        </Link>
        <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
          {article.category} • {article.readTime}
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.2rem]">
          {article.title}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
          {article.summary}
        </p>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="surface-panel px-6 py-7 sm:px-8">
          <div className="space-y-6">
            {article.sections.map((section) => (
              <section key={section.title} className="section-card p-5 sm:p-6">
                <h2 className="font-display text-[2rem] leading-none text-ink-900">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-ink-600 sm:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="soft-list mt-5">
                  {section.bullets.map((bullet) => (
                    <div key={bullet} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-sm leading-6 text-ink-600">{bullet}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>

        <aside className="space-y-4">
          <div className="surface-panel p-6">
            <span className="eyebrow">Quick takeaways</span>
            <div className="soft-list mt-5">
              {article.takeaways.map((takeaway) => (
                <div key={takeaway} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-sm leading-6 text-ink-600">{takeaway}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel-strong p-6">
            <span className="eyebrow">Use it in practice</span>
            <h2 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
              Turn the process into a shared workspace.
            </h2>
            <p className="mt-4 text-sm leading-6 text-ink-600">
              Use Fliprop to organize deals, tasks, vendors, property context, and recurring
              decisions without rebuilding the system from scratch each week.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/signup" className="primary-action">
                Start free
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/product" className="secondary-action">
                See the product
              </Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Keep reading</span>
            <h2 className="mt-4 font-display text-[2.1rem] leading-none text-ink-900">
              Related guides for the rest of the workflow
            </h2>
          </div>
          <Link to="/resources" className="secondary-action">
            View all resources
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {relatedArticles.map((relatedArticle) => (
            <Link
              key={relatedArticle.slug}
              to={`/resources/${relatedArticle.slug}`}
              className="surface-panel block p-6 transition hover:-translate-y-0.5"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                {relatedArticle.category}
              </p>
              <h3 className="mt-4 font-display text-[1.9rem] leading-none text-ink-900">
                {relatedArticle.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-ink-600">{relatedArticle.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}

export default ResourceArticlePage;
