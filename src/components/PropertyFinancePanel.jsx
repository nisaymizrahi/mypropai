import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  PlusIcon,
  ReceiptPercentIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import FinancialsTab from "./FinancialsTab";
import PropertyFinanceReports from "./PropertyFinanceReports";
import {
  createPropertyWorkspace,
  getBudgetItems,
  getExpenses,
  getInvestment,
  getProjectDocuments,
  getVendors,
  updateInvestment,
} from "../utils/api";
import {
  formatCurrency,
  getInvestmentAnalysisMetrics,
  toNumber,
} from "../utils/investmentMetrics";
import { exportElementToPdf } from "../utils/pdfExport";
import {
  buildDrawRequest,
  buildFundingSource,
  buildPaymentRecord,
  DRAW_STATUS_OPTIONS,
  FUNDING_SOURCE_TYPE_OPTIONS,
  FUNDING_PAYMENT_METHOD_OPTIONS,
  getDrawRequests,
  getDrawSummary,
  getFundingCurrentBalance,
  getFundingPaymentDraft,
  getFundingSourceLabel,
  getFundingSourceTypeLabel,
  getFundingSources,
  getPaymentRecords,
  getPrimaryFundingSource,
  getTotalFundingAmount,
  getTotalFundingMonthlyInterest,
  getTotalFundingPaymentDraft,
  getTotalFundingPointsCost,
  PAYMENT_FREQUENCY_OPTIONS,
  PAYMENT_RECORD_STATUS_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
} from "../utils/capitalStack";
import {
  addDaysToDate,
  buildCashManagementSummary,
  buildDrawOperationsSummary,
  buildFundingPaymentSchedule,
  buildServicingSchedule,
} from "../utils/financeOperations";
import {
  getInvestmentStrategy,
  getInvestmentStrategyLabel,
  PROPERTY_STRATEGIES,
} from "../utils/propertyStrategy";

const formatPercent = (value = 0, digits = 1) => `${toNumber(value, 0).toFixed(digits)}%`;

const safeRatio = (value, total) => {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (toNumber(value, 0) / total) * 100));
};

const formatDateLabel = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "Not scheduled";
  }

  return parsed.toLocaleDateString();
};

const toDateInputValue = (value) => {
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

const getDrawStatusClasses = (status = "") => {
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

const getScheduleTimingTone = (dueDate, now = new Date()) => {
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

const getPaymentStatusClasses = (status = "") => {
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

const buildFinanceForm = (investment) => {
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

const normalizeFundingSourcesForSave = (fundingSources = []) =>
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

const normalizeDrawRequestsForSave = (drawRequests = []) =>
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

const normalizePaymentRecordsForSave = (paymentRecords = []) =>
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

const MetricTile = ({ icon: Icon, label, value, hint, tone = "text-ink-900" }) => (
  <div className="metric-tile p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const FinanceRow = ({ label, value, tone = "text-ink-900", hint }) => (
  <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-3 last:border-b-0">
    <div>
      <p className="text-sm font-medium text-ink-600">{label}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-ink-400">{hint}</p> : null}
    </div>
    <p className={`text-sm font-semibold ${tone}`}>{value}</p>
  </div>
);

const ProgressBar = ({ label, value, total, tone = "bg-verdigris-500", helper }) => {
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

const FinanceField = ({ label, name, value, onChange, type = "text", placeholder, suffix }) => (
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

const FinanceSelect = ({ label, name, value, options, onChange }) => (
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

const FundingSourceEditor = ({
  source,
  index,
  onChange,
  onRemove,
  canRemove,
}) => {
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
            <p className="mt-1 text-sm font-semibold text-ink-900">
              {formatCurrency(paymentDraft)}
            </p>
          </div>
          {canRemove ? (
            <button
              type="button"
              onClick={() => onRemove(source.sourceId)}
              className="ghost-action"
            >
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

const DrawRequestEditor = ({
  request,
  index,
  sourceOptions,
  onChange,
  onRemove,
}) => (
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

const PaymentRecordEditor = ({
  record,
  sourceOptions,
  onChange,
  onRemove,
}) => (
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
}) => (
  <section className="surface-panel px-6 py-7 sm:px-7">
    <span className="eyebrow">Finance workspace</span>
    <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <div>
        <h3 className="font-display text-[2.15rem] leading-[0.96] text-ink-900">
          Create the acquisitions finance workspace for this property
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
          Phase 2 runs on the linked acquisitions project. Once we create it, this property gets a
          real finance center with budget versus actual, capital stack inputs, sources and uses,
          and PDF-ready reporting.
        </p>

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
          {isCreating ? "Creating..." : "Create acquisitions workspace"}
        </button>
      </div>
    </div>
  </section>
);

const PropertyFinancePanel = ({
  property,
  propertyKey,
  activeContentKey,
  onPropertyUpdated,
}) => {
  const investmentId = property?.workspaces?.acquisitions?.id || "";
  const [selectedStrategy, setSelectedStrategy] = useState(
    property?.workspaces?.acquisitions?.strategy || "flip"
  );
  const [investment, setInvestment] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [financeForm, setFinanceForm] = useState(() => buildFinanceForm(null));
  const [fundingSources, setFundingSources] = useState([]);
  const [drawRequests, setDrawRequests] = useState([]);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [isSavingFinance, setIsSavingFinance] = useState(false);
  const drawExportRef = useRef(null);

  const loadFinanceWorkspace = useCallback(async () => {
    if (!investmentId) {
      setInvestment(null);
      setBudgetItems([]);
      setExpenses([]);
      setDocuments([]);
      setVendors([]);
      setFinanceForm(buildFinanceForm(null));
      setFundingSources([]);
      setDrawRequests([]);
      setPaymentRecords([]);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [investmentData, budgetData, expenseData, documentData, vendorData] = await Promise.all([
        getInvestment(investmentId),
        getBudgetItems(investmentId),
        getExpenses(investmentId),
        getProjectDocuments(investmentId),
        getVendors(),
      ]);

      setInvestment(investmentData);
      setBudgetItems(budgetData || []);
      setExpenses(expenseData || []);
      setDocuments(documentData || []);
      setVendors(vendorData || []);
      setFinanceForm(buildFinanceForm(investmentData));
      setFundingSources(getFundingSources(investmentData));
      setDrawRequests(getDrawRequests(investmentData));
      setPaymentRecords(getPaymentRecords(investmentData));
    } catch (loadError) {
      setError(loadError.message || "Failed to load the finance workspace.");
    } finally {
      setLoading(false);
    }
  }, [investmentId]);

  useEffect(() => {
    setSelectedStrategy(property?.workspaces?.acquisitions?.strategy || "flip");
  }, [property?.workspaces?.acquisitions?.strategy]);

  useEffect(() => {
    if (!activeContentKey.startsWith("finance-")) {
      return;
    }

    loadFinanceWorkspace();
  }, [activeContentKey, loadFinanceWorkspace]);

  const normalizedFundingSources = useMemo(
    () => normalizeFundingSourcesForSave(fundingSources),
    [fundingSources]
  );
  const normalizedDrawRequests = useMemo(
    () => normalizeDrawRequestsForSave(drawRequests),
    [drawRequests]
  );
  const normalizedPaymentRecords = useMemo(
    () => normalizePaymentRecordsForSave(paymentRecords),
    [paymentRecords]
  );
  const metricsInvestment = useMemo(() => {
    const primarySource = normalizedFundingSources[0] || null;

    return {
      ...(investment || {}),
      purchasePrice: toNumber(financeForm.purchasePrice, 0),
      arv: toNumber(financeForm.arv, 0),
      buyClosingCost: toNumber(financeForm.buyClosingCost, 0),
      buyClosingIsPercent: financeForm.buyClosingMode === "percent",
      sellClosingCost: toNumber(financeForm.sellClosingCost, 0),
      sellClosingIsPercent: financeForm.sellClosingMode === "percent",
      holdingMonths: toNumber(financeForm.holdingMonths, 0),
      taxes: toNumber(financeForm.taxes, 0),
      insurance: toNumber(financeForm.insurance, 0),
      utilities: toNumber(financeForm.utilities, 0),
      otherMonthly: toNumber(financeForm.otherMonthly, 0),
      fundingSources: normalizedFundingSources,
      drawRequests: normalizedDrawRequests,
      paymentRecords: normalizedPaymentRecords,
      loanType: primarySource?.type || "",
      lenderName: primarySource?.name || "",
      loanAmount: primarySource?.amount || 0,
      interestRate: primarySource?.interestRate || 0,
      loanTerm: primarySource?.termMonths || 0,
      loanPoints: primarySource?.points || 0,
      loanNotes: primarySource?.notes || "",
    };
  }, [financeForm, investment, normalizedDrawRequests, normalizedFundingSources, normalizedPaymentRecords]);

  const metrics = useMemo(
    () => getInvestmentAnalysisMetrics(metricsInvestment, { budgetItems, expenses }),
    [budgetItems, expenses, metricsInvestment]
  );

  const totalFundingAmount = useMemo(
    () => getTotalFundingAmount(fundingSources),
    [fundingSources]
  );
  const totalFundingMonthlyInterest = useMemo(
    () => getTotalFundingMonthlyInterest(fundingSources),
    [fundingSources]
  );
  const totalFundingPaymentDraft = useMemo(
    () => getTotalFundingPaymentDraft(fundingSources),
    [fundingSources]
  );
  const totalFundingPoints = useMemo(
    () => getTotalFundingPointsCost(fundingSources),
    [fundingSources]
  );
  const drawSummary = useMemo(
    () => getDrawSummary(fundingSources, drawRequests),
    [drawRequests, fundingSources]
  );
  const fundingSourceOptions = useMemo(
    () => [
      { value: "", label: "Select funding source" },
      ...fundingSources.map((source, index) => ({
        value: source.sourceId,
        label: getFundingSourceLabel(source, index),
      })),
    ],
    [fundingSources]
  );
  const drawOperations = useMemo(
    () =>
      buildDrawOperationsSummary({
        drawRequests,
        fundingSources,
        expenses,
        documents,
      }),
    [documents, drawRequests, expenses, fundingSources]
  );
  const paymentSchedule = useMemo(
    () =>
      buildFundingPaymentSchedule(fundingSources, {
        holdingMonths: toNumber(financeForm.holdingMonths, 0),
      }),
    [financeForm.holdingMonths, fundingSources]
  );
  const today = useMemo(() => {
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    return next;
  }, []);
  const nextThirtyDays = useMemo(() => addDaysToDate(today, 30), [today]);
  const servicingSchedule = useMemo(
    () =>
      buildServicingSchedule({
        fundingSources,
        paymentSchedule,
        paymentRecords,
        anchorDate: today,
      }),
    [fundingSources, paymentRecords, paymentSchedule, today]
  );
  const datedPaymentEvents = useMemo(
    () => servicingSchedule.filter((event) => event.dueDate && !event.eventBased),
    [servicingSchedule]
  );
  const upcomingPaymentEvents = useMemo(
    () =>
      datedPaymentEvents.filter((event) => {
        const due = new Date(event.dueDate);
        return due >= today && due <= nextThirtyDays;
      }),
    [datedPaymentEvents, nextThirtyDays, today]
  );
  const nextPaymentEvent = useMemo(
    () => datedPaymentEvents.find((event) => new Date(event.dueDate) >= today) || null,
    [datedPaymentEvents, today]
  );
  const eventBasedPaymentEvents = useMemo(
    () => servicingSchedule.filter((event) => event.eventBased),
    [servicingSchedule]
  );
  const paymentScheduleBySource = useMemo(
    () =>
      fundingSources.map((source, index) => {
        const sourceEvents = servicingSchedule.filter((event) => event.sourceId === source.sourceId);
        const nextDue =
          sourceEvents.find(
            (event) =>
              event.dueDate &&
              !event.eventBased &&
              !["paid", "deferred"].includes(event.status) &&
              new Date(event.dueDate) >= today
          ) ||
          sourceEvents.find(
            (event) => event.dueDate && !event.eventBased && !["paid", "deferred"].includes(event.status)
          ) ||
          null;

        return {
          source,
          index,
          events: sourceEvents,
          nextDue,
        };
      }),
    [fundingSources, servicingSchedule, today]
  );
  const cashManagement = useMemo(
    () =>
      buildCashManagementSummary({
        financeForm,
        fundingSources,
        paymentEvents: servicingSchedule,
        expenses,
        drawSummary,
        anchorDate: today,
      }),
    [drawSummary, expenses, financeForm, fundingSources, servicingSchedule, today]
  );

  const budgetCategorySummary = useMemo(() => {
    const categoryMap = new Map();
    const budgetItemLookup = new Map(
      budgetItems.map((item) => [
        item._id,
        {
          category: item.category || "Uncategorized",
          originalBudgetAmount: toNumber(item.originalBudgetAmount ?? item.budgetedAmount, 0),
          budgetedAmount: toNumber(item.budgetedAmount, 0),
          committedAmount: Array.isArray(item.awards)
            ? item.awards.reduce((sum, award) => sum + toNumber(award.amount, 0), 0)
            : 0,
        },
      ])
    );

    const ensureGroup = (label) => {
      if (!categoryMap.has(label)) {
        categoryMap.set(label, {
          label,
          original: 0,
          expected: 0,
          committed: 0,
          actual: 0,
          expensesCount: 0,
        });
      }

      return categoryMap.get(label);
    };

    budgetItems.forEach((item) => {
      const label = item.category || "Uncategorized";
      const group = ensureGroup(label);
      group.original += toNumber(item.originalBudgetAmount ?? item.budgetedAmount, 0);
      group.expected += toNumber(item.budgetedAmount, 0);
      group.committed += Array.isArray(item.awards)
        ? item.awards.reduce((sum, award) => sum + toNumber(award.amount, 0), 0)
        : 0;
    });

    expenses.forEach((expense) => {
      const budgetItemId =
        typeof expense.budgetItem === "object"
          ? expense.budgetItem?._id || ""
          : expense.budgetItem || "";
      const lookup = budgetItemId ? budgetItemLookup.get(budgetItemId) : null;
      const label = lookup?.category || "Project-level";
      const group = ensureGroup(label);
      group.actual += toNumber(expense.amount, 0);
      group.expensesCount += 1;
    });

    return [...categoryMap.values()]
      .map((group) => ({
        ...group,
        variance: group.actual - group.expected,
      }))
      .sort(
        (left, right) =>
          Math.max(right.expected, right.actual, right.committed) -
          Math.max(left.expected, left.actual, left.committed)
      );
  }, [budgetItems, expenses]);

  const financeSummary = useMemo(
    () => ({
      monthlyCarry:
        toNumber(financeForm.taxes, 0) +
        toNumber(financeForm.insurance, 0) +
        toNumber(financeForm.utilities, 0) +
        toNumber(financeForm.otherMonthly, 0) +
        totalFundingMonthlyInterest,
      pointsCost: totalFundingPoints,
      monthlyPaymentDraft: totalFundingPaymentDraft,
      debtSourcesCount: fundingSources.length,
      drawCapacity: drawSummary.capacity,
      drawFunded: drawSummary.funded,
      receiptAiCount: expenses.filter((expense) => expense.entryMethod === "receipt_ai").length,
    }),
    [
      drawSummary.capacity,
      drawSummary.funded,
      expenses,
      financeForm.insurance,
      financeForm.otherMonthly,
      financeForm.taxes,
      financeForm.utilities,
      fundingSources.length,
      totalFundingMonthlyInterest,
      totalFundingPaymentDraft,
      totalFundingPoints,
    ]
  );

  const sourceItems = useMemo(
    () => {
      const debtItems = fundingSources
        .filter(
          (source) =>
            source.name ||
            source.type ||
            toNumber(source.amount, 0) > 0 ||
            toNumber(source.paymentAmount, 0) > 0
        )
        .map((source, index) => ({
          label: getFundingSourceLabel(source, index),
          amount: toNumber(source.amount, 0),
          hint: [
            getFundingSourceTypeLabel(source.type),
            source.paymentType
              ? `Payment ${PAYMENT_TYPE_OPTIONS.find(
                  (option) => option.value === source.paymentType
                )?.label?.toLowerCase()}`
              : null,
          ]
            .filter(Boolean)
            .join(" · "),
        }));

      return [
        ...debtItems,
        {
          label: "Equity and cash required",
          amount: metrics.cashInvested,
          hint: "Cash still needed after modeled debt and revolving sources are applied.",
        },
      ];
    },
    [fundingSources, metrics.cashInvested]
  );

  const useItems = useMemo(
    () => [
      {
        label: "Purchase price",
        amount: metrics.purchasePrice,
        hint: "Acquisition basis",
      },
      {
        label: "Closing costs",
        amount: metrics.calcBuyingCost,
        hint: financeForm.buyClosingMode === "percent" ? "Calculated from purchase price." : "",
      },
      {
        label: "Expected project budget",
        amount: metrics.totalBudget,
        hint: "Editable expected cost plan.",
      },
      {
        label: "Financing costs",
        amount: metrics.calcFinanceCost,
        hint: "Interest carry and points based on current inputs.",
      },
      {
        label: "Holding costs",
        amount: metrics.calcHoldingCost,
        hint: "Taxes, insurance, utilities, and other monthly carry.",
      },
    ],
    [
      financeForm.buyClosingMode,
      metrics.calcBuyingCost,
      metrics.calcFinanceCost,
      metrics.calcHoldingCost,
      metrics.purchasePrice,
      metrics.totalBudget,
    ]
  );

  const handleCreateAcquisitionWorkspace = async () => {
    try {
      setIsCreatingWorkspace(true);
      const result = await createPropertyWorkspace(propertyKey, "acquisitions", {
        strategy: selectedStrategy,
      });

      if (result?.property) {
        onPropertyUpdated?.(result.property);
      }

      toast.success("Finance workspace created.");
    } catch (createError) {
      toast.error(createError.message || "Failed to create the acquisitions workspace.");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleFinanceFieldChange = (event) => {
    const { name, value } = event.target;
    setFinanceForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFundingSourceChange = (sourceId, event) => {
    const { name, value } = event.target;
    setFundingSources((current) =>
      current.map((source) =>
        source.sourceId === sourceId
          ? {
              ...source,
              [name]: value,
            }
          : source
      )
    );
  };

  const handleAddFundingSource = () => {
    setFundingSources((current) => [...current, buildFundingSource()]);
  };

  const handleRemoveFundingSource = (sourceId) => {
    setFundingSources((current) => current.filter((source) => source.sourceId !== sourceId));
    setDrawRequests((current) => current.filter((request) => request.sourceId !== sourceId));
  };

  const handleDrawRequestChange = (drawId, event) => {
    const { name, value } = event.target;
    setDrawRequests((current) =>
      current.map((request) =>
        request.drawId === drawId
          ? {
              ...request,
              [name]: value,
            }
          : request
      )
    );
  };

  const handleAddDrawRequest = () => {
    setDrawRequests((current) => [
      ...current,
      buildDrawRequest({
        sourceId: fundingSources[0]?.sourceId || "",
      }),
    ]);
  };

  const handleRemoveDrawRequest = (drawId) => {
    setDrawRequests((current) => current.filter((request) => request.drawId !== drawId));
  };

  const handlePaymentRecordChange = (paymentId, event) => {
    const { name, value } = event.target;
    setPaymentRecords((current) =>
      current.map((record) =>
        record.paymentId === paymentId
          ? {
              ...record,
              [name]: value,
            }
          : record
      )
    );
  };

  const handleAddPaymentRecord = (sourceId = "", overrides = {}) => {
    setPaymentRecords((current) => [
      ...current,
      buildPaymentRecord({
        sourceId,
        dueDate: overrides.dueDate || toDateInputValue(today),
        scheduledAmount: overrides.scheduledAmount ?? "",
        paidAmount: overrides.paidAmount ?? "",
        status: overrides.status || "scheduled",
        paidDate: overrides.paidDate || "",
        paymentMethod: overrides.paymentMethod || "other",
        notes: overrides.notes || "",
      }),
    ]);
  };

  const handleRemovePaymentRecord = (paymentId) => {
    setPaymentRecords((current) => current.filter((record) => record.paymentId !== paymentId));
  };

  const handleMarkPaymentPaid = (event) => {
    const dueDate = toDateInputValue(event.dueDate);

    setPaymentRecords((current) => {
      const existing = current.find(
        (record) => record.sourceId === event.sourceId && record.dueDate === dueDate
      );

      if (existing) {
        return current.map((record) =>
          record.paymentId === existing.paymentId
            ? {
                ...record,
                scheduledAmount: event.scheduledAmount,
                paidAmount: event.scheduledAmount,
                paidDate: toDateInputValue(today),
                status: "paid",
              }
            : record
        );
      }

      return [
        ...current,
        buildPaymentRecord({
          sourceId: event.sourceId,
          dueDate,
          scheduledAmount: event.scheduledAmount,
          paidAmount: event.scheduledAmount,
          paidDate: toDateInputValue(today),
          status: "paid",
          paymentMethod: "ach",
          notes: event.title ? `${event.title} marked paid from schedule.` : "",
        }),
      ];
    });
  };

  const handleSaveFinance = async (event) => {
    event.preventDefault();

    if (!investment?._id) {
      toast.error("Create the acquisitions workspace first.");
      return;
    }

    try {
      setIsSavingFinance(true);
      const primarySource = normalizedFundingSources[0] || null;
      const updated = await updateInvestment(investment._id, {
        purchasePrice: toNumber(financeForm.purchasePrice, 0),
        arv: toNumber(financeForm.arv, 0),
        buyClosingCost: toNumber(financeForm.buyClosingCost, 0),
        buyClosingIsPercent: financeForm.buyClosingMode === "percent",
        sellClosingCost: toNumber(financeForm.sellClosingCost, 0),
        sellClosingIsPercent: financeForm.sellClosingMode === "percent",
        loanType: primarySource?.type || "",
        lenderName: primarySource?.name || "",
        loanAmount: primarySource?.amount || 0,
        interestRate: primarySource?.interestRate || 0,
        loanTerm: primarySource?.termMonths || 0,
        loanPoints: primarySource?.points || 0,
        loanNotes: primarySource?.notes || "",
        fundingSources: normalizedFundingSources,
        drawRequests: normalizedDrawRequests,
        paymentRecords: normalizedPaymentRecords,
        holdingMonths: toNumber(financeForm.holdingMonths, 0),
        taxes: toNumber(financeForm.taxes, 0),
        insurance: toNumber(financeForm.insurance, 0),
        utilities: toNumber(financeForm.utilities, 0),
        otherMonthly: toNumber(financeForm.otherMonthly, 0),
        operatingCashReserve: toNumber(financeForm.operatingCashReserve, 0),
        contingencyReserve: toNumber(financeForm.contingencyReserve, 0),
        minimumCashBuffer: toNumber(financeForm.minimumCashBuffer, 0),
      });

      setInvestment(updated);
      setFinanceForm(buildFinanceForm(updated));
      setFundingSources(getFundingSources(updated));
      setDrawRequests(getDrawRequests(updated));
      setPaymentRecords(getPaymentRecords(updated));
      toast.success("Finance assumptions updated.");
    } catch (saveError) {
      toast.error(saveError.message || "Failed to update finance assumptions.");
    } finally {
      setIsSavingFinance(false);
    }
  };

  const handleExportDrawSummary = async () => {
    if (!drawExportRef.current) {
      return;
    }

    try {
      await exportElementToPdf({
        element: drawExportRef.current,
        filename: "lender-draw-summary.pdf",
      });
    } catch (error) {
      toast.error(error.message || "Failed to export the draw summary.");
    }
  };

  if (!investmentId) {
    return (
      <EmptyAcquisitionState
        property={property}
        selectedStrategy={selectedStrategy}
        onStrategyChange={(event) => setSelectedStrategy(event.target.value)}
        onCreate={handleCreateAcquisitionWorkspace}
        isCreating={isCreatingWorkspace}
      />
    );
  }

  if (loading) {
    return (
      <div className="section-card px-6 py-10 text-center text-ink-500">
        Loading finance workspace...
      </div>
    );
  }

  if (error) {
    return (
      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Finance workspace</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">
          We could not load the finance data
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{error}</p>
        <button type="button" onClick={loadFinanceWorkspace} className="primary-action mt-6">
          <ArrowPathIcon className="mr-2 h-5 w-5" />
          Try again
        </button>
      </section>
    );
  }

  if (activeContentKey === "finance-budget-vs-actual") {
    return (
      <div className="space-y-6">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Finance > Budget vs Actual</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Expected cost plan versus actual project spend
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            This section reuses the live budget and expense engine so line-item budgets, vendor
            commitments, receipt capture, and actual spend stay tied to the same property finance
            model.
          </p>
        </section>

        <FinancialsTab
          investment={investment}
          budgetItems={budgetItems}
          expenses={expenses}
          vendors={vendors}
          onUpdate={loadFinanceWorkspace}
          showAnalysis={false}
        />
      </div>
    );
  }

  if (activeContentKey === "finance-draw-operations") {
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
        <section className="surface-panel px-6 py-7 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow">Finance > Draw Operations</span>
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
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getDrawStatusClasses(draw.status)}`}
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
                                      {formatDateLabel(expense.date)}
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
  }

  if (activeContentKey === "finance-payment-schedule") {
    const upcomingThirtyDayAmount = upcomingPaymentEvents.reduce(
      (sum, event) => sum + toNumber(event.remainingAmount || event.scheduledAmount, 0),
      0
    );
    const overduePaymentEvents = datedPaymentEvents.filter((event) => event.status === "overdue");
    const paidThisMonthAmount = paymentRecords.reduce((sum, record) => {
      if (!record.paidDate) {
        return sum;
      }

      const paidDate = new Date(record.paidDate);
      if (
        Number.isNaN(paidDate.valueOf()) ||
        paidDate.getMonth() !== today.getMonth() ||
        paidDate.getFullYear() !== today.getFullYear()
      ) {
        return sum;
      }

      return sum + toNumber(record.paidAmount, 0);
    }, 0);

    return (
      <div className="space-y-6">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Finance > Payment Schedule</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Turn modeled debt into a live servicing and cash board
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            See what is due, what is overdue, what has been paid, and how much reserve cushion the
            project still has across every funding source.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={ClockIcon}
            label="Next due"
            value={nextPaymentEvent ? formatDateLabel(nextPaymentEvent.dueDate) : "No dates"}
            hint={nextPaymentEvent ? nextPaymentEvent.sourceLabel : "Add payment timing to funding sources."}
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
                <FinanceRow
                  label="Monthly carry"
                  value={formatCurrency(cashManagement.monthlyCarry)}
                />
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
                            {lastPaidRecord ? formatDateLabel(lastPaidRecord.paidDate || lastPaidRecord.dueDate) : "No payment yet"}
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
                              value={toNumber(source.paymentDay, 0) > 0 ? `Day ${toNumber(source.paymentDay, 0)}` : "Not set"}
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
  }

  if (activeContentKey === "finance-reports") {
    return (
      <PropertyFinanceReports
        property={property}
        investment={metricsInvestment}
        metrics={metrics}
        fundingSources={fundingSources}
        sourceItems={sourceItems}
        useItems={useItems}
        drawSummary={drawSummary}
        drawOperations={drawOperations}
        budgetCategorySummary={budgetCategorySummary}
        cashManagement={cashManagement}
        expenses={expenses}
        documents={documents}
        paymentEvents={datedPaymentEvents}
      />
    );
  }

  if (activeContentKey === "finance-sources-uses") {
    const totalSources = sourceItems.reduce((sum, item) => sum + item.amount, 0);
    const totalUses = useItems.reduce((sum, item) => sum + item.amount, 0);

    return (
      <div className="space-y-6">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Finance > Sources & Uses</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Show exactly where the money comes from and where it goes
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            This is the finance view you can use to explain the deal to partners, lenders, or your
            own team without piecing it together from several tabs.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricTile
            icon={BanknotesIcon}
            label="Total sources"
            value={formatCurrency(totalSources)}
            hint="Debt plus cash required to run the project."
          />
          <MetricTile
            icon={ClipboardDocumentListIcon}
            label="Total uses"
            value={formatCurrency(totalUses)}
            hint="Purchase, close, rehab, finance, and hold assumptions."
          />
          <MetricTile
            icon={DocumentChartBarIcon}
            label="Projected exit value"
            value={formatCurrency(metrics.arv)}
            hint="Current projected exit value based on deal assumptions."
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Capital in</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Sources</h4>
            <div className="mt-6">
              {sourceItems.map((item) => (
                <FinanceRow
                  key={item.label}
                  label={item.label}
                  value={formatCurrency(item.amount)}
                  hint={item.hint}
                />
              ))}
            </div>
          </section>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Capital out</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Uses</h4>
            <div className="mt-6">
              {useItems.map((item) => (
                <FinanceRow
                  key={item.label}
                  label={item.label}
                  value={formatCurrency(item.amount)}
                  hint={item.hint}
                />
              ))}
            </div>
          </section>
        </div>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Visual split</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Use allocation</h4>
          <div className="mt-6 space-y-4">
            {useItems.map((item, index) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-ink-700">{item.label}</p>
                  <p className="text-sm font-semibold text-ink-900">{formatCurrency(item.amount)}</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full ${
                      index % 4 === 0
                        ? "bg-verdigris-500"
                        : index % 4 === 1
                          ? "bg-sky-500"
                          : index % 4 === 2
                            ? "bg-amber-400"
                            : "bg-clay-400"
                    }`}
                    style={{ width: `${safeRatio(item.amount, totalUses)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (activeContentKey === "finance-capital-stack") {
    const strategyLabel = getInvestmentStrategyLabel(getInvestmentStrategy(investment));
    const debtToCost = safeRatio(metrics.loanAmount, metrics.totalCost);

    return (
      <div className="space-y-6">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Finance > Capital Stack</span>
          <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
            Model every source of capital, payment draft, and draw flow
          </h3>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
            This is the editable finance model for the property. Update the purchase basis,
            monthly carry, multiple funding sources, and lender draw tracking so returns and
            reporting stay accurate across the whole project.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={BuildingOffice2Icon}
            label="Strategy"
            value={strategyLabel}
            hint="The primary acquisitions strategy on this property."
          />
          <MetricTile
            icon={CreditCardIcon}
            label="Funding sources"
            value={fundingSources.length}
            hint={
              fundingSources.length > 0
                ? `${formatCurrency(totalFundingAmount)} modeled across all sources.`
                : "Add hard money, cards, loans, or private capital."
            }
          />
          <MetricTile
            icon={BanknotesIcon}
            label="Payment draft / month"
            value={formatCurrency(financeSummary.monthlyPaymentDraft)}
            hint="Modeled from interest-only, amortizing, revolving, or custom payments."
          />
          <MetricTile
            icon={CalendarDaysIcon}
            label="Draw funded"
            value={`${formatCurrency(drawSummary.funded)} / ${formatCurrency(drawSummary.capacity)}`}
            hint={
              drawSummary.capacity > 0
                ? `${drawSummary.activeRequests} active draw request${
                    drawSummary.activeRequests === 1 ? "" : "s"
                  }`
                : "Add hard money or construction sources to track draw flow."
            }
          />
        </div>

        <form onSubmit={handleSaveFinance} className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
          <div className="space-y-4">
            <section className="section-card p-6 sm:p-7">
              <span className="eyebrow">Deal assumptions</span>
              <h4 className="mt-4 text-2xl font-semibold text-ink-900">Acquisition and exit</h4>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FinanceField
                  label="Purchase price"
                  name="purchasePrice"
                  value={financeForm.purchasePrice}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
                <FinanceField
                  label="ARV / exit value"
                  name="arv"
                  value={financeForm.arv}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
                <FinanceField
                  label="Buy closing cost"
                  name="buyClosingCost"
                  value={financeForm.buyClosingCost}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
                <FinanceSelect
                  label="Buy closing mode"
                  name="buyClosingMode"
                  value={financeForm.buyClosingMode}
                  onChange={handleFinanceFieldChange}
                  options={[
                    { value: "percent", label: "Percent of purchase price" },
                    { value: "amount", label: "Flat dollar amount" },
                  ]}
                />
                <FinanceField
                  label="Sell closing cost"
                  name="sellClosingCost"
                  value={financeForm.sellClosingCost}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
                <FinanceSelect
                  label="Sell closing mode"
                  name="sellClosingMode"
                  value={financeForm.sellClosingMode}
                  onChange={handleFinanceFieldChange}
                  options={[
                    { value: "percent", label: "Percent of ARV" },
                    { value: "amount", label: "Flat dollar amount" },
                  ]}
                />
              </div>
            </section>

            <section className="section-card p-6 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="eyebrow">Funding sources</span>
                  <h4 className="mt-4 text-2xl font-semibold text-ink-900">Capital stack editor</h4>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                    Track every loan, card, private lender, or seller-finance piece here and let
                    the workspace draft the payment picture automatically.
                  </p>
                </div>
                <button type="button" onClick={handleAddFundingSource} className="secondary-action">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add funding source
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {fundingSources.length > 0 ? (
                  fundingSources.map((source, index) => (
                    <FundingSourceEditor
                      key={source.sourceId}
                      source={source}
                      index={index}
                      onChange={handleFundingSourceChange}
                      onRemove={handleRemoveFundingSource}
                      canRemove
                    />
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                    No funding sources modeled yet. Add the first lender, card, or equity-backed
                    capital source to build the stack.
                  </div>
                )}
              </div>
            </section>

            <section className="section-card p-6 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="eyebrow">Draw tracker</span>
                  <h4 className="mt-4 text-2xl font-semibold text-ink-900">Requests and funding flow</h4>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                    Use this for hard money and construction draws, expected funding dates, and
                    holdbacks tied back to the exact source.
                  </p>
                </div>
                <button type="button" onClick={handleAddDrawRequest} className="secondary-action">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add draw request
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {drawRequests.length > 0 ? (
                  drawRequests.map((request, index) => (
                    <DrawRequestEditor
                      key={request.drawId}
                      request={request}
                      index={index}
                      sourceOptions={fundingSourceOptions}
                      onChange={handleDrawRequestChange}
                      onRemove={handleRemoveDrawRequest}
                    />
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                    No draw requests yet. Add one when a lender reimburses phases of work or
                    releases capital in stages.
                  </div>
                )}
              </div>
            </section>

            <section className="section-card p-6 sm:p-7">
              <span className="eyebrow">Monthly carry</span>
              <h4 className="mt-4 text-2xl font-semibold text-ink-900">Holding assumptions</h4>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <FinanceField
                  label="Holding months"
                  name="holdingMonths"
                  value={financeForm.holdingMonths}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="6"
                  suffix="mo"
                />
                <div className="hidden md:block" />
                <FinanceField
                  label="Taxes / month"
                  name="taxes"
                  value={financeForm.taxes}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
                <FinanceField
                  label="Insurance / month"
                  name="insurance"
                  value={financeForm.insurance}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
                <FinanceField
                  label="Utilities / month"
                  name="utilities"
                  value={financeForm.utilities}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
                <FinanceField
                  label="Other monthly carry"
                  name="otherMonthly"
                  value={financeForm.otherMonthly}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
                <FinanceField
                  label="Operating reserve"
                  name="operatingCashReserve"
                  value={financeForm.operatingCashReserve}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
                <FinanceField
                  label="Contingency reserve"
                  name="contingencyReserve"
                  value={financeForm.contingencyReserve}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
                <FinanceField
                  label="Minimum cash buffer"
                  name="minimumCashBuffer"
                  value={financeForm.minimumCashBuffer}
                  onChange={handleFinanceFieldChange}
                  type="number"
                  placeholder="0"
                />
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingFinance}
                className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingFinance ? "Saving..." : "Save finance assumptions"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <section className="section-card p-5">
              <span className="eyebrow">Live outcome</span>
              <h4 className="mt-4 text-xl font-semibold text-ink-900">What these inputs drive</h4>
              <div className="mt-5">
                <FinanceRow label="All-in cost" value={formatCurrency(metrics.allInCost)} />
                <FinanceRow
                  label="Total debt modeled"
                  value={formatCurrency(totalFundingAmount)}
                  hint={`${formatPercent(debtToCost)} of project cost`}
                />
                <FinanceRow
                  label="Projected profit"
                  value={formatCurrency(metrics.profit)}
                  tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
                />
                <FinanceRow label="Cash invested" value={formatCurrency(metrics.cashInvested)} />
                <FinanceRow
                  label="Payment draft / month"
                  value={formatCurrency(financeSummary.monthlyPaymentDraft)}
                />
                <FinanceRow label="ROI on cash" value={formatPercent(metrics.roiOnCash)} />
                <FinanceRow label="Annualized ROI" value={formatPercent(metrics.annualizedROI)} />
              </div>
            </section>

            <section className="section-card p-5">
              <span className="eyebrow">Capital stack snapshot</span>
              <h4 className="mt-4 text-xl font-semibold text-ink-900">Source-by-source view</h4>
              <div className="mt-5 space-y-3">
                {fundingSources.length > 0 ? (
                  fundingSources.map((source, index) => (
                    <div
                      key={source.sourceId}
                      className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-ink-900">
                            {getFundingSourceLabel(source, index)}
                          </p>
                          <p className="mt-1 text-sm text-ink-500">
                            {getFundingSourceTypeLabel(source.type)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-ink-900">
                          {formatCurrency(toNumber(source.amount, 0))}
                        </p>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-[16px] bg-sand-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                            Payment draft
                          </p>
                          <p className="mt-1 text-sm font-semibold text-ink-900">
                            {formatCurrency(getFundingPaymentDraft(source))}
                          </p>
                        </div>
                        <div className="rounded-[16px] bg-verdigris-50/70 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                            First due
                          </p>
                          <p className="mt-1 text-sm font-semibold text-ink-900">
                            {formatDateLabel(source.paymentStartDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 px-4 py-5 text-sm leading-6 text-ink-500">
                    Add funding sources to break the deal into real capital pieces.
                  </div>
                )}
              </div>
            </section>

            <section className="section-card p-5">
              <span className="eyebrow">Draw position</span>
              <h4 className="mt-4 text-xl font-semibold text-ink-900">Capacity and requests</h4>
              <div className="mt-5">
                <FinanceRow label="Draw capacity" value={formatCurrency(drawSummary.capacity)} />
                <FinanceRow label="Requested" value={formatCurrency(drawSummary.requested)} />
                <FinanceRow label="Funded" value={formatCurrency(drawSummary.funded)} />
                <FinanceRow label="Remaining capacity" value={formatCurrency(drawSummary.remaining)} />
              </div>

              <div className="mt-5 space-y-4">
                <ProgressBar
                  label="Requested vs capacity"
                  value={drawSummary.requested}
                  total={drawSummary.capacity || 1}
                  tone="bg-sky-500"
                  helper={`${formatCurrency(drawSummary.requested)} requested`}
                />
                <ProgressBar
                  label="Funded vs capacity"
                  value={drawSummary.funded}
                  total={drawSummary.capacity || 1}
                  tone="bg-verdigris-500"
                  helper={`${formatCurrency(drawSummary.funded)} funded`}
                />
              </div>

              <div className="mt-5 space-y-3">
                {drawRequests.length > 0 ? (
                  drawRequests.slice(0, 4).map((request) => (
                    <div
                      key={request.drawId}
                      className="rounded-[16px] bg-sand-50/80 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-ink-900">
                            {request.label || "Unnamed draw"}
                          </p>
                          <p className="mt-1 text-xs text-ink-500">
                            {DRAW_STATUS_OPTIONS.find((option) => option.value === request.status)
                              ?.label || "Planned"}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-ink-900">
                          {formatCurrency(toNumber(request.amountFunded || request.amountRequested, 0))}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[16px] border border-dashed border-ink-200 bg-white/80 px-4 py-5 text-sm leading-6 text-ink-500">
                    Draw requests will show here once you start tracking lender releases.
                  </div>
                )}
              </div>
            </section>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel px-6 py-7 sm:px-7">
        <span className="eyebrow">Finance > Financial Health</span>
        <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
          Keep the entire project financial picture in one control tower
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
          This dashboard brings the purchase basis, expected budget, actual spend, carry, debt,
          and return profile together so you can see the health of the property at a glance.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={BanknotesIcon}
          label="All-in basis"
          value={formatCurrency(metrics.totalCost)}
          hint="Purchase, close, expected budget, finance, and hold."
        />
        <MetricTile
          icon={ChartBarIcon}
          label="Projected profit"
          value={formatCurrency(metrics.profit)}
          hint={`${formatPercent(metrics.roiOnCash)} ROI on cash invested.`}
          tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
        />
        <MetricTile
          icon={ClipboardDocumentListIcon}
          label="Budget remaining"
          value={formatCurrency(metrics.remainingBudget)}
          hint={`${formatCurrency(metrics.totalSpent)} already spent against expected cost.`}
          tone={metrics.remainingBudget >= 0 ? "text-ink-900" : "text-clay-700"}
        />
        <MetricTile
          icon={ReceiptPercentIcon}
          label="AI receipt entries"
          value={financeSummary.receiptAiCount}
          hint={`${expenses.length} total expense record${expenses.length === 1 ? "" : "s"} so far.`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)]">
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Budget pulse</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Progress against plan</h4>
          <div className="mt-6 space-y-5">
            <ProgressBar
              label="Actual spent vs expected budget"
              value={metrics.totalSpent}
              total={metrics.totalBudget || 1}
              tone="bg-verdigris-500"
              helper={`${formatCurrency(metrics.totalSpent)} of ${formatCurrency(metrics.totalBudget)}`}
            />
            <ProgressBar
              label="Committed vs original budget"
              value={metrics.totalCommitted}
              total={metrics.totalOriginalBudget || 1}
              tone="bg-sky-500"
              helper={`${formatCurrency(metrics.totalCommitted)} committed`}
            />
            <ProgressBar
              label="All-in cost vs ARV"
              value={metrics.totalCost}
              total={metrics.arv || 1}
              tone="bg-amber-400"
              helper={`${formatCurrency(metrics.totalCost)} of ${formatCurrency(metrics.arv)} projected value`}
            />
            <ProgressBar
              label="Debt share of total cost"
              value={metrics.loanAmount}
              total={metrics.totalCost || 1}
              tone="bg-clay-400"
              helper={`${formatCurrency(metrics.loanAmount)} debt currently modeled`}
            />
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Return profile</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Outcome summary</h4>
          <div className="mt-6">
            <FinanceRow label="Purchase price" value={formatCurrency(metrics.purchasePrice)} />
            <FinanceRow label="Buy closing costs" value={formatCurrency(metrics.calcBuyingCost)} />
            <FinanceRow label="Expected rehab budget" value={formatCurrency(metrics.totalBudget)} />
            <FinanceRow label="Finance costs" value={formatCurrency(metrics.calcFinanceCost)} />
            <FinanceRow label="Holding costs" value={formatCurrency(metrics.calcHoldingCost)} />
            <FinanceRow label="Projected ARV" value={formatCurrency(metrics.arv)} />
            <FinanceRow label="Selling costs" value={formatCurrency(metrics.calcSellCost)} />
            <FinanceRow
              label="Net profit"
              value={formatCurrency(metrics.profit)}
              tone={metrics.profit >= 0 ? "text-verdigris-700" : "text-clay-700"}
            />
          </div>
        </section>
      </div>

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Category burn</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Where the budget is moving</h4>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              A quick read on how the current project categories compare against expected cost.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {budgetCategorySummary.length > 0 ? (
            budgetCategorySummary.slice(0, 8).map((group) => (
              <div key={group.label} className="rounded-[20px] border border-ink-100 bg-white/90 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink-900">{group.label}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {group.expensesCount} expense record{group.expensesCount === 1 ? "" : "s"} linked
                    </p>
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-3 xl:min-w-[360px]">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Expected
                      </p>
                      <p className="mt-1 font-semibold text-ink-900">{formatCurrency(group.expected)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Actual
                      </p>
                      <p className="mt-1 font-semibold text-ink-900">{formatCurrency(group.actual)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Variance
                      </p>
                      <p
                        className={`mt-1 font-semibold ${
                          group.variance <= 0 ? "text-verdigris-700" : "text-clay-700"
                        }`}
                      >
                        {formatCurrency(group.variance)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <ProgressBar
                    label="Actual vs expected"
                    value={group.actual}
                    total={group.expected || 1}
                    tone="bg-verdigris-500"
                  />
                  <ProgressBar
                    label="Committed vs expected"
                    value={group.committed}
                    total={group.expected || 1}
                    tone="bg-sky-500"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
              No budget lines yet. The budget versus actual section is ready whenever you start
              adding scope items or expenses.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PropertyFinancePanel;
