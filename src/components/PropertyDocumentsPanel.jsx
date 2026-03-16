import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DocumentDuplicateIcon,
  FolderIcon,
  LinkIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { EmptyAcquisitionState } from "./PropertyFinancePanel";
import {
  createPropertyWorkspace,
  deleteProjectDocument,
  getProjectDocuments,
  getInvestment,
  uploadProjectDocument,
} from "../utils/api";

const documentCategories = [
  "Closing",
  "Loan & Draw",
  "Receipts & Invoices",
  "Contracts & Bids",
  "Permits & Inspections",
  "Vendor Compliance",
  "Reports",
  "Photos",
  "Scope",
  "General",
];

const formatDate = (value) => {
  if (!value) return "Recently uploaded";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "Recently uploaded";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const MetricTile = ({ icon: Icon, label, value, hint }) => (
  <div className="metric-tile p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const bucketDescriptions = {
  Closing: "HUDs, settlement statements, title files, and purchase-close records.",
  "Loan & Draw": "Lender notes, draw requests, payoff letters, and financing records.",
  "Receipts & Invoices": "Receipts, invoices, and payment support files for the project.",
  "Contracts & Bids": "Bid sheets, vendor contracts, proposals, and scope agreements.",
  "Permits & Inspections": "Permit packages, approvals, inspection notes, and compliance items.",
  "Vendor Compliance": "Insurance certificates, W9s, licenses, and vendor support files.",
  Reports: "Financial reports, lender packages, and investor-facing exports.",
  Photos: "Progress photography and supporting visual documentation.",
  Scope: "Scope drafts, revisions, and planning artifacts.",
  General: "Anything important that does not fit the other structured buckets yet.",
};

const PropertyDocumentsPanel = ({
  property,
  propertyKey,
  onPropertyUpdated,
}) => {
  const investmentId = property?.workspaces?.acquisitions?.id || "";
  const [selectedStrategy, setSelectedStrategy] = useState(
    property?.workspaces?.acquisitions?.strategy || "flip"
  );
  const [investment, setInvestment] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("General");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setSelectedStrategy(property?.workspaces?.acquisitions?.strategy || "flip");
  }, [property?.workspaces?.acquisitions?.strategy]);

  const loadDocumentsWorkspace = useCallback(async () => {
    if (!investmentId) {
      setInvestment(null);
      setDocuments([]);
      setError("");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [investmentData, documentData] = await Promise.all([
        getInvestment(investmentId),
        getProjectDocuments(investmentId),
      ]);

      setInvestment(investmentData);
      setDocuments(Array.isArray(documentData) ? documentData : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load the documents workspace.");
    } finally {
      setLoading(false);
    }
  }, [investmentId]);

  useEffect(() => {
    loadDocumentsWorkspace();
  }, [loadDocumentsWorkspace]);

  const groupedDocuments = useMemo(() => {
    const groups = documentCategories.reduce((accumulator, key) => {
      accumulator[key] = [];
      return accumulator;
    }, {});

    documents.forEach((item) => {
      const key = groups[item.category] ? item.category : "General";
      groups[key].push(item);
    });

    return groups;
  }, [documents]);

  const recentDocuments = useMemo(
    () =>
      [...documents]
        .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0))
        .slice(0, 4),
    [documents]
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

      toast.success("Documents workspace created.");
    } catch (createError) {
      toast.error(createError.message || "Failed to create the acquisitions workspace.");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const refreshDocuments = async () => {
    if (!investmentId) {
      return;
    }

    const nextDocuments = await getProjectDocuments(investmentId);
    setDocuments(Array.isArray(nextDocuments) ? nextDocuments : []);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!displayName.trim() || !file) {
      setError("A document name and file are required.");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("investmentId", investmentId);
      formData.append("displayName", displayName.trim());
      formData.append("category", category);
      formData.append("document", file);

      await uploadProjectDocument(formData);
      await refreshDocuments();
      setDisplayName("");
      setCategory("General");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Document uploaded.");
    } catch (uploadError) {
      setError(uploadError.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm("Delete this document from the property library?")) {
      return;
    }

    try {
      setError("");
      await deleteProjectDocument(documentId);
      await refreshDocuments();
      toast.success("Document removed.");
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete document.");
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
        Loading document library...
      </div>
    );
  }

  if (error && !investment) {
    return (
      <div className="section-card px-6 py-10 text-center text-clay-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-panel px-6 py-7 sm:px-7">
        <span className="eyebrow">Documents</span>
        <h3 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
          Keep every project file in a structured property library
        </h3>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
          Store closing files, lender records, receipts, contracts, permits, and reports in one
          place so the property stays organized as execution gets busier.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          icon={DocumentDuplicateIcon}
          label="Total files"
          value={documents.length}
          hint="All uploaded files tied to this property project."
        />
        <MetricTile
          icon={FolderIcon}
          label="Active buckets"
          value={Object.values(groupedDocuments).filter((items) => items.length > 0).length}
          hint="Structured categories currently in use."
        />
        <MetricTile
          icon={PhotoIcon}
          label="Recent uploads"
          value={recentDocuments.length}
          hint="Most recent files across the library."
        />
        <MetricTile
          icon={LinkIcon}
          label="Project linked"
          value={investment?.address ? "Yes" : "No"}
          hint={investment?.address || "Linked acquisitions project"}
        />
      </div>

      <section className="section-card p-6 sm:p-7">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_360px]">
          <div>
            <span className="eyebrow">Structured buckets</span>
            <h4 className="mt-4 text-2xl font-semibold text-ink-900">How this library is organized</h4>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              The upload form below already lets you place files into the document buckets we want
              for the long-term property workspace.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {documentCategories.map((bucket) => (
                <div key={bucket} className="rounded-[20px] border border-ink-100 bg-white/90 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{bucket}</p>
                      <p className="mt-2 text-sm leading-6 text-ink-500">
                        {bucketDescriptions[bucket]}
                      </p>
                    </div>
                    <span className="rounded-full bg-sand-50 px-3 py-1 text-[11px] font-semibold text-sand-700">
                      {groupedDocuments[bucket]?.length || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {error ? (
              <div className="mt-6 rounded-[20px] border border-clay-200 bg-clay-50 px-5 py-4 text-sm text-clay-700">
                {error}
              </div>
            ) : null}
          </div>

          <form onSubmit={handleUpload} className="rounded-[28px] border border-ink-100 bg-white/90 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
              New upload
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Document name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Closing statement, hard money note, permit set"
                  className="auth-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">Category</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="auth-input"
                >
                  {documentCategories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="block w-full text-sm text-ink-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="primary-action mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploading ? "Uploading..." : "Upload document"}
            </button>
          </form>
        </div>
      </section>

      {recentDocuments.length > 0 ? (
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Recent files</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Latest uploads</h4>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {recentDocuments.map((document) => (
              <div key={document._id} className="rounded-[22px] border border-ink-100 bg-white/85 p-5">
                <p className="text-base font-semibold text-ink-900">{document.displayName}</p>
                <p className="mt-2 text-sm text-ink-500">{document.category || "General"}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Uploaded {formatDate(document.updatedAt || document.createdAt)}
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
                    className="ghost-action text-clay-700 hover:bg-clay-50 hover:text-clay-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Library contents</span>
        <h4 className="mt-4 text-2xl font-semibold text-ink-900">Browse by bucket</h4>

        <div className="mt-8 space-y-4">
          {documents.length > 0 ? (
            documentCategories
              .filter((bucket) => (groupedDocuments[bucket] || []).length > 0)
              .map((bucket) => (
                <div key={bucket} className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-ink-900">{bucket}</p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
                        {bucketDescriptions[bucket]}
                      </p>
                    </div>

                    <span className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1 text-xs font-semibold text-sand-700">
                      {groupedDocuments[bucket].length} file
                      {groupedDocuments[bucket].length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {groupedDocuments[bucket].map((document) => (
                      <div
                        key={document._id}
                        className="rounded-[20px] border border-ink-100 bg-ink-50/40 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-ink-900">{document.displayName}</p>
                            <p className="mt-2 text-sm text-ink-500">
                              Uploaded {formatDate(document.updatedAt || document.createdAt)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-3">
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
                              className="ghost-action text-clay-700 hover:bg-clay-50 hover:text-clay-800"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
              No documents yet. Upload the first closing file, invoice, contract, or permit to
              start the property library.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PropertyDocumentsPanel;
