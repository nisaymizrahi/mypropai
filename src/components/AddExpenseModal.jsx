import React, { useEffect, useMemo, useState } from "react";

import { analyzeExpenseReceipt, createExpense } from "../utils/api";
import { getDrawRequestLabel, getFundingSourceLabel } from "../utils/capitalStack";
import {
  EXPENSE_PAYMENT_METHOD_OPTIONS,
  EXPENSE_RECURRING_CATEGORY_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
} from "../utils/expenseOperations";

const buildInitialForm = ({
  budgetItems = [],
  defaultBudgetItemId = "",
  defaultAwardId = "",
  fundingSources = [],
  drawRequests = [],
  defaultFundingSourceId = "",
  defaultDrawRequestId = "",
  initialValues = {},
}) => {
  const fallbackBudgetItem =
    budgetItems.find((item) => item._id === defaultBudgetItemId) || budgetItems[0] || null;
  const nextBudgetItemId = defaultBudgetItemId || "";
  const matchingAward = fallbackBudgetItem?.awards?.find((award) => award.awardId === defaultAwardId);
  const matchingDrawRequest =
    drawRequests.find((request) => request.drawId === defaultDrawRequestId) || null;
  const nextFundingSourceId =
    defaultFundingSourceId ||
    matchingDrawRequest?.sourceId ||
    (fundingSources.length === 1 ? fundingSources[0].sourceId || "" : "");

  return {
    budgetItemId: initialValues.budgetItemId || nextBudgetItemId,
    awardId: initialValues.awardId || matchingAward?.awardId || "",
    fundingSourceId: initialValues.fundingSourceId || nextFundingSourceId,
    drawRequestId: initialValues.drawRequestId || defaultDrawRequestId || "",
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
    entryMethod: initialValues.entryMethod || "manual",
    status: initialValues.status || "paid",
    paymentMethod: initialValues.paymentMethod || "other",
    recurringCategory: initialValues.recurringCategory || "",
  };
};

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
  fundingSources = [],
  drawRequests = [],
  defaultFundingSourceId = "",
  defaultDrawRequestId = "",
  initialValues = {},
}) => {
  const [mode, setMode] = useState(initialMode === "receipt" ? "receipt" : "manual");
  const [formData, setFormData] = useState(() =>
    buildInitialForm({
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setMode(initialMode === "receipt" ? "receipt" : "manual");
    setFormData(
      buildInitialForm({
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
    setReceiptRecordId("");
    setError("");
    setIsSaving(false);
    setIsAnalyzing(false);
  }, [
    budgetItems,
    defaultAwardId,
    defaultBudgetItemId,
    defaultDrawRequestId,
    defaultFundingSourceId,
    drawRequests,
    fundingSources,
    initialValues,
    initialMode,
    isOpen,
  ]);

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

  const filteredDrawRequests = useMemo(() => {
    if (!formData.fundingSourceId) {
      return drawRequests;
    }

    return drawRequests.filter(
      (request) => !request.sourceId || request.sourceId === formData.fundingSourceId
    );
  }, [drawRequests, formData.fundingSourceId]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === "budgetItemId") {
        next.awardId = "";
      }

      if (name === "awardId") {
        const nextAward = selectedBudgetItem?.awards?.find((award) => award.awardId === value);
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
      setFormData((current) => ({
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
      }));
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

    if (!formData.vendorId && !formData.payeeName.trim() && !formData.awardId) {
      setError("Choose a vendor, select a vendor commitment, or enter the payee name.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
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
      await onSuccess?.();
      handleClose();
    } catch (saveError) {
      setError(saveError.message || "Failed to save expense.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="surface-panel-strong max-h-[92vh] w-full max-w-3xl overflow-y-auto px-6 py-6 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">Expense capture</span>
            <h2 className="mt-4 text-[2rem] font-medium tracking-tight text-ink-900">
              Add project expense
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              Capture a manual payment, tie it to a chosen vendor commitment, or let AI read a
              receipt image and prefill the details.
            </p>
          </div>

          <button type="button" onClick={handleClose} className="ghost-action">
            Close
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={mode === "manual" ? "primary-action" : "secondary-action"}
          >
            Manual expense
          </button>
          <button
            type="button"
            onClick={() => setMode("receipt")}
            className={mode === "receipt" ? "primary-action" : "secondary-action"}
          >
            Receipt assist
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {mode === "receipt" ? (
            <section className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Upload a receipt image</p>
                  <p className="mt-1 text-sm text-ink-500">
                    AI will suggest the vendor, scope item, amount, and payment date before you save.
                  </p>
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
                    the expense below.
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
            </section>
          ) : null}

          <section className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
            <div>
              <p className="text-sm font-semibold text-ink-900">Capital stack links</p>
              <p className="mt-1 text-sm leading-6 text-ink-500">
                Optionally tie this payment to a funding source or specific draw request so your
                costs, lender reporting, and finance dashboard stay connected.
              </p>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
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
                    <option
                      key={drawRequest.drawId || `draw-${index}`}
                      value={drawRequest.drawId || ""}
                    >
                      {getDrawRequestLabel(drawRequest, index)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedDrawRequest ? (
              <div className="mt-5 rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800">
                <p className="font-semibold">Draw-linked expense</p>
                <p className="mt-2">
                  This expense will roll into{" "}
                  {getDrawRequestLabel(
                    selectedDrawRequest,
                    Math.max(
                      drawRequests.findIndex(
                        (request) => request.drawId === selectedDrawRequest.drawId
                      ),
                      0
                    )
                  )}
                  {selectedDrawRequest.sourceId ? " under the connected funding source." : "."}
                </p>
              </div>
            ) : null}
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Scope item</span>
              <select
                name="budgetItemId"
                value={formData.budgetItemId}
                onChange={handleChange}
                className="auth-input appearance-none"
              >
                <option value="">Project-level / custom expense</option>
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
          </div>

          <div className="grid gap-5 md:grid-cols-2">
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
                placeholder="Use this for stores or one-off custom expenses"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Title</span>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="auth-input"
                placeholder="Deposit, appliance order, permit fee, cabinet payment"
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

          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
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

          <section className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
            <div>
              <p className="text-sm font-semibold text-ink-900">AP workflow</p>
              <p className="mt-1 text-sm leading-6 text-ink-500">
                Track approval state, how the payment was made, and whether this belongs to a
                recurring carry category.
              </p>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
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
          </section>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-700">Notes</span>
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              className="auth-input"
              placeholder="Optional internal note."
            />
          </label>

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

          {selectedAward ? (
            <div className="rounded-[20px] border border-sand-200 bg-sand-50 px-4 py-4 text-sm text-sand-800">
              <p className="font-semibold">Expense will be tied to a selected vendor commitment</p>
              <p className="mt-2">
                {(typeof selectedAward.vendor === "object" ? selectedAward.vendor?.name : "") ||
                  selectedAward.vendorName ||
                  "Selected vendor"}
                {selectedAward.description ? ` • ${selectedAward.description}` : ""}
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[18px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={handleClose} className="ghost-action" disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
