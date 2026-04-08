import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import AddBudgetItemModal from "./AddBudgetItemModal";
import AddExpenseModal from "./AddExpenseModal";
import AddTaskModal from "./AddTaskModal";
import AIRehabBuilderModal from "./AIRehabBuilderModal";
import BudgetAwardModal from "./BudgetAwardModal";
import BudgetLineItem from "./BudgetLineItem";
import { EmptyAcquisitionState } from "./PropertyFinancePanel";
import {
  addBudgetAward,
  createPropertyWorkspace,
  deleteBudgetAward,
  getBidsForProject,
  getBudgetItems,
  getExpenses,
  getInvestment,
  getProjectReceipts,
  getProjectTasks,
  getVendors,
  updateExpense,
  updateBudgetAward,
} from "../utils/api";
import {
  formatCurrency,
  getInvestmentAnalysisMetrics,
  toNumber,
} from "../utils/investmentMetrics";
import {
  getDrawRequestById,
  getDrawRequestLabel,
  getDrawRequests,
  getFundingSourceById,
  getFundingSourceLabel,
  getFundingSources,
} from "../utils/capitalStack";
import {
  buildExpenseDuplicateGroups,
  buildRecurringCarryTemplates,
  EXPENSE_STATUS_OPTIONS,
  getExpensePaymentMethodLabel,
  getExpenseRecurringCategoryLabel,
  getExpenseStatusClasses,
  getExpenseStatusLabel,
} from "../utils/expenseOperations";
import {
  getPaymentCostClassLabel,
  getPaymentCostTypeLabel,
  getPaymentCostTypeOptions,
  PAYMENT_COST_CLASS_OPTIONS,
  resolvePaymentClassification,
} from "../utils/paymentTaxonomy";
import {
  getVendorProcurementStateClasses,
  getVendorProcurementSummary,
} from "../utils/vendorProcurement";
import {
  getVendorComplianceClasses,
  getVendorComplianceLabel,
} from "../utils/vendors";

const formatDate = (value) => {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "Recently";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeDateKey = (value) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
};

const normalizeComparisonKey = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const bidAssignmentMatchesBudgetItem = (assignment, item) => {
  if (!assignment || !item) {
    return false;
  }

  const budgetItemId = typeof item === "object" ? item._id || "" : item || "";
  const budgetItemLabel = item?.category || "";

  if (assignment.budgetItemId && assignment.budgetItemId === budgetItemId) {
    return true;
  }

  if (assignment.renovationItemId && assignment.renovationItemId === budgetItemId) {
    return true;
  }

  if (
    item?.sourceRenovationItemId &&
    assignment.renovationItemId === item.sourceRenovationItemId
  ) {
    return true;
  }

  const assignmentName = normalizeComparisonKey(
    assignment.budgetItemLabel || assignment.renovationItemName
  );
  const itemName = normalizeComparisonKey(budgetItemLabel);

  return Boolean(
    assignmentName &&
      itemName &&
      (assignmentName === itemName ||
        assignmentName.includes(itemName) ||
        itemName.includes(assignmentName))
  );
};

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

const PAYMENT_FILTERS_INITIAL_STATE = {
  search: "",
  status: "",
  vendor: "",
  costClass: "",
  costType: "",
  scope: "",
  fundingSourceId: "",
  drawRequestId: "",
  dateFrom: "",
  dateTo: "",
};

const PAYMENT_QUEUE_OPTIONS = [
  {
    value: "needs_approval",
    label: "Needs approval",
    description: "Draft or approved payments still waiting to move forward.",
  },
  {
    value: "missing_receipt",
    label: "Missing receipt",
    description: "Payments without saved receipt support.",
  },
  {
    value: "needs_scope",
    label: "Needs scope",
    description: "Construction payments still not linked to a scope line.",
  },
  {
    value: "project_level",
    label: "Project-level",
    description: "Payments not tied to a specific scope item.",
  },
  {
    value: "draw_linked",
    label: "Draw-linked",
    description: "Payments already connected to a lender draw.",
  },
  {
    value: "duplicate_watch",
    label: "Duplicate watch",
    description: "Likely duplicate payments that need a quick review.",
  },
];

const BATCH_KEEP_VALUE = "__keep__";
const BATCH_PROJECT_LEVEL_VALUE = "__project_level__";
const PAYMENT_QUEUE_DIAGNOSTIC_KEY_MAP = {
  needs_approval: "needsApproval",
  missing_receipt: "missingReceipt",
  needs_scope: "needsScope",
  project_level: "projectLevel",
  draw_linked: "drawLinked",
  duplicate_watch: "duplicateWatch",
};

const getLinkedReceiptExpenseId = (receipt) =>
  typeof receipt?.expense === "object" ? receipt?.expense?._id || "" : receipt?.expense || "";

const getPaymentPartyLabel = (payment = {}) =>
  payment.vendor?.name || payment.payeeName || "Project payment";

const getPaymentPartyKey = (payment = {}) => {
  const vendorId = typeof payment.vendor === "object" ? payment.vendor?._id || "" : payment.vendor || "";
  if (vendorId) {
    return `vendor:${vendorId}`;
  }

  const payee = normalizeComparisonKey(payment.payeeName || "");
  return payee ? `payee:${payee}` : "";
};

const getPaymentVendorLabel = (payment = {}) =>
  payment.vendor?.name || payment.payeeName || "Direct payee";

const getFundingSourceDisplayLabel = (fundingSources, fundingSourceId) => {
  if (!fundingSourceId) {
    return "No source";
  }

  const linkedFundingSource = getFundingSourceById(fundingSources, fundingSourceId);
  if (!linkedFundingSource) {
    return "Archived source";
  }

  return getFundingSourceLabel(
    linkedFundingSource,
    Math.max(
      fundingSources.findIndex((source) => source.sourceId === linkedFundingSource.sourceId),
      0
    )
  );
};

const getDrawRequestDisplayLabel = (drawRequests, drawRequestId) => {
  if (!drawRequestId) {
    return "No draw";
  }

  const linkedDrawRequest = getDrawRequestById(drawRequests, drawRequestId);
  if (!linkedDrawRequest) {
    return "Archived draw";
  }

  return getDrawRequestLabel(
    linkedDrawRequest,
    Math.max(
      drawRequests.findIndex((request) => request.drawId === linkedDrawRequest.drawId),
      0
    )
  );
};

const getPaymentEntryMethodLabel = (value = "") =>
  value === "receipt_ai" ? "AI receipt capture" : "Manual entry";

const getPaymentReceiptRecordId = (payment = null) =>
  typeof payment?.receiptRecord === "object"
    ? payment?.receiptRecord?._id || ""
    : payment?.receiptRecord || "";

const formatReceiptOptionLabel = (receipt = null) => {
  if (!receipt) {
    return "No receipt selected";
  }

  return [
    receipt.title || receipt.payeeName || "Project receipt",
    receipt.amount !== null && receipt.amount !== undefined
      ? formatCurrency(receipt.amount)
      : "",
    formatDate(receipt.receiptDate || receipt.createdAt || receipt.updatedAt),
  ]
    .filter(Boolean)
    .join(" • ");
};

const getPaymentReceiptSupportSummary = (payment = {}, diagnostics = null) => {
  if (payment.receiptUrl) {
    return "Receipt file linked";
  }

  if (diagnostics?.linkedReceiptCount) {
    return `${diagnostics.linkedReceiptCount} saved receipt${
      diagnostics.linkedReceiptCount === 1 ? "" : "s"
    }`;
  }

  return "No receipt support";
};

const SpendBar = ({ label, expected, actual, committed }) => {
  const maxValue = Math.max(expected, actual, committed, 1);
  const expectedRatio = Math.max(8, (expected / maxValue) * 100);
  const actualRatio = Math.max(8, (actual / maxValue) * 100);
  const committedRatio = Math.max(8, (committed / maxValue) * 100);

  return (
    <div className="rounded-[20px] border border-ink-100 bg-white/85 p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-base font-semibold text-ink-900">{label}</p>
        <p
          className={`text-sm font-semibold ${
            actual <= expected ? "text-verdigris-700" : "text-clay-700"
          }`}
        >
          {formatCurrency(actual - expected)} variance
        </p>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-ink-600">Expected</span>
            <span className="font-semibold text-ink-900">{formatCurrency(expected)}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full bg-sky-500" style={{ width: `${expectedRatio}%` }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-ink-600">Committed</span>
            <span className="font-semibold text-ink-900">{formatCurrency(committed)}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-amber-400"
              style={{ width: `${committedRatio}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-ink-600">Actual</span>
            <span className="font-semibold text-ink-900">{formatCurrency(actual)}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-100">
            <div
              className={`h-full rounded-full ${actual <= expected ? "bg-verdigris-500" : "bg-clay-500"}`}
              style={{ width: `${actualRatio}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewPill = ({ flag }) => (
  <span
    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${flag.classes}`}
  >
    {flag.label}
  </span>
);

const PaymentReviewDrawer = ({
  isOpen,
  payment,
  diagnostics,
  reviewReceiptRecordId,
  onReviewReceiptChange,
  availableReceipts,
  selectedReceiptRecord,
  reviewDraft,
  onReviewDraftChange,
  reviewCostTypeOptions,
  reviewCapitalDraft,
  onReviewCapitalDraftChange,
  reviewCapitalDrawOptions,
  onClose,
  onSaveReviewReceipt,
  onSaveReviewCleanup,
  onSaveReviewCapitalLinks,
  onSaveReviewPass,
  onStatusChange,
  onOpenFullEdit,
  onOpenPrevious,
  onOpenNext,
  hasPrevious,
  hasNext,
  isSaving,
  fundingSources,
  drawRequests,
  budgetItems,
}) => {
  if (!isOpen || !payment) {
    return null;
  }

  const quickFlags = (diagnostics?.flags || []).filter((flag) =>
    ["needs_approval", "missing_receipt", "needs_scope", "duplicate_watch"].includes(flag.key)
  );
  const currentReceiptRecordId = getPaymentReceiptRecordId(payment);
  const currentBudgetItemId =
    payment.budgetItemResolved?._id ||
    (typeof payment.budgetItem === "object" ? payment.budgetItem?._id || "" : payment.budgetItem || "");
  const linkedScope =
    budgetItems.find((item) => item._id === reviewDraft.budgetItemId)?.category ||
    payment.budgetItemResolved?.category ||
    "Project-level";
  const linkedFunding = getFundingSourceDisplayLabel(
    fundingSources,
    reviewCapitalDraft.fundingSourceId
  );
  const linkedDraw = getDrawRequestDisplayLabel(drawRequests, reviewCapitalDraft.drawRequestId);
  const currentReceiptLabel = selectedReceiptRecord
    ? formatReceiptOptionLabel(selectedReceiptRecord)
    : payment.receiptUrl
      ? "Receipt file already linked"
      : diagnostics?.latestReceiptTitle
        ? `${diagnostics.latestReceiptTitle}${
            diagnostics.latestReceiptDate ? ` • ${formatDate(diagnostics.latestReceiptDate)}` : ""
          }`
        : "No receipt support linked";
  const receiptComparisonSource = selectedReceiptRecord || null;
  const receiptComparisonRows = receiptComparisonSource
    ? [
        {
          key: "amount",
          label: "Amount",
          expected:
            receiptComparisonSource.amount !== null && receiptComparisonSource.amount !== undefined
              ? formatCurrency(receiptComparisonSource.amount)
              : "Not found",
          actual: formatCurrency(payment.amount),
          matches:
            receiptComparisonSource.amount !== null &&
            receiptComparisonSource.amount !== undefined &&
            Math.abs(Number(receiptComparisonSource.amount) - Number(payment.amount || 0)) < 0.01,
        },
        {
          key: "payee",
          label: "Payee",
          expected: receiptComparisonSource.payeeName || "Not found",
          actual: getPaymentVendorLabel(payment),
          matches:
            normalizeComparisonKey(receiptComparisonSource.payeeName || "") ===
            normalizeComparisonKey(getPaymentVendorLabel(payment)),
        },
        {
          key: "date",
          label: "Date",
          expected: formatDate(receiptComparisonSource.receiptDate),
          actual: formatDate(payment.date),
          matches:
            normalizeDateKey(receiptComparisonSource.receiptDate) === normalizeDateKey(payment.date),
        },
      ]
    : [];
  const lenderReadinessChecks = [
    {
      key: "status",
      label: "Payment finalized",
      ready: ["paid", "reimbursed"].includes(payment.status || "paid"),
      helper: ["paid", "reimbursed"].includes(payment.status || "paid")
        ? "Ready for draw support"
        : "Move this payment past approval",
    },
    {
      key: "receipt",
      label: "Receipt or invoice support",
      ready: Boolean(selectedReceiptRecord || payment.receiptUrl || diagnostics?.linkedReceiptCount),
      helper: currentReceiptLabel,
    },
    {
      key: "capital",
      label: "Capital linked",
      ready: Boolean(reviewCapitalDraft.fundingSourceId || reviewCapitalDraft.drawRequestId),
      helper: linkedDraw !== "No draw" ? linkedDraw : linkedFunding,
    },
    {
      key: "classification",
      label: "Reporting cleanup",
      ready: Boolean(reviewDraft.costClass && reviewDraft.costType),
      helper: `${getPaymentCostClassLabel(reviewDraft.costClass)} / ${
        getPaymentCostTypeLabel(reviewDraft.costType) || "Type needed"
      }`,
    },
    {
      key: "scope",
      label: "Scope aligned",
      ready: reviewDraft.costClass !== "construction" || Boolean(reviewDraft.budgetItemId),
      helper:
        reviewDraft.costClass === "construction"
          ? linkedScope
          : "Optional for non-construction payments",
    },
  ];
  const lenderReadinessScore = lenderReadinessChecks.filter((check) => check.ready).length;
  const lenderReady = lenderReadinessScore === lenderReadinessChecks.length;
  const pendingReviewChanges = [
    reviewReceiptRecordId !== currentReceiptRecordId
      ? {
          key: "receipt",
          label: reviewReceiptRecordId ? "Receipt relinked" : "Receipt cleared",
        }
      : null,
    reviewDraft.costClass !== (payment.costClass || "general")
      ? {
          key: "costClass",
          label: `Class: ${getPaymentCostClassLabel(reviewDraft.costClass)}`,
        }
      : null,
    reviewDraft.costType !== (payment.costType || "")
      ? {
          key: "costType",
          label: `Type: ${getPaymentCostTypeLabel(reviewDraft.costType) || "Unclassified"}`,
        }
      : null,
    reviewDraft.budgetItemId !== currentBudgetItemId
      ? {
          key: "scope",
          label: reviewDraft.budgetItemId ? `Scope: ${linkedScope}` : "Scope cleared",
        }
      : null,
    reviewCapitalDraft.fundingSourceId !== (payment.fundingSourceId || "")
      ? {
          key: "fundingSourceId",
          label:
            reviewCapitalDraft.fundingSourceId && linkedFunding !== "No source"
              ? `Funding: ${linkedFunding}`
              : "Funding cleared",
        }
      : null,
    reviewCapitalDraft.drawRequestId !== (payment.drawRequestId || "")
      ? {
          key: "drawRequestId",
          label:
            reviewCapitalDraft.drawRequestId && linkedDraw !== "No draw"
              ? `Draw: ${linkedDraw}`
              : "Draw cleared",
        }
      : null,
  ].filter(Boolean);
  const hasPendingReviewChanges = pendingReviewChanges.length > 0;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close review drawer"
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/30 backdrop-blur-[2px]"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-ink-100 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
              Payment review
            </p>
            <h3 className="mt-3 text-xl font-semibold text-ink-900">
              {payment.title || getPaymentPartyLabel(payment)}
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {getPaymentVendorLabel(payment)} • {formatCurrency(payment.amount)} •{" "}
              {formatDate(payment.date)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-500 transition hover:border-ink-200 hover:text-ink-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {quickFlags.length > 0 ? (
              quickFlags.map((flag) => <ReviewPill key={flag.key} flag={flag} />)
            ) : (
              <span className="rounded-full border border-verdigris-200 bg-verdigris-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-verdigris-700">
                Clear
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPrevious}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-500 transition hover:border-ink-200 hover:text-ink-800 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!hasPrevious}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onOpenNext}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-100 bg-white text-ink-500 transition hover:border-ink-200 hover:text-ink-800 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!hasNext}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <section className="rounded-[22px] border border-ink-100 bg-ink-50/55 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
              Workflow actions
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(payment.status || "paid") === "draft" ? (
                <button
                  type="button"
                  onClick={() => onStatusChange("approved")}
                  className="secondary-action"
                  disabled={isSaving}
                >
                  {isSaving ? "Working..." : "Approve"}
                </button>
              ) : null}
              {!["paid", "reimbursed"].includes(payment.status || "paid") ? (
                <button
                  type="button"
                  onClick={() => onStatusChange("paid")}
                  className="primary-action"
                  disabled={isSaving}
                >
                  {isSaving ? "Working..." : "Mark paid"}
                </button>
              ) : null}
              {(payment.status || "paid") === "paid" ? (
                <button
                  type="button"
                  onClick={() => onStatusChange("reimbursed")}
                  className="ghost-action"
                  disabled={isSaving}
                >
                  Mark reimbursed
                </button>
              ) : null}
              <button
                type="button"
                onClick={onOpenFullEdit}
                className="ghost-action"
                disabled={isSaving}
              >
                Open full edit
              </button>
              {payment.receiptUrl ? (
                <button
                  type="button"
                  onClick={() => window.open(payment.receiptUrl, "_blank", "noopener,noreferrer")}
                  className="ghost-action"
                >
                  Open receipt
                </button>
              ) : null}
            </div>
            <div className="mt-4 rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Review pass</p>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    Save receipt, cleanup, and capital changes together once this payment looks
                    right.
                  </p>
                </div>
                <span className="rounded-full bg-ink-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-700">
                  {hasPendingReviewChanges ? `${pendingReviewChanges.length} pending` : "Up to date"}
                </span>
              </div>
              {hasPendingReviewChanges ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {pendingReviewChanges.map((change) => (
                    <span
                      key={change.key}
                      className="rounded-full border border-verdigris-200 bg-verdigris-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-verdigris-700"
                    >
                      {change.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-ink-500">
                  The review fields already match the saved payment.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[22px] border border-ink-100 bg-white/95 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Lender readiness
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Keep draw support and payment review aligned before this item leaves the queue.
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                  lenderReady
                    ? "border border-verdigris-200 bg-verdigris-50 text-verdigris-700"
                    : "border border-sand-200 bg-sand-50 text-sand-700"
                }`}
              >
                {lenderReadinessScore}/{lenderReadinessChecks.length} ready
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {lenderReadinessChecks.map((check) => (
                <div
                  key={check.key}
                  className="flex items-start justify-between gap-4 rounded-[18px] border border-ink-100 bg-ink-50/55 px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{check.label}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-500">{check.helper}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                      check.ready
                        ? "border border-verdigris-200 bg-verdigris-50 text-verdigris-700"
                        : "border border-sand-200 bg-sand-50 text-sand-700"
                    }`}
                  >
                    {check.ready ? "Ready" : "Open"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] border border-ink-100 bg-white/95 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
              Capital links
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Tie this payment to the right funding source and draw request while you review it.
            </p>

            <div className="mt-4 grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Funding source</span>
                <select
                  value={reviewCapitalDraft.fundingSourceId}
                  onChange={(event) => onReviewCapitalDraftChange("fundingSourceId", event.target.value)}
                  className="auth-input appearance-none"
                >
                  <option value="">No funding source</option>
                  {fundingSources.map((source, index) => (
                    <option key={source.sourceId || `review-source-${index}`} value={source.sourceId || ""}>
                      {getFundingSourceLabel(source, index)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Draw request</span>
                <select
                  value={reviewCapitalDraft.drawRequestId}
                  onChange={(event) => onReviewCapitalDraftChange("drawRequestId", event.target.value)}
                  className="auth-input appearance-none"
                >
                  <option value="">No draw request</option>
                  {reviewCapitalDrawOptions.map((drawRequest, index) => (
                    <option key={drawRequest.drawId || `review-draw-${index}`} value={drawRequest.drawId || ""}>
                      {getDrawRequestLabel(drawRequest, index)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={onSaveReviewCapitalLinks}
                className="secondary-action"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save capital only"}
              </button>
            </div>
          </section>

          <section className="rounded-[22px] border border-ink-100 bg-white/95 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
              Receipt support
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Link a reviewed project receipt without leaving this review run.
            </p>

            <div className="mt-4 rounded-[18px] border border-ink-100 bg-ink-50/60 px-4 py-4 text-sm text-ink-600">
              <p className="font-semibold text-ink-900">Current receipt state</p>
              <p className="mt-2 leading-6">{currentReceiptLabel}</p>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Saved project receipt</span>
                <select
                  value={reviewReceiptRecordId}
                  onChange={(event) => onReviewReceiptChange(event.target.value)}
                  className="auth-input appearance-none"
                >
                  <option value="">No linked project receipt</option>
                  {availableReceipts.map((receipt) => (
                    <option key={receipt._id} value={receipt._id}>
                      {formatReceiptOptionLabel(receipt)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={onSaveReviewReceipt}
                className="secondary-action"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save receipt only"}
              </button>
              {selectedReceiptRecord?.receiptUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    window.open(selectedReceiptRecord.receiptUrl, "_blank", "noopener,noreferrer")
                  }
                  className="ghost-action"
                >
                  Open selected receipt
                </button>
              ) : null}
            </div>
          </section>

          {receiptComparisonRows.length > 0 ? (
            <section className="rounded-[22px] border border-ink-100 bg-white/95 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                Receipt comparison
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Compare the saved receipt to the ledger entry before it moves into a lender packet.
              </p>

              <div className="mt-4 space-y-3">
                {receiptComparisonRows.map((row) => (
                  <div
                    key={row.key}
                    className="rounded-[18px] border border-ink-100 bg-ink-50/55 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{row.label}</p>
                        <p className="mt-1 text-sm text-ink-500">Receipt: {row.expected}</p>
                        <p className="mt-1 text-sm text-ink-500">Ledger: {row.actual}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                          row.matches
                            ? "border border-verdigris-200 bg-verdigris-50 text-verdigris-700"
                            : "border border-sand-200 bg-sand-50 text-sand-700"
                        }`}
                      >
                        {row.matches ? "Match" : "Review"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[22px] border border-ink-100 bg-white/95 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
              Quick cleanup
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Fix the fields that most often block clean reporting and lender-ready backup.
            </p>

            <div className="mt-4 grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Cost class</span>
                <select
                  value={reviewDraft.costClass}
                  onChange={(event) => onReviewDraftChange("costClass", event.target.value)}
                  className="auth-input appearance-none"
                >
                  {PAYMENT_COST_CLASS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Cost type</span>
                <select
                  value={reviewDraft.costType}
                  onChange={(event) => onReviewDraftChange("costType", event.target.value)}
                  className="auth-input appearance-none"
                >
                  {reviewCostTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Scope</span>
                <select
                  value={reviewDraft.budgetItemId}
                  onChange={(event) => onReviewDraftChange("budgetItemId", event.target.value)}
                  className="auth-input appearance-none"
                >
                  <option value="">Project-level</option>
                  {budgetItems.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.category}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={onSaveReviewCleanup}
                className="secondary-action"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save cleanup only"}
              </button>
            </div>
          </section>

          <section className="rounded-[22px] border border-ink-100 bg-ink-50/55 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
              Context
            </p>
            <dl className="mt-4 space-y-3 text-sm text-ink-600">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-ink-400">Scope</dt>
                <dd className="text-right font-medium text-ink-900">{linkedScope}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-ink-400">Funding</dt>
                <dd className="text-right font-medium text-ink-900">{linkedFunding}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-ink-400">Draw</dt>
                <dd className="text-right font-medium text-ink-900">{linkedDraw}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-ink-400">Method</dt>
                <dd className="text-right font-medium text-ink-900">
                  {getExpensePaymentMethodLabel(payment.paymentMethod)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-ink-400">Entry</dt>
                <dd className="text-right font-medium text-ink-900">
                  {getPaymentEntryMethodLabel(payment.entryMethod)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-[18px] border border-ink-100 bg-white/85 px-4 py-4 text-sm leading-6 text-ink-600">
              <p className="font-semibold text-ink-900">Notes</p>
              <p className="mt-2">{payment.notes || "No internal note saved for this payment."}</p>
            </div>
          </section>
        </div>

        <div className="border-t border-ink-100 bg-white px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-ink-500">
              {hasPendingReviewChanges
                ? `${pendingReviewChanges.length} review change${
                    pendingReviewChanges.length === 1 ? "" : "s"
                  } ready to save.`
                : "No unsaved review changes in the drawer right now."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenFullEdit}
                className="ghost-action"
                disabled={isSaving}
              >
                Open full edit
              </button>
              <button
                type="button"
                onClick={onSaveReviewPass}
                className="primary-action"
                disabled={isSaving || !hasPendingReviewChanges}
              >
                {isSaving ? "Saving..." : "Save review pass"}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

const getUniqueBids = (matches = []) => {
  const seen = new Map();

  matches.forEach((match) => {
    const bidId = match?.bidId || match?.bid?._id || "";
    if (!bidId || seen.has(bidId)) {
      return;
    }

    seen.set(bidId, match?.bid || { _id: bidId, ...match });
  });

  return [...seen.values()];
};

const PropertyCostsPanel = ({
  property,
  propertyKey,
  activeContentKey,
  onPropertyUpdated,
  embedded = false,
}) => {
  const investmentId = property?.workspaces?.acquisitions?.id || "";
  const [selectedStrategy, setSelectedStrategy] = useState(
    property?.workspaces?.acquisitions?.strategy || "flip"
  );
  const [investment, setInvestment] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [projectReceipts, setProjectReceipts] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [projectBids, setProjectBids] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [expenseModalState, setExpenseModalState] = useState({
    isOpen: false,
    budgetItemId: "",
    awardId: "",
    mode: "manual",
    initialValues: {},
    editingExpense: null,
  });
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAIBuilderModal, setShowAIBuilderModal] = useState(false);
  const [awardModalState, setAwardModalState] = useState({
    isOpen: false,
    budgetItem: null,
    award: null,
  });
  const [taskModalState, setTaskModalState] = useState({
    isOpen: false,
    budgetItemId: "",
  });
  const [paymentFilters, setPaymentFilters] = useState(PAYMENT_FILTERS_INITIAL_STATE);
  const [paymentQueueFilter, setPaymentQueueFilter] = useState("");
  const [expandedPaymentId, setExpandedPaymentId] = useState("");
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  const [batchCostClass, setBatchCostClass] = useState(BATCH_KEEP_VALUE);
  const [batchCostType, setBatchCostType] = useState(BATCH_KEEP_VALUE);
  const [batchScopeId, setBatchScopeId] = useState(BATCH_KEEP_VALUE);
  const [batchFundingSourceId, setBatchFundingSourceId] = useState("");
  const [batchDrawRequestId, setBatchDrawRequestId] = useState("");
  const [isApplyingBatchActions, setIsApplyingBatchActions] = useState(false);
  const [reviewDrawerPaymentId, setReviewDrawerPaymentId] = useState("");
  const [reviewReceiptRecordId, setReviewReceiptRecordId] = useState("");
  const [reviewDraft, setReviewDraft] = useState({
    costClass: "general",
    costType: "misc",
    budgetItemId: "",
  });
  const [reviewCapitalDraft, setReviewCapitalDraft] = useState({
    fundingSourceId: "",
    drawRequestId: "",
  });
  const [isSavingReviewDrawer, setIsSavingReviewDrawer] = useState(false);

  useEffect(() => {
    setSelectedStrategy(property?.workspaces?.acquisitions?.strategy || "flip");
  }, [property?.workspaces?.acquisitions?.strategy]);

  const loadCostsWorkspace = useCallback(async () => {
    if (!investmentId) {
      setInvestment(null);
      setBudgetItems([]);
      setExpenses([]);
      setProjectReceipts([]);
      setProjectTasks([]);
      setProjectBids([]);
      setVendors([]);
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [
        investmentData,
        budgetData,
        expenseData,
        vendorData,
        receiptData,
        taskData,
        bidData,
      ] = await Promise.all([
        getInvestment(investmentId),
        getBudgetItems(investmentId),
        getExpenses(investmentId),
        getVendors(),
        getProjectReceipts(investmentId),
        getProjectTasks(investmentId),
        getBidsForProject(investmentId).catch(() => []),
      ]);

      setInvestment(investmentData);
      setBudgetItems(Array.isArray(budgetData) ? budgetData : []);
      setExpenses(Array.isArray(expenseData) ? expenseData : []);
      setProjectReceipts(Array.isArray(receiptData) ? receiptData : []);
      setProjectTasks(Array.isArray(taskData) ? taskData : []);
      setProjectBids(Array.isArray(bidData) ? bidData : []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load the costs workspace.");
    } finally {
      setLoading(false);
    }
  }, [investmentId]);

  useEffect(() => {
    if (!activeContentKey.startsWith("costs-")) {
      return;
    }

    loadCostsWorkspace();
  }, [activeContentKey, loadCostsWorkspace]);

  const paymentRecords = useMemo(
    () =>
      expenses.map((expense) => {
        const resolvedBudgetItem =
          typeof expense.budgetItem === "object"
            ? expense.budgetItem
            : budgetItems.find((item) => item._id === expense.budgetItem) || null;
        const classification = resolvePaymentClassification({
          costClass: expense.costClass,
          costType: expense.costType,
          title: expense.title,
          description: expense.description,
          recurringCategory: expense.recurringCategory,
          budgetItem: resolvedBudgetItem,
          awardId: expense.awardId,
          payeeName: getPaymentPartyLabel(expense),
        });

        return {
          ...expense,
          budgetItemResolved: resolvedBudgetItem,
          costClass: classification.costClass,
          costType: classification.costType,
        };
      }),
    [budgetItems, expenses]
  );

  const metrics = useMemo(
    () => getInvestmentAnalysisMetrics(investment || {}, { budgetItems, expenses: paymentRecords }),
    [budgetItems, investment, paymentRecords]
  );

  const fundingSources = useMemo(() => getFundingSources(investment || {}), [investment]);
  const drawRequests = useMemo(() => getDrawRequests(investment || {}), [investment]);
  const vendorRecordsById = useMemo(
    () =>
      new Map(
        vendors
          .filter((vendor) => vendor && typeof vendor === "object" && !Array.isArray(vendor))
          .map((vendor) => [vendor._id, vendor])
      ),
    [vendors]
  );
  const vendorProcurementById = useMemo(
    () =>
      new Map(
        vendors
          .filter((vendor) => vendor && typeof vendor === "object" && !Array.isArray(vendor))
          .map((vendor) => [vendor._id, getVendorProcurementSummary(vendor)])
      ),
    [vendors]
  );

  const expensesByBudgetItemId = useMemo(() => {
    const groups = new Map();

    paymentRecords.forEach((expense) => {
      const key =
        typeof expense.budgetItem === "object"
          ? expense.budgetItem?._id || ""
          : expense.budgetItem || "";

      if (!key) {
        return;
      }

      const current = groups.get(key) || [];
      current.push(expense);
      groups.set(key, current);
    });

    return groups;
  }, [paymentRecords]);

  const tasksByBudgetItemId = useMemo(() => {
    const groups = new Map();

    projectTasks.forEach((task) => {
      const key =
        typeof task.budgetItem === "object" ? task.budgetItem?._id || "" : task.budgetItem || "";

      if (!key) {
        return;
      }

      const current = groups.get(key) || [];
      current.push(task);
      groups.set(key, current);
    });

    return groups;
  }, [projectTasks]);

  const receiptsByBudgetItemId = useMemo(() => {
    const groups = new Map();

    projectReceipts.forEach((receipt) => {
      const key =
        typeof receipt.budgetItem === "object"
          ? receipt.budgetItem?._id || ""
          : receipt.budgetItem || "";

      if (!key) {
        return;
      }

      const current = groups.get(key) || [];
      current.push(receipt);
      groups.set(key, current);
    });

    return groups;
  }, [projectReceipts]);

  const bidsByBudgetItemId = useMemo(() => {
    const groups = new Map();

    budgetItems.forEach((item) => {
      const matches = projectBids.flatMap((bid) =>
        (Array.isArray(bid.renovationAssignments) ? bid.renovationAssignments : [])
          .filter((assignment) => bidAssignmentMatchesBudgetItem(assignment, item))
          .map((assignment) => ({
            ...assignment,
            bidId: bid._id,
            bid,
          }))
      );

      if (matches.length > 0) {
        groups.set(item._id, matches);
      }
    });

    return groups;
  }, [budgetItems, projectBids]);

  const categorySpendSummary = useMemo(() => {
    const groups = new Map();

    budgetItems.forEach((item) => {
      const key = item.category || "Uncategorized";
      if (!groups.has(key)) {
        groups.set(key, {
          label: key,
          expected: 0,
          committed: 0,
          actual: 0,
        });
      }

      const current = groups.get(key);
      current.expected += toNumber(item.budgetedAmount, 0);
      current.committed += Array.isArray(item.awards)
        ? item.awards.reduce((sum, award) => sum + toNumber(award.amount, 0), 0)
        : 0;
    });

    paymentRecords.forEach((expense) => {
      const budgetItemId =
        typeof expense.budgetItem === "object"
          ? expense.budgetItem?._id || ""
          : expense.budgetItem || "";
      const budgetItem = budgetItems.find((item) => item._id === budgetItemId);
      const key = budgetItem?.category || "Project-level";

      if (!groups.has(key)) {
        groups.set(key, {
          label: key,
          expected: 0,
          committed: 0,
          actual: 0,
        });
      }

      groups.get(key).actual += toNumber(expense.amount, 0);
    });

    return [...groups.values()]
      .sort((left, right) => Math.max(right.expected, right.actual) - Math.max(left.expected, left.actual))
      .slice(0, 8);
  }, [budgetItems, paymentRecords]);

  const fundingSpendSummary = useMemo(() => {
    const groups = new Map();

    paymentRecords.forEach((expense) => {
      if (!expense.fundingSourceId) {
        return;
      }

      const linkedSource = getFundingSourceById(fundingSources, expense.fundingSourceId);
      const index = Math.max(
        fundingSources.findIndex((source) => source.sourceId === expense.fundingSourceId),
        0
      );
      const label = linkedSource
        ? getFundingSourceLabel(linkedSource, index)
        : "Archived funding source";
      const current = groups.get(expense.fundingSourceId) || {
        key: expense.fundingSourceId,
        label,
        amount: 0,
        count: 0,
      };

      current.amount += toNumber(expense.amount, 0);
      current.count += 1;
      groups.set(expense.fundingSourceId, current);
    });

    return [...groups.values()].sort((left, right) => right.amount - left.amount);
  }, [fundingSources, paymentRecords]);

  const drawSpendSummary = useMemo(() => {
    const groups = new Map();

    paymentRecords.forEach((expense) => {
      if (!expense.drawRequestId) {
        return;
      }

      const linkedDrawRequest = getDrawRequestById(drawRequests, expense.drawRequestId);
      const index = Math.max(
        drawRequests.findIndex((request) => request.drawId === expense.drawRequestId),
        0
      );
      const label = linkedDrawRequest
        ? getDrawRequestLabel(linkedDrawRequest, index)
        : "Archived draw request";
      const current = groups.get(expense.drawRequestId) || {
        key: expense.drawRequestId,
        label,
        amount: 0,
        count: 0,
      };

      current.amount += toNumber(expense.amount, 0);
      current.count += 1;
      groups.set(expense.drawRequestId, current);
    });

    return [...groups.values()].sort((left, right) => right.amount - left.amount);
  }, [drawRequests, paymentRecords]);

  const approvalQueue = useMemo(
    () =>
      paymentRecords
        .filter((expense) => ["draft", "approved"].includes(expense.status || "paid"))
        .sort((left, right) => new Date(left.date || 0) - new Date(right.date || 0)),
    [paymentRecords]
  );

  const duplicateGroups = useMemo(() => buildExpenseDuplicateGroups(paymentRecords), [paymentRecords]);
  const duplicateExpenseIds = useMemo(
    () =>
      new Set(
        duplicateGroups.flatMap((group) => group.expenses.map((expense) => String(expense._id)))
      ),
    [duplicateGroups]
  );

  const recurringCarryTemplates = useMemo(
    () => buildRecurringCarryTemplates(investment || {}),
    [investment]
  );

  const recurringCarryActuals = useMemo(() => {
    const groups = new Map();

    paymentRecords.forEach((expense) => {
      if (!expense.recurringCategory) {
        return;
      }

      const current = groups.get(expense.recurringCategory) || {
        amount: 0,
        count: 0,
        lastDate: null,
      };

      current.amount += toNumber(expense.amount, 0);
      current.count += 1;
      if (!current.lastDate || new Date(expense.date || 0) > new Date(current.lastDate || 0)) {
        current.lastDate = expense.date;
      }
      groups.set(expense.recurringCategory, current);
    });

    return groups;
  }, [paymentRecords]);

  const receiptBacklog = useMemo(
    () => projectReceipts.filter((receipt) => !receipt.expense),
    [projectReceipts]
  );

  const paymentReceiptSummaryById = useMemo(() => {
    const summary = new Map();

    projectReceipts.forEach((receipt) => {
      const expenseId = getLinkedReceiptExpenseId(receipt);
      if (!expenseId) {
        return;
      }

      const current = summary.get(expenseId) || {
        count: 0,
        latestDate: "",
        latestTitle: "",
      };

      current.count += 1;
      const receiptDate = receipt.createdAt || receipt.updatedAt || "";
      if (!current.latestDate || new Date(receiptDate || 0) > new Date(current.latestDate || 0)) {
        current.latestDate = receiptDate;
        current.latestTitle = receipt.title || receipt.payeeName || "Receipt";
      }

      summary.set(expenseId, current);
    });

    return summary;
  }, [projectReceipts]);

  const paymentDiagnosticsById = useMemo(() => {
    const diagnostics = new Map();

    paymentRecords.forEach((payment) => {
      const paymentId = String(payment._id || "");
      const linkedReceiptSummary = paymentReceiptSummaryById.get(paymentId);
      const linkedReceiptCount = linkedReceiptSummary?.count || 0;
      const status = payment.status || "paid";
      const needsApproval = ["draft", "approved"].includes(status);
      const missingReceipt = !payment.receiptUrl && linkedReceiptCount === 0;
      const needsScope = payment.costClass === "construction" && !payment.budgetItemResolved;
      const projectLevel = !payment.budgetItemResolved;
      const drawLinked = Boolean(payment.drawRequestId);
      const duplicateWatch = duplicateExpenseIds.has(paymentId);
      const flags = [];

      if (needsApproval) {
        flags.push({
          key: "needs_approval",
          label: "Needs approval",
          classes: "border border-sky-200 bg-sky-50 text-sky-700",
        });
      }
      if (missingReceipt) {
        flags.push({
          key: "missing_receipt",
          label: "Missing receipt",
          classes: "border border-amber-200 bg-amber-50 text-amber-700",
        });
      }
      if (needsScope) {
        flags.push({
          key: "needs_scope",
          label: "Needs scope",
          classes: "border border-clay-200 bg-clay-50 text-clay-700",
        });
      }
      if (projectLevel) {
        flags.push({
          key: "project_level",
          label: "Project-level",
          classes: "border border-ink-100 bg-ink-50 text-ink-700",
        });
      }
      if (drawLinked) {
        flags.push({
          key: "draw_linked",
          label: "Draw-linked",
          classes: "border border-indigo-200 bg-indigo-50 text-indigo-700",
        });
      }
      if (duplicateWatch) {
        flags.push({
          key: "duplicate_watch",
          label: "Duplicate watch",
          classes: "border border-clay-200 bg-clay-50 text-clay-700",
        });
      }

      diagnostics.set(paymentId, {
        linkedReceiptCount,
        latestReceiptDate: linkedReceiptSummary?.latestDate || "",
        latestReceiptTitle: linkedReceiptSummary?.latestTitle || "",
        needsApproval,
        missingReceipt,
        needsScope,
        projectLevel,
        drawLinked,
        duplicateWatch,
        flags,
      });
    });

    return diagnostics;
  }, [duplicateExpenseIds, paymentReceiptSummaryById, paymentRecords]);

  const paymentClassSummary = useMemo(
    () =>
      PAYMENT_COST_CLASS_OPTIONS.map((option) => {
        const matchingPayments = paymentRecords.filter((payment) => payment.costClass === option.value);

        return {
          value: option.value,
          label: option.label,
          count: matchingPayments.length,
          amount: matchingPayments.reduce((sum, payment) => sum + toNumber(payment.amount, 0), 0),
        };
      })
        .filter((item) => item.count > 0)
        .sort((left, right) => right.amount - left.amount)
        .slice(0, 4),
    [paymentRecords]
  );

  const unscopedConstructionPayments = useMemo(
    () =>
      paymentRecords.filter(
        (payment) => payment.costClass === "construction" && !payment.budgetItemResolved
      ).length,
    [paymentRecords]
  );

  const approvalQueueAmount = useMemo(
    () => approvalQueue.reduce((sum, payment) => sum + toNumber(payment.amount, 0), 0),
    [approvalQueue]
  );

  const paymentQueueSummary = useMemo(
    () =>
      PAYMENT_QUEUE_OPTIONS.map((queue) => {
        const matchingPayments = paymentRecords.filter((payment) => {
          const diagnostics = paymentDiagnosticsById.get(String(payment._id || ""));

          if (!diagnostics) {
            return false;
          }

          return Boolean(diagnostics[PAYMENT_QUEUE_DIAGNOSTIC_KEY_MAP[queue.value]]);
        });

        return {
          ...queue,
          count: matchingPayments.length,
          amount: matchingPayments.reduce((sum, payment) => sum + toNumber(payment.amount, 0), 0),
          ids: new Set(matchingPayments.map((payment) => String(payment._id || ""))),
        };
      }),
    [paymentDiagnosticsById, paymentRecords]
  );

  const activePaymentQueue = useMemo(
    () => paymentQueueSummary.find((queue) => queue.value === paymentQueueFilter) || null,
    [paymentQueueFilter, paymentQueueSummary]
  );

  const costPlanRows = useMemo(
    () =>
      budgetItems
        .map((item) => {
          const currentBudget = toNumber(item.budgetedAmount, 0);
          const originalBudget = toNumber(item.originalBudgetAmount ?? item.budgetedAmount, 0);
          const committed = Array.isArray(item.awards)
            ? item.awards.reduce((sum, award) => sum + toNumber(award.amount, 0), 0)
            : 0;
          const paid = (expensesByBudgetItemId.get(item._id) || []).reduce(
            (sum, payment) => sum + toNumber(payment.amount, 0),
            0
          );
          const vendorCount = Array.isArray(item.awards) ? item.awards.length : 0;
          const taskCount = (tasksByBudgetItemId.get(item._id) || []).length;
          const fileCount = (receiptsByBudgetItemId.get(item._id) || []).length;
          const variance = currentBudget - paid;
          const commitmentGap = currentBudget - committed;

          return {
            item,
            currentBudget,
            originalBudget,
            committed,
            paid,
            variance,
            commitmentGap,
            vendorCount,
            taskCount,
            fileCount,
            overBudget: variance < 0,
            overCommitted: commitmentGap < 0,
          };
        })
        .sort((left, right) => {
          const leftRisk = Math.min(left.variance, left.commitmentGap);
          const rightRisk = Math.min(right.variance, right.commitmentGap);
          return leftRisk - rightRisk || left.item.category.localeCompare(right.item.category);
        }),
    [budgetItems, expensesByBudgetItemId, receiptsByBudgetItemId, tasksByBudgetItemId]
  );

  const overBudgetScopeItems = useMemo(
    () =>
      costPlanRows
        .filter((row) => row.overBudget || row.overCommitted)
        .sort((left, right) => Math.min(left.variance, left.commitmentGap) - Math.min(right.variance, right.commitmentGap))
        .slice(0, 5),
    [costPlanRows]
  );

  const projectLevelPayments = useMemo(
    () =>
      paymentRecords
        .filter((payment) => !payment.budgetItemResolved)
        .sort(
          (left, right) =>
            new Date(right.date || right.updatedAt || right.createdAt || 0).valueOf() -
            new Date(left.date || left.updatedAt || left.createdAt || 0).valueOf()
        ),
    [paymentRecords]
  );

  const commitments = useMemo(
    () =>
      budgetItems
        .flatMap((item) =>
          (item.awards || []).map((award) => {
            const vendorId =
              typeof award.vendor === "object" ? award.vendor?._id || "" : award.vendor || "";
            const vendorRecord = vendorRecordsById.get(vendorId) || null;
            const procurement = vendorRecord ? vendorProcurementById.get(vendorId) || null : null;
            const matchedExpenses = paymentRecords.filter((expense) => {
              const expenseBudgetItemId =
                typeof expense.budgetItem === "object"
                  ? expense.budgetItem?._id || ""
                  : expense.budgetItem || "";
              const expenseVendorId =
                typeof expense.vendor === "object" ? expense.vendor?._id || "" : expense.vendor || "";

              if (expense.awardId && expense.awardId === award.awardId) {
                return true;
              }

              return expenseBudgetItemId === item._id && vendorId && vendorId === expenseVendorId;
            });

            const paidToDate = matchedExpenses.reduce(
              (sum, expense) => sum + toNumber(expense.amount, 0),
              0
            );

            return {
              awardId: award.awardId,
              scopeItemId: item._id,
              scopeItemLabel: item.category || "Scope item",
              description: item.description || award.description || "",
              vendorId,
              vendorRecord,
              procurement,
              vendorName:
                (typeof award.vendor === "object" ? award.vendor?.name : "") ||
                award.vendorName ||
                "Selected vendor",
              amount: toNumber(award.amount, 0),
              paidToDate,
              remainingBalance: toNumber(award.amount, 0) - paidToDate,
              expensesCount: matchedExpenses.length,
              createdAt: award.createdAt || item.updatedAt || item.createdAt,
            };
          })
        )
        .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)),
    [budgetItems, paymentRecords, vendorProcurementById, vendorRecordsById]
  );

  const procurementBidSummary = useMemo(() => {
    const awardedBids = projectBids.filter((bid) => (bid.decisionStatus || "open") === "awarded");
    const openBids = projectBids.filter((bid) => (bid.decisionStatus || "open") !== "awarded");
    const unlinkedContractorBids = projectBids.filter(
      (bid) => !bid.vendor?.name && normalizeComparisonKey(bid.vendorSnapshot?.name || bid.contractorName)
    );
    const bidsWithoutAssignments = projectBids.filter(
      (bid) => !Array.isArray(bid.renovationAssignments) || bid.renovationAssignments.length === 0
    );

    return {
      awardedBids,
      openBids,
      unlinkedContractorBids,
      bidsWithoutAssignments,
    };
  }, [projectBids]);

  const procurementScopeRows = useMemo(
    () =>
      budgetItems
        .map((item) => {
          const relatedQuoteAssignments = bidsByBudgetItemId.get(item._id) || [];
          const relatedBids = getUniqueBids(relatedQuoteAssignments);
          const awards = Array.isArray(item.awards) ? item.awards : [];
          const awardedVendors = awards.map((award) => {
            const vendorId =
              typeof award.vendor === "object" ? award.vendor?._id || "" : award.vendor || "";
            const vendorRecord = vendorRecordsById.get(vendorId) || null;
            const procurement = vendorRecord ? vendorProcurementById.get(vendorId) || null : null;

            return {
              awardId: award.awardId,
              vendorId,
              vendorRecord,
              procurement,
              vendorName:
                (typeof award.vendor === "object" ? award.vendor?.name : "") ||
                award.vendorName ||
                "Selected vendor",
            };
          });
          const quoteCount = relatedBids.length;
          const openQuoteCount = relatedBids.filter(
            (bid) => (bid.decisionStatus || "open") !== "awarded"
          ).length;
          const committed = awards.reduce((sum, award) => sum + toNumber(award.amount, 0), 0);
          const paid = (expensesByBudgetItemId.get(item._id) || []).reduce(
            (sum, payment) => sum + toNumber(payment.amount, 0),
            0
          );
          const remaining = committed - paid;
          const packetIssueCount = awardedVendors.filter(
            (vendor) => !vendor.vendorId || !vendor.procurement?.assignmentReady
          ).length;
          const paymentReadyCount = awardedVendors.filter(
            (vendor) => vendor.procurement?.paymentReady
          ).length;
          const assignmentReadyCount = awardedVendors.filter(
            (vendor) => vendor.procurement?.assignmentReady
          ).length;
          let packetState = "missing";
          let packetLabel = "No awarded vendor";

          if (awardedVendors.length === 0) {
            if (quoteCount > 0) {
              packetState = "in_progress";
              packetLabel = "Review quotes";
            } else {
              packetLabel = "No quote coverage";
            }
          } else if (packetIssueCount > 0) {
            packetState = "missing";
            packetLabel = `${packetIssueCount} packet gap${packetIssueCount === 1 ? "" : "s"}`;
          } else if (paymentReadyCount === awardedVendors.length) {
            packetState = "ready_to_pay";
            packetLabel = "Ready to pay";
          } else if (assignmentReadyCount === awardedVendors.length) {
            packetState = "ready_to_assign";
            packetLabel = "Ready to assign";
          } else {
            packetState = "in_progress";
            packetLabel = "Packet in progress";
          }

          const nextActions = [
            ...new Set(
              awardedVendors.flatMap((vendor) =>
                vendor.procurement?.nextActions?.length
                  ? vendor.procurement.nextActions
                  : !vendor.vendorId
                    ? ["Link the vendor record"]
                    : []
              )
            ),
          ];

          let nextMove = "Coverage looks healthy.";
          if (awardedVendors.length === 0 && quoteCount === 0) {
            nextMove = "Collect bids for this scope item.";
          } else if (awardedVendors.length === 0) {
            nextMove = openQuoteCount > 0 ? "Review open quotes and award a vendor." : "Award one of the saved quotes.";
          } else if (packetIssueCount > 0) {
            nextMove = nextActions[0] || "Finish packet items before release of work or funds.";
          } else if (remaining < 0) {
            nextMove = "Paid amount is above the committed amount. Review the scope and payment history.";
          } else if (paid === 0) {
            nextMove = "No payments recorded yet against the awarded work.";
          }

          return {
            item,
            relatedBids,
            quoteCount,
            openQuoteCount,
            awards,
            awardedVendors,
            awardCount: awardedVendors.length,
            committed,
            paid,
            remaining,
            packetIssueCount,
            paymentReadyCount,
            assignmentReadyCount,
            packetState,
            packetLabel,
            nextMove,
          };
        })
        .sort((left, right) => {
          const leftPriority =
            (left.awardCount === 0 ? 100 : 0) +
            left.packetIssueCount * 25 +
            (left.remaining < 0 ? 10 : 0) +
            (left.quoteCount === 0 ? 5 : 0);
          const rightPriority =
            (right.awardCount === 0 ? 100 : 0) +
            right.packetIssueCount * 25 +
            (right.remaining < 0 ? 10 : 0) +
            (right.quoteCount === 0 ? 5 : 0);

          if (leftPriority !== rightPriority) {
            return rightPriority - leftPriority;
          }

          return left.item.category.localeCompare(right.item.category);
        }),
    [bidsByBudgetItemId, budgetItems, expensesByBudgetItemId, vendorProcurementById, vendorRecordsById]
  );

  const scopeItemsWithAwardsCount = useMemo(
    () => procurementScopeRows.filter((row) => row.awardCount > 0).length,
    [procurementScopeRows]
  );
  const scopeItemsWithQuotesCount = useMemo(
    () => procurementScopeRows.filter((row) => row.quoteCount > 0).length,
    [procurementScopeRows]
  );
  const readyToPayCommitmentsCount = useMemo(
    () => commitments.filter((commitment) => commitment.procurement?.paymentReady).length,
    [commitments]
  );
  const procurementCoverageWatchlist = useMemo(
    () =>
      procurementScopeRows
        .filter(
          (row) =>
            row.awardCount === 0 ||
            row.packetIssueCount > 0 ||
            row.quoteCount === 0 ||
            row.remaining < 0
        )
        .slice(0, 6),
    [procurementScopeRows]
  );
  const commitmentProcurementWatchlist = useMemo(
    () =>
      commitments
        .filter(
          (commitment) =>
            !commitment.vendorId ||
            !commitment.procurement?.paymentReady ||
            commitment.remainingBalance < 0
        )
        .sort((left, right) => right.remainingBalance - left.remainingBalance)
        .slice(0, 6),
    [commitments]
  );

  const paymentPartyOptions = useMemo(() => {
    const seen = new Map();

    paymentRecords.forEach((payment) => {
      const key = getPaymentPartyKey(payment);
      if (!key || seen.has(key)) {
        return;
      }

      seen.set(key, {
        value: key,
        label: getPaymentPartyLabel(payment),
      });
    });

    return [...seen.values()].sort((left, right) => left.label.localeCompare(right.label));
  }, [paymentRecords]);

  const paymentCostTypeOptions = useMemo(() => {
    if (paymentFilters.costClass) {
      return getPaymentCostTypeOptions(paymentFilters.costClass);
    }

    return PAYMENT_COST_CLASS_OPTIONS.flatMap((option) =>
      getPaymentCostTypeOptions(option.value)
    );
  }, [paymentFilters.costClass]);

  const filteredPayments = useMemo(() => {
    return paymentRecords.filter((payment) => {
      if (paymentQueueFilter) {
        const activeQueue = paymentQueueSummary.find((queue) => queue.value === paymentQueueFilter);
        if (!activeQueue?.ids.has(String(payment._id || ""))) {
          return false;
        }
      }

      const paymentDate = payment.date ? new Date(payment.date) : null;
      const dateFrom = paymentFilters.dateFrom ? new Date(paymentFilters.dateFrom) : null;
      const dateTo = paymentFilters.dateTo ? new Date(paymentFilters.dateTo) : null;
      const paymentScopeId = payment.budgetItemResolved?._id || "project-level";
      const searchHaystack = [
        payment.title,
        payment.description,
        getPaymentPartyLabel(payment),
        payment.budgetItemResolved?.category,
        getPaymentCostClassLabel(payment.costClass),
        getPaymentCostTypeLabel(payment.costType),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (
        paymentFilters.search &&
        !searchHaystack.includes(paymentFilters.search.trim().toLowerCase())
      ) {
        return false;
      }

      if (paymentFilters.status && payment.status !== paymentFilters.status) {
        return false;
      }

      if (paymentFilters.vendor && getPaymentPartyKey(payment) !== paymentFilters.vendor) {
        return false;
      }

      if (paymentFilters.costClass && payment.costClass !== paymentFilters.costClass) {
        return false;
      }

      if (paymentFilters.costType && payment.costType !== paymentFilters.costType) {
        return false;
      }

      if (paymentFilters.scope && paymentScopeId !== paymentFilters.scope) {
        return false;
      }

      if (paymentFilters.fundingSourceId && payment.fundingSourceId !== paymentFilters.fundingSourceId) {
        return false;
      }

      if (paymentFilters.drawRequestId && payment.drawRequestId !== paymentFilters.drawRequestId) {
        return false;
      }

      if (dateFrom && paymentDate && paymentDate < dateFrom) {
        return false;
      }

      if (dateTo && paymentDate) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        if (paymentDate > endDate) {
          return false;
        }
      }

      if ((dateFrom || dateTo) && !paymentDate) {
        return false;
      }

      return true;
    });
  }, [paymentFilters, paymentQueueFilter, paymentQueueSummary, paymentRecords]);

  const filteredPaymentIds = useMemo(
    () => filteredPayments.map((payment) => String(payment._id || "")),
    [filteredPayments]
  );

  const selectedPaymentIdSet = useMemo(
    () => new Set(selectedPaymentIds),
    [selectedPaymentIds]
  );

  const selectedPayments = useMemo(
    () => filteredPayments.filter((payment) => selectedPaymentIdSet.has(String(payment._id || ""))),
    [filteredPayments, selectedPaymentIdSet]
  );

  const selectedPaymentsTotal = useMemo(
    () => selectedPayments.reduce((sum, payment) => sum + toNumber(payment.amount, 0), 0),
    [selectedPayments]
  );

  const selectedPaymentsPendingApproval = useMemo(
    () =>
      selectedPayments.filter((payment) =>
        ["draft", "approved"].includes(payment.status || "paid")
      ).length,
    [selectedPayments]
  );

  const selectedPaymentsMissingReceipt = useMemo(
    () =>
      selectedPayments.filter((payment) => {
        const diagnostics = paymentDiagnosticsById.get(String(payment._id || ""));
        return diagnostics?.missingReceipt;
      }).length,
    [paymentDiagnosticsById, selectedPayments]
  );

  const selectedPaymentsNeedingScope = useMemo(
    () =>
      selectedPayments.filter((payment) => {
        const diagnostics = paymentDiagnosticsById.get(String(payment._id || ""));
        return diagnostics?.needsScope;
      }).length,
    [paymentDiagnosticsById, selectedPayments]
  );

  const filteredPaymentsTotal = useMemo(
    () => filteredPayments.reduce((sum, payment) => sum + toNumber(payment.amount, 0), 0),
    [filteredPayments]
  );

  const filteredPaymentsMissingReceiptCount = useMemo(
    () =>
      filteredPayments.filter((payment) => {
        const diagnostics = paymentDiagnosticsById.get(String(payment._id || ""));
        return diagnostics?.missingReceipt;
      }).length,
    [filteredPayments, paymentDiagnosticsById]
  );

  const filteredPaymentsNeedingReviewCount = useMemo(
    () =>
      filteredPayments.filter((payment) => {
        const diagnostics = paymentDiagnosticsById.get(String(payment._id || ""));
        return Boolean(diagnostics?.flags?.length);
      }).length,
    [filteredPayments, paymentDiagnosticsById]
  );

  const visibleQueueSelections = useMemo(
    () =>
      PAYMENT_QUEUE_OPTIONS.map((queue) => ({
        ...queue,
        ids: filteredPayments
          .filter((payment) => {
            const diagnostics = paymentDiagnosticsById.get(String(payment._id || ""));
            return Boolean(diagnostics?.[PAYMENT_QUEUE_DIAGNOSTIC_KEY_MAP[queue.value]]);
          })
          .map((payment) => String(payment._id || "")),
      })),
    [filteredPayments, paymentDiagnosticsById]
  );

  const nextSelectedReviewPayment = useMemo(() => {
    const priorityQueue = ["missing_receipt", "needs_scope", "needs_approval"];

    for (const queueValue of priorityQueue) {
      const match = selectedPayments.find((payment) => {
        const diagnostics = paymentDiagnosticsById.get(String(payment._id || ""));
        return Boolean(diagnostics?.[PAYMENT_QUEUE_DIAGNOSTIC_KEY_MAP[queueValue]]);
      });

      if (match) {
        return match;
      }
    }

    return selectedPayments[0] || null;
  }, [paymentDiagnosticsById, selectedPayments]);

  const reviewDrawerPayment = useMemo(
    () => paymentRecords.find((payment) => String(payment._id || "") === String(reviewDrawerPaymentId || "")) || null,
    [paymentRecords, reviewDrawerPaymentId]
  );

  const reviewDrawerDiagnostics = useMemo(
    () =>
      reviewDrawerPayment
        ? paymentDiagnosticsById.get(String(reviewDrawerPayment._id || "")) || null
        : null,
    [paymentDiagnosticsById, reviewDrawerPayment]
  );

  const reviewDrawerSequence = useMemo(() => {
    if (!reviewDrawerPayment) {
      return [];
    }

    const selectedIds = new Set(selectedPayments.map((payment) => String(payment._id || "")));
    if (selectedIds.has(String(reviewDrawerPayment._id || ""))) {
      return selectedPayments;
    }

    return [reviewDrawerPayment];
  }, [reviewDrawerPayment, selectedPayments]);

  const reviewDrawerIndex = useMemo(
    () =>
      reviewDrawerSequence.findIndex(
        (payment) => String(payment._id || "") === String(reviewDrawerPayment?._id || "")
      ),
    [reviewDrawerPayment?._id, reviewDrawerSequence]
  );

  const reviewDrawerAvailableReceipts = useMemo(() => {
    if (!reviewDrawerPayment) {
      return [];
    }

    const currentExpenseId = String(reviewDrawerPayment._id || "");

    return projectReceipts.filter((receipt) => {
      const linkedExpenseId = getLinkedReceiptExpenseId(receipt);
      return !linkedExpenseId || linkedExpenseId === currentExpenseId;
    });
  }, [projectReceipts, reviewDrawerPayment]);

  const reviewDrawerSelectedReceiptRecord = useMemo(() => {
    if (!reviewReceiptRecordId) {
      return null;
    }

    return (
      reviewDrawerAvailableReceipts.find(
        (receipt) => String(receipt._id || "") === String(reviewReceiptRecordId)
      ) || null
    );
  }, [reviewDrawerAvailableReceipts, reviewReceiptRecordId]);

  const reviewCostTypeOptions = useMemo(
    () => getPaymentCostTypeOptions(reviewDraft.costClass),
    [reviewDraft.costClass]
  );

  const reviewCapitalDrawOptions = useMemo(() => {
    if (!reviewCapitalDraft.fundingSourceId) {
      return drawRequests;
    }

    return drawRequests.filter(
      (request) => !request.sourceId || request.sourceId === reviewCapitalDraft.fundingSourceId
    );
  }, [drawRequests, reviewCapitalDraft.fundingSourceId]);

  const allFilteredPaymentsSelected =
    filteredPayments.length > 0 && filteredPayments.every((payment) => selectedPaymentIdSet.has(String(payment._id || "")));

  const batchCostTypeOptions = useMemo(() => {
    if (batchCostClass === BATCH_KEEP_VALUE) {
      return [];
    }

    return getPaymentCostTypeOptions(batchCostClass);
  }, [batchCostClass]);

  const batchDrawRequestOptions = useMemo(() => {
    if (!batchFundingSourceId) {
      return drawRequests;
    }

    return drawRequests.filter(
      (request) => !request.sourceId || request.sourceId === batchFundingSourceId
    );
  }, [batchFundingSourceId, drawRequests]);

  const activePaymentFilterChips = useMemo(() => {
    const chips = [];

    if (activePaymentQueue) {
      chips.push({
        key: `queue:${activePaymentQueue.value}`,
        label: activePaymentQueue.label,
      });
    }

    if (paymentFilters.status) {
      chips.push({
        key: `status:${paymentFilters.status}`,
        label:
          EXPENSE_STATUS_OPTIONS.find((option) => option.value === paymentFilters.status)?.label ||
          "Filtered status",
      });
    }

    if (paymentFilters.vendor) {
      chips.push({
        key: `vendor:${paymentFilters.vendor}`,
        label:
          paymentPartyOptions.find((option) => option.value === paymentFilters.vendor)?.label ||
          "Filtered payee",
      });
    }

    if (paymentFilters.scope) {
      chips.push({
        key: `scope:${paymentFilters.scope}`,
        label:
          paymentFilters.scope === "project-level"
            ? "Project-level"
            : budgetItems.find((item) => item._id === paymentFilters.scope)?.category || "Filtered scope",
      });
    }

    if (paymentFilters.costClass) {
      chips.push({
        key: `class:${paymentFilters.costClass}`,
        label: getPaymentCostClassLabel(paymentFilters.costClass),
      });
    }

    if (paymentFilters.costType) {
      chips.push({
        key: `type:${paymentFilters.costType}`,
        label: getPaymentCostTypeLabel(paymentFilters.costType),
      });
    }

    if (paymentFilters.fundingSourceId) {
      chips.push({
        key: `funding:${paymentFilters.fundingSourceId}`,
        label: getFundingSourceDisplayLabel(fundingSources, paymentFilters.fundingSourceId),
      });
    }

    if (paymentFilters.drawRequestId) {
      chips.push({
        key: `draw:${paymentFilters.drawRequestId}`,
        label: getDrawRequestDisplayLabel(drawRequests, paymentFilters.drawRequestId),
      });
    }

    if (paymentFilters.dateFrom || paymentFilters.dateTo) {
      chips.push({
        key: "dates",
        label: `${paymentFilters.dateFrom || "Start"} to ${paymentFilters.dateTo || "Now"}`,
      });
    }

    if (paymentFilters.search) {
      chips.push({
        key: "search",
        label: `Search: ${paymentFilters.search}`,
      });
    }

    return chips;
  }, [activePaymentQueue, budgetItems, drawRequests, fundingSources, paymentFilters, paymentPartyOptions]);

  useEffect(() => {
    const visibleIds = new Set(filteredPaymentIds);

    setSelectedPaymentIds((current) => current.filter((id) => visibleIds.has(id)));
  }, [filteredPaymentIds]);

  useEffect(() => {
    if (batchCostClass === BATCH_KEEP_VALUE) {
      if (batchCostType !== BATCH_KEEP_VALUE) {
        setBatchCostType(BATCH_KEEP_VALUE);
      }
      return;
    }

    if (
      batchCostType !== BATCH_KEEP_VALUE &&
      !batchCostTypeOptions.some((option) => option.value === batchCostType)
    ) {
      setBatchCostType(BATCH_KEEP_VALUE);
    }
  }, [batchCostClass, batchCostType, batchCostTypeOptions]);

  useEffect(() => {
    if (!batchDrawRequestId) {
      return;
    }

    const matchingDrawRequest = drawRequests.find((request) => request.drawId === batchDrawRequestId);
    if (matchingDrawRequest?.sourceId && batchFundingSourceId && matchingDrawRequest.sourceId !== batchFundingSourceId) {
      setBatchDrawRequestId("");
    }
  }, [batchDrawRequestId, batchFundingSourceId, drawRequests]);

  useEffect(() => {
    if (!reviewDrawerPayment) {
      return;
    }

    setReviewReceiptRecordId(getPaymentReceiptRecordId(reviewDrawerPayment));
    setReviewDraft({
      costClass: reviewDrawerPayment.costClass || "general",
      costType:
        reviewDrawerPayment.costType ||
        getPaymentCostTypeOptions(reviewDrawerPayment.costClass || "general")?.[0]?.value ||
        "misc",
      budgetItemId: reviewDrawerPayment.budgetItemResolved?._id || "",
    });
    setReviewCapitalDraft({
      fundingSourceId: reviewDrawerPayment.fundingSourceId || "",
      drawRequestId: reviewDrawerPayment.drawRequestId || "",
    });
  }, [reviewDrawerPayment]);

  useEffect(() => {
    if (!reviewDrawerPaymentId) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setReviewDrawerPaymentId("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reviewDrawerPaymentId]);

  useEffect(() => {
    if (
      reviewDraft.costType &&
      !reviewCostTypeOptions.some((option) => option.value === reviewDraft.costType)
    ) {
      setReviewDraft((current) => ({
        ...current,
        costType: reviewCostTypeOptions[0]?.value || "",
      }));
    }
  }, [reviewCostTypeOptions, reviewDraft.costType]);

  const handleCreateAcquisitionWorkspace = async () => {
    try {
      setIsCreatingWorkspace(true);
      const result = await createPropertyWorkspace(propertyKey, "acquisitions", {
        strategy: selectedStrategy,
      });

      if (result?.property) {
        onPropertyUpdated?.(result.property);
      }

      toast.success("Costs workspace created.");
    } catch (createError) {
      toast.error(createError.message || "Failed to create the acquisitions workspace.");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleOpenExpenseModal = ({
    budgetItemId = "",
    awardId = "",
    mode = "manual",
    initialValues = {},
    editingExpense = null,
  } = {}) => {
    setExpenseModalState({
      isOpen: true,
      budgetItemId,
      awardId,
      mode,
      initialValues,
      editingExpense,
    });
  };

  const handleOpenEditPaymentModal = (payment) => {
    const budgetItemId =
      payment?.budgetItemResolved?._id ||
      (typeof payment?.budgetItem === "object" ? payment?.budgetItem?._id || "" : payment?.budgetItem || "");
    const vendorId =
      typeof payment?.vendor === "object" ? payment?.vendor?._id || "" : payment?.vendor || "";

    handleOpenExpenseModal({
      budgetItemId,
      awardId: payment?.awardId || "",
      mode:
        payment?.entryMethod === "receipt_ai" || payment?.receiptUrl || payment?.receiptRecord
          ? "receipt"
          : "manual",
      editingExpense: payment,
      initialValues: {
        budgetItemId,
        awardId: payment?.awardId || "",
        fundingSourceId: payment?.fundingSourceId || "",
        drawRequestId: payment?.drawRequestId || "",
        vendorId,
        payeeName: payment?.payeeName || "",
        title: payment?.title || "",
        description: payment?.description || "",
        amount: payment?.amount ?? "",
        date: payment?.date ? new Date(payment.date).toISOString().split("T")[0] : "",
        notes: payment?.notes || "",
        entryMethod: payment?.entryMethod || "",
        status: payment?.status || "",
        paymentMethod: payment?.paymentMethod || "",
        recurringCategory: payment?.recurringCategory || "",
        costClass: payment?.costClass || "",
        costType: payment?.costType || "",
      },
    });
  };

  const handleOpenPaymentFromReceipt = (receipt) => {
    const budgetItemId =
      typeof receipt?.budgetItem === "object" ? receipt?.budgetItem?._id || "" : receipt?.budgetItem || "";
    const vendorId =
      typeof receipt?.vendor === "object" ? receipt?.vendor?._id || "" : receipt?.vendor || "";
    const receiptDate = receipt?.receiptDate
      ? new Date(receipt.receiptDate).toISOString().split("T")[0]
      : "";

    handleOpenExpenseModal({
      budgetItemId,
      mode: "manual",
      initialValues: {
        receiptRecordId: receipt?._id || "",
        budgetItemId,
        vendorId,
        payeeName: receipt?.payeeName || "",
        title: receipt?.title || "",
        description: receipt?.description || "",
        amount:
          receipt?.amount !== null && receipt?.amount !== undefined ? receipt.amount : "",
        date: receiptDate,
        notes: receipt?.notes || "",
      },
    });
  };

  const handleOpenTaskModal = (budgetItemId = "") => {
    setTaskModalState({
      isOpen: true,
      budgetItemId,
    });
  };

  const handleExpenseStatusChange = async (expenseId, status) => {
    try {
      await updateExpense(expenseId, { status });
      await loadCostsWorkspace();
      toast.success(`Payment moved to ${getExpenseStatusLabel(status).toLowerCase()}.`);
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update payment status.");
    }
  };

  const handleOpenReviewDrawer = (paymentId) => {
    setReviewDrawerPaymentId(String(paymentId || ""));
  };

  const handleAdvanceReviewDrawer = (direction = 1) => {
    if (reviewDrawerIndex < 0) {
      return;
    }

    const nextPayment = reviewDrawerSequence[reviewDrawerIndex + direction];
    if (!nextPayment?._id) {
      return;
    }

    setReviewDrawerPaymentId(String(nextPayment._id));
  };

  const handleReviewDraftChange = (field, value) => {
    setReviewDraft((current) => {
      if (field === "costClass") {
        const nextOptions = getPaymentCostTypeOptions(value);
        return {
          ...current,
          costClass: value,
          costType: nextOptions.some((option) => option.value === current.costType)
            ? current.costType
            : nextOptions[0]?.value || "",
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  };

  const handleReviewCapitalDraftChange = (field, value) => {
    setReviewCapitalDraft((current) => {
      if (field === "fundingSourceId") {
        const nextDraw =
          current.drawRequestId &&
          drawRequests.find((request) => request.drawId === current.drawRequestId);

        return {
          fundingSourceId: value,
          drawRequestId:
            nextDraw?.sourceId && value && nextDraw.sourceId !== value ? "" : current.drawRequestId,
        };
      }

      if (field === "drawRequestId") {
        const nextDrawRequest =
          drawRequests.find((request) => request.drawId === value) || null;

        return {
          fundingSourceId: nextDrawRequest?.sourceId || current.fundingSourceId,
          drawRequestId: value,
        };
      }

      return current;
    });
  };

  const handleTogglePaymentSelection = (paymentId) => {
    const normalizedId = String(paymentId || "");

    setSelectedPaymentIds((current) =>
      current.includes(normalizedId)
        ? current.filter((entry) => entry !== normalizedId)
        : [...current, normalizedId]
    );
  };

  const handleToggleAllFilteredPayments = () => {
    if (allFilteredPaymentsSelected) {
      setSelectedPaymentIds([]);
      return;
    }

    setSelectedPaymentIds(filteredPaymentIds);
  };

  const handleLoadVisibleQueueSelection = (queueValue) => {
    const queueSelection = visibleQueueSelections.find((queue) => queue.value === queueValue);
    const nextIds = queueSelection?.ids || [];

    if (!nextIds.length) {
      toast.error("No visible payments match that review queue right now.");
      return;
    }

    setSelectedPaymentIds(nextIds);
  };

  const handleOpenNextSelectedReview = () => {
    if (!nextSelectedReviewPayment) {
      toast.error("Select payments first.");
      return;
    }

    setExpandedPaymentId(nextSelectedReviewPayment._id || "");
    handleOpenReviewDrawer(nextSelectedReviewPayment._id || "");
  };

  const handleBatchStatusUpdate = async ({ status, successMessage, eligibilityCheck, emptyMessage }) => {
    const eligiblePayments = selectedPayments.filter(eligibilityCheck);

    if (!eligiblePayments.length) {
      toast.error(emptyMessage);
      return;
    }

    try {
      setIsApplyingBatchActions(true);
      await Promise.all(
        eligiblePayments.map((payment) => updateExpense(payment._id, { status }))
      );
      await loadCostsWorkspace();
      toast.success(successMessage);
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update selected payments.");
    } finally {
      setIsApplyingBatchActions(false);
    }
  };

  const handleApplyBatchCapitalLinks = async () => {
    if (!selectedPayments.length) {
      toast.error("Select payments first.");
      return;
    }

    try {
      setIsApplyingBatchActions(true);
      await Promise.all(
        selectedPayments.map((payment) =>
          updateExpense(payment._id, {
            fundingSourceId: batchFundingSourceId,
            drawRequestId: batchDrawRequestId,
          })
        )
      );
      await loadCostsWorkspace();
      setBatchFundingSourceId("");
      setBatchDrawRequestId("");
      toast.success("Capital links updated for the selected payments.");
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update capital links.");
    } finally {
      setIsApplyingBatchActions(false);
    }
  };

  const handleApplyBatchClassification = async () => {
    if (!selectedPayments.length) {
      toast.error("Select payments first.");
      return;
    }

    const shouldUpdateCostClass = batchCostClass !== BATCH_KEEP_VALUE;
    const shouldUpdateCostType = batchCostType !== BATCH_KEEP_VALUE;
    const shouldUpdateScope = batchScopeId !== BATCH_KEEP_VALUE;

    if (!shouldUpdateCostClass && !shouldUpdateCostType && !shouldUpdateScope) {
      toast.error("Choose a class, type, or scope to apply.");
      return;
    }

    try {
      setIsApplyingBatchActions(true);
      await Promise.all(
        selectedPayments.map((payment) => {
          const payload = {};

          if (shouldUpdateCostClass) {
            payload.costClass = batchCostClass;
          }

          if (shouldUpdateCostType) {
            payload.costType = batchCostType;
          }

          if (shouldUpdateScope) {
            payload.budgetItemId =
              batchScopeId === BATCH_PROJECT_LEVEL_VALUE ? "" : batchScopeId;
          }

          return updateExpense(payment._id, payload);
        })
      );
      await loadCostsWorkspace();
      setBatchCostClass(BATCH_KEEP_VALUE);
      setBatchCostType(BATCH_KEEP_VALUE);
      setBatchScopeId(BATCH_KEEP_VALUE);
      toast.success("Classification updated for the selected payments.");
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update the selected payment details.");
    } finally {
      setIsApplyingBatchActions(false);
    }
  };

  const handleSaveReviewReceipt = async () => {
    if (!reviewDrawerPayment?._id) {
      return;
    }

    try {
      setIsSavingReviewDrawer(true);
      await updateExpense(reviewDrawerPayment._id, {
        projectReceiptId: reviewReceiptRecordId || "",
      });
      await loadCostsWorkspace();
      toast.success(reviewReceiptRecordId ? "Receipt link updated." : "Receipt link cleared.");
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update the receipt link.");
    } finally {
      setIsSavingReviewDrawer(false);
    }
  };

  const handleSaveReviewCleanup = async () => {
    if (!reviewDrawerPayment?._id) {
      return;
    }

    try {
      setIsSavingReviewDrawer(true);
      await updateExpense(reviewDrawerPayment._id, {
        costClass: reviewDraft.costClass,
        costType: reviewDraft.costType,
        budgetItemId: reviewDraft.budgetItemId || "",
      });
      await loadCostsWorkspace();
      toast.success("Quick cleanup saved.");
    } catch (updateError) {
      toast.error(updateError.message || "Failed to save the review changes.");
    } finally {
      setIsSavingReviewDrawer(false);
    }
  };

  const handleReviewStatusChange = async (status) => {
    if (!reviewDrawerPayment?._id) {
      return;
    }

    try {
      setIsSavingReviewDrawer(true);
      await updateExpense(reviewDrawerPayment._id, { status });
      await loadCostsWorkspace();
      toast.success(`Payment moved to ${getExpenseStatusLabel(status).toLowerCase()}.`);
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update the payment status.");
    } finally {
      setIsSavingReviewDrawer(false);
    }
  };

  const handleSaveReviewCapitalLinks = async () => {
    if (!reviewDrawerPayment?._id) {
      return;
    }

    try {
      setIsSavingReviewDrawer(true);
      await updateExpense(reviewDrawerPayment._id, {
        fundingSourceId: reviewCapitalDraft.fundingSourceId || "",
        drawRequestId: reviewCapitalDraft.drawRequestId || "",
      });
      await loadCostsWorkspace();
      toast.success("Capital links updated.");
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update capital links.");
    } finally {
      setIsSavingReviewDrawer(false);
    }
  };

  const handleSaveReviewPass = async () => {
    if (!reviewDrawerPayment?._id) {
      return;
    }

    try {
      setIsSavingReviewDrawer(true);
      await updateExpense(reviewDrawerPayment._id, {
        projectReceiptId: reviewReceiptRecordId || "",
        costClass: reviewDraft.costClass,
        costType: reviewDraft.costType,
        budgetItemId: reviewDraft.budgetItemId || "",
        fundingSourceId: reviewCapitalDraft.fundingSourceId || "",
        drawRequestId: reviewCapitalDraft.drawRequestId || "",
      });
      await loadCostsWorkspace();
      toast.success("Review pass saved.");
    } catch (updateError) {
      toast.error(updateError.message || "Failed to save the review pass.");
    } finally {
      setIsSavingReviewDrawer(false);
    }
  };

  const handleSaveAward = async (payload) => {
    if (!awardModalState.budgetItem?._id) {
      return;
    }

    if (awardModalState.award?.awardId) {
      await updateBudgetAward(
        awardModalState.budgetItem._id,
        awardModalState.award.awardId,
        payload
      );
    } else {
      await addBudgetAward(awardModalState.budgetItem._id, payload);
    }

    await loadCostsWorkspace();
  };

  const handleDeleteAward = async (budgetItem, award) => {
    if (!window.confirm("Remove this selected vendor from the scope item?")) {
      return;
    }

    await deleteBudgetAward(budgetItem._id, award.awardId);
    await loadCostsWorkspace();
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
        Loading costs workspace...
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-card px-6 py-10 text-center text-clay-700">
        {error}
      </div>
    );
  }

  const sharedModals = (
    <>
      <AddExpenseModal
        isOpen={expenseModalState.isOpen}
        onClose={() =>
          setExpenseModalState({
            isOpen: false,
            budgetItemId: "",
            awardId: "",
            mode: "manual",
            initialValues: {},
            editingExpense: null,
          })
        }
        investmentId={investment._id}
        defaultBudgetItemId={expenseModalState.budgetItemId}
        defaultAwardId={expenseModalState.awardId}
        initialMode={expenseModalState.mode}
        onSuccess={loadCostsWorkspace}
        budgetItems={budgetItems}
        vendors={vendors}
        projectReceipts={projectReceipts}
        fundingSources={fundingSources}
        drawRequests={drawRequests}
        initialValues={expenseModalState.initialValues}
        editingExpense={expenseModalState.editingExpense}
      />
      <AddBudgetItemModal
        isOpen={showAddBudgetModal}
        onClose={() => setShowAddBudgetModal(false)}
        investmentId={investment._id}
        onSuccess={loadCostsWorkspace}
      />
      <AIRehabBuilderModal
        isOpen={showAIBuilderModal}
        onClose={() => setShowAIBuilderModal(false)}
        investmentId={investment._id}
        onSuccess={loadCostsWorkspace}
      />
      <AddTaskModal
        isOpen={taskModalState.isOpen}
        onClose={() => setTaskModalState({ isOpen: false, budgetItemId: "" })}
        onSuccess={loadCostsWorkspace}
        investmentId={investment._id}
        vendors={vendors}
        budgetItems={budgetItems}
        defaultBudgetItemId={taskModalState.budgetItemId}
      />
      <BudgetAwardModal
        isOpen={awardModalState.isOpen}
        onClose={() => setAwardModalState({ isOpen: false, budgetItem: null, award: null })}
        onSave={handleSaveAward}
        vendors={vendors}
        budgetItem={awardModalState.budgetItem}
        initialAward={awardModalState.award}
      />
      <PaymentReviewDrawer
        isOpen={Boolean(reviewDrawerPaymentId && reviewDrawerPayment)}
        payment={reviewDrawerPayment}
        diagnostics={reviewDrawerDiagnostics}
        reviewReceiptRecordId={reviewReceiptRecordId}
        onReviewReceiptChange={setReviewReceiptRecordId}
        availableReceipts={reviewDrawerAvailableReceipts}
        selectedReceiptRecord={reviewDrawerSelectedReceiptRecord}
        reviewDraft={reviewDraft}
        onReviewDraftChange={handleReviewDraftChange}
        reviewCostTypeOptions={reviewCostTypeOptions}
        reviewCapitalDraft={reviewCapitalDraft}
        onReviewCapitalDraftChange={handleReviewCapitalDraftChange}
        reviewCapitalDrawOptions={reviewCapitalDrawOptions}
        onClose={() => setReviewDrawerPaymentId("")}
        onSaveReviewReceipt={handleSaveReviewReceipt}
        onSaveReviewCleanup={handleSaveReviewCleanup}
        onSaveReviewCapitalLinks={handleSaveReviewCapitalLinks}
        onSaveReviewPass={handleSaveReviewPass}
        onStatusChange={handleReviewStatusChange}
        onOpenFullEdit={() => {
          if (reviewDrawerPayment) {
            setReviewDrawerPaymentId("");
            handleOpenEditPaymentModal(reviewDrawerPayment);
          }
        }}
        onOpenPrevious={() => handleAdvanceReviewDrawer(-1)}
        onOpenNext={() => handleAdvanceReviewDrawer(1)}
        hasPrevious={reviewDrawerIndex > 0}
        hasNext={reviewDrawerIndex >= 0 && reviewDrawerIndex < reviewDrawerSequence.length - 1}
        isSaving={isSavingReviewDrawer}
        fundingSources={fundingSources}
        drawRequests={drawRequests}
        budgetItems={budgetItems}
      />
    </>
  );

  const isCostPlanView =
    activeContentKey === "costs-budget" || activeContentKey === "costs-cost-plan";
  const isPaymentsView =
    activeContentKey === "costs-expenses" || activeContentKey === "costs-payments";
  const handlePaymentFilterChange = (event) => {
    const { name, value } = event.target;
    setPaymentFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === "costClass" ? { costType: "" } : {}),
    }));
  };
  const resetPaymentFilters = () => {
    setPaymentFilters(PAYMENT_FILTERS_INITIAL_STATE);
    setPaymentQueueFilter("");
  };

  if (isCostPlanView) {
    return (
      <>
        {sharedModals}
        <div className="space-y-6">
          {!embedded ? (
            <section className="surface-panel px-6 py-7 sm:px-7">
              <span className="eyebrow">Budget / Cost Plan</span>
              <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
                Keep the cost plan editable and visible at every step
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
                Cost Plan is the live budget-control view for this property. Scope lines, vendor
                commitments, and paid amounts all roll into the same working page.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => setShowAddBudgetModal(true)} className="primary-action">
                  Add scope item
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenExpenseModal()}
                  className="secondary-action"
                >
                  Add payment
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenExpenseModal({ mode: "receipt" })}
                  className="secondary-action"
                >
                  Scan receipt with AI
                </button>
                <button type="button" onClick={() => setShowAIBuilderModal(true)} className="ghost-action">
                  Generate AI cost plan
                </button>
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              icon={ClipboardDocumentListIcon}
              label="Expected budget"
              value={formatCurrency(metrics.totalBudget)}
              hint="Current editable cost plan."
            />
            <MetricTile
              icon={ArrowTrendingUpIcon}
              label="Committed"
              value={formatCurrency(metrics.totalCommitted)}
              hint="Awarded vendor and supplier amounts."
            />
            <MetricTile
              icon={BanknotesIcon}
              label="Actual spent"
              value={formatCurrency(metrics.totalSpent)}
              hint="Payments already recorded against the project."
            />
            <MetricTile
              icon={ReceiptPercentIcon}
              label="Remaining budget"
              value={formatCurrency(metrics.remainingBudget)}
              hint={`${budgetItems.length} scope item${budgetItems.length === 1 ? "" : "s"} in the plan.`}
              tone={metrics.remainingBudget >= 0 ? "text-ink-900" : "text-clay-700"}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_340px]">
            <section className="section-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="eyebrow">Category pressure</span>
                  <h4 className="mt-4 text-2xl font-semibold text-ink-900">
                    See where the budget is tightening first
                  </h4>
                </div>
                <div className="workspace-counter-pill">
                  {categorySpendSummary.length} categories tracked
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {categorySpendSummary.length > 0 ? (
                  categorySpendSummary.slice(0, 4).map((category) => (
                    <SpendBar
                      key={category.label}
                      label={category.label}
                      expected={category.expected}
                      committed={category.committed}
                      actual={category.actual}
                    />
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-ink-200 bg-ink-50/40 p-5 text-sm leading-6 text-ink-500 xl:col-span-2">
                    Category pressure will appear here once scope items and payments are in motion.
                  </div>
                )}
              </div>
            </section>

            <div className="space-y-5">
              <section className="section-card p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                  At risk scope
                </p>
                <div className="mt-5 space-y-3">
                  {overBudgetScopeItems.length > 0 ? (
                    overBudgetScopeItems.map((row) => (
                      <div
                        key={row.item._id}
                        className="rounded-[18px] border border-clay-200 bg-clay-50/70 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-ink-900">{row.item.category}</p>
                          <span className="text-sm font-semibold text-clay-700">
                            {formatCurrency(Math.min(row.variance, row.commitmentGap))}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-ink-500">
                          {row.overBudget
                            ? `${formatCurrency(Math.abs(row.variance))} over paid plan`
                            : `${formatCurrency(Math.abs(row.commitmentGap))} over committed plan`}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                      No scope items are over budget or over committed right now.
                    </div>
                  )}
                </div>
              </section>

              <section className="section-card p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Project-level payments
                </p>
                <div className="mt-5 space-y-3">
                  {projectLevelPayments.length > 0 ? (
                    projectLevelPayments.slice(0, 4).map((payment) => (
                      <div
                        key={payment._id}
                        className="rounded-[18px] border border-ink-100 bg-ink-50/50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink-900">{payment.title}</p>
                            <p className="mt-1 text-sm text-ink-500">
                              {getPaymentCostClassLabel(payment.costClass)} • {formatDate(payment.date)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-ink-900">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                      Lender fees, closing costs, and other project-level payments will appear here.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Scope cost plan</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">Control table and scope detail</h4>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
              Each scope item is the working hub for this project. Budget, committed vendors,
              actual spend, receipts, related bids, and task progress all roll up here.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[20px] border border-ink-100 bg-white/90 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Scope items with tasks
                </p>
                <p className="mt-2 text-lg font-semibold text-ink-900">
                  {budgetItems.filter((item) => (tasksByBudgetItemId.get(item._id) || []).length > 0).length}
                </p>
              </div>
              <div className="rounded-[20px] border border-ink-100 bg-white/90 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Scope items with receipts
                </p>
                <p className="mt-2 text-lg font-semibold text-ink-900">
                  {budgetItems.filter((item) => (receiptsByBudgetItemId.get(item._id) || []).length > 0).length}
                </p>
              </div>
              <div className="rounded-[20px] border border-ink-100 bg-white/90 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Scope items with quotes
                </p>
                <p className="mt-2 text-lg font-semibold text-ink-900">
                  {budgetItems.filter((item) => (bidsByBudgetItemId.get(item._id) || []).length > 0).length}
                </p>
              </div>
              <div className="rounded-[20px] border border-ink-100 bg-white/90 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Unlinked receipts
                </p>
                <p className="mt-2 text-lg font-semibold text-ink-900">
                  {receiptBacklog.length}
                </p>
              </div>
            </div>

            <div className="mt-8 overflow-x-auto rounded-[24px] border border-ink-100 bg-white/92">
              {costPlanRows.length > 0 ? (
                <table className="min-w-[1080px] w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                      <th className="border-b border-ink-100 px-4 py-3">Scope</th>
                      <th className="border-b border-ink-100 px-4 py-3">Original</th>
                      <th className="border-b border-ink-100 px-4 py-3">Current</th>
                      <th className="border-b border-ink-100 px-4 py-3">Committed</th>
                      <th className="border-b border-ink-100 px-4 py-3">Paid</th>
                      <th className="border-b border-ink-100 px-4 py-3">Variance</th>
                      <th className="border-b border-ink-100 px-4 py-3">Vendors</th>
                      <th className="border-b border-ink-100 px-4 py-3">Tasks</th>
                      <th className="border-b border-ink-100 px-4 py-3">Files</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costPlanRows.map((row) => (
                      <tr key={row.item._id} className="bg-white/80">
                        <td className="border-b border-ink-100 px-4 py-4 align-top">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-ink-900">{row.item.category}</p>
                            {row.overBudget || row.overCommitted ? (
                              <span className="rounded-full bg-clay-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-clay-700">
                                At risk
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-ink-500">
                            {row.item.description || "No scope description saved yet."}
                          </p>
                        </td>
                        <td className="border-b border-ink-100 px-4 py-4 align-top text-ink-600">
                          {formatCurrency(row.originalBudget)}
                        </td>
                        <td className="border-b border-ink-100 px-4 py-4 align-top font-medium text-ink-900">
                          {formatCurrency(row.currentBudget)}
                        </td>
                        <td className="border-b border-ink-100 px-4 py-4 align-top text-ink-600">
                          {formatCurrency(row.committed)}
                        </td>
                        <td className="border-b border-ink-100 px-4 py-4 align-top text-ink-600">
                          {formatCurrency(row.paid)}
                        </td>
                        <td className="border-b border-ink-100 px-4 py-4 align-top">
                          <span
                            className={`font-semibold ${
                              row.variance < 0 ? "text-clay-700" : "text-verdigris-700"
                            }`}
                          >
                            {formatCurrency(row.variance)}
                          </span>
                        </td>
                        <td className="border-b border-ink-100 px-4 py-4 align-top text-ink-600">
                          {row.vendorCount}
                        </td>
                        <td className="border-b border-ink-100 px-4 py-4 align-top text-ink-600">
                          {row.taskCount}
                        </td>
                        <td className="border-b border-ink-100 px-4 py-4 align-top text-ink-600">
                          {row.fileCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-sm leading-6 text-ink-500">
                  Add the first scope item and the control table will populate here.
                </div>
              )}
            </div>

            <div className="mt-8 space-y-4">
              {budgetItems.length > 0 ? (
                budgetItems.map((item) => (
                  <BudgetLineItem
                    key={item._id}
                    item={item}
                    expenses={expensesByBudgetItemId.get(item._id) || []}
                    tasks={tasksByBudgetItemId.get(item._id) || []}
                    receipts={receiptsByBudgetItemId.get(item._id) || []}
                    relatedBids={bidsByBudgetItemId.get(item._id) || []}
                    fundingSources={fundingSources}
                    drawRequests={drawRequests}
                    onAddExpense={() => handleOpenExpenseModal({ budgetItemId: item._id })}
                    onScanReceipt={() => handleOpenExpenseModal({ budgetItemId: item._id, mode: "receipt" })}
                    onAddTask={() => handleOpenTaskModal(item._id)}
                    onAddAward={() =>
                      setAwardModalState({ isOpen: true, budgetItem: item, award: null })
                    }
                    onEditAward={(award) =>
                      setAwardModalState({ isOpen: true, budgetItem: item, award })
                    }
                    onDeleteAward={(award) => handleDeleteAward(item, award)}
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                  No scope items yet. Add one manually or generate a first-pass budget with AI.
                </div>
              )}
            </div>
          </section>
        </div>
      </>
    );
  }

  if (isPaymentsView) {
    return (
      <>
        {sharedModals}
        <div className="space-y-6">
          {!embedded ? (
            <section className="surface-panel px-6 py-7 sm:px-7">
              <span className="eyebrow">Budget / Payments</span>
              <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
                Keep every project payment in one professional ledger
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
                Record construction payments, soft costs, financing, closing, and holding costs in
                one table-first workplace with scope, capital, and receipt links.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenExpenseModal()}
                  className="primary-action"
                >
                  Add payment
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenExpenseModal({ mode: "receipt" })}
                  className="secondary-action"
                >
                  Scan receipt with AI
                </button>
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              icon={BanknotesIcon}
              label="Total payments"
              value={formatCurrency(metrics.totalSpent)}
              hint={`${paymentRecords.length} payment record${paymentRecords.length === 1 ? "" : "s"} logged.`}
            />
            <MetricTile
              icon={ClipboardDocumentListIcon}
              label="Approval queue"
              value={approvalQueue.length}
              hint={
                approvalQueue.length > 0
                  ? `${formatCurrency(approvalQueueAmount)} still waiting to clear.`
                  : "No payments are waiting on approval."
              }
            />
            <MetricTile
              icon={ReceiptPercentIcon}
              label="Receipt backlog"
              value={receiptBacklog.length}
              hint="Receipts saved but not tied to a final payment yet."
            />
            <MetricTile
              icon={ArrowTrendingUpIcon}
              label="Scope review"
              value={unscopedConstructionPayments}
              hint="Construction payments without a scope link still need review."
            />
          </div>

          <section className="section-card p-6 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="eyebrow">Operator queues</span>
                <h4 className="mt-4 text-2xl font-semibold text-ink-900">
                  Start with what actually needs action
                </h4>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
                  These queues turn the payment ledger into a daily workplace instead of a passive
                  list. Pick one to focus the table on approvals, missing support, scope cleanup,
                  or draw-linked cash.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {activePaymentQueue ? (
                  <div className="workspace-counter-pill">
                    {activePaymentQueue.label} active
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPaymentQueueFilter("")}
                  className="ghost-action"
                  disabled={!paymentQueueFilter}
                >
                  Clear queue
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {paymentQueueSummary.map((queue) => {
                const isActive = paymentQueueFilter === queue.value;

                return (
                  <button
                    key={queue.value}
                    type="button"
                    onClick={() =>
                      setPaymentQueueFilter((current) =>
                        current === queue.value ? "" : queue.value
                      )
                    }
                    className={`rounded-[20px] border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-verdigris-300 bg-verdigris-50/70 shadow-[0_16px_30px_rgba(26,89,78,0.08)]"
                        : "border-ink-100 bg-white/90 hover:border-ink-200 hover:bg-ink-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{queue.label}</p>
                        <p className="mt-2 text-sm leading-6 text-ink-500">{queue.description}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isActive ? "bg-white text-verdigris-700" : "bg-mist-50 text-ink-700"
                        }`}
                      >
                        {queue.count}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-ink-900">
                      {formatCurrency(queue.amount)}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_340px]">
            <section className="section-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="eyebrow">Spend mix</span>
                  <h4 className="mt-4 text-2xl font-semibold text-ink-900">
                    See where project cash is actually going
                  </h4>
                </div>
                <div className="workspace-counter-pill">{paymentClassSummary.length} active classes</div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {paymentClassSummary.length > 0 ? (
                  paymentClassSummary.map((item) => (
                    <div
                      key={item.value}
                      className="rounded-[20px] border border-ink-100 bg-white/90 px-4 py-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        {item.label}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="mt-1 text-sm text-ink-500">
                        {item.count} payment{item.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-ink-200 bg-ink-50/40 px-4 py-5 text-sm text-ink-500 md:col-span-2 xl:col-span-4">
                    Payment classes will summarize here once project payments are recorded.
                  </div>
                )}
              </div>
            </section>

            <section className="section-card p-6">
              <span className="eyebrow">Capital links</span>
              <div className="mt-5 space-y-3">
                <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Funding linked
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink-900">
                    {formatCurrency(
                      paymentRecords.reduce(
                        (sum, payment) =>
                          sum + (payment.fundingSourceId ? toNumber(payment.amount, 0) : 0),
                        0
                      )
                    )}
                  </p>
                </div>
                <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Draw linked
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink-900">
                    {formatCurrency(
                      paymentRecords.reduce(
                        (sum, payment) =>
                          sum + (payment.drawRequestId ? toNumber(payment.amount, 0) : 0),
                        0
                      )
                    )}
                  </p>
                </div>
                <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Recurring carry
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink-900">
                    {formatCurrency(
                      [...recurringCarryActuals.values()].reduce(
                        (sum, item) => sum + toNumber(item.amount, 0),
                        0
                      )
                    )}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Payments workspace</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">
              Filter the ledger the way operators actually work
            </h4>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label className="space-y-2 xl:col-span-2">
                <span className="text-sm font-medium text-ink-700">Search</span>
                <input
                  name="search"
                  value={paymentFilters.search}
                  onChange={handlePaymentFilterChange}
                  className="auth-input"
                  placeholder="Search title, payee, scope, class, or type"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Status</span>
                <select
                  name="status"
                  value={paymentFilters.status}
                  onChange={handlePaymentFilterChange}
                  className="auth-input appearance-none"
                >
                  <option value="">All statuses</option>
                  {EXPENSE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Payee / Vendor</span>
                <select
                  name="vendor"
                  value={paymentFilters.vendor}
                  onChange={handlePaymentFilterChange}
                  className="auth-input appearance-none"
                >
                  <option value="">All payees</option>
                  {paymentPartyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Scope</span>
                <select
                  name="scope"
                  value={paymentFilters.scope}
                  onChange={handlePaymentFilterChange}
                  className="auth-input appearance-none"
                >
                  <option value="">All scope</option>
                  <option value="project-level">Project-level</option>
                  {budgetItems.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Cost class</span>
                <select
                  name="costClass"
                  value={paymentFilters.costClass}
                  onChange={handlePaymentFilterChange}
                  className="auth-input appearance-none"
                >
                  <option value="">All classes</option>
                  {PAYMENT_COST_CLASS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Cost type</span>
                <select
                  name="costType"
                  value={paymentFilters.costType}
                  onChange={handlePaymentFilterChange}
                  className="auth-input appearance-none"
                >
                  <option value="">All types</option>
                  {paymentCostTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Funding source</span>
                <select
                  name="fundingSourceId"
                  value={paymentFilters.fundingSourceId}
                  onChange={handlePaymentFilterChange}
                  className="auth-input appearance-none"
                >
                  <option value="">All sources</option>
                  {fundingSources.map((source, index) => (
                    <option key={source.sourceId || `source-${index}`} value={source.sourceId || ""}>
                      {getFundingSourceLabel(source, index)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Draw</span>
                <select
                  name="drawRequestId"
                  value={paymentFilters.drawRequestId}
                  onChange={handlePaymentFilterChange}
                  className="auth-input appearance-none"
                >
                  <option value="">All draws</option>
                  {drawRequests.map((draw, index) => (
                    <option key={draw.drawId || `draw-${index}`} value={draw.drawId || ""}>
                      {getDrawRequestLabel(draw, index)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">From</span>
                <input
                  type="date"
                  name="dateFrom"
                  value={paymentFilters.dateFrom}
                  onChange={handlePaymentFilterChange}
                  className="auth-input"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">To</span>
                <input
                  type="date"
                  name="dateTo"
                  value={paymentFilters.dateTo}
                  onChange={handlePaymentFilterChange}
                  className="auth-input"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="workspace-counter-pill">
                Showing {filteredPayments.length} of {paymentRecords.length}
                {activePaymentQueue ? ` in ${activePaymentQueue.label.toLowerCase()}` : ""}
              </div>
              <button type="button" onClick={resetPaymentFilters} className="ghost-action">
                Reset filters
              </button>
            </div>

            {activePaymentFilterChips.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {activePaymentFilterChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="rounded-full border border-ink-100 bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-700"
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="section-card p-6 sm:p-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="eyebrow">Batch actions</span>
                <h4 className="mt-4 text-2xl font-semibold text-ink-900">
                  Move selected payments without leaving the ledger
                </h4>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
                  Select payments in the table to approve them, push them to paid, or map the run
                  to the right funding source and draw request in one pass.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="workspace-counter-pill">
                  {selectedPayments.length} selected
                </div>
                <button
                  type="button"
                  onClick={handleToggleAllFilteredPayments}
                  className="ghost-action"
                  disabled={!filteredPayments.length || isApplyingBatchActions}
                >
                  {allFilteredPaymentsSelected ? "Clear shown" : "Select all shown"}
                </button>
              </div>
            </div>

            {selectedPayments.length > 0 ? (
              <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_380px]">
                <div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[20px] border border-ink-100 bg-white/90 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Selected total
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">
                        {formatCurrency(selectedPaymentsTotal)}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-ink-100 bg-white/90 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Pending approval
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">
                        {selectedPaymentsPendingApproval}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-ink-100 bg-white/90 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Missing receipt
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">
                        {selectedPaymentsMissingReceipt}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-ink-100 bg-white/90 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Needs scope
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">
                        {selectedPaymentsNeedingScope}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleBatchStatusUpdate({
                          status: "approved",
                          successMessage: "Selected draft payments moved to approved.",
                          eligibilityCheck: (payment) => (payment.status || "paid") === "draft",
                          emptyMessage: "Select at least one draft payment to approve.",
                        })
                      }
                      className="secondary-action"
                      disabled={isApplyingBatchActions}
                    >
                      {isApplyingBatchActions ? "Working..." : "Approve selected"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleBatchStatusUpdate({
                          status: "paid",
                          successMessage: "Selected payments marked as paid.",
                          eligibilityCheck: (payment) =>
                            !["paid", "reimbursed"].includes(payment.status || "paid"),
                          emptyMessage: "Select payments that still need to be marked paid.",
                        })
                      }
                      className="primary-action"
                      disabled={isApplyingBatchActions}
                    >
                      {isApplyingBatchActions ? "Working..." : "Mark selected paid"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentIds([])}
                      className="ghost-action"
                      disabled={isApplyingBatchActions}
                    >
                      Clear selection
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-ink-100 bg-white/92 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Review run
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      Load the visible queue that needs attention, then step through the next
                      flagged payment without hunting through the ledger.
                    </p>

                    <div className="mt-5 grid gap-2">
                      {visibleQueueSelections
                        .filter((queue) =>
                          ["needs_approval", "missing_receipt", "needs_scope"].includes(queue.value)
                        )
                        .map((queue) => (
                          <button
                            key={queue.value}
                            type="button"
                            onClick={() => handleLoadVisibleQueueSelection(queue.value)}
                            className="flex items-center justify-between rounded-[18px] border border-ink-100 bg-ink-50/60 px-4 py-3 text-left transition hover:border-ink-200 hover:bg-ink-50"
                            disabled={!queue.ids.length || isApplyingBatchActions}
                          >
                            <span className="text-sm font-medium text-ink-800">
                              Load {queue.label.toLowerCase()}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700">
                              {queue.ids.length}
                            </span>
                          </button>
                        ))}
                    </div>

                    <div className="mt-5 rounded-[18px] border border-ink-100 bg-ink-50/50 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Next review item
                      </p>
                      {nextSelectedReviewPayment ? (
                        <>
                          <p className="mt-2 text-sm font-semibold text-ink-900">
                            {nextSelectedReviewPayment.title || getPaymentPartyLabel(nextSelectedReviewPayment)}
                          </p>
                          <p className="mt-1 text-sm text-ink-500">
                            {getPaymentVendorLabel(nextSelectedReviewPayment)} •{" "}
                            {formatCurrency(nextSelectedReviewPayment.amount)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(paymentDiagnosticsById.get(String(nextSelectedReviewPayment._id || ""))?.flags || [])
                              .filter((flag) =>
                                ["needs_approval", "missing_receipt", "needs_scope"].includes(flag.key)
                              )
                              .map((flag) => (
                                <span
                                  key={flag.key}
                                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${flag.classes}`}
                                >
                                  {flag.label}
                                </span>
                              ))}
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-ink-500">
                          Select a payment run to jump straight into the next issue that needs review.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenNextSelectedReview}
                      className="mt-4 secondary-action w-full justify-center"
                      disabled={!nextSelectedReviewPayment || isApplyingBatchActions}
                    >
                      Open next review item
                    </button>
                  </div>

                  <div className="rounded-[24px] border border-ink-100 bg-ink-50/50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Classification
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      Reclassify a run of payments without opening each row. Keep existing values
                      where they are already right, or push construction payments onto the right
                      scope line in one pass.
                    </p>

                    <div className="mt-5 grid gap-4">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-ink-700">Cost class</span>
                        <select
                          value={batchCostClass}
                          onChange={(event) => setBatchCostClass(event.target.value)}
                          className="auth-input appearance-none"
                        >
                          <option value={BATCH_KEEP_VALUE}>Keep existing / infer</option>
                          {PAYMENT_COST_CLASS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-ink-700">Cost type</span>
                        <select
                          value={batchCostType}
                          onChange={(event) => setBatchCostType(event.target.value)}
                          className="auth-input appearance-none"
                          disabled={batchCostClass === BATCH_KEEP_VALUE}
                        >
                          <option value={BATCH_KEEP_VALUE}>
                            {batchCostClass === BATCH_KEEP_VALUE
                              ? "Choose a class first"
                              : "Keep existing / infer"}
                          </option>
                          {batchCostTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-ink-700">Scope</span>
                        <select
                          value={batchScopeId}
                          onChange={(event) => setBatchScopeId(event.target.value)}
                          className="auth-input appearance-none"
                        >
                          <option value={BATCH_KEEP_VALUE}>Keep existing scope</option>
                          <option value={BATCH_PROJECT_LEVEL_VALUE}>Clear to project-level</option>
                          {budgetItems.map((item) => (
                            <option key={item._id} value={item._id}>
                              {item.category}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={handleApplyBatchClassification}
                        className="secondary-action"
                        disabled={isApplyingBatchActions}
                      >
                        {isApplyingBatchActions ? "Applying..." : "Apply classification"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-ink-100 bg-ink-50/50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Capital mapping
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      Map the selected payments to a funding source and draw request together. Leave
                      these empty if you want to clear the current capital links.
                    </p>

                    <div className="mt-5 grid gap-4">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-ink-700">Funding source</span>
                        <select
                          value={batchFundingSourceId}
                          onChange={(event) => setBatchFundingSourceId(event.target.value)}
                          className="auth-input appearance-none"
                        >
                          <option value="">No funding source</option>
                          {fundingSources.map((source, index) => (
                            <option key={source.sourceId || `batch-source-${index}`} value={source.sourceId || ""}>
                              {getFundingSourceLabel(source, index)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-ink-700">Draw request</span>
                        <select
                          value={batchDrawRequestId}
                          onChange={(event) => {
                            const nextDrawRequestId = event.target.value;
                            const nextDrawRequest =
                              drawRequests.find((request) => request.drawId === nextDrawRequestId) || null;

                            setBatchDrawRequestId(nextDrawRequestId);
                            if (nextDrawRequest?.sourceId) {
                              setBatchFundingSourceId(nextDrawRequest.sourceId);
                            }
                          }}
                          className="auth-input appearance-none"
                        >
                          <option value="">No draw request</option>
                          {batchDrawRequestOptions.map((drawRequest, index) => (
                            <option key={drawRequest.drawId || `batch-draw-${index}`} value={drawRequest.drawId || ""}>
                              {getDrawRequestLabel(drawRequest, index)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={handleApplyBatchCapitalLinks}
                        className="secondary-action"
                        disabled={isApplyingBatchActions}
                      >
                        {isApplyingBatchActions ? "Applying..." : "Apply capital links"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[22px] border border-dashed border-ink-200 bg-ink-50/40 px-5 py-5 text-sm leading-6 text-ink-500">
                No payments are selected yet. Use the checkboxes in the ledger to work through a
                run of approvals, capital mapping, or status changes without opening each payment.
              </div>
            )}
          </section>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Payment ledger</span>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h4 className="text-2xl font-semibold text-ink-900">All project payments</h4>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
                  Run the cash ledger like a bank register: scan date, line item, category,
                  workflow, and amount fast, then open a row only when something needs real review.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenExpenseModal()}
                  className="primary-action"
                >
                  Add payment
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenExpenseModal({ mode: "receipt" })}
                  className="secondary-action"
                >
                  Scan receipt
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <div className="workspace-counter-pill">
                Filtered spend {formatCurrency(filteredPaymentsTotal)}
              </div>
              <div className="workspace-counter-pill">
                {filteredPaymentsNeedingReviewCount} need review
              </div>
              <div className="workspace-counter-pill">
                {filteredPaymentsMissingReceiptCount} missing receipt
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-[24px] border border-ink-100 bg-white/96 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              {filteredPayments.length > 0 ? (
                <table className="min-w-[1520px] w-full border-separate border-spacing-0 text-left text-sm">
                  <thead className="sticky top-0 z-[1]">
                    <tr className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                      <th className="border-b border-ink-100 bg-mist-50/95 px-3 py-3">Select</th>
                      <th className="border-b border-ink-100 bg-mist-50/95 px-4 py-3">Date</th>
                      <th className="border-b border-ink-100 bg-mist-50/95 px-4 py-3">Line item</th>
                      <th className="border-b border-ink-100 bg-mist-50/95 px-4 py-3">Category</th>
                      <th className="border-b border-ink-100 bg-mist-50/95 px-4 py-3">Scope + Capital</th>
                      <th className="border-b border-ink-100 bg-mist-50/95 px-4 py-3">Workflow</th>
                      <th className="border-b border-ink-100 bg-mist-50/95 px-4 py-3 text-right">Amount</th>
                      <th className="border-b border-ink-100 bg-mist-50/95 px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments
                      .slice()
                      .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))
                      .map((payment) => {
                        const budgetItem = payment.budgetItemResolved;
                        const isExpanded = expandedPaymentId === payment._id;
                        const isSelected = selectedPaymentIdSet.has(String(payment._id || ""));
                        const diagnostics =
                          paymentDiagnosticsById.get(String(payment._id || "")) || {
                            flags: [],
                            linkedReceiptCount: 0,
                            latestReceiptDate: "",
                            latestReceiptTitle: "",
                            needsApproval: false,
                            missingReceipt: false,
                            needsScope: false,
                            projectLevel: false,
                            drawLinked: false,
                            duplicateWatch: false,
                          };

                        return (
                          <React.Fragment key={payment._id}>
                            <tr
                              className={`transition hover:bg-mist-50/75 ${
                                isSelected ? "bg-verdigris-50/45" : "bg-white/90"
                              }`}
                            >
                              <td className="border-b border-ink-100 px-3 py-4 align-top">
                                <label className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleTogglePaymentSelection(payment._id)}
                                    className="h-4 w-4 rounded border-ink-300 text-verdigris-600 focus:ring-verdigris-500"
                                  />
                                </label>
                              </td>
                              <td className="border-b border-ink-100 px-4 py-4 align-top">
                                <p className="font-medium text-ink-900">{formatDate(payment.date)}</p>
                                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                                  {getPaymentEntryMethodLabel(payment.entryMethod)}
                                </p>
                              </td>
                              <td className="border-b border-ink-100 px-4 py-4 align-top">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-ink-900">
                                      {payment.title || "Untitled payment"}
                                    </p>
                                    {payment.awardId ? (
                                      <span className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sand-700">
                                        Commitment
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-sm text-ink-600">
                                    {getPaymentVendorLabel(payment)}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-ink-400">
                                    {payment.description || "No payment note saved."}
                                  </p>
                                </div>
                              </td>
                              <td className="border-b border-ink-100 px-4 py-4 align-top">
                                <span className="rounded-full bg-mist-50 px-3 py-1 text-[11px] font-semibold text-ink-700">
                                  {getPaymentCostClassLabel(payment.costClass)}
                                </span>
                                <p className="mt-2 text-sm font-medium text-ink-900">
                                  {getPaymentCostTypeLabel(payment.costType) || "Unclassified"}
                                </p>
                                <p className="mt-1 text-xs text-ink-400">
                                  {getExpenseRecurringCategoryLabel(payment.recurringCategory) || "One-time payment"}
                                </p>
                              </td>
                              <td className="border-b border-ink-100 px-4 py-4 align-top">
                                <p className="font-medium text-ink-900">
                                  {budgetItem?.category || "Project-level"}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-ink-500">
                                  Funding:{" "}
                                  <span className="font-medium text-ink-700">
                                    {getFundingSourceDisplayLabel(fundingSources, payment.fundingSourceId)}
                                  </span>
                                </p>
                                <p className="mt-1 text-xs leading-5 text-ink-500">
                                  Draw:{" "}
                                  <span className="font-medium text-ink-700">
                                    {getDrawRequestDisplayLabel(drawRequests, payment.drawRequestId)}
                                  </span>
                                </p>
                              </td>
                              <td className="border-b border-ink-100 px-4 py-4 align-top">
                                <span
                                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getExpenseStatusClasses(
                                    payment.status
                                  )}`}
                                >
                                  {getExpenseStatusLabel(payment.status)}
                                </span>
                                <p className="mt-2 text-xs font-medium text-ink-500">
                                  {getPaymentReceiptSupportSummary(payment, diagnostics)}
                                </p>
                                {diagnostics.flags.length > 0 ? (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {diagnostics.flags.slice(0, 2).map((flag) => (
                                      <span
                                        key={`${payment._id}-${flag.key}`}
                                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${flag.classes}`}
                                      >
                                        {flag.label}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-ink-400">Clear</span>
                                )}
                              </td>
                              <td className="border-b border-ink-100 px-4 py-4 align-top text-right">
                                <p className="text-base font-semibold text-ink-900">
                                  {formatCurrency(payment.amount)}
                                </p>
                                <p className="mt-1 text-xs text-ink-400">
                                  {getExpensePaymentMethodLabel(payment.paymentMethod)}
                                </p>
                              </td>
                              <td className="border-b border-ink-100 px-4 py-4 align-top text-right">
                                <div className="flex flex-col items-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedPaymentId((current) =>
                                        current === payment._id ? "" : payment._id
                                      )
                                    }
                                    className="ghost-action"
                                  >
                                    {isExpanded ? "Hide" : "Open"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      diagnostics.flags.length > 0
                                        ? handleOpenReviewDrawer(payment._id)
                                        : handleOpenEditPaymentModal(payment)
                                    }
                                    className="ghost-action"
                                  >
                                    {diagnostics.flags.length > 0 ? "Review" : "Edit"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded ? (
                              <tr>
                                <td
                                  colSpan={8}
                                  className="border-b border-ink-100 bg-mist-50/45 px-5 py-5"
                                >
                                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                                    <div className="space-y-3">
                                      <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                                          Notes
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-ink-600">
                                          {payment.notes || "No internal note saved for this payment."}
                                        </p>
                                      </div>
                                      <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                                          Links
                                        </p>
                                        <dl className="mt-3 space-y-2 text-sm text-ink-600">
                                          <div className="flex items-start justify-between gap-4">
                                            <dt className="text-ink-400">Scope</dt>
                                            <dd className="text-right font-medium text-ink-900">
                                              {budgetItem?.category || "Project-level"}
                                            </dd>
                                          </div>
                                          <div className="flex items-start justify-between gap-4">
                                            <dt className="text-ink-400">Funding source</dt>
                                            <dd className="text-right font-medium text-ink-900">
                                              {getFundingSourceDisplayLabel(
                                                fundingSources,
                                                payment.fundingSourceId
                                              )}
                                            </dd>
                                          </div>
                                          <div className="flex items-start justify-between gap-4">
                                            <dt className="text-ink-400">Draw request</dt>
                                            <dd className="text-right font-medium text-ink-900">
                                              {getDrawRequestDisplayLabel(
                                                drawRequests,
                                                payment.drawRequestId
                                              )}
                                            </dd>
                                          </div>
                                          <div className="flex items-start justify-between gap-4">
                                            <dt className="text-ink-400">Receipts linked</dt>
                                            <dd className="text-right font-medium text-ink-900">
                                              {diagnostics.linkedReceiptCount}
                                            </dd>
                                          </div>
                                        </dl>
                                      </div>
                                      {payment.receiptExtraction ? (
                                        <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
                                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                                            Receipt OCR
                                          </p>
                                          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-ink-600">
                                            {JSON.stringify(payment.receiptExtraction, null, 2)}
                                          </pre>
                                        </div>
                                      ) : null}
                                    </div>
                                    <div className="space-y-3">
                                      <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                                          Workflow
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenReviewDrawer(payment._id)}
                                            className="secondary-action"
                                          >
                                            Review in side sheet
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditPaymentModal(payment)}
                                            className="ghost-action"
                                          >
                                            Edit payment
                                          </button>
                                          {(payment.status || "paid") === "draft" ? (
                                            <button
                                              type="button"
                                              onClick={() => handleExpenseStatusChange(payment._id, "approved")}
                                              className="secondary-action"
                                            >
                                              Approve
                                            </button>
                                          ) : null}
                                          {(payment.status || "paid") !== "paid" &&
                                          (payment.status || "paid") !== "reimbursed" ? (
                                            <button
                                              type="button"
                                              onClick={() => handleExpenseStatusChange(payment._id, "paid")}
                                              className="primary-action"
                                            >
                                              Mark paid
                                            </button>
                                          ) : null}
                                          {(payment.status || "paid") === "paid" ? (
                                            <button
                                              type="button"
                                              onClick={() => handleExpenseStatusChange(payment._id, "reimbursed")}
                                              className="ghost-action"
                                            >
                                              Mark reimbursed
                                            </button>
                                          ) : null}
                                          {payment.receiptUrl ? (
                                            <button
                                              type="button"
                                              onClick={() => window.open(payment.receiptUrl, "_blank", "noopener,noreferrer")}
                                              className="ghost-action"
                                            >
                                              Open receipt
                                            </button>
                                          ) : null}
                                        </div>
                                      </div>
                                      <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                                          Operational checks
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {diagnostics.flags.length > 0 ? (
                                            diagnostics.flags.map((flag) => (
                                              <span
                                                key={`${payment._id}-detail-${flag.key}`}
                                                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${flag.classes}`}
                                              >
                                                {flag.label}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="rounded-full border border-verdigris-200 bg-verdigris-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-verdigris-700">
                                              Clear
                                            </span>
                                          )}
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-ink-500">
                                          {diagnostics.missingReceipt
                                            ? "Attach or reconcile receipt support so this payment is ready for review and lender backup."
                                            : diagnostics.needsScope
                                              ? "Link this construction payment to a scope item so cost plan and procurement reporting stay accurate."
                                              : diagnostics.duplicateWatch
                                                ? "This payment is close to another recent entry and should be checked before more money moves."
                                                : "This payment is cleanly linked and not currently sitting in a watch queue."}
                                        </p>
                                      </div>
                                      <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                                          Payment details
                                        </p>
                                        <dl className="mt-3 space-y-2 text-sm text-ink-600">
                                          <div className="flex items-start justify-between gap-4">
                                            <dt className="text-ink-400">Payee / Vendor</dt>
                                            <dd className="text-right font-medium text-ink-900">
                                              {getPaymentVendorLabel(payment)}
                                            </dd>
                                          </div>
                                          <div className="flex items-start justify-between gap-4">
                                            <dt className="text-ink-400">Payment method</dt>
                                            <dd className="text-right font-medium text-ink-900">
                                              {getExpensePaymentMethodLabel(payment.paymentMethod)}
                                            </dd>
                                          </div>
                                          <div className="flex items-start justify-between gap-4">
                                            <dt className="text-ink-400">Entry method</dt>
                                            <dd className="text-right font-medium text-ink-900">
                                              {getPaymentEntryMethodLabel(payment.entryMethod)}
                                            </dd>
                                          </div>
                                          <div className="flex items-start justify-between gap-4">
                                            <dt className="text-ink-400">Recurring carry</dt>
                                            <dd className="text-right font-medium text-ink-900">
                                              {getExpenseRecurringCategoryLabel(payment.recurringCategory) ||
                                                "Not tagged"}
                                            </dd>
                                          </div>
                                          <div className="flex items-start justify-between gap-4">
                                            <dt className="text-ink-400">Latest receipt</dt>
                                            <dd className="text-right font-medium text-ink-900">
                                              {diagnostics.latestReceiptTitle
                                                ? `${diagnostics.latestReceiptTitle}${
                                                    diagnostics.latestReceiptDate
                                                      ? ` · ${formatDate(diagnostics.latestReceiptDate)}`
                                                      : ""
                                                  }`
                                                : "No receipt support"}
                                            </dd>
                                          </div>
                                        </dl>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </React.Fragment>
                        );
                      })}
                  </tbody>
                </table>
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                  No payments match this filter set. Try widening the filters or add the first payment.
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.04fr)_minmax(280px,360px)]">
            <section className="section-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Approval queue
                  </p>
                  <p className="mt-2 text-base font-semibold text-ink-900">
                    Keep captured payments moving to approved and paid
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {approvalQueue.length} open
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {approvalQueue.length > 0 ? (
                  approvalQueue.slice(0, 6).map((payment) => (
                    <div
                      key={payment._id}
                      className="rounded-[18px] border border-ink-100 bg-ink-50/50 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-ink-900">{payment.title}</p>
                            <span
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${getExpenseStatusClasses(
                                payment.status
                              )}`}
                            >
                              {getExpenseStatusLabel(payment.status)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-ink-500">
                            {getPaymentVendorLabel(payment)} · {formatDate(payment.date)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPaymentModal(payment)}
                            className="ghost-action"
                          >
                            Edit
                          </button>
                          {(payment.status || "paid") === "draft" ? (
                            <button
                              type="button"
                              onClick={() => handleExpenseStatusChange(payment._id, "approved")}
                              className="secondary-action"
                            >
                              Approve
                            </button>
                          ) : null}
                          {(payment.status || "paid") !== "paid" &&
                          (payment.status || "paid") !== "reimbursed" ? (
                            <button
                              type="button"
                              onClick={() => handleExpenseStatusChange(payment._id, "paid")}
                              className="primary-action"
                            >
                              Mark paid
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                    No payments are waiting on approval right now.
                  </div>
                )}
              </div>
            </section>

            <div className="space-y-5">
              <section className="section-card p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Duplicate watch
                </p>
                <div className="mt-5 space-y-3">
                  {duplicateGroups.length > 0 ? (
                    duplicateGroups.slice(0, 4).map((group) => (
                      <div
                        key={group.key}
                        className="rounded-[18px] border border-clay-200 bg-clay-50/70 p-4"
                      >
                        <p className="text-sm font-semibold text-ink-900">
                          {getPaymentPartyLabel(group.expenses[0]) || "Potential duplicate"}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-ink-500">
                          {group.expenses.length} similar payments totaling{" "}
                          {formatCurrency(group.totalAmount)} were logged within a short date window.
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                      No likely duplicates detected in the payment ledger.
                    </div>
                  )}
                </div>
              </section>

              <section className="section-card p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Receipt backlog
                </p>
                <div className="mt-5 space-y-3">
                  {receiptBacklog.length > 0 ? (
                    receiptBacklog.slice(0, 4).map((receipt) => (
                        <div
                          key={receipt._id}
                          className="rounded-[18px] border border-ink-100 bg-ink-50/50 p-4"
                        >
                          <p className="text-sm font-semibold text-ink-900">
                            {receipt.title || receipt.payeeName || "Receipt"}
                          </p>
                          <p className="mt-2 text-sm text-ink-500">
                            {receipt.budgetItem?.category || "Unassigned scope"} ·{" "}
                            {receipt.amount ? formatCurrency(receipt.amount) : "—"}
                          </p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-ink-400">
                            {formatDate(receipt.receiptDate || receipt.createdAt || receipt.updatedAt)}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentFromReceipt(receipt)}
                              className="secondary-action"
                            >
                              Create payment
                            </button>
                            {receipt.receiptUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(receipt.receiptUrl, "_blank", "noopener,noreferrer")
                                }
                                className="ghost-action"
                              >
                                Open receipt
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                      No pending receipt reviews right now.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          <section className="section-card p-6 sm:p-7">
            <span className="eyebrow">Capital allocation</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">
              See which sources and draws are funding the work
            </h4>

            <div className="mt-8 grid gap-5 xl:grid-cols-2">
              <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Funding sources
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink-900">
                      Spend mapped to the capital stack
                    </p>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    {fundingSpendSummary.length} linked
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {fundingSpendSummary.length > 0 ? (
                    fundingSpendSummary.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-[18px] border border-ink-100 bg-ink-50/50 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                            <p className="mt-1 text-sm text-ink-500">
                              {item.count} payment{item.count === 1 ? "" : "s"} linked
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-ink-900">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                      No payments are linked to a funding source yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Draw requests
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink-900">
                      Spend already attached to lender draws
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {drawSpendSummary.length} linked
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {drawSpendSummary.length > 0 ? (
                    drawSpendSummary.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-[18px] border border-ink-100 bg-ink-50/50 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                            <p className="mt-1 text-sm text-ink-500">
                              {item.count} payment{item.count === 1 ? "" : "s"} linked
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-ink-900">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                      No payments are assigned to a specific draw request yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      {sharedModals}
      <div className="space-y-6">
        {!embedded ? (
          <section className="surface-panel px-6 py-7 sm:px-7">
            <span className="eyebrow">Procurement / Commitments</span>
            <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
              Run vendor coverage, awarded work, and payment readiness from one place
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
              Procurement connects quote coverage, awarded vendors, packet readiness, and recorded
              payments so scope gaps and payout blockers do not hide in separate tools.
            </p>
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricTile
            icon={ArrowTrendingUpIcon}
            label="Commitments"
            value={commitments.length}
            hint="Selected vendor commitments across scope items."
          />
          <MetricTile
            icon={ClipboardDocumentListIcon}
            label="Awarded scope"
            value={scopeItemsWithAwardsCount}
            hint={`${Math.max(procurementScopeRows.length - scopeItemsWithAwardsCount, 0)} scope item${procurementScopeRows.length - scopeItemsWithAwardsCount === 1 ? "" : "s"} still need coverage.`}
          />
          <MetricTile
            icon={ClipboardDocumentListIcon}
            label="Quote coverage"
            value={scopeItemsWithQuotesCount}
            hint={`${procurementBidSummary.openBids.length} open quote${procurementBidSummary.openBids.length === 1 ? "" : "s"} still active.`}
          />
          <MetricTile
            icon={BanknotesIcon}
            label="Ready to pay"
            value={readyToPayCommitmentsCount}
            hint="Commitments whose vendor packet is payment-ready."
          />
          <MetricTile
            icon={CreditCardIcon}
            label="Committed amount"
            value={formatCurrency(metrics.totalCommitted)}
            hint="Total contract value awarded so far."
          />
          <MetricTile
            icon={BanknotesIcon}
            label="Remaining balance"
            value={formatCurrency(
              commitments.reduce((sum, item) => sum + item.remainingBalance, 0)
            )}
            hint="Outstanding commitment exposure."
            tone={
              commitments.reduce((sum, item) => sum + item.remainingBalance, 0) >= 0
                ? "text-ink-900"
                : "text-clay-700"
            }
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_340px]">
          <section className="section-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="eyebrow">Coverage watch</span>
                <h4 className="mt-4 text-2xl font-semibold text-ink-900">
                  Scope items that need a procurement decision
                </h4>
              </div>
              <div className="workspace-counter-pill">
                {procurementCoverageWatchlist.length} active watch item{procurementCoverageWatchlist.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {procurementCoverageWatchlist.length > 0 ? (
                procurementCoverageWatchlist.map((row) => (
                  <div
                    key={row.item._id}
                    className="rounded-[20px] border border-ink-100 bg-white/90 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-ink-900">{row.item.category}</p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getVendorProcurementStateClasses(
                              row.packetState
                            )}`}
                          >
                            {row.packetLabel}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-ink-500">
                          {row.nextMove}
                        </p>
                      </div>
                      <div className="text-sm text-ink-500 lg:text-right">
                        <p>{row.quoteCount} quote{row.quoteCount === 1 ? "" : "s"}</p>
                        <p className="mt-1">{row.awardCount} awarded vendor{row.awardCount === 1 ? "" : "s"}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-ink-200 bg-ink-50/35 p-5 text-sm leading-6 text-ink-500">
                  Scope coverage looks healthy right now. Awards, packet readiness, and payments are aligned.
                </div>
              )}
            </div>
          </section>

          <div className="space-y-5">
            <section className="section-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                Bid pipeline
              </p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Open quotes
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink-900">
                    {procurementBidSummary.openBids.length}
                  </p>
                </div>
                <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Awarded quotes
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink-900">
                    {procurementBidSummary.awardedBids.length}
                  </p>
                </div>
                <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Unlinked contractors
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink-900">
                    {procurementBidSummary.unlinkedContractorBids.length}
                  </p>
                </div>
                <div className="rounded-[18px] border border-ink-100 bg-ink-50/55 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Project-only quotes
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ink-900">
                    {procurementBidSummary.bidsWithoutAssignments.length}
                  </p>
                </div>
              </div>
            </section>

            <section className="section-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">
                Payout blockers
              </p>
              <div className="mt-5 space-y-3">
                {commitmentProcurementWatchlist.length > 0 ? (
                  commitmentProcurementWatchlist.map((commitment) => (
                    <div
                      key={commitment.awardId}
                      className="rounded-[18px] border border-sand-100 bg-sand-50/60 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink-900">{commitment.vendorName}</p>
                        {commitment.procurement ? (
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorProcurementStateClasses(
                              commitment.procurement.overallState
                            )}`}
                          >
                            {commitment.procurement.overallLabel}
                          </span>
                        ) : null}
                        {commitment.vendorRecord ? (
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorComplianceClasses(
                              commitment.vendorRecord
                            )}`}
                          >
                            {getVendorComplianceLabel(commitment.vendorRecord)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-ink-500">{commitment.scopeItemLabel}</p>
                      <p className="mt-3 text-sm leading-6 text-ink-600">
                        {!commitment.vendorId
                          ? "Link the vendor record before more scope or payments move forward."
                          : commitment.procurement?.nextActions?.[0] ||
                            (commitment.remainingBalance < 0
                              ? "Review paid amount against the committed contract value."
                              : "Packet cleanup is still needed before payout.")}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm leading-6 text-ink-500">
                    No payout blockers are standing out right now.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Scope coverage table</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">See coverage, packet readiness, and exposure by scope</h4>

          {procurementScopeRows.length > 0 ? (
            <div className="mt-8 overflow-x-auto rounded-[24px] border border-ink-100 bg-white/92">
              <table className="min-w-[1240px] w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    <th className="border-b border-ink-100 px-4 py-3">Scope</th>
                    <th className="border-b border-ink-100 px-4 py-3">Quotes</th>
                    <th className="border-b border-ink-100 px-4 py-3">Awarded vendor</th>
                    <th className="border-b border-ink-100 px-4 py-3">Packet</th>
                    <th className="border-b border-ink-100 px-4 py-3">Committed</th>
                    <th className="border-b border-ink-100 px-4 py-3">Paid</th>
                    <th className="border-b border-ink-100 px-4 py-3">Remaining</th>
                    <th className="border-b border-ink-100 px-4 py-3">Next move</th>
                  </tr>
                </thead>
                <tbody>
                  {procurementScopeRows.map((row) => (
                    <tr key={row.item._id} className="bg-white/80">
                      <td className="border-b border-ink-100 px-4 py-4 align-top">
                        <p className="font-semibold text-ink-900">{row.item.category}</p>
                        <p className="mt-1 text-sm text-ink-500">
                          {row.item.description || "No scope description saved yet."}
                        </p>
                      </td>
                      <td className="border-b border-ink-100 px-4 py-4 align-top text-ink-600">
                        <p className="font-semibold text-ink-900">
                          {row.quoteCount} quote{row.quoteCount === 1 ? "" : "s"}
                        </p>
                        <p className="mt-1 text-xs text-ink-400">
                          {row.openQuoteCount} still open
                        </p>
                      </td>
                      <td className="border-b border-ink-100 px-4 py-4 align-top text-ink-600">
                        {row.awardedVendors.length > 0 ? (
                          <div className="space-y-2">
                            {row.awardedVendors.slice(0, 2).map((vendor) => (
                              <p key={`${row.item._id}-${vendor.awardId}`} className="font-medium text-ink-900">
                                {vendor.vendorName}
                              </p>
                            ))}
                            {row.awardedVendors.length > 2 ? (
                              <p className="text-xs text-ink-400">
                                +{row.awardedVendors.length - 2} more
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          "No awarded vendor"
                        )}
                      </td>
                      <td className="border-b border-ink-100 px-4 py-4 align-top">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVendorProcurementStateClasses(
                            row.packetState
                          )}`}
                        >
                          {row.packetLabel}
                        </span>
                      </td>
                      <td className="border-b border-ink-100 px-4 py-4 align-top text-ink-600">
                        {formatCurrency(row.committed)}
                      </td>
                      <td className="border-b border-ink-100 px-4 py-4 align-top text-ink-600">
                        {formatCurrency(row.paid)}
                      </td>
                      <td className="border-b border-ink-100 px-4 py-4 align-top">
                        <span
                          className={`font-semibold ${
                            row.remaining >= 0 ? "text-ink-900" : "text-clay-700"
                          }`}
                        >
                          {formatCurrency(row.remaining)}
                        </span>
                      </td>
                      <td className="border-b border-ink-100 px-4 py-4 align-top text-sm leading-6 text-ink-600">
                        {row.nextMove}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-8 rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
              Add the first scope item and procurement coverage will populate here.
            </div>
          )}
        </section>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Commitment ledger</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Awarded obligations and payout progress</h4>

          <div className="mt-8 space-y-4">
            {commitments.length > 0 ? (
              commitments.map((commitment) => (
                <div
                  key={commitment.awardId}
                  className="rounded-[24px] border border-ink-100 bg-white/90 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-base font-semibold text-ink-900">{commitment.vendorName}</p>
                      <p className="mt-2 text-sm font-medium text-ink-600">
                        {commitment.scopeItemLabel}
                      </p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
                        {commitment.description || "No scope note saved for this commitment."}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Added {formatDate(commitment.createdAt)}
                      </p>
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-3 xl:min-w-[360px]">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Awarded
                        </p>
                        <p className="mt-1 font-semibold text-ink-900">
                          {formatCurrency(commitment.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Paid
                        </p>
                        <p className="mt-1 font-semibold text-ink-900">
                          {formatCurrency(commitment.paidToDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Remaining
                        </p>
                        <p
                          className={`mt-1 font-semibold ${
                            commitment.remainingBalance >= 0 ? "text-ink-900" : "text-clay-700"
                          }`}
                        >
                          {formatCurrency(commitment.remainingBalance)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-verdigris-500"
                      style={{
                        width: `${Math.max(
                          6,
                          Math.min(
                            100,
                            (commitment.paidToDate / Math.max(commitment.amount, 1)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-ink-500">
                    {commitment.expensesCount} linked payment
                    {commitment.expensesCount === 1 ? "" : "s"} recorded so far.
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                No commitments yet. Add vendors to budget lines in the Budget section to start the
                commitment ledger.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default PropertyCostsPanel;
