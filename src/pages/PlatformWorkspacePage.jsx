import React from "react";
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const workspaceSignals = [
  { label: "Morning brief", value: "Narrative-first status" },
  { label: "Portfolio tone", value: "Warm and deliberate" },
  { label: "Live shell", value: "Rebuilt visual system" },
];

const cadenceStreams = [
  {
    title: "Acquisitions signal",
    description:
      "A more polished place to summarize pricing conviction, comps, diligence movement, and the next call to make.",
    progress: 76,
    icon: ChartBarIcon,
  },
  {
    title: "Execution rhythm",
    description:
      "Project work can breathe with clearer separation between milestones, blockers, and forward motion.",
    progress: 64,
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "Operations overview",
    description:
      "Leasing, resident needs, and portfolio health now sit inside a calmer surface hierarchy for daily review.",
    progress: 82,
    icon: HomeModernIcon,
  },
];

const attentionBoard = [
  {
    label: "Layout intent",
    value: "More white space around the highest-signal information.",
  },
  {
    label: "Material system",
    value: "Ivory glass, espresso type, and sage undertones carry the full shell.",
  },
  {
    label: "Motion tone",
    value: "Only a few softer ambient movements so the interface still feels composed.",
  },
];

const designPrinciples = [
  "Editorial hierarchy over flat utility grids.",
  "Stronger typography before adding more chrome.",
  "Deliberate surfaces that feel premium without becoming heavy.",
];

const workspaceDisciplines = [
  {
    title: "Acquisitions",
    description:
      "Underwriting and diligence are framed like a clear decision memo instead of a crowded worksheet.",
    icon: ChartBarIcon,
  },
  {
    title: "Execution",
    description:
      "Tasks, scopes, and field activity can be reintroduced on top of a more deliberate visual rhythm.",
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "Reporting",
    description:
      "Narrative snapshots and higher-trust presentation help the platform feel ready for external eyes.",
    icon: SparklesIcon,
  },
];

function PlatformWorkspacePage() {
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-5 text-ink-900">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_340px]">
        <div className="surface-panel-strong relative overflow-hidden px-6 py-6 sm:px-8 sm:py-8">
          <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-clay-100/35 blur-3xl" />

          <div className="relative">
            <span className="eyebrow">Workspace overview</span>
            <h2 className="mt-5 max-w-3xl font-display text-[3.2rem] leading-[0.92] text-ink-900">
              A calmer command center for the next phase of the product.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-600">
              The live dashboard now emphasizes materials, spacing, and narrative structure so the
              product feels elevated before we layer the next feature set back in.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {workspaceSignals.map((signal) => (
                <div key={signal.label} className="metric-tile p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                    {signal.label}
                  </p>
                  <p className="mt-4 font-display text-[2rem] leading-none text-ink-900">
                    {signal.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface-panel px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">Today</p>
            <h3 className="mt-3 font-display text-[2.3rem] leading-none text-ink-900">
              {todayLabel}
            </h3>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              The live experience is intentionally focused on the refined shell while the next
              modules are rebuilt against it.
            </p>
          </div>

          <div className="section-card px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
              Design note
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              Elegant interfaces earn trust through pacing and emphasis. This version trades dense
              chrome for fewer, stronger moments of information.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)]">
        <div className="surface-panel px-6 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                Portfolio cadence
              </p>
              <h3 className="mt-3 font-display text-[2.4rem] leading-none text-ink-900">
                Three streams, one refined rhythm.
              </h3>
            </div>
            <span className="glass-chip">Preview dashboard</span>
          </div>

          <div className="soft-list mt-6">
            {cadenceStreams.map((stream) => (
              <div key={stream.title} className="py-5 first:pt-0 last:pb-0">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-sand-50 text-clay-600">
                    <stream.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-ink-900">{stream.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-ink-600">
                          {stream.description}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-ink-500">
                        {stream.progress}%
                      </span>
                    </div>
                    <div className="signal-bar mt-4">
                      <div className="signal-fill" style={{ width: `${stream.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface-panel px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
              Attention board
            </p>
            <div className="soft-list mt-4">
              {attentionBoard.map((item) => (
                <div key={item.label} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-ink-600">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
              Principles
            </p>
            <div className="soft-list mt-4">
              {designPrinciples.map((principle) => (
                <div key={principle} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-sm leading-6 text-ink-600">{principle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {workspaceDisciplines.map((discipline) => (
          <div key={discipline.title} className="surface-panel p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-sand-50 text-clay-600">
              <discipline.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-6 font-display text-[2.2rem] leading-none text-ink-900">
              {discipline.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-ink-600">{discipline.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default PlatformWorkspacePage;
