import React, { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { deleteBid, importBid } from "../utils/api";
import BidDetailModal from "./BidDetailModal";

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "—";
  return parsed.toLocaleDateString();
};

const normalizeAmount = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeRenovationItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => ({
      itemId: String(item.itemId || `renovation-item-${index}`),
      name: String(item.name || "Untitled item"),
      category: String(item.category || "custom"),
      budget: normalizeAmount(item.budget),
      status: String(item.status || "planning"),
      scopeDescription: String(item.scopeDescription || ""),
    }));
};

const normalizeBids = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item && typeof item === "object" && !Array.isArray(item));
};

class BidsTabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Bid management render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="section-card px-5 py-10 text-center">
          <h3 className="text-xl font-semibold text-ink-900">Bid management needs a refresh</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Something in the existing quote data could not be rendered. Refresh the page and try
            again. If it still happens, this lead likely has an older bid record we need to clean up.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

const BidsTabContent = ({ leadId, bids = [], renovationItems = [], onUpdate }) => {
  const fileInputRef = useRef(null);

  const [fileToUpload, setFileToUpload] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);

  const safeBids = useMemo(() => normalizeBids(bids), [bids]);
  const safeRenovationItems = useMemo(
    () => normalizeRenovationItems(renovationItems),
    [renovationItems]
  );

  const itemComparisons = useMemo(() => {
    return safeRenovationItems.map((item) => {
      const matchedQuotes = safeBids
        .flatMap((bid) =>
          (Array.isArray(bid.renovationAssignments) ? bid.renovationAssignments : [])
            .filter(
              (assignment) => assignment && typeof assignment === "object" && !Array.isArray(assignment)
            )
            .filter((assignment) => assignment.renovationItemId === item.itemId)
            .map((assignment) => ({
              bidId: bid._id,
              contractorName: bid.contractorName || "Unknown contractor",
              amount: normalizeAmount(assignment.amount),
              confidence: normalizeAmount(assignment.confidence),
              scopeSummary: assignment.scopeSummary || "",
              matchedLineItems: Array.isArray(assignment.matchedLineItems)
                ? assignment.matchedLineItems
                : [],
              bidDate: bid.bidDate,
              totalAmount: bid.totalAmount,
              sourceDocumentUrl: bid.sourceDocumentUrl,
              sourceFileName: bid.sourceFileName,
              bid,
            }))
        )
        .filter((quote) => quote.amount !== null)
        .sort((left, right) => left.amount - right.amount);

      const budget = normalizeAmount(item.budget);
      const bestQuote = matchedQuotes[0] || null;
      const variance =
        budget !== null && bestQuote?.amount !== null ? bestQuote.amount - budget : null;

      return {
        ...item,
        budget,
        matchedQuotes,
        bestQuote,
        variance,
      };
    });
  }, [safeBids, safeRenovationItems]);

  const bidsWithoutAssignments = useMemo(
    () =>
      safeBids.filter(
        (bid) =>
          !Array.isArray(bid.renovationAssignments) || bid.renovationAssignments.length === 0
      ),
    [safeBids]
  );

  const totalBudget = useMemo(
    () => itemComparisons.reduce((sum, item) => sum + (item.budget || 0), 0),
    [itemComparisons]
  );

  const bestSplitTotal = useMemo(
    () => itemComparisons.reduce((sum, item) => sum + (item.bestQuote?.amount || 0), 0),
    [itemComparisons]
  );

  const itemsWithQuotesCount = itemComparisons.filter((item) => item.matchedQuotes.length > 0).length;

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    setFileToUpload(event.target.files?.[0] || null);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0] || null;
    if (droppedFile) {
      setFileToUpload(droppedFile);
    }
  };

  const handleImportBid = async () => {
    if (!fileToUpload) {
      toast.error("Select a quote file first.");
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append("leadId", leadId);
    formData.append("estimate", fileToUpload);

    const toastId = toast.loading("Uploading and matching the quote...");
    try {
      await importBid(formData);
      toast.success("Quote imported and matched to renovation items.", { id: toastId });
      setFileToUpload(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await onUpdate?.();
    } catch (error) {
      toast.error(error.message || "Failed to import bid.", { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteBid = async (bidId) => {
    if (!window.confirm("Delete this contractor quote?")) {
      return;
    }

    try {
      await deleteBid(bidId);
      toast.success("Quote deleted.");
      await onUpdate?.();
    } catch (error) {
      toast.error(error.message || "Failed to delete quote.");
    }
  };

  const handleViewDetails = (bid) => {
    setSelectedBid(bid);
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <BidDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        bid={selectedBid}
      />

      <div className="space-y-6">
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Bid management</span>
          <h2 className="mt-4 text-2xl font-semibold text-ink-900">
            Compare contractor quotes by renovation item
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
            Upload contractor bids here and the AI will try to map quote pricing to the renovation
            items from your plan, so you can compare budget versus real bids and mix contractors
            item by item.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="metric-tile p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Renovation Items
              </p>
              <p className="mt-3 text-2xl font-semibold text-ink-900">{safeRenovationItems.length}</p>
            </div>
            <div className="metric-tile p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Quotes Imported
              </p>
              <p className="mt-3 text-2xl font-semibold text-ink-900">{safeBids.length}</p>
            </div>
            <div className="metric-tile p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Planned Budget
              </p>
              <p className="mt-3 text-2xl font-semibold text-ink-900">
                {totalBudget ? formatCurrency(totalBudget) : "—"}
              </p>
            </div>
            <div className="metric-tile p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Best Split Price
              </p>
              <p className="mt-3 text-2xl font-semibold text-ink-900">
                {itemsWithQuotesCount ? formatCurrency(bestSplitTotal) : "—"}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Cheapest matched quote on each priced item.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <div className="space-y-6">
            <section className="section-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-ink-900">Import contractor quote</h3>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    Upload a PDF or image. The AI will extract pricing and try to match it to your
                    renovation items.
                  </p>
                </div>
                {!safeRenovationItems.length ? (
                  <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                    Add renovation items first
                  </span>
                ) : null}
              </div>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`mt-5 rounded-[24px] border-2 border-dashed px-5 py-8 text-center transition ${
                  isDragging
                    ? "border-ink-900 bg-sand-50"
                    : "border-ink-200 bg-white"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-base font-semibold text-ink-900">
                  Drag a contractor quote here
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  or choose a PDF/image file from your computer
                </p>
                <button type="button" onClick={handleChooseFile} className="secondary-action mt-4">
                  Choose file
                </button>
                {fileToUpload ? (
                  <p className="mt-4 text-sm font-medium text-ink-700">{fileToUpload.name}</p>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleImportBid}
                  disabled={isImporting || !fileToUpload}
                  className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isImporting ? "Importing..." : "Import quote with AI"}
                </button>
              </div>
            </section>

            <section className="space-y-4">
              {safeRenovationItems.length ? (
                itemComparisons.map((item) => (
                  <article key={item.itemId} className="section-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-ink-900">{item.name}</h3>
                          <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                            {item.category || "custom"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-ink-500">
                          {item.scopeDescription || "No contractor scope written for this item yet."}
                        </p>
                      </div>

                      <div className="min-w-[200px] rounded-[20px] bg-sand-50 px-4 py-4 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-ink-500">Budget</span>
                          <span className="font-semibold text-ink-900">
                            {item.budget !== null ? formatCurrency(item.budget) : "—"}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-4">
                          <span className="text-ink-500">Best quote</span>
                          <span className="font-semibold text-ink-900">
                            {item.bestQuote ? formatCurrency(item.bestQuote.amount) : "—"}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-4">
                          <span className="text-ink-500">Variance</span>
                          <span
                            className={`font-semibold ${
                              item.variance === null
                                ? "text-ink-900"
                                : item.variance > 0
                                  ? "text-red-600"
                                  : "text-verdigris-700"
                            }`}
                          >
                            {item.variance === null ? "—" : formatCurrency(item.variance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {item.bestQuote ? (
                      <div className="mt-4 rounded-[20px] border border-verdigris-100 bg-verdigris-50/60 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-verdigris-700">
                          Best current price
                        </p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-ink-900">
                            {item.bestQuote.contractorName}
                          </p>
                          <p className="text-sm font-semibold text-ink-900">
                            {formatCurrency(item.bestQuote.amount)}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-5 space-y-3">
                      {item.matchedQuotes.length ? (
                        item.matchedQuotes.map((quote) => (
                          <div
                            key={`${item.itemId}-${quote.bidId}`}
                            className="rounded-[20px] border border-ink-100 px-4 py-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-ink-900">
                                  {quote.contractorName}
                                </p>
                                <p className="mt-1 text-xs text-ink-400">
                                  Imported {formatDate(quote.bidDate)}
                                  {quote.confidence !== null
                                    ? ` • ${Math.round(quote.confidence * 100)}% match confidence`
                                    : ""}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-ink-900">
                                  {formatCurrency(quote.amount)}
                                </p>
                                <p className="mt-1 text-xs text-ink-400">
                                  Quote total {formatCurrency(quote.totalAmount)}
                                </p>
                              </div>
                            </div>

                            {quote.scopeSummary ? (
                              <p className="mt-3 text-sm leading-6 text-ink-600">
                                {quote.scopeSummary}
                              </p>
                            ) : null}

                            {quote.matchedLineItems.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {quote.matchedLineItems.map((lineItem) => (
                                  <span
                                    key={`${quote.bidId}-${lineItem}`}
                                    className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600"
                                  >
                                    {lineItem}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => handleViewDetails(quote.bid)}
                                className="ghost-action"
                              >
                                View full quote
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[20px] border border-dashed border-ink-200 bg-sand-50/60 px-4 py-4 text-sm text-ink-500">
                          No contractor quote is matched to this item yet.
                        </div>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <section className="section-card px-5 py-10 text-center">
                  <h3 className="text-xl font-semibold text-ink-900">No renovation items yet</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    Build the renovation plan first so quotes can be mapped to real scope items and
                    compared against budgets.
                  </p>
                </section>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="section-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Coverage status
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500">Items with quotes</span>
                  <span className="font-semibold text-ink-900">
                    {itemsWithQuotesCount} / {safeRenovationItems.length}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500">Project-only quotes</span>
                  <span className="font-semibold text-ink-900">{bidsWithoutAssignments.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500">Imported files</span>
                  <span className="font-semibold text-ink-900">{safeBids.length}</span>
                </div>
              </div>
            </section>

            <section className="section-card p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Quote library
                </p>
                <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                  {safeBids.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {safeBids.length ? (
                  safeBids.map((bid) => (
                    <div key={bid._id} className="rounded-[18px] border border-ink-100 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink-900">
                            {bid.contractorName || "Unknown contractor"}
                          </p>
                          <p className="mt-1 text-xs text-ink-400">
                            {formatDate(bid.bidDate)}
                            {bid.sourceFileName ? ` • ${bid.sourceFileName}` : ""}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-ink-900">
                          {formatCurrency(bid.totalAmount)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.isArray(bid.renovationAssignments) && bid.renovationAssignments.length ? (
                          bid.renovationAssignments
                            .filter(
                              (assignment) =>
                                assignment &&
                                typeof assignment === "object" &&
                                !Array.isArray(assignment)
                            )
                            .map((assignment) => (
                            <span
                              key={`${bid._id}-${assignment.renovationItemId}`}
                              className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600"
                            >
                              {assignment.renovationItemName || "Matched item"}{" "}
                              {assignment.amount !== null && assignment.amount !== undefined
                                ? `• ${formatCurrency(assignment.amount)}`
                                : ""}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                            Project quote only
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(bid)}
                          className="ghost-action"
                        >
                          View details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBid(bid._id)}
                          className="ghost-action text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink-500">No contractor quotes have been imported yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

const BidsTab = (props) => (
  <BidsTabErrorBoundary>
    <BidsTabContent {...props} />
  </BidsTabErrorBoundary>
);

export default BidsTab;
