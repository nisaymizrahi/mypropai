import React from "react";

function PlatformWorkspacePage() {
  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-6 md:px-6 md:py-7">
        <span className="eyebrow">Workspace</span>
        <h2 className="mt-3 text-2xl font-semibold text-ink-900">Blank canvas ready</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
          This is the new starting point for the product. The previous feature set is still on disk,
          but the active app is now reduced to an empty shell so we can build forward cleanly.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="surface-panel min-h-[460px] rounded-[32px] border border-dashed border-ink-200 bg-white/80 px-6 py-6">
          <div className="flex min-h-full items-center justify-center rounded-[28px] border border-dashed border-ink-200 bg-sand-50/55 px-6 py-16 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                Empty state
              </p>
              <h3 className="mt-4 text-xl font-semibold text-ink-900">
                Add your first feature here
              </h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-ink-500">
                Start shaping the new information architecture, components, and flows without the old
                product getting in the way.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <section className="surface-panel px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
              Live now
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              A minimal platform shell, auth access, and this empty workspace.
            </p>
          </section>

          <section className="surface-panel px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
              Parked
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              Legacy routes redirect away from the old product, but the previous code remains available
              in the repository if we want to reuse pieces later.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}

export default PlatformWorkspacePage;
