import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowRightIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

import BrandLogo from "./BrandLogo";
import PublicLegalLinks from "./PublicLegalLinks";
import {
  marketingNavItems,
  marketingSecondaryNavItems,
  pricingModel,
} from "../content/marketingContent";
import { trackMarketingEvent } from "../utils/analytics";

const footerCollections = [
  {
    title: "Product",
    links: [
      { label: "Homepage", to: "/" },
      { label: "Product", to: "/product" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    title: "Explore",
    links: marketingSecondaryNavItems,
  },
];

const navLinkClassName = ({ isActive }) =>
  `segmented-option ${
    isActive
      ? "segmented-option-active"
      : "text-ink-500 hover:bg-white/80 hover:text-ink-900"
  }`;

const trackDatasetEvent = (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const trackedElement = event.target.closest("[data-analytics-event], [data-analytics-label]");

  if (!trackedElement) {
    return;
  }

  const {
    analyticsCategory,
    analyticsEvent,
    analyticsLabel,
    analyticsLocation,
    analyticsSlug,
  } = trackedElement.dataset;

  const destination =
    trackedElement.getAttribute("href") ||
    trackedElement.getAttribute("data-analytics-destination") ||
    "";

  trackMarketingEvent(analyticsEvent || "marketing_cta_click", {
    interaction_label: analyticsLabel || trackedElement.textContent?.trim() || "interaction",
    interaction_location: analyticsLocation || "marketing_layout",
    interaction_category: analyticsCategory || "cta",
    resource_slug: analyticsSlug || undefined,
    destination,
  });
};

function MarketingLayout({ children }) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  return (
    <div className="public-shell min-h-screen text-ink-900" onClickCapture={trackDatasetEvent}>
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel-strong sticky top-4 z-30 space-y-4 px-5 py-4 backdrop-blur-md">
          <div className="flex flex-wrap items-start gap-4 lg:items-center">
            <Link to="/" className="shrink-0">
              <BrandLogo caption="Fix-and-flip workspace for operators" />
            </Link>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Link
                to="/login"
                className="ghost-action"
                data-testid="home-nav-login"
                data-analytics-event="marketing_cta_click"
                data-analytics-label="Sign in"
                data-analytics-location="header"
                data-analytics-category="auth"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="primary-action"
                data-testid="home-nav-create-account"
                data-analytics-event="marketing_cta_click"
                data-analytics-label="Start free"
                data-analytics-location="header"
                data-analytics-category="conversion"
              >
                Start free
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((current) => !current)}
                className="ghost-action lg:hidden"
                aria-expanded={isMoreMenuOpen}
                aria-label={isMoreMenuOpen ? "Close more links" : "Open more links"}
              >
                {isMoreMenuOpen ? <XMarkIcon className="h-4 w-4" /> : <Bars3Icon className="h-4 w-4" />}
                {isMoreMenuOpen ? "Close" : "More"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="segmented-control flex flex-wrap items-center gap-1 text-sm">
              {marketingNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navLinkClassName}
                  data-analytics-event="marketing_nav_click"
                  data-analytics-label={item.label}
                  data-analytics-location="header_nav"
                  data-analytics-category="navigation"
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden flex-wrap items-center gap-4 text-sm text-ink-500 lg:flex">
              {marketingSecondaryNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="transition hover:text-ink-900"
                  data-analytics-event="marketing_nav_click"
                  data-analytics-label={item.label}
                  data-analytics-location="header_secondary_nav"
                  data-analytics-category="navigation"
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {isMoreMenuOpen ? (
            <div className="grid gap-2 rounded-[22px] border border-ink-100 bg-white/80 p-4 lg:hidden">
              {marketingSecondaryNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="rounded-[14px] px-3 py-2 text-sm text-ink-600 transition hover:bg-sand-50 hover:text-ink-900"
                  data-analytics-event="marketing_nav_click"
                  data-analytics-label={item.label}
                  data-analytics-location="mobile_more_menu"
                  data-analytics-category="navigation"
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ) : null}
        </header>

        <main className="marketing-stage flex-1 space-y-6 py-10 lg:py-12">{children}</main>

        <footer className="pb-8">
          <div className="marketing-spotlight px-6 py-6 sm:px-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
              <div>
                <span className="eyebrow">Fliprop</span>
                <h2 className="mt-4 max-w-xl font-display text-[2rem] leading-none text-ink-900">
                  Go from lead to rehab-ready workspace without rebuilding the deal in three tools.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
                  Start free, centralize the lead and project first, then turn on Pro when recurring
                  deal analysis becomes part of the weekly workflow.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to="/signup"
                    className="primary-action"
                    data-analytics-event="marketing_cta_click"
                    data-analytics-label="Create your workspace"
                    data-analytics-location="footer"
                    data-analytics-category="conversion"
                  >
                    Create your workspace
                  </Link>
                  <Link
                    to="/pricing"
                    className="secondary-action"
                    data-analytics-event="marketing_footer_link_click"
                    data-analytics-label="See pricing"
                    data-analytics-location="footer"
                    data-analytics-category="pricing"
                  >
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
                        data-analytics-event="marketing_footer_link_click"
                        data-analytics-label={link.label}
                        data-analytics-location={`footer_${collection.title.toLowerCase()}`}
                        data-analytics-category={collection.title.toLowerCase()}
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
              <p className="text-sm text-ink-500">
                Starter is free. Pro is {pricingModel.proMonthlyPrice} per month with a{" "}
                {pricingModel.proTrialDays}-day trial.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default MarketingLayout;
