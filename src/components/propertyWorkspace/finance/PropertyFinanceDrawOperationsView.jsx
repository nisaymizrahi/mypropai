import React from "react";
import {
  ArrowDownTrayIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

import { formatCurrency } from "../../../utils/investmentMetrics";
import { DRAW_STATUS_OPTIONS } from "../../../utils/capitalStack";
import {
  FinanceField,
  FinanceSelect,
  getDrawStatusClasses,
  MetricTile,
  ProgressBar,
} from "./PropertyFinanceShared";

const PropertyFinanceDrawOperationsView = ({
  embedded = false,
  drawOperations,
  drawSummary,
  documents,
  drawExportRef,
  handleAddDrawRequest,
  handleExportDrawSummary,
  handleSaveFinance,
  isSavingFinance,
  handleDrawRequestChange,
}) => {
  const packetReadyCount = drawOperations.filter(
    (item) => item.packetReady && item.status !== "funded"
  ).length;
  const submittedDrawCount = drawOperations.filter((item) =>
    ["requested", "approved", "holdback", "funded"].includes(item.status)
  ).length;
  const holdbackExposure = drawOperations.reduce(
    (sum, item) => sum + (item.status === "holdback" ? item.outstandingAmount : 0),
    0
  );
  const linkedPacketDocs = documents.filter((document) => document.drawRequestId).length;

  return (
    <div className="space-y-6">
      {!embedded ? (
        <section className="surface-panel px-6 py-7 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow">Finance / Draw Operations</span>
              <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
                Run lender draw workflow from one operational board
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
                Track request status, packet readiness, linked support files, and reimbursable
                spend so hard-money and construction draws stop living in separate notes and
                inboxes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleAddDrawRequest} className="primary-action">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add draw request
              </button>
              <button type="button" onClick={handleExportDrawSummary} className="secondary-action">
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                Export lender summary
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={CalendarDaysIcon}
          label="Draws tracked"
          value={drawOperations.length}
          hint="Requests, approvals, holdbacks, and funded releases."
        />
        <MetricTile
          icon={ClipboardDocumentListIcon}
          label="Packet ready"
          value={packetReadyCount}
          hint="Draws with source, amount, docs, and linked expenses in place."
        />
        <MetricTile
          icon={DocumentTextIcon}
          label="Submitted / active"
          value={submittedDrawCount}
          hint="Draws already in motion with the lender."
        />
        <MetricTile
          icon={BanknotesIcon}
          label="Holdback exposure"
          value={formatCurrency(holdbackExposure)}
          hint={`${linkedPacketDocs} linked lender support file${linkedPacketDocs === 1 ? "" : "s"}.`}
        />
      </div>

      <form onSubmit={handleSaveFinance} className="space-y-6">
        <div ref={drawExportRef} className="space-y-6">
          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Lender position</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Request flow summary</h4>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[20px] border border-ink-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Requested
                </p>
                <p className="mt-2 text-xl font-semibold text-ink-900">
                  {formatCurrency(drawSummary.requested)}
                </p>
              </div>
              <div className="rounded-[20px] border border-ink-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Funded
                </p>
                <p className="mt-2 text-xl font-semibold text-ink-900">
                  {formatCurrency(drawSummary.funded)}
                </p>
              </div>
              <div className="rounded-[20px] border border-ink-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Pending funding
                </p>
                <p className="mt-2 text-xl font-semibold text-ink-900">
                  {formatCurrency(Math.max(drawSummary.requested - drawSummary.funded, 0))}
                </p>
              </div>
              <div className="rounded-[20px] border border-ink-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Packet docs
                </p>
                <p className="mt-2 text-xl font-semibold text-ink-900">{linkedPacketDocs}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <ProgressBar
                label="Requested vs draw capacity"
                value={drawSummary.requested}
                total={drawSummary.capacity || 1}
                tone="bg-sky-500"
                helper={`${formatCurrency(drawSummary.requested)} requested against ${formatCurrency(drawSummary.capacity)} capacity`}
              />
              <ProgressBar
                label="Funded vs draw capacity"
                value={drawSummary.funded}
                total={drawSummary.capacity || 1}
                tone="bg-verdigris-500"
                helper={`${formatCurrency(drawSummary.funded)} funded against ${formatCurrency(drawSummary.capacity)} capacity`}
              />
            </div>
          </section>

          <section className="space-y-4">
            {drawOperations.length > 0 ? (
              drawOperations.map((draw) => (
                <div key={draw.drawId} className="section-card p-6 sm:p-7">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xl font-semibold text-ink-900">{draw.label}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getDrawStatusClasses(
                            draw.status
                          )}`}
                        >
                          {DRAW_STATUS_OPTIONS.find((option) => option.value === draw.status)?.label ||
                            "Planned"}
                        </span>
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                          {draw.sourceLabel}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-ink-500">
                        Use this view to confirm the packet is ready, mark lender movement, and
                        see whether support docs and reimbursable expenses are keeping up with the
                        request amount.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Requested
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink-900">
                          {formatCurrency(draw.amountRequested)}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-verdigris-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Funded
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink-900">
                          {formatCurrency(draw.amountFunded)}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-clay-50/70 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Outstanding
                        </p>
                        <p className="mt-1 text-sm font-semibold text-ink-900">
                          {formatCurrency(draw.outstandingAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                      <div className="grid gap-5 md:grid-cols-2">
                        <FinanceSelect
                          label="Status"
                          name="status"
                          value={draw.status}
                          onChange={(event) => handleDrawRequestChange(draw.drawId, event)}
                          options={DRAW_STATUS_OPTIONS}
                        />
                        <FinanceField
                          label="Request date"
                          name="requestDate"
                          value={draw.requestDate}
                          onChange={(event) => handleDrawRequestChange(draw.drawId, event)}
                          type="date"
                        />
                        <FinanceField
                          label="Expected funding"
                          name="expectedFundingDate"
                          value={draw.expectedFundingDate}
                          onChange={(event) => handleDrawRequestChange(draw.drawId, event)}
                          type="date"
                        />
                        <FinanceField
                          label="Funded date"
                          name="fundedDate"
                          value={draw.fundedDate}
                          onChange={(event) => handleDrawRequestChange(draw.drawId, event)}
                          type="date"
                        />
                      </div>

                      <label className="mt-5 block space-y-2">
                        <span className="text-sm font-medium text-ink-700">Lender notes</span>
                        <textarea
                          name="notes"
                          value={draw.notes}
                          onChange={(event) => handleDrawRequestChange(draw.drawId, event)}
                          rows={3}
                          className="auth-input min-h-[110px]"
                          placeholder="Inspection results, holdback reason, lender asks, or next step."
                        />
                      </label>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-[22px] border border-ink-100 bg-white/90 p-4">
                          <p className="text-sm font-semibold text-ink-900">Linked packet docs</p>
                          <p className="mt-2 text-sm leading-6 text-ink-500">
                            Files tied to this draw from the document library.
                          </p>
                          <div className="mt-4 space-y-3">
                            {draw.linkedDocuments.length > 0 ? (
                              draw.linkedDocuments.slice(0, 4).map((document) => (
                                <div
                                  key={document._id}
                                  className="rounded-[18px] border border-ink-100 bg-ink-50/50 p-3"
                                >
                                  <p className="text-sm font-semibold text-ink-900">
                                    {document.displayName}
                                  </p>
                                  <p className="mt-1 text-xs text-ink-500">
                                    {document.category || "General"}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                                No lender packet files are linked yet.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-ink-100 bg-white/90 p-4">
                          <p className="text-sm font-semibold text-ink-900">Linked expenses</p>
                          <p className="mt-2 text-sm leading-6 text-ink-500">
                            Costs already assigned to this draw request.
                          </p>
                          <div className="mt-4 space-y-3">
                            {draw.linkedExpenses.length > 0 ? (
                              draw.linkedExpenses.slice(0, 4).map((expense) => (
                                <div
                                  key={expense._id}
                                  className="rounded-[18px] border border-ink-100 bg-ink-50/50 p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-ink-900">
                                      {expense.title}
                                    </p>
                                    <p className="text-sm font-semibold text-ink-900">
                                      {formatCurrency(expense.amount)}
                                    </p>
                                  </div>
                                  <p className="mt-1 text-xs text-ink-500">
                                    {expense.vendor?.name || expense.payeeName || "Expense"} ·{" "}
                                    {expense.date ? new Date(expense.date).toLocaleDateString() : "No date"}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                                No expenses are linked to this draw yet.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-ink-100 bg-ink-50/60 p-5">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Packet readiness
                      </p>
                      <h5 className="mt-3 text-lg font-semibold text-ink-900">
                        {draw.packetReady ? "Ready to submit" : "Needs support"}
                      </h5>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                        {draw.packetScore} of {draw.packetChecks.length} key packet checks are in
                        place.
                      </p>

                      <div className="mt-5">
                        <ProgressBar
                          label="Packet completeness"
                          value={draw.packetScore}
                          total={draw.packetChecks.length}
                          tone={draw.packetReady ? "bg-verdigris-500" : "bg-amber-400"}
                          helper={`${draw.packetScore}/${draw.packetChecks.length} draw support checks completed`}
                        />
                      </div>

                      <div className="mt-5 space-y-2">
                        {draw.packetChecks.map((check) => (
                          <div
                            key={check.label}
                            className="flex items-center justify-between gap-3 rounded-[16px] bg-white/90 px-4 py-3"
                          >
                            <p className="text-sm font-medium text-ink-700">{check.label}</p>
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                check.complete
                                  ? "bg-verdigris-50 text-verdigris-700"
                                  : "bg-sand-50 text-sand-700"
                              }`}
                            >
                              {check.complete ? "Done" : "Open"}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 space-y-3 rounded-[18px] bg-white/90 px-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-medium text-ink-600">Support coverage</p>
                          <p className="text-sm font-semibold text-ink-900">
                            {formatCurrency(draw.linkedExpenseAmount)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-medium text-ink-600">Coverage gap</p>
                          <p className="text-sm font-semibold text-ink-900">
                            {formatCurrency(draw.supportGap)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-medium text-ink-600">Doc categories</p>
                          <p className="text-sm font-semibold text-ink-900">
                            {draw.documentCategories.length > 0
                              ? draw.documentCategories.join(", ")
                              : "No docs"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <section className="section-card p-6 text-center text-sm leading-6 text-ink-500">
                No draw requests yet. Add the first hard-money or construction draw in Capital
                Stack, then this board will turn it into a lender workflow.
              </section>
            )}
          </section>
        </div>

        {drawOperations.length > 0 ? (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingFinance}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSavingFinance ? "Saving..." : "Save draw operations"}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
};

export default PropertyFinanceDrawOperationsView;
