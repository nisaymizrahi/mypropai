import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

import BrandLogo from "../components/BrandLogo";
import PublicLegalLinks from "../components/PublicLegalLinks";

const focusPoints = [
  "Cleaner hierarchy",
  "Smaller typography",
  "No tenant portal entry",
];

const Homepage = () => {
  return (
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo caption="Real estate workspace for operators" />
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/login" className="ghost-action">
              Workspace login
            </Link>
            <Link to="/signup" className="primary-action">
              Create account
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-12">
          <section className="surface-panel-strong w-full px-6 py-8 sm:px-8 sm:py-10 reveal-up">
            <span className="eyebrow">Minimal workspace redesign</span>
            <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.4rem]">
              Underwrite deals, manage properties, and keep operations organized without the clutter.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
              Fliprop is moving toward a simpler public entry: one operator-focused homepage,
              smaller type, and less visual bulk around the main actions.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/signup" className="primary-action">
                Create workspace account
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
              <Link to="/login" className="secondary-action">
                Sign in
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {focusPoints.map((point) => (
                <span key={point} className="glass-chip">
                  {point}
                </span>
              ))}
            </div>
          </section>
        </main>

        <section className="pb-8">
          <div className="surface-panel px-5 py-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Focus
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600">
              The public entry now stays centered on one path: create an operator account or sign in
              to the workspace. Tenant login is no longer promoted on the main homepage.
            </p>
            <PublicLegalLinks className="mt-4" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Homepage;
