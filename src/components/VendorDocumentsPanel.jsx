import React, { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { deleteVendorDocument, uploadVendorDocument } from "../utils/api";
import {
  VENDOR_DOCUMENT_CATEGORY_OPTIONS,
  formatVendorDate,
  getVendorDocumentState,
  getVendorDocumentStateLabel,
} from "../utils/vendors";
import { getVendorProcurementSummary } from "../utils/vendorProcurement";

const DocumentMetric = ({ label, value }) => (
  <div className="rounded-[18px] border border-ink-100 bg-white/85 p-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-xl font-semibold text-ink-900">{value}</p>
  </div>
);

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
      toast.success("Vendor document removed.");
      onUpdated?.(updatedVendor);
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete vendor document.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DocumentMetric label="Total files" value={documents.length} />
        <DocumentMetric
          label="Packet coverage"
          value={`${procurement.completedRequiredCount}/${procurement.requiredCount}`}
        />
        <DocumentMetric label="Expiring soon" value={expiringCount} />
        <DocumentMetric label="Expired" value={expiredCount} />
      </div>

      <section className="section-card p-6 sm:p-7">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <span className="eyebrow">Vendor documents</span>
            <h3 className="mt-4 text-3xl font-semibold text-ink-900">
              Quotes, contracts, insurance, and payment backup
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              Store vendor files with document types and expiration dates so assignment and payment
              decisions stay clear.
            </p>

            {error ? (
              <div className="mt-6 rounded-[18px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 rounded-[22px] border border-sand-100 bg-sand-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sand-700">
                Packet guidance
              </p>
              <p className="mt-2 text-sm leading-6 text-sand-900">
                {procurement.nextActions[0]
                  ? procurement.nextActions.join(" • ")
                  : "This vendor packet is in a good place. Upload project-specific change orders or invoices as work moves forward."}
              </p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">New upload</p>

            <div className="mt-5 space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Document name</span>
                <input
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="2026 COI, kitchen bid, W-9"
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
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="auth-input"
                />
              </label>

              <button type="submit" disabled={isUploading} className="primary-action w-full justify-center">
                {isUploading ? "Uploading..." : "Upload document"}
              </button>
            </div>
          </form>
        </div>

        {sortedDocuments.length > 0 ? (
          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {sortedDocuments.map((document) => {
              const state = getVendorDocumentState(document);
              const stateClasses =
                state === "expired"
                  ? "border border-clay-200 bg-clay-50 text-clay-700"
                  : state === "expiring"
                    ? "border border-sand-200 bg-sand-50 text-sand-700"
                    : "border border-verdigris-200 bg-verdigris-50 text-verdigris-700";

              return (
                <div key={document._id} className="rounded-[22px] border border-ink-100 bg-white/85 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-ink-900">{document.displayName}</p>
                      <p className="mt-1 text-sm font-medium text-ink-500">{document.category}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stateClasses}`}>
                      {getVendorDocumentStateLabel(document)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-ink-500">
                    <p>Uploaded {formatVendorDate(document.uploadedAt, "Recently uploaded")}</p>
                    <p>Issue date: {formatVendorDate(document.issueDate, "Not set")}</p>
                    <p>Expires: {formatVendorDate(document.expiresAt, "No expiration")}</p>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-ink-600">
                    {document.notes || "No notes saved for this document."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="secondary-action"
                    >
                      Open file
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(document._id)}
                      className="ghost-action text-clay-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-[20px] border border-dashed border-ink-200 bg-ink-50/40 px-6 py-12 text-center">
            <p className="text-lg font-medium text-ink-900">No vendor documents yet</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Upload quotes, W-9s, insurance certificates, licenses, and contracts here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default VendorDocumentsPanel;
