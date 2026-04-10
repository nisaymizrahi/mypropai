import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { getVendors } from "../utils/api";
import {
  attachQuoteToRequest,
  createQuoteRequest,
  getQuoteRequestsForLead,
  getQuoteRequestsForProject,
  updateQuoteRequest,
} from "../utils/quoteRequestsApi";

const REQUEST_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "received", label: "Received" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
  { value: "awarded", label: "Awarded" },
];

const normalizeText = (value, fallback = "") => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim() || fallback;
};

const formatDate = (value, fallback = "No date") => {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) {
    return fallback;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizeScopeItems = (items = []) =>
  items
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      itemId:
        normalizeText(item.itemId) ||
        normalizeText(item._id) ||
        normalizeText(item.renovationItemId) ||
        `scope-${index}`,
      name:
        normalizeText(item.name) ||
        normalizeText(item.category) ||
        normalizeText(item.renovationItemName) ||
        "Untitled scope item",
      category:
        normalizeText(item.category) ||
        normalizeText(item.scopeKey) ||
        normalizeText(item.scopeGroup) ||
        "custom",
      budget:
        item.budget ??
        item.budgetedAmount ??
        null,
    }));

const normalizeVendors = (items = []) =>
  items
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      _id: normalizeText(item._id, `vendor-${index}`),
      name: normalizeText(item.name, "Unnamed vendor"),
      trade: normalizeText(item.trade),
    }));

const normalizeBids = (items = []) =>
  items
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      _id: normalizeText(item._id, `bid-${index}`),
      contractorName: normalizeText(item.contractorName, "Unknown contractor"),
      decisionStatus: normalizeText(item.decisionStatus, "open"),
      vendorId:
        typeof item.vendor === "object"
          ? normalizeText(item.vendor?._id)
          : normalizeText(item.vendor),
      vendorName:
        typeof item.vendor === "object"
          ? normalizeText(item.vendor?.name)
          : normalizeText(item.vendorSnapshot?.name),
      sourceFileName: normalizeText(item.sourceFileName),
      createdAt: item.createdAt || item.bidDate || "",
    }));

const normalizeRequests = (items = []) =>
  items
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      _id: normalizeText(item._id, `request-${index}`),
      title: normalizeText(item.title),
      status: normalizeText(item.status, "draft"),
      dueDate: item.dueDate || "",
      notes: normalizeText(item.notes),
      sentAt: item.sentAt || "",
      scopeItemId: normalizeText(item.scopeItemId),
      scopeItemName: normalizeText(item.scopeItemName, "Scope item"),
      scopeItemCategory: normalizeText(item.scopeItemCategory, "custom"),
      vendorId:
        typeof item.vendor === "object"
          ? normalizeText(item.vendor?._id)
          : normalizeText(item.vendor),
      vendorName:
        typeof item.vendor === "object"
          ? normalizeText(item.vendor?.name)
          : normalizeText(item.vendorSnapshot?.name, "Vendor"),
      linkedBidId:
        typeof item.linkedBid === "object"
          ? normalizeText(item.linkedBid?._id)
          : normalizeText(item.linkedBid),
      linkedBidLabel:
        typeof item.linkedBid === "object"
          ? normalizeText(
              item.linkedBid?.contractorName || item.linkedBid?.sourceFileName,
              "Linked quote"
            )
          : "Linked quote",
    }));

const getStatusClasses = (status) => {
  if (status === "awarded") {
    return "bg-verdigris-50 text-verdigris-700";
  }

  if (status === "received") {
    return "bg-sky-50 text-sky-700";
  }

  if (status === "sent") {
    return "bg-sand-100 text-ink-700";
  }

  if (status === "declined" || status === "expired") {
    return "bg-clay-50 text-clay-700";
  }

  return "bg-white text-ink-600 ring-1 ring-ink-100";
};

const buildInitialForm = (scopeItems = []) => ({
  scopeItemId: scopeItems[0]?.itemId || "",
  vendorId: "",
  dueDate: "",
  notes: "",
});

const QuoteRequestsPanel = ({
  leadId,
  investmentId = "",
  scopeItems = [],
  bids = [],
  vendors = [],
  onRequestsChanged,
}) => {
  const normalizedScopeItems = useMemo(() => normalizeScopeItems(scopeItems), [scopeItems]);
  const normalizedBids = useMemo(() => normalizeBids(bids), [bids]);
  const [requestRecords, setRequestRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => buildInitialForm(normalizedScopeItems));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendorRecords, setVendorRecords] = useState(() => normalizeVendors(vendors));
  const [isVendorLoading, setIsVendorLoading] = useState(false);
  const [linkingRequestId, setLinkingRequestId] = useState("");
  const [linkSelections, setLinkSelections] = useState({});
  const [statusSavingId, setStatusSavingId] = useState("");

  useEffect(() => {
    setForm((current) => ({
      ...current,
      scopeItemId:
        current.scopeItemId && normalizedScopeItems.some((item) => item.itemId === current.scopeItemId)
          ? current.scopeItemId
          : normalizedScopeItems[0]?.itemId || "",
    }));
  }, [normalizedScopeItems]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      setError("");
      const payload = investmentId
        ? await getQuoteRequestsForProject(investmentId)
        : await getQuoteRequestsForLead(leadId);
      setRequestRecords(normalizeRequests(payload));
    } catch (loadError) {
      setRequestRecords([]);
      setError(loadError.message || "Failed to load quote requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!leadId && !investmentId) {
      setRequestRecords([]);
      setIsLoading(false);
      return;
    }

    loadRequests();
  }, [investmentId, leadId]);

  useEffect(() => {
    if (vendors.length > 0) {
      setVendorRecords(normalizeVendors(vendors));
      return;
    }

    let isMounted = true;

    const loadVendors = async () => {
      try {
        setIsVendorLoading(true);
        const payload = await getVendors();
        if (isMounted) {
          setVendorRecords(normalizeVendors(payload));
        }
      } catch (loadError) {
        if (isMounted) {
          setVendorRecords([]);
        }
      } finally {
        if (isMounted) {
          setIsVendorLoading(false);
        }
      }
    };

    loadVendors();

    return () => {
      isMounted = false;
    };
  }, [vendors]);

  const sortedRequests = useMemo(
    () =>
      [...requestRecords].sort(
        (left, right) =>
          new Date(right.dueDate || right.sentAt || 0).valueOf() -
          new Date(left.dueDate || left.sentAt || 0).valueOf()
      ),
    [requestRecords]
  );

  const openCount = sortedRequests.filter((request) =>
    ["draft", "sent", "received"].includes(request.status)
  ).length;
  const dueSoonCount = sortedRequests.filter((request) => {
    if (!request.dueDate || !["draft", "sent"].includes(request.status)) {
      return false;
    }

    const dueDate = new Date(request.dueDate).valueOf();
    return dueDate <= Date.now() + 1000 * 60 * 60 * 24 * 5;
  }).length;
  const receivedCount = sortedRequests.filter((request) => request.status === "received").length;

  const handleFormChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateRequest = async () => {
    if (!form.scopeItemId || !form.vendorId) {
      toast.error("Choose a scope item and vendor first.");
      return;
    }

    const scopeItem = normalizedScopeItems.find((item) => item.itemId === form.scopeItemId);
    if (!scopeItem) {
      toast.error("Choose a valid scope item.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createQuoteRequest({
        leadId,
        investmentId,
        scopeItemId: scopeItem.itemId,
        scopeItemName: scopeItem.name,
        scopeItemCategory: scopeItem.category,
        vendorId: form.vendorId,
        dueDate: form.dueDate || null,
        notes: form.notes,
      });
      toast.success("Quote request created.");
      setForm(buildInitialForm(normalizedScopeItems));
      await loadRequests();
      await onRequestsChanged?.();
    } catch (createError) {
      toast.error(createError.message || "Failed to create quote request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (requestId, status) => {
    try {
      setStatusSavingId(requestId);
      await updateQuoteRequest(requestId, { status });
      toast.success("Quote request updated.");
      await loadRequests();
      await onRequestsChanged?.();
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update quote request.");
    } finally {
      setStatusSavingId("");
    }
  };

  const handleAttachBid = async (request) => {
    const selectedBidId = linkSelections[request._id];
    if (!selectedBidId) {
      toast.error("Choose a quote to attach.");
      return;
    }

    try {
      setLinkingRequestId(request._id);
      await attachQuoteToRequest(request._id, { bidId: selectedBidId });
      toast.success("Quote attached to request.");
      await loadRequests();
      await onRequestsChanged?.();
    } catch (attachError) {
      toast.error(attachError.message || "Failed to attach quote.");
    } finally {
      setLinkingRequestId("");
    }
  };

  return (
    <div className="space-y-5">
      <section className="section-card p-6">
        <span className="eyebrow">Bid requests</span>
        <h2 className="mt-4 text-2xl font-semibold text-ink-900">
          Start collecting real contractor pricing
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
          Create request lanes by scope item, assign vendors, set due dates, and keep incoming
          quotes attached to the right work instead of scattered across calls and texts.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="metric-tile p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Open requests
            </p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">{openCount}</p>
          </div>
          <div className="metric-tile p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Due soon
            </p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">{dueSoonCount}</p>
          </div>
          <div className="metric-tile p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Quotes received
            </p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">{receivedCount}</p>
          </div>
        </div>
      </section>

      <section className="section-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-ink-900">Create quote request</h3>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              Pick the scope item first, then the vendor you want pricing from.
            </p>
          </div>
          {isVendorLoading ? (
            <span className="workspace-counter-pill">Refreshing vendors...</span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink-700">Scope item</span>
            <select
              value={form.scopeItemId}
              onChange={(event) => handleFormChange("scopeItemId", event.target.value)}
              className="auth-input appearance-none"
            >
              <option value="">Select a scope item</option>
              {normalizedScopeItems.map((item) => (
                <option key={item.itemId} value={item.itemId}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-ink-700">Vendor</span>
            <select
              value={form.vendorId}
              onChange={(event) => handleFormChange("vendorId", event.target.value)}
              className="auth-input appearance-none"
            >
              <option value="">Select a vendor</option>
              {vendorRecords.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                  {vendor.trade ? ` - ${vendor.trade}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-ink-700">Due date</span>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => handleFormChange("dueDate", event.target.value)}
              className="auth-input"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <span className="text-sm font-medium text-ink-700">Notes</span>
            <textarea
              rows="4"
              value={form.notes}
              onChange={(event) => handleFormChange("notes", event.target.value)}
              className="auth-input min-h-[140px]"
              placeholder="What should this vendor price, and what should they keep separated?"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleCreateRequest}
            disabled={isSubmitting || !normalizedScopeItems.length || !vendorRecords.length}
            className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Create quote request"}
          </button>
        </div>
      </section>

      <section className="section-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-ink-900">Request board</h3>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              Track who has been asked, what has come back, and which request already has a quote attached.
            </p>
          </div>
          <span className="workspace-counter-pill">
            {sortedRequests.length} request{sortedRequests.length === 1 ? "" : "s"}
          </span>
        </div>

        {error ? (
          <div className="mt-5 rounded-[18px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <p className="mt-5 text-sm text-ink-500">Loading quote requests...</p>
        ) : sortedRequests.length ? (
          <div className="mt-5 space-y-4">
            {sortedRequests.map((request) => {
              const availableBids = normalizedBids.filter((bid) => {
                if (request.linkedBidId && request.linkedBidId === bid._id) {
                  return true;
                }

                if (request.vendorId && bid.vendorId) {
                  return request.vendorId === bid.vendorId;
                }

                return true;
              });

              return (
                <article key={request._id} className="rounded-[22px] border border-ink-100 bg-white px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-ink-900">
                          {request.scopeItemName}
                        </h4>
                        <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                          {request.scopeItemCategory}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(request.status)}`}
                        >
                          {REQUEST_STATUS_OPTIONS.find((option) => option.value === request.status)?.label ||
                            request.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-ink-500">
                        Vendor: <span className="font-semibold text-ink-900">{request.vendorName}</span>
                      </p>
                      <p className="mt-1 text-sm text-ink-500">
                        Due {formatDate(request.dueDate, "No due date")}
                      </p>
                      {request.notes ? (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600">{request.notes}</p>
                      ) : null}
                    </div>

                    <div className="rounded-[18px] bg-sand-50 px-4 py-4 text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Quote linkage
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {request.linkedBidId ? request.linkedBidLabel : "No quote linked"}
                      </p>
                      {request.sentAt ? (
                        <p className="mt-1 text-xs text-ink-500">Sent {formatDate(request.sentAt)}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-ink-700">Status</span>
                      <select
                        value={request.status}
                        onChange={(event) => handleStatusChange(request._id, event.target.value)}
                        disabled={statusSavingId === request._id}
                        className="auth-input appearance-none"
                      >
                        {REQUEST_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-ink-700">Attach existing quote</span>
                      <select
                        value={linkSelections[request._id] || request.linkedBidId || ""}
                        onChange={(event) =>
                          setLinkSelections((current) => ({
                            ...current,
                            [request._id]: event.target.value,
                          }))
                        }
                        className="auth-input appearance-none"
                      >
                        <option value="">Select a quote</option>
                        {availableBids.map((bid) => (
                          <option key={bid._id} value={bid._id}>
                            {bid.contractorName}
                            {bid.sourceFileName ? ` - ${bid.sourceFileName}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleAttachBid(request)}
                        disabled={linkingRequestId === request._id}
                        className="secondary-action disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {linkingRequestId === request._id ? "Linking..." : "Attach quote"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-[22px] border border-dashed border-ink-200 bg-sand-50/70 px-5 py-10 text-center">
            <h4 className="text-xl font-semibold text-ink-900">No quote requests yet</h4>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Create the first request so vendor outreach stays attached to real scope items.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default QuoteRequestsPanel;
