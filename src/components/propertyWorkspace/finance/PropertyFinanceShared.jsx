import React from "react";
import { TrashIcon } from "@heroicons/react/24/outline";

import { formatCurrency, toNumber } from "../../../utils/investmentMetrics";
import {
  DRAW_STATUS_OPTIONS,
  FUNDING_PAYMENT_METHOD_OPTIONS,
  FUNDING_SOURCE_TYPE_OPTIONS,
  getFundingPaymentDraft,
  getFundingSources,
  getFundingSourceLabel,
  getFundingSourceTypeLabel,
  getPrimaryFundingSource,
  PAYMENT_FREQUENCY_OPTIONS,
  PAYMENT_RECORD_STATUS_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
} from "../../../utils/capitalStack";
import { addDaysToDate } from "../../../utils/financeOperations";
import { PROPERTY_STRATEGIES } from "../../../utils/propertyStrategy";

export const formatPercent = (value = 0, digits = 1) => `${toNumber(value, 0).toFixed(digits)}%`;

export const safeRatio = (value, total) => {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (toNumber(value, 0) / total) * 100));
};

export const formatDateLabel = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "Not scheduled";
  }

  return parsed.toLocaleDateString();
};

export const toDateInputValue = (value) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "";
  }

  const offset = parsed.getTimezoneOffset() * 60 * 1000;
  return new Date(parsed.getTime() - offset).toISOString().slice(0, 10);
};

export const getDrawStatusClasses = (status = "") => {
  if (status === "funded") {
    return "bg-verdigris-50 text-verdigris-700";
  }

  if (status === "approved") {
    return "bg-sky-50 text-sky-700";
  }

  if (status === "holdback") {
    return "bg-clay-50 text-clay-700";
  }

  if (status === "requested") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-sand-50 text-sand-700";
};

export const getScheduleTimingTone = (dueDate, now = new Date()) => {
  if (!dueDate) {
    return "text-ink-500";
  }

  const due = new Date(dueDate);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (due < today) {
    return "text-clay-700";
  }

  const nextThirtyDays = addDaysToDate(today, 30);
  if (due <= nextThirtyDays) {
    return "text-amber-700";
  }

  return "text-verdigris-700";
};

export const getPaymentStatusClasses = (status = "") => {
  if (status === "paid") {
    return "border border-verdigris-200 bg-verdigris-50 text-verdigris-700";
  }

  if (status === "partial") {
    return "border border-sky-200 bg-sky-50 text-sky-700";
  }

  if (status === "overdue") {
    return "border border-clay-200 bg-clay-50 text-clay-700";
  }

  if (status === "deferred") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border border-ink-100 bg-ink-50 text-ink-600";
};

export const buildFinanceForm = (investment) => {
  const primarySource = getPrimaryFundingSource(getFundingSources(investment));

  return {
    purchasePrice: investment?.purchasePrice ?? "",
    arv: investment?.arv ?? "",
    buyClosingCost: investment?.buyClosingCost ?? "",
    buyClosingMode: investment?.buyClosingIsPercent ? "percent" : "amount",
    sellClosingCost: investment?.sellClosingCost ?? "",
    sellClosingMode: investment?.sellClosingIsPercent ? "percent" : "amount",
    loanType: primarySource?.type || investment?.loanType || "",
    lenderName: primarySource?.name || investment?.lenderName || "",
    loanAmount: primarySource?.amount ?? investment?.loanAmount ?? "",
    interestRate: primarySource?.interestRate ?? investment?.interestRate ?? "",
    loanTerm: primarySource?.termMonths ?? investment?.loanTerm ?? "",
    loanPoints: primarySource?.points ?? investment?.loanPoints ?? "",
    loanNotes: primarySource?.notes || investment?.loanNotes || "",
    holdingMonths: investment?.holdingMonths ?? "",
    taxes: investment?.taxes ?? "",
    insurance: investment?.insurance ?? "",
    utilities: investment?.utilities ?? "",
    otherMonthly: investment?.otherMonthly ?? "",
    operatingCashReserve: investment?.operatingCashReserve ?? "",
    contingencyReserve: investment?.contingencyReserve ?? "",
    minimumCashBuffer: investment?.minimumCashBuffer ?? "",
  };
};

export const normalizeFundingSourcesForSave = (fundingSources = []) =>
  fundingSources
    .map((source) => ({
      sourceId: source.sourceId,
      name: source.name.trim(),
      type: source.type,
      amount: toNumber(source.amount, 0),
      currentBalance: toNumber(source.currentBalance, 0),
      interestRate: toNumber(source.interestRate, 0),
      termMonths: toNumber(source.termMonths, 0),
      points: toNumber(source.points, 0),
      paymentType: source.paymentType,
      paymentFrequency: source.paymentFrequency,
      paymentAmount: toNumber(source.paymentAmount, 0),
      paymentDay: Math.max(1, Math.min(31, toNumber(source.paymentDay, 1))),
      paymentStartDate: source.paymentStartDate || null,
      originationDate: source.originationDate || null,
      maturityDate: source.maturityDate || null,
      drawLimit: toNumber(source.drawLimit, 0),
      drawnAmount: toNumber(source.drawnAmount, 0),
      notes: source.notes.trim(),
    }))
    .filter(
      (source) =>
        source.name ||
        source.type ||
        source.amount > 0 ||
        source.paymentAmount > 0 ||
        source.drawLimit > 0 ||
        source.drawnAmount > 0 ||
        source.currentBalance > 0
    );

export const normalizeDrawRequestsForSave = (drawRequests = []) =>
  drawRequests
    .map((request) => ({
      drawId: request.drawId,
      label: request.label.trim(),
      sourceId: request.sourceId,
      status: request.status,
      requestDate: request.requestDate || null,
      expectedFundingDate: request.expectedFundingDate || null,
      fundedDate: request.fundedDate || null,
      amountRequested: toNumber(request.amountRequested, 0),
      amountFunded: toNumber(request.amountFunded, 0),
      notes: request.notes.trim(),
    }))
    .filter(
      (request) =>
        request.label ||
        request.sourceId ||
        request.amountRequested > 0 ||
        request.amountFunded > 0
    );

export const normalizePaymentRecordsForSave = (paymentRecords = []) =>
  paymentRecords
    .map((record) => ({
      paymentId: record.paymentId,
      sourceId: record.sourceId,
      dueDate: record.dueDate || null,
      scheduledAmount: toNumber(record.scheduledAmount, 0),
      paidAmount: toNumber(record.paidAmount, 0),
      status: record.status || "scheduled",
      paidDate: record.paidDate || null,
      paymentMethod: record.paymentMethod || "other",
      notes: String(record.notes || "").trim(),
    }))
    .filter(
      (record) =>
        record.sourceId ||
        record.dueDate ||
        record.scheduledAmount > 0 ||
        record.paidAmount > 0 ||
        record.notes
    );

export const MetricTile = ({ icon: Icon, label, value, hint, tone = "text-ink-900" }) => (
  <div className="metric-tile p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

export const FinanceRow = ({ label, value, tone = "text-ink-900", hint }) => (
  <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-3 last:border-b-0">
    <div>
      <p className="text-sm font-medium text-ink-600">{label}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-ink-400">{hint}</p> : null}
    </div>
    <p className={`text-sm font-semibold ${tone}`}>{value}</p>
  </div>
);

export const ProgressBar = ({ label, value, total, tone = "bg-verdigris-500", helper }) => {
  const ratio = safeRatio(value, total);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-ink-700">{label}</p>
        <p className="text-sm font-semibold text-ink-900">{formatPercent(ratio)}</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${ratio}%` }} />
      </div>
      {helper ? <p className="text-xs leading-5 text-ink-400">{helper}</p> : null}
    </div>
  );
};

export const FinanceField = ({ label, name, value, onChange, type = "text", placeholder, suffix }) => (
  <label className="space-y-2">
    <span className="text-sm font-medium text-ink-700">{label}</span>
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`auth-input ${suffix ? "pr-12" : ""}`}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-400">
          {suffix}
        </span>
      ) : null}
    </div>
  </label>
);

export const FinanceSelect = ({ label, name, value, options, onChange }) => (
  <label className="space-y-2">
    <span className="text-sm font-medium text-ink-700">{label}</span>
    <select name={name} value={value} onChange={onChange} className="auth-input appearance-none">
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export const FundingSourceEditor = ({ source, index, onChange, onRemove, canRemove }) => {
  const paymentDraft = getFundingPaymentDraft(source);
  const drawAware =
    ["hard_money", "construction"].includes(source.type) ||
    toNumber(source.drawLimit, 0) > 0 ||
    toNumber(source.drawnAmount, 0) > 0;

  return (
    <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
            Funding source {index + 1}
          </p>
          <h5 className="mt-2 text-xl font-semibold text-ink-900">
            {getFundingSourceLabel(source, index)}
          </h5>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            {source.type
              ? `${getFundingSourceTypeLabel(source.type)} with a ${formatCurrency(
                  toNumber(source.amount, 0)
                )} modeled balance.`
              : "Track a lender, card, or capital source here."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-[16px] bg-verdigris-50 px-4 py-3 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
              Payment draft
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{formatCurrency(paymentDraft)}</p>
          </div>
          {canRemove ? (
            <button type="button" onClick={() => onRemove(source.sourceId)} className="ghost-action">
              <TrashIcon className="mr-2 h-4 w-4" />
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <FinanceSelect
          label="Source type"
          name="type"
          value={source.type}
          onChange={(event) => onChange(source.sourceId, event)}
          options={FUNDING_SOURCE_TYPE_OPTIONS}
        />
        <FinanceField
          label="Source name"
          name="name"
          value={source.name}
          onChange={(event) => onChange(source.sourceId, event)}
          placeholder="Bank, lender, card issuer..."
        />
        <FinanceField
          label="Amount"
          name="amount"
          value={source.amount}
          onChange={(event) => onChange(source.sourceId, event)}
          type="number"
          placeholder="0"
        />
        <FinanceField
          label="Current balance"
          name="currentBalance"
          value={source.currentBalance}
          onChange={(event) => onChange(source.sourceId, event)}
          type="number"
          placeholder="0"
        />
        <FinanceField
          label="Interest rate"
          name="interestRate"
          value={source.interestRate}
          onChange={(event) => onChange(source.sourceId, event)}
          type="number"
          placeholder="0"
          suffix="%"
        />
        <FinanceField
          label="Term"
          name="termMonths"
          value={source.termMonths}
          onChange={(event) => onChange(source.sourceId, event)}
          type="number"
          placeholder="12"
          suffix="mo"
        />
        <FinanceField
          label="Points / fees"
          name="points"
          value={source.points}
          onChange={(event) => onChange(source.sourceId, event)}
          type="number"
          placeholder="0"
          suffix="%"
        />
        <FinanceSelect
          label="Payment style"
          name="paymentType"
          value={source.paymentType}
          onChange={(event) => onChange(source.sourceId, event)}
          options={PAYMENT_TYPE_OPTIONS}
        />
        <FinanceSelect
          label="Payment timing"
          name="paymentFrequency"
          value={source.paymentFrequency}
          onChange={(event) => onChange(source.sourceId, event)}
          options={PAYMENT_FREQUENCY_OPTIONS}
        />
        <FinanceField
          label="Custom payment draft"
          name="paymentAmount"
          value={source.paymentAmount}
          onChange={(event) => onChange(source.sourceId, event)}
          type="number"
          placeholder="Optional"
        />
        <FinanceField
          label="Payment day"
          name="paymentDay"
          value={source.paymentDay}
          onChange={(event) => onChange(source.sourceId, event)}
          type="number"
          placeholder="1"
          suffix="day"
        />
        <FinanceField
          label="First payment date"
          name="paymentStartDate"
          value={source.paymentStartDate}
          onChange={(event) => onChange(source.sourceId, event)}
          type="date"
        />
        <FinanceField
          label="Origination date"
          name="originationDate"
          value={source.originationDate}
          onChange={(event) => onChange(source.sourceId, event)}
          type="date"
        />
        <FinanceField
          label="Maturity date"
          name="maturityDate"
          value={source.maturityDate}
          onChange={(event) => onChange(source.sourceId, event)}
          type="date"
        />
        {drawAware ? (
          <>
            <FinanceField
              label="Draw limit"
              name="drawLimit"
              value={source.drawLimit}
              onChange={(event) => onChange(source.sourceId, event)}
              type="number"
              placeholder="0"
            />
            <FinanceField
              label="Drawn so far"
              name="drawnAmount"
              value={source.drawnAmount}
              onChange={(event) => onChange(source.sourceId, event)}
              type="number"
              placeholder="0"
            />
          </>
        ) : null}
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-ink-700">Notes</span>
          <textarea
            name="notes"
            value={source.notes}
            onChange={(event) => onChange(source.sourceId, event)}
            rows={3}
            className="auth-input min-h-[110px]"
            placeholder="Track lender notes, balloon timing, or payoff assumptions."
          />
        </label>
      </div>
    </div>
  );
};

export const DrawRequestEditor = ({ request, index, sourceOptions, onChange, onRemove }) => (
  <div className="rounded-[22px] border border-ink-100 bg-white/90 p-5">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-ink-900">
          {request.label || `Draw request ${index + 1}`}
        </p>
        <p className="mt-1 text-sm text-ink-500">
          Status:{" "}
          {DRAW_STATUS_OPTIONS.find((option) => option.value === request.status)?.label || "Planned"}
        </p>
      </div>

      <button type="button" onClick={() => onRemove(request.drawId)} className="ghost-action">
        <TrashIcon className="mr-2 h-4 w-4" />
        Remove
      </button>
    </div>

    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <FinanceField
        label="Label"
        name="label"
        value={request.label}
        onChange={(event) => onChange(request.drawId, event)}
        placeholder="Demo, framing, final rehab..."
      />
      <FinanceSelect
        label="Funding source"
        name="sourceId"
        value={request.sourceId}
        onChange={(event) => onChange(request.drawId, event)}
        options={sourceOptions}
      />
      <FinanceSelect
        label="Status"
        name="status"
        value={request.status}
        onChange={(event) => onChange(request.drawId, event)}
        options={DRAW_STATUS_OPTIONS}
      />
      <FinanceField
        label="Amount requested"
        name="amountRequested"
        value={request.amountRequested}
        onChange={(event) => onChange(request.drawId, event)}
        type="number"
        placeholder="0"
      />
      <FinanceField
        label="Amount funded"
        name="amountFunded"
        value={request.amountFunded}
        onChange={(event) => onChange(request.drawId, event)}
        type="number"
        placeholder="0"
      />
      <div className="hidden md:block" />
      <FinanceField
        label="Request date"
        name="requestDate"
        value={request.requestDate}
        onChange={(event) => onChange(request.drawId, event)}
        type="date"
      />
      <FinanceField
        label="Expected funding"
        name="expectedFundingDate"
        value={request.expectedFundingDate}
        onChange={(event) => onChange(request.drawId, event)}
        type="date"
      />
      <FinanceField
        label="Funded date"
        name="fundedDate"
        value={request.fundedDate}
        onChange={(event) => onChange(request.drawId, event)}
        type="date"
      />
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-ink-700">Notes</span>
        <textarea
          name="notes"
          value={request.notes}
          onChange={(event) => onChange(request.drawId, event)}
          rows={3}
          className="auth-input min-h-[96px]"
          placeholder="Inspection note, holdback, lender condition, or payment milestone."
        />
      </label>
    </div>
  </div>
);

export const PaymentRecordEditor = ({ record, sourceOptions, onChange, onRemove }) => (
  <div className="rounded-[22px] border border-ink-100 bg-white/90 p-5">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-ink-900">Payment record</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getPaymentStatusClasses(
              record.status
            )}`}
          >
            {PAYMENT_RECORD_STATUS_OPTIONS.find((option) => option.value === record.status)?.label ||
              "Scheduled"}
          </span>
          <span className="rounded-full border border-ink-100 bg-ink-50 px-3 py-1 text-[11px] font-semibold text-ink-600">
            Due {formatDateLabel(record.dueDate)}
          </span>
        </div>
      </div>

      <button type="button" onClick={() => onRemove(record.paymentId)} className="ghost-action">
        <TrashIcon className="mr-2 h-4 w-4" />
        Remove
      </button>
    </div>

    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <FinanceSelect
        label="Funding source"
        name="sourceId"
        value={record.sourceId}
        onChange={(event) => onChange(record.paymentId, event)}
        options={sourceOptions}
      />
      <FinanceSelect
        label="Status"
        name="status"
        value={record.status}
        onChange={(event) => onChange(record.paymentId, event)}
        options={PAYMENT_RECORD_STATUS_OPTIONS}
      />
      <FinanceField
        label="Due date"
        name="dueDate"
        value={record.dueDate}
        onChange={(event) => onChange(record.paymentId, event)}
        type="date"
      />
      <FinanceField
        label="Paid date"
        name="paidDate"
        value={record.paidDate}
        onChange={(event) => onChange(record.paymentId, event)}
        type="date"
      />
      <FinanceField
        label="Scheduled amount"
        name="scheduledAmount"
        value={record.scheduledAmount}
        onChange={(event) => onChange(record.paymentId, event)}
        type="number"
        placeholder="0"
      />
      <FinanceField
        label="Paid amount"
        name="paidAmount"
        value={record.paidAmount}
        onChange={(event) => onChange(record.paymentId, event)}
        type="number"
        placeholder="0"
      />
      <FinanceSelect
        label="Payment method"
        name="paymentMethod"
        value={record.paymentMethod}
        onChange={(event) => onChange(record.paymentId, event)}
        options={FUNDING_PAYMENT_METHOD_OPTIONS}
      />
      <div className="hidden md:block" />
      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-ink-700">Notes</span>
        <textarea
          name="notes"
          value={record.notes}
          onChange={(event) => onChange(record.paymentId, event)}
          rows={2}
          className="auth-input min-h-[88px]"
          placeholder="Loan servicer note, payoff comment, or exception detail."
        />
      </label>
    </div>
  </div>
);

export const EmptyAcquisitionState = ({
  property,
  selectedStrategy,
  onStrategyChange,
  onCreate,
  isCreating,
  compact = false,
  eyebrow,
  title,
  description,
  buttonLabel,
}) => (
  <section className={`${compact ? "section-card p-6 sm:p-7" : "surface-panel px-6 py-7 sm:px-7"}`}>
    <span className="eyebrow">{eyebrow || (compact ? "Workspace setup" : "Finance workspace")}</span>
    <div
      className={`mt-4 grid gap-6 ${
        compact ? "lg:grid-cols-[minmax(0,1fr)_320px]" : "xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]"
      }`}
    >
      <div>
        <h3
          className={`${compact ? "text-2xl font-semibold" : "font-display text-[2.15rem] leading-[0.96]"} text-ink-900`}
        >
          {title || "Create the acquisitions workspace for finance"}
        </h3>
        <p
          className={`mt-4 max-w-3xl text-sm text-ink-500 ${compact ? "leading-6" : "leading-7 sm:text-base"}`}
        >
          {description ||
            "Add the acquisitions layer once, then budget, expenses, capital, draws, payments, and reports all stay inside this property workspace."}
        </p>

        {!compact ? (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
              <p className="text-sm font-semibold text-ink-900">Expected cost plan</p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Budget lines and actual expenses stay connected instead of living in separate tools.
              </p>
            </div>
            <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
              <p className="text-sm font-semibold text-ink-900">Editable deal assumptions</p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Purchase price, closing costs, hold assumptions, loan profile, and returns all stay
                live in one place.
              </p>
            </div>
            <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
              <p className="text-sm font-semibold text-ink-900">Report-ready outputs</p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Export polished PDF deal analysis for lender reviews, investor updates, or internal
                decision making.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="section-card p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
          {property?.title || "Property"}
        </p>
        <h4 className="mt-4 text-xl font-semibold text-ink-900">Start the finance center</h4>
        <p className="mt-3 text-sm leading-6 text-ink-500">
          Choose the primary strategy for this property. We will create the acquisitions workspace
          and load the finance sections from there.
        </p>

        <div className="mt-5">
          <FinanceSelect
            label="Strategy"
            name="strategy"
            value={selectedStrategy}
            options={PROPERTY_STRATEGIES}
            onChange={onStrategyChange}
          />
        </div>

        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="primary-action mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isCreating ? "Creating..." : buttonLabel || "Create acquisitions workspace"}
        </button>
      </div>
    </div>
  </section>
);
