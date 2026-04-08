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
      { label: "Product", to: "/product" },
      { label: "Pricing", to: "/pricing" },
      { label: "Resources", to: "/resources" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Compare", to: "/compare/flipper-force" },
      { label: "About", to: "/about" },
    ],
  },
];

const navLinkClassName = ({ isActive }) =>
  `public-nav-link ${isActive ? "public-nav-link-active" : ""}`.trim();

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

  const closeMoreMenu = () => setIsMoreMenuOpen(false);

  return (
    <div className="public-shell min-h-screen text-ink-900" onClickCapture={trackDatasetEvent}>
      <div className="mx-auto flex min-h-screen max-w-[1320px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="public-header-shell sticky top-4 z-30 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex min-w-0 shrink-0 items-center gap-3" onClick={closeMoreMenu}>
              <BrandLogo imageClassName="h-9 max-w-[150px] sm:h-10 sm:max-w-[166px]" />
              <p className="hidden max-w-[12rem] text-xs leading-5 text-ink-500 xl:block">
                Investor workspace for lead-to-project execution
              </p>
            </Link>

            <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Primary">
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

            <div className="ml-auto flex items-center gap-2">
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
                <ArrowRightIcon className="hidden h-4 w-4 sm:block" />
              </Link>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((current) => !current)}
                className="ghost-action lg:hidden"
                aria-controls="public-mobile-nav"
                aria-expanded={isMoreMenuOpen}
                aria-label={isMoreMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMoreMenuOpen ? <XMarkIcon className="h-4 w-4" /> : <Bars3Icon className="h-4 w-4" />}
                {isMoreMenuOpen ? "Close" : "Menu"}
              </button>
            </div>
          </div>

          {isMoreMenuOpen ? (
            <div id="public-mobile-nav" className="public-mobile-menu mt-3 lg:hidden" aria-label="Mobile navigation">
              <div className="grid gap-2">
                {marketingNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMoreMenu}
                    className="rounded-[16px] px-4 py-3 text-sm font-semibold text-ink-700 transition hover:bg-white hover:text-ink-900"
                    data-analytics-event="marketing_nav_click"
                    data-analytics-label={item.label}
                    data-analytics-location="mobile_nav"
                    data-analytics-category="navigation"
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className="editorial-divider my-3" />

              <div className="grid gap-2">
                {marketingSecondaryNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMoreMenu}
                    className="rounded-[16px] px-4 py-3 text-sm font-medium text-ink-600 transition hover:bg-white hover:text-ink-900"
                    data-analytics-event="marketing_nav_click"
                    data-analytics-label={item.label}
                    data-analytics-location="mobile_secondary_nav"
                    data-analytics-category="navigation"
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ) : null}
        </header>

        <main className="marketing-stage flex-1 space-y-8 py-8 lg:py-12">{children}</main>

        <footer className="pb-8 pt-6" role="contentinfo">
          <div className="public-footer-shell px-6 py-7 sm:px-7">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
              <div className="max-w-xl">
                <span className="eyebrow">Fliprop</span>
                <h2 className="mt-5 font-display text-[2rem] leading-[0.98] text-ink-900">
                  A calmer operating system for investor teams moving from lead review into execution.
                </h2>
                <p className="mt-4 text-sm leading-7 text-ink-600 sm:text-base">
                  Start free, keep the deal story intact, and turn on Pro only when recurring
                  analysis becomes part of the weekly workflow.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
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
