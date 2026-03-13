import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  deleteProjectDocument,
  getProjectDocuments,
  uploadProjectDocument,
} from "../utils/api";

const categoryOptions = [
  "General",
  "Contracts",
  "Permits",
  "Photos",
  "Insurance",
  "Scope",
  "Closing",
  "Financing",
];

const formatDate = (value) => {
  if (!value) {
    return "Recently uploaded";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently uploaded";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const DocumentsTab = ({ investment, property }) => {
  const project = investment || property;
  const projectId = project?._id;

  const [documents, setDocuments] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("General");
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const groupedDocuments = useMemo(() => {
    return documents.reduce((groups, item) => {
      const key = item.category || "General";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }, [documents]);

  useEffect(() => {
    if (!projectId) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const response = await getProjectDocuments(projectId);
        if (isMounted) {
          setDocuments(Array.isArray(response) ? response : []);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load documents.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDocuments();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const refreshDocuments = async () => {
    if (!projectId) {
      return;
    }

    const response = await getProjectDocuments(projectId);
    setDocuments(Array.isArray(response) ? response : []);
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
      formData.append("investmentId", projectId);
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
    } catch (err) {
      setError(err.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    const confirmed = window.confirm("Delete this document from the project library?");
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteProjectDocument(documentId);
      await refreshDocuments();
    } catch (err) {
      setError(err.message || "Failed to delete document.");
    }
  };

  if (!projectId) {
    return (
      <div className="section-card px-6 py-10 text-center text-sm text-ink-500">
        Document storage is not available until the project is loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric-tile p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
            Total files
          </p>
          <p className="mt-3 text-3xl font-semibold text-ink-900">{documents.length}</p>
        </div>
        <div className="metric-tile p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
            Categories
          </p>
          <p className="mt-3 text-3xl font-semibold text-ink-900">
            {Object.keys(groupedDocuments).length}
          </p>
        </div>
        <div className="metric-tile p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
            Project library
          </p>
          <p className="mt-3 text-lg font-semibold text-ink-900">{project.address || "Active project"}</p>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Centralize contracts, permits, photos, and closing files in one place.
          </p>
        </div>
      </div>

      <section className="section-card p-6 sm:p-7">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_360px]">
          <div>
            <span className="eyebrow">Document library</span>
            <h3 className="mt-4 text-3xl font-semibold text-ink-900">Upload project records</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              Add the files your team needs during acquisition, rehab, and handoff. Documents are
              grouped by category automatically after upload.
            </p>

            {error ? (
              <div className="mt-6 rounded-[24px] border border-clay-200 bg-clay-50 px-5 py-4 text-sm text-clay-700">
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
                  placeholder="Purchase agreement, contractor bid, permit set"
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
                  {categoryOptions.map((option) => (
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

            <button type="submit" disabled={isUploading} className="primary-action mt-6 w-full justify-center">
              {isUploading ? "Uploading..." : "Upload document"}
            </button>
          </form>
        </div>
      </section>

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Library contents</span>
            <h3 className="mt-4 text-3xl font-semibold text-ink-900">Organized by category</h3>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm text-ink-500">
            Loading project documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
            No project documents yet. Upload the first contract, budget, or permit file to start
            the library.
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {Object.entries(groupedDocuments).map(([group, items]) => (
              <div key={group} className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-ink-900">{group}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {items.length} document{items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-600">
                    {project.address || "Project"}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col gap-4 rounded-[20px] border border-ink-100 bg-ink-50/55 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{item.displayName}</p>
                        <p className="mt-1 text-sm text-ink-500">
                          Uploaded {formatDate(item.createdAt || item.updatedAt)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="secondary-action"
                        >
                          Open file
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="ghost-action text-clay-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DocumentsTab;
