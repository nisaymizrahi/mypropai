import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const quietMetrics = [
  { label: "Direction", value: "Minimal" },
  { label: "Typography", value: "Smaller" },
  { label: "Mood", value: "Calmer" },
];

const previewNotes = [
  {
    title: "Cleaner hierarchy",
    description: "Fewer panels and smaller type let the primary action surface faster.",
  },
  {
    title: "Lighter materials",
    description: "The interface now leans on thin borders and soft contrast instead of blur and glow.",
  },
  {
    title: "More breathing room",
    description: "Spacing stays deliberate without making the layout feel oversized.",
  },
];

const focusAreas = [
  {
    title: "Acquisitions",
    description: "Sharper decision screens with less decorative weight.",
  },
  {
    title: "Operations",
    description: "A calmer shell for daily leasing and portfolio review.",
  },
  {
    title: "Reporting",
    description: "Cleaner presentation for summaries and investor-facing moments.",
  },
];

function PlatformLandingPage() {
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

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
              <p className="mt-1 text-xs text-ink-500">Minimal editorial redesign</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/login" className="ghost-action">
              Sign in
            </Link>
            <Link to="/signup" className="primary-action">
              Create workspace
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10 lg:py-12">
          <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1.06fr)_360px] xl:gap-8">
            <section className="flex flex-col justify-center reveal-up">
              <span className="eyebrow">A quieter portfolio workspace</span>
              <h1 className="mt-5 max-w-4xl font-display text-[3rem] leading-[0.96] text-balance text-ink-900 sm:text-[3.8rem] xl:text-[4.4rem]">
                Property operations, acquisitions, and reporting with less visual noise.
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-ink-600 sm:text-base">
                The live experience has been simplified into a lighter interface with smaller
                typography, flatter surfaces, and fewer competing sections.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/dashboard" className="primary-action">
                  Open workspace
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
                <Link to="/login" className="secondary-action">
                  Workspace login
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {quietMetrics.map((metric) => (
                  <div key={metric.label} className="metric-tile p-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-base font-medium text-ink-900">{metric.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="surface-panel-strong p-6 reveal-up" style={{ animationDelay: "90ms" }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                Preview
              </p>
              <h2 className="mt-3 font-display text-[2rem] leading-none text-ink-900">
                Minimal editorial direction
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-600">
                A more restrained foundation for the product, updated {todayLabel}.
              </p>

              <div className="soft-list mt-5">
                {previewNotes.map((note) => (
                  <div key={note.title} className="py-4 first:pt-0 last:pb-0">
                    <h3 className="text-sm font-medium text-ink-900">{note.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-600">{note.description}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </main>

        <section className="grid gap-3 pb-8 md:grid-cols-3">
          {focusAreas.map((area) => (
            <div key={area.title} className="surface-panel p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                {area.title}
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-600">{area.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default PlatformLandingPage;
