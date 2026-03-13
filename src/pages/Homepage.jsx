import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const summaryRows = [
  {
    title: "Acquisitions",
    description: "Track leads, underwriting, and next actions in a cleaner pipeline.",
  },
  {
    title: "Execution",
    description: "Keep rehab and leasing workflows inside a lighter operating view.",
  },
  {
    title: "Reporting",
    description: "Present updates and decisions with less visual weight around them.",
  },
];

const reasons = [
  "Smaller typography for easier scanning",
  "Fewer panels competing for attention",
  "Flatter surfaces with lighter contrast",
];

const Homepage = () => {
  return (
    <div className="public-shell min-h-screen text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-panel flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="brand-mark flex h-10 w-10 items-center justify-center rounded-[14px] text-sm font-semibold text-white">
              FL
            </div>
            <div>
              <p className="font-display text-[1.9rem] leading-none text-ink-900">Fliprop</p>
              <p className="mt-1 text-xs text-ink-500">
                Real estate workspace for operators
              </p>
            </div>
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
          <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
            <section className="flex flex-col justify-center reveal-up">
              <span className="eyebrow">Minimal workspace redesign</span>
              <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.9rem] xl:text-[4.6rem]">
                Underwrite deals, manage properties, and keep operations organized without the clutter.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
                Fliprop is now moving toward a lighter interface: smaller type, simpler hierarchy,
                and less visual bulk around the work that matters.
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
            </section>

            <aside className="surface-panel-strong p-6 reveal-up" style={{ animationDelay: "90ms" }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                Why it feels different
              </p>
              <div className="soft-list mt-4">
                {reasons.map((reason) => (
                  <div key={reason} className="py-4 first:pt-0 last:pb-0">
                    <p className="text-sm leading-6 text-ink-600">{reason}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </main>

        <section className="grid gap-3 pb-8 md:grid-cols-3">
          {summaryRows.map((row) => (
            <div key={row.title} className="surface-panel p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                {row.title}
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-600">{row.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Homepage;
