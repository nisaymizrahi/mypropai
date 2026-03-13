import React from "react";

const workspaceSignals = [
  { label: "Interface", value: "Lighter" },
  { label: "Scale", value: "Smaller type" },
  { label: "Focus", value: "Less noise" },
];

const focusAreas = [
  {
    title: "Acquisitions",
    description: "A quieter structure for decisions, assumptions, and next steps.",
  },
  {
    title: "Execution",
    description: "A slimmer base for project, rehab, and leasing workflows.",
  },
  {
    title: "Operations",
    description: "More room for the day-to-day information that actually needs attention.",
  },
];

const designPrinciples = [
  "Use fewer boxes and let the content breathe.",
  "Keep serif typography for emphasis, not for every large block.",
  "Prefer thin borders and light contrast over blur, glow, and heavy shadows.",
];

function PlatformWorkspacePage() {
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-4 text-ink-900">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="surface-panel-strong px-6 py-6">
          <span className="eyebrow">Workspace overview</span>
          <h2 className="mt-4 max-w-3xl font-display text-[2.6rem] leading-[0.96] text-ink-900">
            A lighter starting point for the platform.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-600 sm:text-base">
            The live shell has been simplified so new product work can sit on a cleaner, calmer
            visual foundation.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {workspaceSignals.map((signal) => (
              <div key={signal.label} className="metric-tile p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                  {signal.label}
                </p>
                <p className="mt-3 text-sm font-medium text-ink-900">{signal.value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="surface-panel px-5 py-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">Today</p>
          <h3 className="mt-3 font-display text-[2rem] leading-none text-ink-900">{todayLabel}</h3>
          <p className="mt-4 text-sm leading-6 text-ink-600">
            The emphasis is now on clear spacing, smaller typography, and simpler presentation.
          </p>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="surface-panel px-6 py-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
            Focus areas
          </p>
          <div className="soft-list mt-4">
            {focusAreas.map((area) => (
              <div key={area.title} className="py-4 first:pt-0 last:pb-0">
                <h3 className="text-sm font-medium text-ink-900">{area.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-600">{area.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-panel px-5 py-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
            Design principles
          </p>
          <div className="soft-list mt-4">
            {designPrinciples.map((principle) => (
              <div key={principle} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm leading-6 text-ink-600">{principle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default PlatformWorkspacePage;
