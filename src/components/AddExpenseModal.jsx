import React, { useEffect, useMemo, useState } from "react";
import {
  BanknotesIcon,
  CheckBadgeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { analyzeExpenseReceipt, createExpense, updateExpense } from "../utils/api";
import { getDrawRequestLabel, getFundingSourceLabel } from "../utils/capitalStack";
import {
  EXPENSE_PAYMENT_METHOD_OPTIONS,
  EXPENSE_RECURRING_CATEGORY_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
} from "../utils/expenseOperations";
import {
  getPaymentCostClassLabel,
  getPaymentCostTypeLabel,
  getPaymentCostTypeOptions,
  getPaymentScopeExpectation,
  PAYMENT_COST_CLASS_OPTIONS,
  resolvePaymentClassification,
} from "../utils/paymentTaxonomy";

const PAYMENT_CAPTURE_PRESETS = [
  {
    id: "contractor_labor",
    label: "Contractor labor",
    description: "Subcontractor labor draw, deposit, or progress payment.",
    costClass: "construction",
    costType: "contractor_labor",
    suggestedTitle: "Contractor labor payment",
  },
  {
    id: "materials",
    label: "Materials",
    description: "Lumber, finishes, fixtures, or direct material purchase.",
    costClass: "construction",
    costType: "materials",
    suggestedTitle: "Materials purchase",
  },
  {
    id: "permit",
    label: "Permit / plans",
    description: "Permits, plans, architect, or inspection costs.",
    costClass: "soft_cost",
    costType: "permit",
    suggestedTitle: "Permit or plans payment",
  },
  {
    id: "lender_fee",
    label: "Lender fee",
    description: "Points, lender fees, appraisal, or draw fees.",
    costClass: "financing",
    costType: "lender_fee",
    suggestedTitle: "Lender fee payment",
  },
  {
    id: "closing",
    label: "Closing cost",
    description: "Title, escrow, attorney, recording, and close costs.",
    costClass: "closing",
    costType: "title",
    suggestedTitle: "Closing cost payment",
  },
  {
    id: "holding",
    label: "Holding bill",
    description: "Utilities, taxes, insurance, HOA, and carry costs.",
    costClass: "holding",
    costType: "utilities",
    recurringCategory: "utilities",
    suggestedTitle: "Holding cost payment",
  },
];

const formatDateLabel = (value) => {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) {
    return "Not set";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatFileSize = (bytes = 0) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getLinkedReceiptRecordId = (expense = null) =>
  typeof expense?.receiptRecord === "object"
    ? expense?.receiptRecord?._id || ""
    : expense?.receiptRecord || "";

const formatReceiptSummaryLabel = (receipt = null) => {
  if (!receipt) {
    return "No receipt selected";
  }

  const parts = [
    receipt.title || receipt.payeeName || "Project receipt",
    receipt.amount !== null && receipt.amount !== undefined
      ? `$${Number(receipt.amount).toLocaleString()}`
      : "",
    formatDateLabel(receipt.receiptDate || receipt.createdAt || receipt.updatedAt),
  ].filter(Boolean);

  return parts.join(" • ");
};

const SectionCard = ({ eyebrow, title, description, children }) => (
  <section className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
    {(eyebrow || title || description) ? (
      <div>
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-400">{eyebrow}</p>
        ) : null}
        {title ? <p className="mt-3 text-base font-semibold text-ink-900">{title}</p> : null}
        {description ? (
          <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
        ) : null}
      </div>
    ) : null}
    <div className={eyebrow || title || description ? "mt-5" : ""}>{children}</div>
  </section>
);

const SummaryMetric = ({ icon: Icon, label, value, hint }) => (
  <div className="rounded-[20px] border border-ink-100 bg-white/90 p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">{label}</p>
        <p className="mt-2 text-base font-semibold text-ink-900">{value}</p>
        {hint ? <p className="mt-1 text-sm leading-6 text-ink-500">{hint}</p> : null}
      </div>
      {Icon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
    </div>
  </div>
);

const ReadinessPill = ({ ready, label }) => (
  <span
    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
      ready
        ? "border border-verdigris-200 bg-verdigris-50 text-verdigris-700"
        : "border border-sand-200 bg-sand-50 text-sand-700"
    }`}
  >
    {label}
  </span>
);

const resolveModalMode = ({ initialMode = "manual", editingExpense = null }) => {
  if (editingExpense) {
    if (
      editingExpense.entryMethod === "receipt_ai" ||
      editingExpense.receiptUrl ||
      editingExpense.receiptRecord
    ) {
      return "receipt";
    }

    return "manual";
  }

  return initialMode === "receipt" ? "receipt" : "manual";
};

const buildInitialForm = ({
  mode = "manual",
  budgetItems = [],
  defaultBudgetItemId = "",
  defaultAwardId = "",
  fundingSources = [],
  drawRequests = [],
  defaultFundingSourceId = "",
  defaultDrawRequestId = "",
  initialValues = {},
}) => {
  const nextBudgetItemId = initialValues.budgetItemId || defaultBudgetItemId || "";
  const nextDrawRequestId = initialValues.drawRequestId || defaultDrawRequestId || "";
  const selectedBudgetItem =
    budgetItems.find((item) => item._id === nextBudgetItemId) || null;
  const inferredAwardId =
    initialValues.awardId ||
    defaultAwardId ||
    (selectedBudgetItem?.awards?.length === 1 ? selectedBudgetItem.awards[0].awardId : "");
  const matchingAward =
    selectedBudgetItem?.awards?.find((award) => award.awardId === inferredAwardId) || null;
  const matchingDrawRequest =
    drawRequests.find((request) => request.drawId === nextDrawRequestId) || null;
  const nextFundingSourceId =
    initialValues.fundingSourceId ||
    defaultFundingSourceId ||
    matchingDrawRequest?.sourceId ||
    (fundingSources.length === 1 ? fundingSources[0].sourceId || "" : "");
  const classification = resolvePaymentClassification({
    costClass: initialValues.costClass,
    costType: initialValues.costType,
    title: initialValues.title || "",
    description: initialValues.description || "",
    recurringCategory: initialValues.recurringCategory || "",
    budgetItem: selectedBudgetItem,
    awardId: inferredAwardId || matchingAward?.awardId || "",
    payeeName: initialValues.payeeName || matchingAward?.vendorName || "",
  });

  return {
    budgetItemId: nextBudgetItemId,
    awardId: inferredAwardId || matchingAward?.awardId || "",
    fundingSourceId: nextFundingSourceId,
    drawRequestId: nextDrawRequestId,
    vendorId:
      initialValues.vendorId ||
      (typeof matchingAward?.vendor === "object"
        ? matchingAward?.vendor?._id || ""
        : matchingAward?.vendor || ""),
    payeeName: initialValues.payeeName || matchingAward?.vendorName || "",
    title: initialValues.title || "",
    description: initialValues.description || "",
    amount:
      initialValues.amount !== undefined && initialValues.amount !== null
        ? String(initialValues.amount)
        : "",
    date: initialValues.date || new Date().toISOString().split("T")[0],
    notes: initialValues.notes || "",
    entryMethod: initialValues.entryMethod || (mode === "receipt" ? "receipt_ai" : "manual"),
    status: initialValues.status || (mode === "receipt" ? "draft" : "paid"),
    paymentMethod: initialValues.paymentMethod || "other",
    recurringCategory: initialValues.recurringCategory || "",
    costClass: classification.costClass,
    costType: classification.costType,
  };
};

const buildInitialFormSeed = ({
  editingExpenseId = "",
  initialMode = "manual",
  defaultBudgetItemId = "",
  defaultAwardId = "",
  defaultFundingSourceId = "",
  defaultDrawRequestId = "",
  initialLinkedReceiptRecordId = "",
  initialValues = {},
}) =>
  JSON.stringify({
    editingExpenseId,
    initialMode,
    defaultBudgetItemId,
    defaultAwardId,
    defaultFundingSourceId,
    defaultDrawRequestId,
    initialLinkedReceiptRecordId,
    budgetItemId: initialValues.budgetItemId || "",
    awardId: initialValues.awardId || "",
    fundingSourceId: initialValues.fundingSourceId || "",
    drawRequestId: initialValues.drawRequestId || "",
    vendorId: initialValues.vendorId || "",
    payeeName: initialValues.payeeName || "",
    title: initialValues.title || "",
    description: initialValues.description || "",
    amount:
      initialValues.amount !== undefined && initialValues.amount !== null
        ? String(initialValues.amount)
        : "",
    date: initialValues.date || "",
    notes: initialValues.notes || "",
    entryMethod: initialValues.entryMethod || "",
    status: initialValues.status || "",
    paymentMethod: initialValues.paymentMethod || "",
    recurringCategory: initialValues.recurringCategory || "",
    costClass: initialValues.costClass || "",
    costType: initialValues.costType || "",
    receiptRecordId: initialValues.receiptRecordId || "",
  });

const AddExpenseModal = ({
  isOpen,
  onClose,
  investmentId,
  defaultBudgetItemId = "",
  defaultAwardId = "",
  initialMode = "manual",
  onSuccess,
  budgetItems = [],
  vendors = [],
  projectReceipts = [],
  fundingSources = [],
  drawRequests = [],
  defaultFundingSourceId = "",
  defaultDrawRequestId = "",
  initialValues = {},
  editingExpense = null,
}) => {
  const resolvedInitialMode = resolveModalMode({ initialMode, editingExpense });
  const [mode, setMode] = useState(resolvedInitialMode);
  const [formData, setFormData] = useState(() =>
    buildInitialForm({
      mode: resolvedInitialMode,
      budgetItems,
      defaultBudgetItemId,
      defaultAwardId,
      fundingSources,
      drawRequests,
      defaultFundingSourceId,
      defaultDrawRequestId,
      initialValues,
    })
  );
  const [receipt, setReceipt] = useState(null);
  const [receiptAnalysis, setReceiptAnalysis] = useState(null);
  const [receiptRecordId, setReceiptRecordId] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const isEditing = Boolean(editingExpense?._id);
  const initialLinkedReceiptRecordId =
    initialValues.receiptRecordId || getLinkedReceiptRecordId(editingExpense);
  const initialFormSeed = useMemo(
    () =>
      buildInitialFormSeed({
        editingExpenseId: editingExpense?._id || "",
        initialMode,
        defaultBudgetItemId,
        defaultAwardId,
        defaultFundingSourceId,
        defaultDrawRequestId,
        initialLinkedReceiptRecordId,
        initialValues,
      }),
    [
      defaultAwardId,
      defaultBudgetItemId,
      defaultDrawRequestId,
      defaultFundingSourceId,
      editingExpense?._id,
      initialLinkedReceiptRecordId,
      initialMode,
      initialValues,
    ]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const resolvedMode = resolveModalMode({ initialMode, editingExpense });

    // Reset only when a new payment session starts so workspace rerenders do not wipe typing.
    setMode(resolvedMode);
    setFormData(
      buildInitialForm({
        mode: resolvedMode,
        budgetItems,
        defaultBudgetItemId,
        defaultAwardId,
        fundingSources,
        drawRequests,
        defaultFundingSourceId,
        defaultDrawRequestId,
        initialValues,
      })
    );
    setReceipt(null);
    setReceiptAnalysis(null);
    setReceiptRecordId(initialLinkedReceiptRecordId || "");
    setError("");
    setIsSaving(false);
    setIsAnalyzing(false);
  }, [initialFormSeed, isOpen]);

  const selectedBudgetItem = useMemo(
    () => budgetItems.find((item) => item._id === formData.budgetItemId) || null,
    [budgetItems, formData.budgetItemId]
  );

  const selectedAward = useMemo(
    () =>
      selectedBudgetItem?.awards?.find((award) => award.awardId === formData.awardId) || null,
    [selectedBudgetItem, formData.awardId]
  );

  const selectedDrawRequest = useMemo(
    () => drawRequests.find((request) => request.drawId === formData.drawRequestId) || null,
    [drawRequests, formData.drawRequestId]
  );

  const selectedVendor = useMemo(
    () => vendors.find((vendor) => vendor._id === formData.vendorId) || null,
    [formData.vendorId, vendors]
  );

  const availableProjectReceipts = useMemo(() => {
    const currentExpenseId = editingExpense?._id ? String(editingExpense._id) : "";

    return projectReceipts.filter((receipt) => {
      const linkedExpenseId =
        typeof receipt?.expense === "object" ? receipt?.expense?._id || "" : receipt?.expense || "";

      return !linkedExpenseId || linkedExpenseId === currentExpenseId;
    });
  }, [editingExpense?._id, projectReceipts]);

  const selectedReceiptRecord = useMemo(() => {
    if (!receiptRecordId) {
      return null;
    }

    return (
      availableProjectReceipts.find((receipt) => String(receipt._id || "") === String(receiptRecordId)) ||
      null
    );
  }, [availableProjectReceipts, receiptRecordId]);

  const selectedFundingSource = useMemo(
    () =>
      fundingSources.find((source) => source.sourceId === formData.fundingSourceId) || null,
    [formData.fundingSourceId, fundingSources]
  );

  const filteredDrawRequests = useMemo(() => {
    if (!formData.fundingSourceId) {
      return drawRequests;
    }

    return drawRequests.filter(
      (request) => !request.sourceId || request.sourceId === formData.fundingSourceId
    );
  }, [drawRequests, formData.fundingSourceId]);

  const costTypeOptions = useMemo(
    () => getPaymentCostTypeOptions(formData.costClass),
    [formData.costClass]
  );

  const activePresetId = useMemo(
    () =>
      PAYMENT_CAPTURE_PRESETS.find(
        (preset) =>
          preset.costClass === formData.costClass &&
          preset.costType === formData.costType &&
          (!preset.recurringCategory || preset.recurringCategory === formData.recurringCategory)
      )?.id || "",
    [formData.costClass, formData.costType, formData.recurringCategory]
  );

  const resolvedPayeeLabel = useMemo(() => {
    if (selectedVendor?.name) {
      return selectedVendor.name;
    }

    if (formData.payeeName.trim()) {
      return formData.payeeName.trim();
    }

    if (selectedAward?.vendorName) {
      return selectedAward.vendorName;
    }

    return "Not set";
  }, [formData.payeeName, selectedAward?.vendorName, selectedVendor?.name]);

  const receiptSupportWasChanged =
    receiptRecordId !== initialLinkedReceiptRecordId || Boolean(receipt) || Boolean(receiptAnalysis);
  const existingReceiptSupport =
    !receiptSupportWasChanged &&
    Boolean(editingExpense?.receiptUrl || editingExpense?.receiptRecord || editingExpense?.receiptExtraction);
  const hasReceiptSupport = Boolean(receipt || receiptRecordId || existingReceiptSupport);
  const needsScopeLink = formData.costClass === "construction" && !formData.budgetItemId;
  const receiptLabel = receiptAnalysis && receiptRecordId
    ? "Analyzed receipt saved to the project"
    : receipt
      ? `${receipt.name}${receipt.size ? ` · ${formatFileSize(receipt.size)}` : ""}`
      : selectedReceiptRecord
        ? formatReceiptSummaryLabel(selectedReceiptRecord)
      : existingReceiptSupport
        ? editingExpense?.receiptUrl
          ? "Existing receipt linked to this payment"
          : "Existing project receipt support is already attached"
      : "No receipt attached yet";
  const readinessChecks = useMemo(
    () => [
      {
        key: "classification",
        label: "Classification set",
        ready: Boolean(formData.costClass && formData.costType),
        helper: `${getPaymentCostClassLabel(formData.costClass)} / ${
          getPaymentCostTypeLabel(formData.costType) || "Type needed"
        }`,
      },
      {
        key: "payee",
        label: "Payee confirmed",
        ready: Boolean(formData.vendorId || formData.payeeName.trim() || formData.awardId),
        helper: resolvedPayeeLabel,
      },
      {
        key: "scope",
        label: "Scope linked",
        ready: !needsScopeLink,
        helper: selectedBudgetItem?.category || "Project-level",
      },
      {
        key: "receipt",
        label: "Receipt support",
        ready: hasReceiptSupport,
        helper: receiptLabel,
      },
      {
        key: "capital",
        label: "Capital linked",
        ready: Boolean(formData.fundingSourceId || formData.drawRequestId),
        helper:
          selectedFundingSource?.name ||
          (selectedDrawRequest ? "Draw-linked" : "Optional for this payment"),
      },
    ],
    [
      formData.awardId,
      formData.costClass,
      formData.costType,
      formData.drawRequestId,
      formData.fundingSourceId,
      formData.payeeName,
      formData.vendorId,
      hasReceiptSupport,
      needsScopeLink,
      receiptLabel,
      resolvedPayeeLabel,
      selectedBudgetItem?.category,
      selectedDrawRequest,
      selectedFundingSource?.name,
    ]
  );

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleModeSelect = (nextMode) => {
    if (isEditing) {
      return;
    }

    setMode(nextMode);
    setFormData((current) => {
      if (initialValues.entryMethod || initialValues.status) {
        return current;
      }

      return {
        ...current,
        entryMethod: nextMode === "receipt" ? "receipt_ai" : "manual",
        status:
          nextMode === "receipt"
            ? current.status === "paid"
              ? "draft"
              : current.status
            : current.status === "draft" && !receiptRecordId
              ? "paid"
              : current.status,
      };
    });
  };

  const handleApplyPreset = (preset) => {
    setFormData((current) => {
      const shouldReplaceTitle =
        !current.title ||
        PAYMENT_CAPTURE_PRESETS.some((option) => option.suggestedTitle === current.title);

      return {
        ...current,
        costClass: preset.costClass,
        costType: preset.costType,
        recurringCategory: preset.recurringCategory || current.recurringCategory,
        title: shouldReplaceTitle ? preset.suggestedTitle : current.title,
      };
    });
  };

  const handleSavedReceiptChange = (event) => {
    const nextReceiptRecordId = event.target.value;
    const nextReceipt =
      availableProjectReceipts.find(
        (receiptOption) => String(receiptOption._id || "") === String(nextReceiptRecordId)
      ) || null;

    setReceiptRecordId(nextReceiptRecordId);
    setReceipt(null);
    setReceiptAnalysis(null);

    if (!nextReceipt) {
      return;
    }

    setFormData((current) => {
      const nextBudgetItemId =
        current.budgetItemId ||
        (typeof nextReceipt.budgetItem === "object"
          ? nextReceipt.budgetItem?._id || ""
          : nextReceipt.budgetItem || "");
      const nextBudgetItem =
        budgetItems.find((item) => item._id === nextBudgetItemId) || selectedBudgetItem || null;
      const nextVendorId =
        current.vendorId ||
        (typeof nextReceipt.vendor === "object" ? nextReceipt.vendor?._id || "" : nextReceipt.vendor || "");
      const nextPayeeName = current.payeeName || nextReceipt.payeeName || "";
      const nextDraft = {
        ...current,
        budgetItemId: nextBudgetItemId,
        vendorId: nextVendorId,
        payeeName: nextPayeeName,
        title: current.title || nextReceipt.title || "",
        description: current.description || nextReceipt.description || "",
        amount:
          current.amount ||
          (nextReceipt.amount !== null && nextReceipt.amount !== undefined
            ? String(nextReceipt.amount)
            : ""),
        date:
          current.date ||
          (nextReceipt.receiptDate
            ? new Date(nextReceipt.receiptDate).toISOString().split("T")[0]
            : ""),
        notes: current.notes || nextReceipt.notes || "",
      };
      const nextClassification = resolvePaymentClassification({
        ...nextDraft,
        budgetItem: nextBudgetItem,
        payeeName: nextDraft.payeeName,
      });

      return {
        ...nextDraft,
        costClass:
          current.costClass && current.costClass !== "general"
            ? current.costClass
            : nextClassification.costClass,
        costType:
          current.costType && current.costType !== "misc"
            ? current.costType
            : nextClassification.costType,
      };
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => {
      const next = {
        ...current,
        [name]: value,
      };
      const currentClassification = resolvePaymentClassification({
        ...current,
        budgetItem: selectedBudgetItem,
        payeeName: current.payeeName,
      });
      const nextBudgetItem =
        budgetItems.find((item) => item._id === (name === "budgetItemId" ? value : next.budgetItemId)) ||
        null;

      if (name === "budgetItemId") {
        const autoAward =
          nextBudgetItem?.awards?.length === 1 ? nextBudgetItem.awards[0] : null;

        next.awardId = autoAward?.awardId || "";

        if (autoAward) {
          next.vendorId =
            typeof autoAward.vendor === "object"
              ? autoAward.vendor?._id || ""
              : autoAward.vendor || "";
          next.payeeName = autoAward.vendorName || "";
        }
      }

      if (name === "awardId") {
        const nextAward = nextBudgetItem?.awards?.find((award) => award.awardId === value);
        if (nextAward) {
          next.vendorId =
            typeof nextAward.vendor === "object"
              ? nextAward.vendor?._id || ""
              : nextAward.vendor || "";
          next.payeeName = nextAward.vendorName || "";
        }
      }

      if (name === "fundingSourceId") {
        const existingDrawRequest =
          drawRequests.find((request) => request.drawId === current.drawRequestId) || null;

        if (existingDrawRequest?.sourceId && existingDrawRequest.sourceId !== value) {
          next.drawRequestId = "";
        }
      }

      if (name === "drawRequestId") {
        const nextDrawRequest = drawRequests.find((request) => request.drawId === value) || null;
        if (nextDrawRequest?.sourceId) {
          next.fundingSourceId = nextDrawRequest.sourceId;
        }
      }

      if (name === "vendorId" && value) {
        next.payeeName = "";
      }

      if (name === "costClass") {
        const nextClassification = resolvePaymentClassification({
          ...next,
          costClass: value,
          costType: "",
          budgetItem: nextBudgetItem,
          payeeName: next.payeeName,
        });
        next.costClass = nextClassification.costClass;
        next.costType = nextClassification.costType;
        return next;
      }

      if (name !== "costType") {
        const nextClassification = resolvePaymentClassification({
          ...next,
          budgetItem: nextBudgetItem,
          payeeName: next.payeeName,
        });

        if (!current.costClass || current.costClass === currentClassification.costClass) {
          next.costClass = nextClassification.costClass;
        }

        if (!current.costType || current.costType === currentClassification.costType) {
          next.costType = nextClassification.costType;
        }
      }

      return next;
    });
  };

  const handleAnalyzeReceipt = async () => {
    if (!receipt) {
      setError("Add a receipt image first.");
      return;
    }

    setError("");
    setIsAnalyzing(true);

    try {
      const payload = new FormData();
      payload.append("investmentId", investmentId);
      payload.append("receipt", receipt);

      const analysis = await analyzeExpenseReceipt(payload);
      const suggestedBudgetItemId = analysis?.suggestedBudgetItem?._id || "";
      const nextBudgetItem =
        budgetItems.find((item) => item._id === suggestedBudgetItemId) || null;
      const suggestedVendorId = analysis?.suggestedVendor?._id || "";
      const matchedAward =
        nextBudgetItem?.awards?.find((award) => {
          const vendorId =
            typeof award.vendor === "object" ? award.vendor?._id || "" : award.vendor || "";
          return vendorId && vendorId === suggestedVendorId;
        }) || null;

      setReceiptAnalysis(analysis);
      setReceiptRecordId(analysis?.receiptRecordId || "");
      setFormData((current) => {
        const nextDraft = {
          ...current,
          budgetItemId: suggestedBudgetItemId || current.budgetItemId,
          awardId: matchedAward?.awardId || "",
          vendorId: suggestedVendorId || current.vendorId,
          payeeName: analysis?.extracted?.vendorName || current.payeeName,
          title: analysis?.extracted?.title || current.title,
          description: analysis?.extracted?.description || current.description,
          amount:
            analysis?.extracted?.amount !== null && analysis?.extracted?.amount !== undefined
              ? String(analysis.extracted.amount)
              : current.amount,
          date: analysis?.extracted?.expenseDate || current.date,
          notes: analysis?.extracted?.notes || current.notes,
          entryMethod: "receipt_ai",
          status:
            !initialValues.status && current.status === "paid" ? "draft" : current.status,
        };
        const nextClassification = resolvePaymentClassification({
          ...nextDraft,
          budgetItem: nextBudgetItem,
          payeeName: nextDraft.payeeName,
        });

        return {
          ...nextDraft,
          costClass: nextClassification.costClass,
          costType: nextClassification.costType,
        };
      });
    } catch (analysisError) {
      setError(analysisError.message || "Failed to analyze receipt.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title || !formData.amount) {
      setError("Title and amount are required.");
      return;
    }

    if (mode === "receipt" && !receipt && !receiptRecordId && !existingReceiptSupport) {
      setError("Upload a receipt or switch to manual payment capture.");
      return;
    }

    if (!formData.vendorId && !formData.payeeName.trim() && !formData.awardId) {
      setError("Choose a vendor, select a vendor commitment, or enter the payee name.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      if (isEditing) {
        const updatePayload = {
          budgetItemId: formData.budgetItemId || "",
          awardId: formData.awardId || "",
          fundingSourceId: formData.fundingSourceId || "",
          drawRequestId: formData.drawRequestId || "",
          vendor: formData.vendorId || "",
          payeeName: formData.payeeName.trim(),
          title: formData.title.trim(),
          description: formData.description.trim(),
          amount: Number(formData.amount),
          date: formData.date,
          notes: formData.notes.trim(),
          entryMethod: formData.entryMethod,
          status: formData.status,
          paymentMethod: formData.paymentMethod,
          recurringCategory: formData.recurringCategory,
          costClass: formData.costClass,
          costType: formData.costType,
        };

        if (receiptSupportWasChanged || initialLinkedReceiptRecordId) {
          updatePayload.projectReceiptId = receiptRecordId || "";
        }

        await updateExpense(editingExpense._id, updatePayload);
      } else {
        const payload = new FormData();
        payload.append("investmentId", investmentId);
        if (formData.budgetItemId) payload.append("budgetItemId", formData.budgetItemId);
        if (formData.awardId) payload.append("awardId", formData.awardId);
        if (formData.fundingSourceId) payload.append("fundingSourceId", formData.fundingSourceId);
        if (formData.drawRequestId) payload.append("drawRequestId", formData.drawRequestId);
        if (formData.vendorId) payload.append("vendor", formData.vendorId);
        if (formData.payeeName.trim()) payload.append("payeeName", formData.payeeName.trim());
        payload.append("title", formData.title.trim());
        payload.append("description", formData.description.trim());
        payload.append("amount", formData.amount);
        payload.append("date", formData.date);
        payload.append("notes", formData.notes.trim());
        payload.append("entryMethod", formData.entryMethod);
        payload.append("status", formData.status);
        payload.append("paymentMethod", formData.paymentMethod);
        payload.append("recurringCategory", formData.recurringCategory);
        payload.append("costClass", formData.costClass);
        payload.append("costType", formData.costType);
        if (receiptRecordId) payload.append("projectReceiptId", receiptRecordId);
        if (receiptAnalysis) {
          payload.append(
            "receiptExtraction",
            JSON.stringify({
              extracted: receiptAnalysis.extracted || null,
              suggestedVendor: receiptAnalysis.suggestedVendor || null,
              suggestedBudgetItem: receiptAnalysis.suggestedBudgetItem || null,
            })
          );
        }
        if (!receiptRecordId && receipt) payload.append("receipt", receipt);

        await createExpense(payload);
      }

      toast.success(isEditing ? "Payment updated." : "Payment saved.");
      await onSuccess?.();
      handleClose();
    } catch (saveError) {
      setError(saveError.message || `Failed to ${isEditing ? "update" : "save"} payment.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="surface-panel-strong max-h-[92vh] w-full max-w-6xl overflow-y-auto px-6 py-6 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">{isEditing ? "Edit payment" : "Payment capture"}</span>
            <h2 className="mt-4 text-[2rem] font-medium tracking-tight text-ink-900">
              {isEditing ? "Update project payment" : "Record project payment"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              {isEditing
                ? "Adjust classification, scope, payee, capital links, and status without losing the existing ledger history tied to this payment."
                : "Capture a construction payment, lender fee, closing cost, holding cost, or soft cost with the right scope, capital, and receipt links from the start."}
            </p>
          </div>

          <button type="button" onClick={handleClose} className="ghost-action">
            Close
          </button>
        </div>

        {isEditing ? (
          <div className="mt-8 rounded-[22px] border border-ink-100 bg-white/90 px-4 py-4 text-sm text-ink-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-ink-100 bg-ink-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700">
                {mode === "receipt" ? "Receipt-backed payment" : "Manual payment"}
              </span>
              <span className="rounded-full border border-ink-100 bg-ink-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700">
                {getExpenseStatusLabel(formData.status)}
              </span>
            </div>
            <p className="mt-3 leading-6">
              Receipt support stays attached while you update the payment details here. Use this
              edit flow for classification, scope, capital links, and status corrections.
            </p>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleModeSelect("manual")}
              className={mode === "manual" ? "primary-action" : "secondary-action"}
            >
              Manual payment
            </button>
            <button
              type="button"
              onClick={() => handleModeSelect("receipt")}
              className={mode === "receipt" ? "primary-action" : "secondary-action"}
            >
              Receipt assist
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <SectionCard
                eyebrow="Payment profile"
                title="Start from the type of payment you are recording"
                description="Use a preset to classify the payment fast, then fine-tune the details below."
              >
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {PAYMENT_CAPTURE_PRESETS.map((preset) => {
                    const isActive = activePresetId === preset.id;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`rounded-[20px] border px-4 py-4 text-left transition ${
                          isActive
                            ? "border-verdigris-300 bg-verdigris-50/70 shadow-[0_14px_30px_rgba(26,89,78,0.08)]"
                            : "border-ink-100 bg-white/90 hover:border-ink-200 hover:bg-ink-50/70"
                        }`}
                      >
                        <p className="text-sm font-semibold text-ink-900">{preset.label}</p>
                        <p className="mt-2 text-sm leading-6 text-ink-500">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Cost class</span>
                    <select
                      name="costClass"
                      value={formData.costClass}
                      onChange={handleChange}
                      className="auth-input appearance-none"
                    >
                      {PAYMENT_COST_CLASS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Cost type</span>
                    <select
                      name="costType"
                      value={formData.costType}
                      onChange={handleChange}
                      className="auth-input appearance-none"
                    >
                      {costTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div
                  className={`mt-5 rounded-[18px] border px-4 py-4 text-sm ${
                    needsScopeLink
                      ? "border-clay-200 bg-clay-50 text-clay-700"
                      : "border-sand-200 bg-sand-50 text-sand-800"
                  }`}
                >
                  <p className="font-semibold">Scope guidance</p>
                  <p className="mt-2">{getPaymentScopeExpectation(formData.costClass)}.</p>
                </div>
              </SectionCard>

              {mode === "receipt" && !isEditing ? (
                <SectionCard
                  eyebrow="Receipt assist"
                  title="Upload a receipt and let AI draft the payment"
                  description="AI will suggest vendor, scope, amount, and payment date before you save."
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="rounded-[18px] border border-ink-100 bg-ink-50/60 px-4 py-4 text-sm text-ink-600">
                      <p className="font-semibold text-ink-900">Receipt support</p>
                      <p className="mt-2">{receiptLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAnalyzeReceipt}
                      disabled={!receipt || isAnalyzing}
                      className="secondary-action disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isAnalyzing ? "Reading receipt..." : "Use AI to read receipt"}
                    </button>
                  </div>

                  <label className="mt-5 block rounded-[20px] border border-dashed border-ink-200 bg-ink-50/60 px-4 py-5 text-sm text-ink-600">
                    <span className="block font-medium text-ink-800">Receipt image</span>
                    <span className="mt-1 block">PNG or JPG works best for AI matching.</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(event) => {
                        setReceipt(event.target.files?.[0] || null);
                        setReceiptRecordId("");
                        setReceiptAnalysis(null);
                      }}
                      className="mt-4 block w-full text-sm text-ink-600"
                    />
                  </label>

                  {receiptAnalysis ? (
                    <div className="mt-5 rounded-[20px] border border-verdigris-200 bg-verdigris-50 px-4 py-4 text-sm text-verdigris-800">
                      <p className="font-semibold">Receipt suggestions ready</p>
                      <p className="mt-2">
                        This receipt is now saved to the project and will be linked when you confirm
                        the payment below.
                      </p>
                      <p className="mt-2">
                        Vendor:{" "}
                        {receiptAnalysis?.suggestedVendor?.name ||
                          receiptAnalysis?.extracted?.vendorName ||
                          "No match"}
                      </p>
                      <p className="mt-1">
                        Scope item: {receiptAnalysis?.suggestedBudgetItem?.category || "No match"}
                      </p>
                    </div>
                  ) : null}
                </SectionCard>
              ) : null}

              <SectionCard
                eyebrow="Scope and payee"
                title="Tie the payment to the right job and the right party"
                description="Use scope and awarded vendor links when the payment belongs to work in the field."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Scope item</span>
                    <select
                      name="budgetItemId"
                      value={formData.budgetItemId}
                      onChange={handleChange}
                      className="auth-input appearance-none"
                    >
                      <option value="">Project-level / non-scope payment</option>
                      {budgetItems.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Selected vendor commitment</span>
                    <select
                      name="awardId"
                      value={formData.awardId}
                      onChange={handleChange}
                      className="auth-input appearance-none"
                      disabled={!selectedBudgetItem?.awards?.length}
                    >
                      <option value="">No specific commitment</option>
                      {(selectedBudgetItem?.awards || []).map((award) => (
                        <option key={award.awardId} value={award.awardId}>
                          {(typeof award.vendor === "object" ? award.vendor?.name : "") ||
                            award.vendorName ||
                            "Selected vendor"}
                          {award.description ? ` - ${award.description}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Vendor from your list</span>
                    <select
                      name="vendorId"
                      value={formData.vendorId}
                      onChange={handleChange}
                      className="auth-input appearance-none"
                    >
                      <option value="">No linked vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.name}
                          {vendor.trade ? ` - ${vendor.trade}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Payee name</span>
                    <input
                      name="payeeName"
                      value={formData.payeeName}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="Use this for stores, lenders, title companies, or one-off payments"
                    />
                  </label>
                </div>

                {selectedAward ? (
                  <div className="mt-5 rounded-[20px] border border-sand-200 bg-sand-50 px-4 py-4 text-sm text-sand-800">
                    <p className="font-semibold">Payment will be tied to a selected vendor commitment</p>
                    <p className="mt-2">
                      {(typeof selectedAward.vendor === "object" ? selectedAward.vendor?.name : "") ||
                        selectedAward.vendorName ||
                        "Selected vendor"}
                      {selectedAward.description ? ` • ${selectedAward.description}` : ""}
                    </p>
                  </div>
                ) : null}
              </SectionCard>

              <SectionCard
                eyebrow="Payment details"
                title="Record the actual payment"
                description="Use a title someone on your team will understand instantly when they see it in the ledger."
              >
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Title</span>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="Draw fee, permit payment, framing deposit, utility bill"
                      required
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Amount</span>
                    <input
                      name="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleChange}
                      className="auth-input"
                      required
                    />
                  </label>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Description</span>
                    <textarea
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="Optional note about what was purchased or paid."
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Date</span>
                    <input
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </label>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Capital links"
                title="Connect this payment to the money that funded it"
                description="Tie the payment to a funding source or lender draw when that context matters for capital tracking."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Funding source</span>
                    <select
                      name="fundingSourceId"
                      value={formData.fundingSourceId}
                      onChange={handleChange}
                      className="auth-input appearance-none"
                    >
                      <option value="">No funding source selected</option>
                      {fundingSources.map((source, index) => (
                        <option key={source.sourceId || `source-${index}`} value={source.sourceId || ""}>
                          {getFundingSourceLabel(source, index)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Draw request</span>
                    <select
                      name="drawRequestId"
                      value={formData.drawRequestId}
                      onChange={handleChange}
                      className="auth-input appearance-none"
                      disabled={!filteredDrawRequests.length}
                    >
                      <option value="">No specific draw</option>
                      {filteredDrawRequests.map((drawRequest, index) => (
                        <option key={drawRequest.drawId || `draw-${index}`} value={drawRequest.drawId || ""}>
                          {getDrawRequestLabel(drawRequest, index)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {selectedDrawRequest ? (
                  <div className="mt-5 rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800">
                    <p className="font-semibold">Draw-linked payment</p>
                    <p className="mt-2">
                      This payment will roll into{" "}
                      {getDrawRequestLabel(
                        selectedDrawRequest,
                        Math.max(
                          drawRequests.findIndex((request) => request.drawId === selectedDrawRequest.drawId),
                          0
                        )
                      )}
                      {selectedDrawRequest.sourceId ? " under the connected funding source." : "."}
                    </p>
                  </div>
                ) : null}
              </SectionCard>

              <SectionCard
                eyebrow="AP workflow"
                title="Decide how this payment should move through the ledger"
                description="Track approval state, payment method, and whether it belongs to recurring carry."
              >
                <div className="grid gap-5 md:grid-cols-3">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Status</span>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="auth-input appearance-none"
                    >
                      {EXPENSE_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Payment method</span>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="auth-input appearance-none"
                    >
                      {EXPENSE_PAYMENT_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Recurring carry tag</span>
                    <select
                      name="recurringCategory"
                      value={formData.recurringCategory}
                      onChange={handleChange}
                      className="auth-input appearance-none"
                    >
                      {EXPENSE_RECURRING_CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value || "none"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Supporting detail"
                title="Attach notes and receipt support"
                description="Keep enough detail here so lenders and teammates do not need to guess what this payment was for."
              >
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Notes</span>
                    <textarea
                      name="notes"
                      rows="5"
                      value={formData.notes}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="Optional internal note."
                    />
                  </label>

                  <div className="space-y-3">
                    <div className="rounded-[18px] border border-ink-100 bg-ink-50/60 px-4 py-4 text-sm text-ink-600">
                      <p className="font-semibold text-ink-900">Receipt status</p>
                      <p className="mt-2">{receiptLabel}</p>
                    </div>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-ink-700">Use saved project receipt</span>
                      <select
                        value={receiptRecordId}
                        onChange={handleSavedReceiptChange}
                        className="auth-input appearance-none"
                      >
                        <option value="">No linked project receipt</option>
                        {availableProjectReceipts.map((receiptOption) => (
                          <option key={receiptOption._id} value={receiptOption._id}>
                            {formatReceiptSummaryLabel(receiptOption)}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs leading-5 text-ink-500">
                        Reuse a saved receipt from the project backlog when you want this payment
                        tied to existing support without uploading another file.
                      </p>
                    </label>

                    {selectedReceiptRecord ? (
                      <div className="rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800">
                        <p className="font-semibold">Selected project receipt</p>
                        <p className="mt-2">{formatReceiptSummaryLabel(selectedReceiptRecord)}</p>
                        <p className="mt-2 text-sky-700">
                          {selectedReceiptRecord.budgetItem?.category || "Project-level"}{" "}
                          {selectedReceiptRecord.status ? `• ${selectedReceiptRecord.status}` : ""}
                        </p>
                        {selectedReceiptRecord.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                selectedReceiptRecord.receiptUrl,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                            className="ghost-action mt-4"
                          >
                            Open selected receipt
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {isEditing && !selectedReceiptRecord ? (
                      <div className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4 text-sm text-ink-600">
                        <p className="font-semibold text-ink-900">Receipt trail is preserved</p>
                        <p className="mt-2 leading-6">
                          Update the payment details here without disturbing the existing receipt
                          support already tied to this ledger entry.
                        </p>
                        {editingExpense?.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(editingExpense.receiptUrl, "_blank", "noopener,noreferrer")
                            }
                            className="ghost-action mt-4"
                          >
                            Open current receipt
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-ink-700">Attach receipt</span>
                        {receiptRecordId ? (
                          <p className="text-xs leading-5 text-ink-500">
                            AI already saved the analyzed receipt to the project. Leave this empty unless you
                            want to attach a different file without re-running AI.
                          </p>
                        ) : null}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,application/pdf"
                          onChange={(event) => {
                            setReceipt(event.target.files?.[0] || null);
                            setReceiptRecordId("");
                          }}
                          className="auth-input file:mr-4 file:rounded-full file:border-0 file:bg-verdigris-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-verdigris-700"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="space-y-6 xl:sticky xl:top-4 self-start">
              <SectionCard
                eyebrow="Capture summary"
                title="What this payment will look like in the workspace"
                description="Use this side panel to verify the payment before it hits the ledger."
              >
                <div className="grid gap-3">
                  <SummaryMetric
                    icon={BanknotesIcon}
                    label="Classification"
                    value={`${getPaymentCostClassLabel(formData.costClass)} / ${
                      getPaymentCostTypeLabel(formData.costType) || "Type needed"
                    }`}
                    hint={formData.title || "Choose the payment profile and add a clear title."}
                  />
                  <SummaryMetric
                    icon={ClipboardDocumentListIcon}
                    label="Scope"
                    value={selectedBudgetItem?.category || "Project-level"}
                    hint={selectedAward?.vendorName || "No commitment linked"}
                  />
                  <SummaryMetric
                    icon={DocumentTextIcon}
                    label="Payee"
                    value={resolvedPayeeLabel}
                    hint={formData.amount ? `$${Number(formData.amount || 0).toLocaleString()}` : "Amount pending"}
                  />
                  <SummaryMetric
                    icon={ReceiptPercentIcon}
                    label="Receipt support"
                    value={hasReceiptSupport ? "Attached" : "Open"}
                    hint={receiptLabel}
                  />
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Readiness"
                title="Checks before save"
                description="These checks help keep the payments ledger clean, searchable, and lender-ready."
              >
                <div className="space-y-3">
                  {readinessChecks.map((check) => (
                    <div
                      key={check.key}
                      className="flex items-start justify-between gap-4 rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{check.label}</p>
                        <p className="mt-1 text-sm leading-6 text-ink-500">{check.helper}</p>
                      </div>
                      <ReadinessPill ready={check.ready} label={check.ready ? "Ready" : "Open"} />
                    </div>
                  ))}
                </div>
              </SectionCard>

              {needsScopeLink ? (
                <div className="rounded-[22px] border border-clay-200 bg-clay-50 px-4 py-4 text-sm text-clay-700">
                  <div className="flex items-start gap-3">
                    <CheckBadgeIcon className="mt-0.5 h-5 w-5 flex-none" />
                    <div>
                      <p className="font-semibold">Construction payment still needs scope</p>
                      <p className="mt-2 leading-6">
                        This is okay if the payment truly belongs at the project level, but most
                        construction payments are more useful when linked to a scope item.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedFundingSource || selectedDrawRequest ? (
                <div className="rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800">
                  <div className="flex items-start gap-3">
                    <SparklesIcon className="mt-0.5 h-5 w-5 flex-none" />
                    <div>
                      <p className="font-semibold">Capital context is in place</p>
                      <p className="mt-2 leading-6">
                        {selectedDrawRequest
                          ? `This payment will be tied to ${getDrawRequestLabel(
                              selectedDrawRequest,
                              Math.max(
                                drawRequests.findIndex(
                                  (request) => request.drawId === selectedDrawRequest.drawId
                                ),
                                0
                              )
                            )}.`
                          : `This payment will be tracked under ${
                              selectedFundingSource
                                ? getFundingSourceLabel(
                                    selectedFundingSource,
                                    Math.max(
                                      fundingSources.findIndex(
                                        (source) =>
                                          source.sourceId === selectedFundingSource.sourceId
                                      ),
                                      0
                                    )
                                  )
                                : "the selected funding source"
                            }.`}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {receiptAnalysis ? (
                <div className="rounded-[22px] border border-verdigris-200 bg-verdigris-50 px-4 py-4 text-sm text-verdigris-800">
                  <div className="flex items-start gap-3">
                    <SparklesIcon className="mt-0.5 h-5 w-5 flex-none" />
                    <div>
                      <p className="font-semibold">AI suggestions loaded</p>
                      <p className="mt-2 leading-6">
                        Receipt AI suggested{" "}
                        {receiptAnalysis?.suggestedVendor?.name ||
                          receiptAnalysis?.extracted?.vendorName ||
                          "a payee"}{" "}
                        and{" "}
                        {receiptAnalysis?.suggestedBudgetItem?.category || "no specific scope item"}.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="rounded-[18px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-ink-100 pt-2">
            <button type="button" onClick={handleClose} className="ghost-action" disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? (isEditing ? "Saving changes..." : "Saving...") : isEditing ? "Save changes" : "Save payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
