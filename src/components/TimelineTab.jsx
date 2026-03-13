import React from "react";

const TimelineTab = ({ investment }) => {
  const phases = [
    {
      label: "Acquire",
      description: "Core purchase and asset details are entered.",
      complete: Boolean(investment.purchasePrice || investment.address),
    },
    {
      label: "Underwrite",
      description: "Budget, value, and financing assumptions are modeled.",
      complete: Boolean(
        investment.arv ||
          investment.loanAmount ||
          investment.buyClosingCost ||
          investment.dealAnalysis
      ),
    },
    {
      label: "Execute",
      description: "The rehab or project plan is actively moving through tasks.",
      complete: Number(investment.progress || 0) > 0,
    },
    {
      label: "Outcome",
      description: "The project has exited or moved into active management.",
      complete: Boolean(
        investment.managedProperty || ["Sold", "Archived"].includes(investment.status)
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Project path</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">Milestone timeline</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
          Track the project from acquisition setup through execution and final outcome.
        </p>

        <div className="mt-8 grid gap-4 xl:grid-cols-4">
          {phases.map((phase, index) => (
            <div key={phase.label} className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    phase.complete
                      ? "bg-verdigris-600 text-white"
                      : "border border-ink-200 bg-white text-ink-500"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    phase.complete
                      ? "border border-verdigris-200 bg-verdigris-50 text-verdigris-700"
                      : "border border-ink-200 bg-white text-ink-500"
                  }`}
                >
                  {phase.complete ? "Complete" : "Pending"}
                </span>
              </div>

              <p className="mt-5 text-lg font-semibold text-ink-900">{phase.label}</p>
              <p className="mt-3 text-sm leading-6 text-ink-500">{phase.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[24px] border border-sand-200 bg-sand-50/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sand-700">
            Current project state
          </p>
          <p className="mt-3 text-sm leading-7 text-ink-600">
            Status is currently <span className="font-semibold text-ink-900">{investment.status || "Not Started"}</span> with
            project progress at <span className="font-semibold text-ink-900">{Math.round(Number(investment.progress || 0))}%</span>.
          </p>
        </div>
      </section>
    </div>
  );
};

export default TimelineTab;
