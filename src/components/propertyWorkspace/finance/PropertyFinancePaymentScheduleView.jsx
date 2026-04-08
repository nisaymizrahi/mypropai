import React from "react";
import {
  BanknotesIcon,
  CalendarDaysIcon,
  ClockIcon,
  CreditCardIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

import { formatCurrency, toNumber } from "../../../utils/investmentMetrics";
import {
  getFundingCurrentBalance,
  getFundingPaymentDraft,
  getFundingSourceLabel,
  getFundingSourceTypeLabel,
  PAYMENT_FREQUENCY_OPTIONS,
  PAYMENT_RECORD_STATUS_OPTIONS,
} from "../../../utils/capitalStack";
import {
  FinanceRow,
  formatDateLabel,
  getPaymentStatusClasses,
  getScheduleTimingTone,
  MetricTile,
  PaymentRecordEditor,
} from "./PropertyFinanceShared";

const PropertyFinancePaymentScheduleView = ({
  embedded = false,
  nextPaymentEvent,
  upcomingPaymentEvents,
  datedPaymentEvents,
  overduePaymentEvents,
  cashManagement,
  paidThisMonthAmount,
  handleSaveFinance,
  isSavingFinance,
  handleAddPaymentRecord,
  fundingSources,
  paymentScheduleBySource,
  paymentRecords,
  fundingSourceOptions,
  handlePaymentRecordChange,
  handleRemovePaymentRecord,
  handleMarkPaymentPaid,
  eventBasedPaymentEvents,
  today,
}) => {
  const upcomingThirtyDayAmount = upcomingPaymentEvents.reduce(
    (sum, event) => sum + toNumber(event.remainingAmount || event.scheduledAmount, 0),
    0
  );

  return (
    <div className="space-y-6">
      {!embedded ? (
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Finance / Payment Schedule</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Turn modeled debt into a live servicing and cash board
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            See what is due, what is overdue, what has been paid, and how much reserve cushion the
            project still has across every funding source.
          </p>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={ClockIcon}
          label="Next due"
          value={nextPaymentEvent ? formatDateLabel(nextPaymentEvent.dueDate) : "No dates"}
          hint={
            nextPaymentEvent ? nextPaymentEvent.sourceLabel : "Add payment timing to funding sources."
          }
        />
        <MetricTile
          icon={BanknotesIcon}
          label="Next 30 days"
          value={formatCurrency(upcomingThirtyDayAmount)}
          hint={`${upcomingPaymentEvents.length} scheduled payment${upcomingPaymentEvents.length === 1 ? "" : "s"} in the next month.`}
        />
        <MetricTile
          icon={CalendarDaysIcon}
          label="Overdue now"
          value={formatCurrency(
            overduePaymentEvents.reduce(
              (sum, event) => sum + toNumber(event.remainingAmount || event.scheduledAmount, 0),
              0
            )
          )}
          hint={`${overduePaymentEvents.length} overdue payment${overduePaymentEvents.length === 1 ? "" : "s"} across the stack.`}
        />
        <MetricTile
          icon={CreditCardIcon}
          label="Reserve runway"
          value={`${cashManagement.reserveRunwayMonths.toFixed(1)} mo`}
          hint={`${formatCurrency(cashManagement.totalReserve)} reserved with ${formatCurrency(
            cashManagement.minimumCashBuffer
          )} kept as minimum buffer.`}
        />
      </div>

      <form onSubmit={handleSaveFinance} className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(360px,0.96fr)]">
          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Upcoming and overdue</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">
              What needs action across the stack
            </h4>

            <div className="mt-8 space-y-3">
              {datedPaymentEvents.length > 0 ? (
                datedPaymentEvents.slice(0, 12).map((event) => (
                  <div
                    key={event.scheduleId}
                    className="rounded-[22px] border border-ink-100 bg-white/90 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-ink-900">{event.title}</p>
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                            {event.sourceLabel}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getPaymentStatusClasses(
                              event.status
                            )}`}
                          >
                            {PAYMENT_RECORD_STATUS_OPTIONS.find(
                              (option) => option.value === event.status
                            )?.label || "Scheduled"}
                          </span>
                        </div>
                        <p
                          className={`mt-2 text-sm font-medium ${getScheduleTimingTone(
                            event.dueDate,
                            today
                          )}`}
                        >
                          Due {formatDateLabel(event.dueDate)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-400">
                          {event.paymentFrequency === "quarterly"
                            ? "Quarterly cadence"
                            : event.paymentFrequency === "at_sale"
                              ? "Balloon event"
                              : "Monthly cadence"}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-ink-900">
                            {formatCurrency(event.remainingAmount || event.scheduledAmount)}
                          </p>
                          {event.paidAmount > 0 ? (
                            <p className="mt-1 text-xs text-ink-500">
                              {formatCurrency(event.paidAmount)} already recorded
                            </p>
                          ) : null}
                        </div>

                        {!event.eventBased &&
                        event.sourceId &&
                        event.status !== "paid" &&
                        event.status !== "deferred" ? (
                          <button
                            type="button"
                            onClick={() => handleMarkPaymentPaid(event)}
                            className="secondary-action"
                          >
                            Mark paid
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                  No scheduled debt dates yet. Add funding sources and a payment start date to build
                  the calendar.
                </div>
              )}
            </div>
          </section>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Cash management</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">
              Reserve cushion and near-term obligations
            </h4>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-ink-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Total reserve
                </p>
                <p className="mt-2 text-xl font-semibold text-ink-900">
                  {formatCurrency(cashManagement.totalReserve)}
                </p>
              </div>
              <div className="rounded-[20px] border border-ink-100 bg-white/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Paid this month
                </p>
                <p className="mt-2 text-xl font-semibold text-ink-900">
                  {formatCurrency(paidThisMonthAmount)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <FinanceRow
                label="Operating reserve"
                value={formatCurrency(cashManagement.operatingReserve)}
              />
              <FinanceRow
                label="Contingency reserve"
                value={formatCurrency(cashManagement.contingencyReserve)}
              />
              <FinanceRow
                label="Minimum cash buffer"
                value={formatCurrency(cashManagement.minimumCashBuffer)}
              />
              <FinanceRow label="Monthly carry" value={formatCurrency(cashManagement.monthlyCarry)} />
              <FinanceRow
                label="Monthly debt draft"
                value={formatCurrency(cashManagement.monthlyDebtDraft)}
              />
              <FinanceRow
                label="Monthly cash need"
                value={formatCurrency(cashManagement.monthlyCashNeed)}
              />
              <FinanceRow
                label="Approved unpaid expenses"
                value={formatCurrency(cashManagement.approvedUnpaidExpenses)}
              />
              <FinanceRow
                label="Debt due in 60 days"
                value={formatCurrency(cashManagement.nextSixtyDebt)}
              />
              <FinanceRow
                label="Overdue debt"
                value={formatCurrency(cashManagement.overdueAmount)}
                tone={cashManagement.overdueAmount > 0 ? "text-clay-700" : "text-ink-900"}
              />
              <FinanceRow
                label="Undrawn capacity"
                value={formatCurrency(cashManagement.drawRemaining)}
                hint="Potential support if lender funds are still available."
              />
              <FinanceRow
                label="Combined coverage"
                value={`${cashManagement.combinedCoverageMonths.toFixed(1)} mo`}
                hint="Reserve plus undrawn capacity against monthly cash need."
              />
            </div>
          </section>
        </div>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Loan servicing</span>
              <h4 className="mt-4 text-2xl font-semibold text-ink-900">Per-source servicing board</h4>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
                Track balances, maturity, next due dates, and real payment history for every
                lender, card, or private capital source.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddPaymentRecord(fundingSources[0]?.sourceId || "")}
              className="secondary-action"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add payment record
            </button>
          </div>

          <div className="mt-8 space-y-4">
            {paymentScheduleBySource.length > 0 ? (
              paymentScheduleBySource.map(({ source, index, nextDue, events }) => {
                const sourceRecords = paymentRecords
                  .filter((record) => record.sourceId === source.sourceId)
                  .sort(
                    (left, right) =>
                      new Date(left.dueDate || 0).getTime() - new Date(right.dueDate || 0).getTime()
                  );
                const lastPaidRecord =
                  [...sourceRecords]
                    .filter((record) => record.status === "paid" || record.status === "partial")
                    .sort(
                      (left, right) =>
                        new Date(right.paidDate || right.dueDate || 0).getTime() -
                        new Date(left.paidDate || left.dueDate || 0).getTime()
                    )[0] || null;

                return (
                  <div
                    key={source.sourceId}
                    className="rounded-[24px] border border-ink-100 bg-white/90 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-ink-900">
                            {getFundingSourceLabel(source, index)}
                          </p>
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
                            {getFundingSourceTypeLabel(source.type)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-ink-500">
                          {PAYMENT_FREQUENCY_OPTIONS.find(
                            (option) => option.value === source.paymentFrequency
                          )?.label || "Monthly"}{" "}
                          cadence with {formatCurrency(getFundingPaymentDraft(source))} drafted per
                          cycle.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddPaymentRecord(source.sourceId)}
                        className="ghost-action"
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add record
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Balance
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink-900">
                          {formatCurrency(getFundingCurrentBalance(source))}
                        </p>
                      </div>
                      <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Next due
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink-900">
                          {nextDue?.dueDate ? formatDateLabel(nextDue.dueDate) : "Not scheduled"}
                        </p>
                      </div>
                      <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Maturity
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink-900">
                          {formatDateLabel(source.maturityDate)}
                        </p>
                      </div>
                      <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Last paid
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink-900">
                          {lastPaidRecord
                            ? formatDateLabel(lastPaidRecord.paidDate || lastPaidRecord.dueDate)
                            : "No payment yet"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                      <div className="rounded-[22px] border border-ink-100 bg-ink-50/50 p-4">
                        <p className="text-sm font-semibold text-ink-900">Servicing snapshot</p>
                        <div className="mt-4">
                          <FinanceRow label="Origination" value={formatDateLabel(source.originationDate)} />
                          <FinanceRow
                            label="Payment day"
                            value={
                              toNumber(source.paymentDay, 0) > 0
                                ? `Day ${toNumber(source.paymentDay, 0)}`
                                : "Not set"
                            }
                          />
                          <FinanceRow label="Modeled events" value={events.length} />
                          <FinanceRow
                            label="Records logged"
                            value={sourceRecords.length}
                            hint="Manual and schedule-matched servicing records."
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {sourceRecords.length > 0 ? (
                          sourceRecords.map((record) => (
                            <PaymentRecordEditor
                              key={record.paymentId}
                              record={record}
                              sourceOptions={fundingSourceOptions}
                              onChange={handlePaymentRecordChange}
                              onRemove={handleRemovePaymentRecord}
                            />
                          ))
                        ) : (
                          <div className="rounded-[22px] border border-dashed border-ink-200 bg-ink-50/40 p-5 text-sm leading-6 text-ink-500">
                            No payment records logged yet. Use the quick pay action above or add a
                            manual servicing record for this source.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                Add funding sources in Capital Stack to generate a servicing board here.
              </div>
            )}
          </div>
        </section>

        {eventBasedPaymentEvents.length > 0 ? (
          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Event-based obligations</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">
              Payments triggered by draw or payoff events
            </h4>

            <div className="mt-8 grid gap-4 xl:grid-cols-2">
              {eventBasedPaymentEvents.map((event) => (
                <div
                  key={event.scheduleId}
                  className="rounded-[22px] border border-ink-100 bg-white/90 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-ink-900">{event.sourceLabel}</p>
                      <p className="mt-2 text-sm text-ink-500">{event.title}</p>
                    </div>
                    <p className="text-sm font-semibold text-ink-900">
                      {formatCurrency(event.scheduledAmount || event.amount)}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink-500">
                    This obligation is not pinned to a fixed calendar cadence. It should be managed
                    alongside draw workflow or payoff planning.
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSavingFinance}
            className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSavingFinance ? "Saving..." : "Save servicing + cash settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyFinancePaymentScheduleView;
