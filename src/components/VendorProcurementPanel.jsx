import React, { useMemo } from "react";

import { formatVendorDate } from "../utils/vendors";
import {
  getVendorProcurementStageClasses,
  getVendorProcurementStateClasses,
  getVendorProcurementSummary,
} from "../utils/vendorProcurement";

const ProcurementMetric = ({ label, value, hint }) => (
  <div className="rounded-[20px] border border-ink-100 bg-white/88 px-4 py-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-1 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const VendorProcurementPanel = ({ vendor }) => {
  const summary = useMemo(() => getVendorProcurementSummary(vendor), [vendor]);

  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="eyebrow">Procurement readiness</span>
            <h3 className="mt-4 text-[1.8rem] font-medium tracking-tight text-ink-900">
              Keep the packet ready for bid, assignment, and payout
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
              This is the working view for packet readiness. It shows what the vendor still needs
              before you can confidently assign work, execute contracts, or release payment.
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${getVendorProcurementStateClasses(
              summary.overallState
            )}`}
          >
            {summary.overallLabel}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ProcurementMetric
            label="Packet coverage"
            value={`${summary.completedRequiredCount}/${summary.requiredCount}`}
            hint="Required packet items currently covered."
          />
          <ProcurementMetric
            label="Assignment"
            value={summary.assignmentReady ? "Ready" : "Needs follow-through"}
            hint="W-9, insurance, and contract packet status."
          />
          <ProcurementMetric
            label="Payment"
            value={summary.paymentReady ? "Ready" : "Needs backup"}
            hint="Invoice-backed payout readiness."
          />
          <ProcurementMetric
            label="Renewal watch"
            value={summary.renewalsDueCount}
            hint="Files nearing expiration or review."
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="section-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Packet board
              </p>
              <p className="mt-1 text-sm text-ink-500">
                Work through the stages in order so the vendor is genuinely ready to use.
              </p>
            </div>
            <span className="rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-semibold text-ink-500">
              {summary.stages.length} stages
            </span>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {summary.stages.map((stage) => {
              const classes = getVendorProcurementStageClasses(stage.state);
              const stageReadyCount = stage.requirements.filter(
                (requirement) =>
                  requirement.state === "current" || requirement.state === "expiring"
              ).length;
              const stageAction =
                stage.requirements.find(
                  (requirement) =>
                    requirement.state === "missing" || requirement.state === "expired"
                )?.label || "Packet is in a good place for this stage.";

              return (
                <div key={stage.id} className={`rounded-[22px] border p-4 ${classes.card}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-ink-900">{stage.label}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-500">{stage.description}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes.chip}`}>
                      {stage.state === "complete"
                        ? "Ready"
                        : stage.state === "warning"
                          ? "Watch"
                          : stage.state === "attention"
                            ? "Needs docs"
                            : stage.state === "in_progress"
                              ? "In progress"
                              : "Not started"}
                    </span>
                  </div>

                  <div className="mt-4 rounded-[18px] border border-white/75 bg-white/85 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Stage signal
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink-900">
                      {stageReadyCount}/{stage.requirements.length} covered
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-500">{stageAction}</p>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {stage.requirements.map((requirement) => (
                      <div
                        key={requirement.id}
                        className="rounded-[18px] border border-white/75 bg-white/85 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink-900">{requirement.label}</p>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                              requirement.state === "current"
                                ? "border border-verdigris-200 bg-verdigris-50 text-verdigris-700"
                                : requirement.state === "expiring"
                                  ? "border border-sand-200 bg-sand-50 text-sand-700"
                                  : requirement.state === "expired"
                                    ? "border border-clay-200 bg-clay-50 text-clay-700"
                                    : "border border-ink-100 bg-ink-50 text-ink-600"
                            }`}
                          >
                            {requirement.state === "current"
                              ? "On file"
                              : requirement.state === "expiring"
                                ? "Expiring"
                                : requirement.state === "expired"
                                  ? "Expired"
                                  : "Missing"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-ink-500">
                          {requirement.description}
                        </p>
                        {requirement.matchedDocument ? (
                          <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-400">
                            {requirement.matchedDocument.displayName} • expires{" "}
                            {formatVendorDate(requirement.matchedDocument.expiresAt, "not set")}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-4">
          <section className="section-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              Next best actions
            </p>
            {summary.nextActions.length > 0 ? (
              <div className="mt-4 space-y-3">
                {summary.nextActions.map((action) => (
                  <div
                    key={action}
                    className="rounded-[18px] border border-sand-100 bg-sand-50/70 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-sand-900">{action}</p>
                    <p className="mt-1 text-sm leading-6 text-sand-800/85">
                      Clearing this item will move the vendor closer to active assignment or
                      payment-ready status.
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-ink-500">
                The packet is in a healthy place right now. Keep an eye on renewals and upload
                project-specific change orders or payout backup as work progresses.
              </p>
            )}
          </section>

          <section className="section-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              Strong packet checklist
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-ink-500">
              <p>Bid support: quote, scope notes, and clear trade details.</p>
              <p>Onboarding: W-9, insurance, license or registration when required.</p>
              <p>Contracting: signed contract, PO, or approved scope agreement.</p>
              <p>Payment support: invoice or pay app, plus lien waiver when needed.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default VendorProcurementPanel;
