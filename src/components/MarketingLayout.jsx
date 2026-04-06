import React from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import BrandLogo from "./BrandLogo";
import PublicLegalLinks from "./PublicLegalLinks";
import { marketingNavItems, resourceArticles } from "../content/marketingContent";

const footerCollections = [
  {
    title: "Product",
    links: [
      { label: "Homepage", to: "/" },
      { label: "Product", to: "/product" },
      { label: "Pricing", to: "/pricing" },
      { label: "About", to: "/about" },
    ],
  },
  {
    title: "Resources",
    links: resourceArticles.map((article) => ({
      label: article.title,
      to: `/resources/${article.slug}`,
    })),
  },
];

const navLinkClassName = ({ isActive }) =>
  `rounded-full px-3 py-2 transition ${
    isActive
      ? "bg-white text-ink-900 shadow-sm"
      : "text-ink-500 hover:bg-white/80 hover:text-ink-900"
  }`;

function MarketingLayout({ children }) {
  return (
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex flex-wrap items-center gap-4 px-5 py-4">
          <Link to="/" className="shrink-0">
            <BrandLogo caption="Real estate workspace for operators" />
          </Link>

          <nav className="order-3 flex w-full flex-wrap items-center gap-1 rounded-full bg-white/50 p-1 text-sm lg:order-2 lg:ml-auto lg:w-auto">
            {marketingNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClassName}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="order-2 ml-auto flex flex-wrap items-center gap-2 lg:order-3">
            <Link to="/login" className="ghost-action" data-testid="home-nav-login">
              Workspace login
            </Link>
            <Link to="/signup" className="primary-action" data-testid="home-nav-create-account">
              Start free
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="flex-1 py-10 lg:py-12">{children}</main>

        <footer className="pb-8">
          <div className="surface-panel px-6 py-6 sm:px-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px_300px]">
              <div>
                <span className="eyebrow">Fliprop</span>
                <h2 className="mt-4 max-w-xl font-display text-[2rem] leading-none text-ink-900">
                  One workspace for acquisitions, execution, and property operations.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
                  Start with the core operating system, then upgrade when you need recurring premium
                  analysis and reporting.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to="/signup" className="primary-action">
                    Create your workspace
                  </Link>
                  <Link to="/pricing" className="secondary-action">
                    See pricing
                  </Link>
                </div>
              </div>

              {footerCollections.map((collection) => (
                <div key={collection.title}>
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                    {collection.title}
                  </p>
                  <div className="mt-4 space-y-3">
                    {collection.links.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="block text-sm leading-6 text-ink-600 transition hover:text-ink-900"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="editorial-divider my-6" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <PublicLegalLinks className="mt-0" />
              <p className="text-sm text-ink-500">Starter is free. Pro is $49 per month.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default MarketingLayout;
