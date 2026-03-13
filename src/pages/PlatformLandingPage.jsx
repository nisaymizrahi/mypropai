import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const signaturePillars = [
  {
    kicker: "Acquisitions",
    title: "Sharper decisions",
    description:
      "Underwriting, diligence, and next moves can read more like a polished memo and less like a crowded tool.",
    icon: ChartBarIcon,
  },
  {
    kicker: "Execution",
    title: "Calmer operations",
    description:
      "Tasks, leasing activity, and on-site coordination now sit inside warmer surfaces with clearer visual priority.",
    icon: ClipboardDocumentListIcon,
  },
  {
    kicker: "Portfolio",
    title: "Higher trust",
    description:
      "A more elegant material system gives the product a steadier, more investor-ready presence from the first screen.",
    icon: HomeModernIcon,
  },
];

const previewStreams = [
  {
    title: "Deal cadence",
    description: "Narrative signals for pricing, diligence, and the next recommendation.",
    progress: 78,
  },
  {
    title: "Execution rhythm",
    description: "A quieter read on project flow, dependencies, and site momentum.",
    progress: 64,
  },
  {
    title: "Portfolio pulse",
    description: "An executive-style snapshot of operations, reporting, and resident activity.",
    progress: 86,
  },
];

const workspaceSignals = [
  { label: "Visual language", value: "Editorial and calm" },
  { label: "Navigation tone", value: "Less noise, more focus" },
  { label: "Current release", value: "Elegant live shell" },
];

function PlatformLandingPage() {
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="public-shell relative min-h-screen overflow-hidden text-ink-900">
      <div className="absolute inset-0 grid-fade opacity-30" />
      <div className="ambient-orb ambient-orb-bronze float-slower left-[-10rem] top-[-4rem] h-[20rem] w-[20rem]" />
      <div className="ambient-orb ambient-orb-sage float-slow right-[-7rem] top-20 h-[18rem] w-[18rem]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="surface-panel flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-4">
            <div className="brand-mark flex h-12 w-12 items-center justify-center rounded-[18px] text-lg font-semibold text-white">
              FL
            </div>
            <div>
              <p className="font-display text-[2rem] leading-none text-ink-900">Fliprop</p>
              <p className="mt-1 text-sm text-ink-500">Elegant workspace redesign</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className="glass-chip hidden md:inline-flex">Live preview</span>
            <Link to="/login" className="ghost-action">
              Sign in
            </Link>
            <Link to="/signup" className="primary-action">
              Create workspace
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center py-8 lg:py-12">
          <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] xl:gap-10">
            <section className="flex flex-col justify-center reveal-up">
              <span className="eyebrow">A calmer portfolio operating system</span>
              <h1 className="mt-6 max-w-5xl font-display text-[3.7rem] leading-[0.92] text-balance text-ink-900 sm:text-[4.8rem] xl:text-[5.8rem]">
                Property operations, acquisitions, and reporting with a more elegant point of view.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-600 sm:text-xl">
                The live Fliprop experience has been rebuilt around premium materials, editorial
                hierarchy, and cleaner pacing so every screen feels more deliberate.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/dashboard" className="primary-action">
                  Enter the workspace
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/login" className="secondary-action">
                  Workspace login
                </Link>
                <Link to="/signup" className="ghost-action">
                  Start a new account
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
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
            </section>

            <section
              className="surface-panel-strong relative overflow-hidden p-6 sm:p-8 reveal-up xl:mt-8"
              style={{ animationDelay: "120ms" }}
            >
              <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-clay-100/40 blur-3xl" />

              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="eyebrow">Concept preview</span>
                    <h2 className="mt-5 font-display text-[3rem] leading-none text-ink-900">
                      Portfolio brief
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-ink-500">
                      A redesign built to feel composed, tactile, and investor-ready at a glance.
                      Updated {todayLabel}.
                    </p>
                  </div>
                  <span className="glass-chip">Editorial layout</span>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(220px,0.92fr)]">
                  <div className="section-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                      Signal stream
                    </p>
                    <div className="soft-list mt-4">
                      {previewStreams.map((stream) => (
                        <div key={stream.title} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-base font-semibold text-ink-900">
                                {stream.title}
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-ink-600">
                                {stream.description}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-ink-500">
                              {stream.progress}%
                            </span>
                          </div>
                          <div className="signal-bar mt-4">
                            <div
                              className="signal-fill"
                              style={{ width: `${stream.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="section-card p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                        Studio note
                      </p>
                      <p className="mt-4 font-display text-[2rem] leading-none text-ink-900">
                        Crafted to feel steadier.
                      </p>
                      <p className="mt-3 text-sm leading-6 text-ink-600">
                        The new system trades generic application chrome for better spacing, richer
                        type, and surfaces with more presence.
                      </p>
                    </div>

                    <div className="metric-tile p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-verdigris-50 text-verdigris-600">
                          <SparklesIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                            Materials
                          </p>
                          <p className="mt-1 text-sm text-ink-600">
                            Ivory, espresso, sage, and copper accents.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <section className="relative pb-10">
          <div className="grid gap-4 lg:grid-cols-3">
            {signaturePillars.map((pillar) => (
              <div key={pillar.title} className="surface-panel p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-sand-50 text-clay-600">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                  {pillar.kicker}
                </p>
                <h3 className="mt-3 font-display text-[2.3rem] leading-none text-ink-900">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-ink-600">{pillar.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PlatformLandingPage;
