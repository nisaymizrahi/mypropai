import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { createBid, deleteBid, getVendors, importBid, updateBid } from "../utils/api";
import AddVendorModal from "./AddVendorModal";
import BidDetailModal from "./BidDetailModal";

const normalizeText = (value, fallback = "") => {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
};

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

const buildManualAssignmentId = () =>
  `assignment-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const humanizeLabel = (value, fallback = "") => {
  const normalized = normalizeText(value, fallback).replace(/[-_]+/g, " ").trim();
  if (!normalized) return fallback;

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeVendorSnapshot = (value = {}) => ({
  name: normalizeText(value.name, ""),
  contactName: normalizeText(value.contactName, ""),
  email: normalizeText(value.email, ""),
  phone: normalizeText(value.phone, ""),
  address: normalizeText(value.address, ""),
});

const normalizeVendor = (vendor, index) => {
  if (!vendor || typeof vendor !== "object" || Array.isArray(vendor)) {
    return null;
  }

  return {
    _id: normalizeText(vendor._id, `vendor-${index}`),
    name: normalizeText(vendor.name, "Unnamed vendor"),
    trade: normalizeText(vendor.trade, ""),
    contactInfo: normalizeVendorSnapshot(vendor.contactInfo || {}),
  };
};

const normalizeVendors = (vendors) => {
  if (!Array.isArray(vendors)) {
    return [];
  }

  return vendors.map(normalizeVendor).filter(Boolean);
};

const normalizeRenovationItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => ({
      itemId: normalizeText(item.itemId, `renovation-item-${index}`),
      name: normalizeText(item.name, "Untitled item"),
      category: normalizeText(item.category, "custom"),
      budget: normalizeAmount(item.budget),
      status: normalizeText(item.status, "planning"),
      scopeDescription: normalizeText(item.scopeDescription, ""),
    }));
};

const normalizeMatchedLineItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => normalizeText(item))
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeBidAssignments = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => ({
      renovationItemId: normalizeText(item.renovationItemId, `assignment-${index}`),
      renovationItemName: normalizeText(item.renovationItemName, "Matched item"),
      amount: normalizeAmount(item.amount),
      confidence: normalizeAmount(item.confidence),
      scopeSummary: normalizeText(item.scopeSummary, ""),
      matchedLineItems: normalizeMatchedLineItems(item.matchedLineItems),
    }))
    .filter((item) => item.amount !== null || item.scopeSummary || item.matchedLineItems.length);
};

const normalizeBidItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      description: normalizeText(item.description, ""),
      category: normalizeText(item.category, "—"),
      cost: normalizeAmount(item.cost),
    }))
    .filter((item) => item.description || item.cost !== null);
};

const normalizeBids = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => ({
      _id: normalizeText(item._id, `bid-${index}`),
      contractorName: normalizeText(item.contractorName, "Unknown contractor"),
      totalAmount: normalizeAmount(item.totalAmount),
      bidDate: item.bidDate || item.createdAt || null,
      sourceType: normalizeText(item.sourceType, "imported"),
      sourceDocumentUrl: normalizeText(item.sourceDocumentUrl, ""),
      sourceFileName: normalizeText(item.sourceFileName, ""),
      notes: normalizeText(item.notes, ""),
      vendor:
        item.vendor && typeof item.vendor === "object" && !Array.isArray(item.vendor)
          ? normalizeVendor(item.vendor, index)
          : null,
      vendorSnapshot: normalizeVendorSnapshot(item.vendorSnapshot || {}),
      items: normalizeBidItems(item.items),
      renovationAssignments: normalizeBidAssignments(item.renovationAssignments),
    }));
};

const buildInitialCustomQuoteForm = () => ({
  vendorId: "",
  notes: "",
  assignments: [
    {
      rowId: buildManualAssignmentId(),
      renovationItemId: "",
      amount: "",
      scopeSummary: "",
    },
  ],
});

const buildQuickVendorInitialValues = ({ bid = null, trade = "" } = {}) => {
  const snapshot = normalizeVendorSnapshot(bid?.vendorSnapshot || {});

  return {
    name: snapshot.name || normalizeText(bid?.contractorName, ""),
    trade,
    contactName: snapshot.contactName,
    email: snapshot.email,
    phone: snapshot.phone,
    address: snapshot.address,
    notes:
      bid?.sourceType === "manual"
        ? "Added from a custom quote entered in bid management."
        : "Added from an imported contractor quote in bid management.",
  };
};

const CustomQuoteModal = ({
  isOpen,
  onClose,
  onSubmit,
  onOpenQuickAddVendor,
  vendors,
  renovationItems,
  form,
  isSubmitting,
  onMetaChange,
  onAssignmentChange,
  onAddAssignment,
  onRemoveAssignment,
}) => {
  if (!isOpen) {
    return null;
  }

  const totalAmount = form.assignments.reduce(
    (sum, assignment) => sum + (normalizeAmount(assignment.amount) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="surface-panel-strong max-h-[92vh] w-full max-w-4xl overflow-y-auto px-6 py-6 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">Bid management</span>
            <h2 className="mt-4 text-[2rem] font-medium tracking-tight text-ink-900">
              Add custom quote
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              Save a phone, text, or in-person contractor price and map it directly to your
              renovation items.
            </p>
          </div>

          <button type="button" onClick={onClose} className="ghost-action">
            Close
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <section className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-900">Vendor</p>
                <p className="mt-1 text-sm text-ink-500">
                  Choose the contractor this quote came from.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenQuickAddVendor}
                className="secondary-action"
              >
                Quick add vendor
              </button>
            </div>

            <div className="mt-4">
              <select
                value={form.vendorId}
                onChange={(event) => onMetaChange("vendorId", event.target.value)}
                className="auth-input appearance-none"
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name}
                    {vendor.trade ? ` - ${vendor.trade}` : ""}
                  </option>
                ))}
              </select>
              {!vendors.length ? (
                <p className="mt-3 text-sm text-ink-500">
                  No vendors in your list yet. Add one first, then save the custom quote.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-900">Quoted renovation items</p>
                <p className="mt-1 text-sm text-ink-500">
                  Add the renovation items this contractor priced and the amount for each one.
                </p>
              </div>
              <button
                type="button"
                onClick={onAddAssignment}
                className="secondary-action"
                disabled={!renovationItems.length}
              >
                Add item
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {form.assignments.map((assignment, index) => (
                <div
                  key={assignment.rowId}
                  className="rounded-[20px] border border-ink-100 bg-sand-50/60 p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_180px]">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-ink-700">
                        Renovation item
                      </span>
                      <select
                        value={assignment.renovationItemId}
                        onChange={(event) =>
                          onAssignmentChange(assignment.rowId, "renovationItemId", event.target.value)
                        }
                        className="auth-input appearance-none"
                      >
                        <option value="">Select an item</option>
                        {renovationItems.map((item) => (
                          <option key={item.itemId} value={item.itemId}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-ink-700">Amount</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={assignment.amount}
                        onChange={(event) =>
                          onAssignmentChange(assignment.rowId, "amount", event.target.value)
                        }
                        className="auth-input"
                        placeholder="0"
                      />
                    </label>
                  </div>

                  <label className="mt-4 block space-y-2">
                    <span className="text-sm font-medium text-ink-700">
                      Scope note for this item
                    </span>
                    <textarea
                      rows="3"
                      value={assignment.scopeSummary}
                      onChange={(event) =>
                        onAssignmentChange(assignment.rowId, "scopeSummary", event.target.value)
                      }
                      className="auth-input"
                      placeholder="Example: labor only for kitchen demo, cabinets, counters, and install."
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Item {index + 1}
                    </p>
                    {form.assignments.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => onRemoveAssignment(assignment.rowId)}
                        className="ghost-action text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Remove item
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {!renovationItems.length ? (
              <p className="mt-4 text-sm text-ink-500">
                Add renovation items in the renovation plan first, then custom quotes can be mapped
                here.
              </p>
            ) : null}
          </section>

          <section className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Quote notes</span>
                <textarea
                  rows="4"
                  value={form.notes}
                  onChange={(event) => onMetaChange("notes", event.target.value)}
                  className="auth-input"
                  placeholder="Example: pricing was given over the phone and contractor said it is subject to a site walk."
                />
              </label>

              <div className="rounded-[22px] bg-sand-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Quote total
                </p>
                <p className="mt-3 text-2xl font-semibold text-ink-900">
                  {totalAmount ? formatCurrency(totalAmount) : "—"}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Total is calculated from the renovation items you added above.
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="ghost-action">
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Save custom quote"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [vendors, setVendors] = useState([]);
  const [isCustomQuoteModalOpen, setIsCustomQuoteModalOpen] = useState(false);
  const [isSavingCustomQuote, setIsSavingCustomQuote] = useState(false);
  const [customQuoteForm, setCustomQuoteForm] = useState(() => buildInitialCustomQuoteForm());
  const [vendorModalState, setVendorModalState] = useState({
    isOpen: false,
    mode: "link-bid",
    bidId: "",
    initialValues: {},
  });
  const [pendingVendorPromptBidId, setPendingVendorPromptBidId] = useState("");

  const safeBids = useMemo(() => normalizeBids(bids), [bids]);
  const safeVendors = useMemo(() => normalizeVendors(vendors), [vendors]);
  const safeRenovationItems = useMemo(
    () => normalizeRenovationItems(renovationItems),
    [renovationItems]
  );
  const renovationItemsById = useMemo(
    () => new Map(safeRenovationItems.map((item) => [item.itemId, item])),
    [safeRenovationItems]
  );

  useEffect(() => {
    let isMounted = true;

    const loadVendors = async () => {
      try {
        const vendorData = await getVendors();
        if (isMounted) {
          setVendors(Array.isArray(vendorData) ? vendorData : []);
        }
      } catch (error) {
        if (isMounted) {
          setVendors([]);
        }
      }
    };

    loadVendors();

    return () => {
      isMounted = false;
    };
  }, []);

  const getSuggestedTrade = (itemId) => {
    const item = renovationItemsById.get(itemId);
    if (!item) {
      return "";
    }

    return humanizeLabel(item.category || item.name, "");
  };

  const getSuggestedTradeFromBid = (bid) => {
    const matchedItemId = bid?.renovationAssignments?.[0]?.renovationItemId || "";
    return getSuggestedTrade(matchedItemId);
  };

  const itemComparisons = useMemo(() => {
    return safeRenovationItems.map((item) => {
      const matchedQuotes = safeBids
        .flatMap((bid) =>
              (Array.isArray(bid.renovationAssignments) ? bid.renovationAssignments : [])
            .filter((assignment) => assignment.renovationItemId === item.itemId)
            .map((assignment) => ({
              bidId: bid._id,
              contractorName: bid.contractorName || "Unknown contractor",
              amount: normalizeAmount(assignment.amount),
              confidence: normalizeAmount(assignment.confidence),
              scopeSummary: assignment.scopeSummary || "",
              matchedLineItems: assignment.matchedLineItems,
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
        budget !== null && bestQuote && bestQuote.amount !== null ? bestQuote.amount - budget : null;

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

  const pendingVendorPromptBid = useMemo(
    () => safeBids.find((bid) => bid._id === pendingVendorPromptBidId) || null,
    [pendingVendorPromptBidId, safeBids]
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
      const importedBid = await importBid(formData);
      if (!importedBid?.vendor && normalizeText(importedBid?.vendorSnapshot?.name)) {
        setPendingVendorPromptBidId(importedBid._id);
        toast.success("Quote imported. Review the contractor and add them to your vendors if needed.", {
          id: toastId,
        });
      } else {
        toast.success("Quote imported and matched to renovation items.", { id: toastId });
      }
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

  const openCustomQuoteModal = () => {
    setCustomQuoteForm(buildInitialCustomQuoteForm());
    setIsCustomQuoteModalOpen(true);
  };

  const closeCustomQuoteModal = () => {
    setCustomQuoteForm(buildInitialCustomQuoteForm());
    setIsCustomQuoteModalOpen(false);
  };

  const handleCustomQuoteMetaChange = (field, value) => {
    setCustomQuoteForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCustomQuoteAssignmentChange = (rowId, field, value) => {
    setCustomQuoteForm((current) => ({
      ...current,
      assignments: current.assignments.map((assignment) =>
        assignment.rowId === rowId ? { ...assignment, [field]: value } : assignment
      ),
    }));
  };

  const handleAddCustomQuoteAssignment = () => {
    setCustomQuoteForm((current) => ({
      ...current,
      assignments: [
        ...current.assignments,
        {
          rowId: buildManualAssignmentId(),
          renovationItemId: "",
          amount: "",
          scopeSummary: "",
        },
      ],
    }));
  };

  const handleRemoveCustomQuoteAssignment = (rowId) => {
    setCustomQuoteForm((current) => ({
      ...current,
      assignments:
        current.assignments.length > 1
          ? current.assignments.filter((assignment) => assignment.rowId !== rowId)
          : current.assignments,
    }));
  };

  const openQuickAddVendorForCustomQuote = () => {
    const firstItemId = customQuoteForm.assignments.find((assignment) => assignment.renovationItemId)
      ?.renovationItemId;
    setVendorModalState({
      isOpen: true,
      mode: "custom-quote",
      bidId: "",
      initialValues: buildQuickVendorInitialValues({
        trade: getSuggestedTrade(firstItemId),
      }),
    });
  };

  const openQuickAddVendorForBid = (bid) => {
    setVendorModalState({
      isOpen: true,
      mode: "link-bid",
      bidId: bid._id,
      initialValues: buildQuickVendorInitialValues({
        bid,
        trade: getSuggestedTradeFromBid(bid),
      }),
    });
  };

  const closeVendorModal = () => {
    setVendorModalState({
      isOpen: false,
      mode: "link-bid",
      bidId: "",
      initialValues: {},
    });
  };

  const handleVendorSaved = async (savedVendor) => {
    setVendors((current) => {
      const normalizedCurrent = Array.isArray(current) ? current : [];
      const exists = normalizedCurrent.some((vendor) => vendor._id === savedVendor?._id);
      return exists
        ? normalizedCurrent.map((vendor) => (vendor._id === savedVendor._id ? savedVendor : vendor))
        : [savedVendor, ...normalizedCurrent];
    });

    if (vendorModalState.mode === "custom-quote") {
      setCustomQuoteForm((current) => ({
        ...current,
        vendorId: savedVendor?._id || "",
      }));
      toast.success("Vendor added to your list.");
      closeVendorModal();
      return;
    }

    if (vendorModalState.mode === "link-bid" && vendorModalState.bidId) {
      try {
        await updateBid(vendorModalState.bidId, { vendorId: savedVendor?._id || "" });
        setPendingVendorPromptBidId((current) =>
          current === vendorModalState.bidId ? "" : current
        );
        toast.success("Vendor added and linked to the quote.");
        closeVendorModal();
        await onUpdate?.();
      } catch (error) {
        toast.error(error.message || "Vendor was saved, but linking the quote failed.");
      }
    } else {
      closeVendorModal();
    }
  };

  const handleSaveCustomQuote = async () => {
    if (!customQuoteForm.vendorId) {
      toast.error("Choose a vendor for this custom quote.");
      return;
    }

    const assignments = customQuoteForm.assignments
      .map((assignment) => ({
        renovationItemId: assignment.renovationItemId,
        amount: normalizeAmount(assignment.amount),
        scopeSummary: normalizeText(assignment.scopeSummary, "").trim(),
      }))
      .filter((assignment) => assignment.renovationItemId && assignment.amount !== null);

    if (!assignments.length) {
      toast.error("Add at least one renovation item amount.");
      return;
    }

    setIsSavingCustomQuote(true);
    try {
      await createBid({
        leadId,
        vendorId: customQuoteForm.vendorId,
        notes: customQuoteForm.notes,
        renovationAssignments: assignments,
      });
      toast.success("Custom quote saved.");
      closeCustomQuoteModal();
      await onUpdate?.();
    } catch (error) {
      toast.error(error.message || "Failed to save custom quote.");
    } finally {
      setIsSavingCustomQuote(false);
    }
  };

  return (
    <>
      <AddVendorModal
        isOpen={vendorModalState.isOpen}
        onClose={closeVendorModal}
        onSuccess={handleVendorSaved}
        initialValues={vendorModalState.initialValues}
        eyebrow="Vendor directory"
        title="Quick add vendor"
        description="Add this contractor to your vendor list without leaving bid management."
        submitLabel="Save vendor"
      />
      <CustomQuoteModal
        isOpen={isCustomQuoteModalOpen}
        onClose={closeCustomQuoteModal}
        onSubmit={handleSaveCustomQuote}
        onOpenQuickAddVendor={openQuickAddVendorForCustomQuote}
        vendors={safeVendors}
        renovationItems={safeRenovationItems}
        form={customQuoteForm}
        isSubmitting={isSavingCustomQuote}
        onMetaChange={handleCustomQuoteMetaChange}
        onAssignmentChange={handleCustomQuoteAssignmentChange}
        onAddAssignment={handleAddCustomQuoteAssignment}
        onRemoveAssignment={handleRemoveCustomQuoteAssignment}
      />
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
                <div className="flex flex-wrap items-center gap-3">
                  {!safeRenovationItems.length ? (
                    <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                      Add renovation items first
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={openCustomQuoteModal}
                    disabled={!safeRenovationItems.length}
                    className="secondary-action disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Add custom quote
                  </button>
                </div>
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
                {pendingVendorPromptBid ? (
                  <div className="rounded-[20px] border border-sand-200 bg-sand-50 px-4 py-4">
                    <p className="text-sm font-semibold text-ink-900">
                      {pendingVendorPromptBid.vendorSnapshot.name || pendingVendorPromptBid.contractorName} is not in your vendor list yet
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink-500">
                      We found a contractor on the imported quote, but could not match it to an
                      existing vendor.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => openQuickAddVendorForBid(pendingVendorPromptBid)}
                        className="primary-action"
                      >
                        Quick add vendor
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingVendorPromptBidId("")}
                        className="ghost-action"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ) : null}

                {safeBids.length ? (
                  safeBids.map((bid) => (
                    <div key={bid._id} className="rounded-[18px] border border-ink-100 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-ink-900">
                              {bid.contractorName || "Unknown contractor"}
                            </p>
                            <span className="rounded-full bg-sand-100 px-2.5 py-1 text-[11px] font-semibold text-ink-600">
                              {bid.sourceType === "manual" ? "Custom quote" : "Imported"}
                            </span>
                            {bid.vendor?.name ? (
                              <span className="rounded-full bg-verdigris-50 px-2.5 py-1 text-[11px] font-semibold text-verdigris-700">
                                Vendor linked
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-ink-400">
                            {formatDate(bid.bidDate)}
                            {bid.sourceFileName ? ` • ${bid.sourceFileName}` : ""}
                          </p>
                          {bid.vendor?.name ? (
                            <p className="mt-1 text-xs text-ink-500">
                              Vendor: {bid.vendor.name}
                            </p>
                          ) : normalizeText(bid.vendorSnapshot?.name) ? (
                            <p className="mt-1 text-xs text-ink-500">
                              Unlinked contractor: {bid.vendorSnapshot.name}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold text-ink-900">
                          {formatCurrency(bid.totalAmount)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {Array.isArray(bid.renovationAssignments) && bid.renovationAssignments.length ? (
                          bid.renovationAssignments
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
                        {!bid.vendor?.name && normalizeText(bid.vendorSnapshot?.name) ? (
                          <button
                            type="button"
                            onClick={() => openQuickAddVendorForBid(bid)}
                            className="secondary-action"
                          >
                            Add to vendors
                          </button>
                        ) : null}
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
