import React, { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import {
  deleteVendorDocument,
  getDocumentAssetAccessUrl,
  getDocumentStorageOverview,
  uploadVendorDocument,
} from "../utils/api";
import { DOCUMENT_FILE_ACCEPT, formatStorageBytes } from "../utils/documentStorage";
import {
  VENDOR_DOCUMENT_CATEGORY_OPTIONS,
  formatVendorDate,
  getVendorDocumentState,
  getVendorDocumentStateLabel,
} from "../utils/vendors";
import { getVendorProcurementSummary } from "../utils/vendorProcurement";

const DocumentMetric = ({ label, value, hint }) => (
  <div className="rounded-[20px] border border-ink-100 bg-white/88 px-4 py-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-1 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const getDocumentStateClasses = (state) => {
  if (state === "expired") {
    return "border border-clay-200 bg-clay-50 text-clay-700";
  }

  if (state === "expiring") {
    return "border border-sand-200 bg-sand-50 text-sand-700";
  }

  return "border border-verdigris-200 bg-verdigris-50 text-verdigris-700";
};

const VendorDocumentsPanel = ({ vendor, onUpdated }) => {
  const [formData, setFormData] = useState({
    displayName: "",
    category: "Quote / Estimate",
    issueDate: "",
    expiresAt: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [storageOverview, setStorageOverview] = useState(null);
  const fileInputRef = useRef(null);

  const documents = useMemo(
    () => (Array.isArray(vendor?.documents) ? vendor.documents : []),
    [vendor?.documents]
  );
  const sortedDocuments = useMemo(
    () =>
      [...documents].sort(
        (left, right) =>
          new Date(right.uploadedAt || right.createdAt || 0) -
          new Date(left.uploadedAt || left.createdAt || 0)
      ),
    [documents]
  );
  const procurement = useMemo(() => getVendorProcurementSummary(vendor || {}), [vendor]);
  const expiredCount = useMemo(
    () => documents.filter((document) => getVendorDocumentState(document) === "expired").length,
    [documents]
  );
  const expiringCount = useMemo(
    () => documents.filter((document) => getVendorDocumentState(document) === "expiring").length,
    [documents]
  );

  const resetForm = () => {
    setFormData({
      displayName: "",
      category: "Quote / Estimate",
      issueDate: "",
      expiresAt: "",
      notes: "",
    });
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  React.useEffect(() => {
    let isMounted = true;

    const loadStorageOverview = async () => {
      try {
        const overview = await getDocumentStorageOverview();
        if (isMounted) {
          setStorageOverview(overview);
        }
      } catch (loadError) {
        if (isMounted) {
          setError((current) => current || loadError.message || "Failed to load storage details.");
        }
      }
    };

    loadStorageOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!vendor?._id) {
      setError("Vendor details are unavailable.");
      return;
    }

    if (!formData.displayName.trim() || !file) {
      setError("Document name and file are required.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const payload = new FormData();
      payload.append("displayName", formData.displayName.trim());
      payload.append("category", formData.category);
      payload.append("issueDate", formData.issueDate);
      payload.append("expiresAt", formData.expiresAt);
      payload.append("notes", formData.notes.trim());
      payload.append("document", file);

      const updatedVendor = await uploadVendorDocument(vendor._id, payload);
      const overview = await getDocumentStorageOverview().catch(() => null);
      if (overview) {
        setStorageOverview(overview);
      }
      toast.success("Vendor document uploaded.");
      onUpdated?.(updatedVendor);
      resetForm();
    } catch (uploadError) {
      setError(uploadError.message || "Failed to upload vendor document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    const confirmed = window.confirm("Delete this vendor document?");
    if (!confirmed || !vendor?._id) {
      return;
    }

    try {
      setError("");
      const updatedVendor = await deleteVendorDocument(vendor._id, documentId);
      const overview = await getDocumentStorageOverview().catch(() => null);
      if (overview) {
        setStorageOverview(overview);
      }
      toast.success("Vendor document removed.");
      onUpdated?.(updatedVendor);
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete vendor document.");
    }
  };

  const handleOpenDocument = async (document) => {
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");

    try {
      setError("");

      if (document.documentAsset) {
        const payload = await getDocumentAssetAccessUrl(document.documentAsset);
        if (previewWindow) {
          previewWindow.location.replace(payload.url);
        } else {
          window.open(payload.url, "_blank", "noopener,noreferrer");
        }
        return;
      }

      if (document.fileUrl) {
        if (previewWindow) {
          previewWindow.location.replace(document.fileUrl);
        } else {
          window.open(document.fileUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch (openError) {
      if (previewWindow) {
        previewWindow.close();
      }
      setError(openError.message || "Failed to open vendor document.");
    }
  };

  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-5 sm:px-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <span className="eyebrow">Vendor documents</span>
            <h3 className="mt-4 text-[1.8rem] font-medium tracking-tight text-ink-900">
              Quotes, contracts, insurance, and payout backup
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              Keep vendor documents organized by category and expiration so assignment and payment
              decisions stay easy to trust.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <DocumentMetric label="Total files" value={documents.length} />
              <DocumentMetric
                label="Packet coverage"
                value={`${procurement.completedRequiredCount}/${procurement.requiredCount}`}
                hint="Required packet items currently covered."
              />
              <DocumentMetric label="Expiring soon" value={expiringCount} />
              <DocumentMetric label="Expired" value={expiredCount} />
            </div>

            {storageOverview ? (
              <div className="mt-5 rounded-[18px] border border-ink-100 bg-white/85 px-4 py-4 text-sm text-ink-600">
                <p className="font-semibold text-ink-900">
                  {formatStorageBytes(storageOverview.bytesUsed)} of{" "}
                  {formatStorageBytes(storageOverview.totalStorageQuotaBytes)} used
                </p>
                <p className="mt-2 leading-6">
                  {formatStorageBytes(storageOverview.bytesRemaining)} remaining. Max file size:{" "}
                  {formatStorageBytes(storageOverview.maxFileSizeBytes)} on your{" "}
                  {storageOverview.tierLabel} plan.
                </p>
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-[18px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 rounded-[20px] border border-sand-100 bg-sand-50/70 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sand-700">
                Packet guidance
              </p>
              <p className="mt-2 text-sm leading-6 text-sand-900">
                {procurement.nextActions[0]
                  ? procurement.nextActions.join(" • ")
                  : "The vendor packet is in a good place right now. Upload project-specific change orders, invoices, or final backup as work moves forward."}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleUpload}
            className="rounded-[24px] border border-ink-100 bg-white/92 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  New upload
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Add vendor packet files with the right category and dates so the ledger stays
                  useful later.
                </p>
              </div>
              <span className="rounded-full border border-ink-100 bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-500">
                {file ? "File ready" : "Awaiting file"}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Document name</span>
                <input
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="2026 COI, kitchen bid, signed MSA"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Category</span>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="auth-input"
                >
                  {VENDOR_DOCUMENT_CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Issue date</span>
                  <input
                    name="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Expiration date</span>
                  <input
                    name="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Notes</span>
                <textarea
                  name="notes"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Optional details about coverage, quote scope, or document context."
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">File</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={DOCUMENT_FILE_ACCEPT}
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="auth-input"
                />
                {file ? (
                  <p className="text-sm text-ink-500">
                    Ready to upload: <span className="font-semibold text-ink-700">{file.name}</span>
                  </p>
                ) : null}
              </label>

              <button type="submit" disabled={isUploading} className="primary-action w-full justify-center">
                {isUploading ? "Uploading..." : "Upload document"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {sortedDocuments.length > 0 ? (
        <section className="section-card overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Document ledger
              </p>
              <p className="mt-1 text-sm text-ink-500">
                Denser vendor file view for compliance, payout, and packet review.
              </p>
            </div>
            <span className="rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-semibold text-ink-500">
              {sortedDocuments.length} file{sortedDocuments.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="hidden gap-4 border-b border-ink-100 bg-ink-50/50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400 md:grid md:grid-cols-[minmax(0,1.45fr)_190px_140px_120px_120px_150px]">
            <span>Document</span>
            <span>Category</span>
            <span>State</span>
            <span>Issue date</span>
            <span>Expiration</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-ink-100">
            {sortedDocuments.map((document) => {
              const state = getVendorDocumentState(document);

              return (
                <div
                  key={document._id}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1.45fr)_190px_140px_120px_120px_150px] md:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{document.displayName}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-500">
                      {document.notes || "No document notes saved."}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-ink-400">
                      Uploaded {formatVendorDate(document.uploadedAt, "Recently uploaded")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400 md:hidden">
                      Category
                    </p>
                    <p className="mt-1 text-sm text-ink-700 md:mt-0">{document.category}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400 md:hidden">
                      State
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold md:mt-0 ${getDocumentStateClasses(
                        state
                      )}`}
                    >
                      {getVendorDocumentStateLabel(document)}
                    </span>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400 md:hidden">
                      Issue date
                    </p>
                    <p className="mt-1 text-sm text-ink-700 md:mt-0">
                      {formatVendorDate(document.issueDate, "Not set")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400 md:hidden">
                      Expiration
                    </p>
                    <p className="mt-1 text-sm text-ink-700 md:mt-0">
                      {formatVendorDate(document.expiresAt, "No expiration")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(document)}
                      className="secondary-action min-h-0 px-4 py-2 text-sm"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(document._id)}
                      className="ghost-action min-h-0 px-4 py-2 text-sm text-clay-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="section-card px-6 py-14 text-center">
          <p className="text-lg font-medium text-ink-900">No vendor documents yet</p>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Upload quotes, W-9s, insurance certificates, licenses, contracts, and payout backup
            here.
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorDocumentsPanel;
