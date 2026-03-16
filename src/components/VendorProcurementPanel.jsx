import React, { useMemo } from "react";

import { formatVendorDate } from "../utils/vendors";
import {
  getVendorProcurementStageClasses,
  getVendorProcurementStateClasses,
  getVendorProcurementSummary,
} from "../utils/vendorProcurement";

const ProcurementMetric = ({ label, value, hint }) => (
  <div className="rounded-[22px] border border-ink-100 bg-white/90 p-5">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-3 text-2xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const VendorProcurementPanel = ({ vendor }) => {
  const summary = useMemo(() => getVendorProcurementSummary(vendor), [vendor]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProcurementMetric
          label="Packet progress"
          value={`${summary.completedRequiredCount}/${summary.requiredCount}`}
          hint="Required procurement items currently covered."
        />
        <ProcurementMetric
          label="Assignment status"
          value={summary.assignmentReady ? "Ready" : "Not ready"}
          hint="W-9, insurance, and contract packet status."
        />
        <ProcurementMetric
          label="Payment status"
          value={summary.paymentReady ? "Ready" : "Needs backup"}
          hint="Invoice-backed payout readiness."
        />
        <ProcurementMetric
          label="Renewals due"
          value={summary.renewalsDueCount}
          hint="Files nearing expiration or renewal."
        />
      </div>

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="eyebrow">Vendor procurement</span>
            <h3 className="mt-4 text-3xl font-semibold text-ink-900">
              Turn the vendor record into a complete assignment packet
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
              This view shows whether the vendor is actually ready to bid, assign, and pay with
              the supporting files already in place.
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${getVendorProcurementStateClasses(summary.overallState)}`}
          >
            {summary.overallLabel}
          </span>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
              Stage checklist
            </p>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {summary.stages.map((stage) => {
                const classes = getVendorProcurementStageClasses(stage.state);

                return (
                  <div key={stage.id} className={`rounded-[22px] border p-5 ${classes.card}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-lg font-semibold text-ink-900">{stage.label}</p>
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
                    <p className="mt-2 text-sm leading-6 text-ink-500">{stage.description}</p>

                    <div className="mt-4 space-y-3">
                      {stage.requirements.map((requirement) => (
                        <div
                          key={requirement.id}
                          className="rounded-[18px] border border-white/70 bg-white/80 px-4 py-3"
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
                              {formatVendorDate(
                                requirement.matchedDocument.expiresAt,
                                "not set"
                              )}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                Next best actions
              </p>
              {summary.nextActions.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {summary.nextActions.map((action) => (
                    <div
                      key={action}
                      className="rounded-[18px] border border-sand-100 bg-sand-50/65 px-4 py-3 text-sm font-medium text-sand-800"
                    >
                      {action}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-ink-500">
                  The packet is in a healthy place right now. Keep an eye on renewals and upload
                  job-specific change orders or payment backup as work progresses.
                </p>
              )}
            </div>

            <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                What strong vendors usually have on file
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-ink-500">
                <p>Bid packet: quote, scope notes, trade details.</p>
                <p>Assignment packet: W-9, insurance, license or registration, signed agreement.</p>
                <p>Payment packet: invoice or payment application, plus lien waiver when needed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VendorProcurementPanel;
