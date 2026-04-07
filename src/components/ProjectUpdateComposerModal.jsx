import React, { useEffect, useState } from "react";

import { PROJECT_UPDATE_TYPE_OPTIONS, getProjectUpdateTypeLabel } from "../utils/projectUpdates";

const buildInitialFormState = (initialUpdate = null) => ({
  type: initialUpdate?.type || "internal_note",
  title: initialUpdate?.title || "",
  body: initialUpdate?.body || "",
  attachment: null,
  removeAttachment: false,
});

const ProjectUpdateComposerModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialUpdate = null,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState(() => buildInitialFormState(initialUpdate));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(buildInitialFormState(initialUpdate));
    setError("");
  }, [initialUpdate, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        type === "checkbox" ? checked : type === "file" ? files?.[0] || null : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.body.trim()) {
      setError("Update title and details are required.");
      return;
    }

    try {
      await onSubmit?.({
        type: formData.type,
        title: formData.title.trim(),
        body: formData.body.trim(),
        attachment: formData.attachment || undefined,
        removeAttachment: formData.removeAttachment ? "true" : "",
      });
    } catch (submitError) {
      setError(submitError.message || "Failed to save the update.");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/55 p-4 backdrop-blur-sm">
      <div className="surface-panel-strong w-full max-w-2xl rounded-[30px] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">{initialUpdate ? "Edit update" : "Project updates"}</span>
            <h2 className="mt-4 text-3xl font-semibold text-ink-900">
              {initialUpdate ? "Update project note" : "Add project update"}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-500">
              Capture field notes, lender follow-ups, issues, and vendor communication in one
              running project feed.
            </p>
          </div>

          <button type="button" onClick={onClose} className="ghost-action">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Type</span>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="auth-input appearance-none"
              >
                {PROJECT_UPDATE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Title</span>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="auth-input"
                placeholder={`Add a ${getProjectUpdateTypeLabel(formData.type).toLowerCase()} title`}
                required
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-700">Details</span>
            <textarea
              name="body"
              rows="5"
              value={formData.body}
              onChange={handleChange}
              className="auth-input"
              placeholder="Write what happened, what changed, or what the team should do next."
              required
            />
          </label>

          <section className="rounded-[24px] border border-ink-100 bg-white/90 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900">Attachment</p>
                <p className="mt-1 text-sm leading-6 text-ink-500">
                  Add one supporting file if the note needs a photo, PDF, or proof point.
                </p>
              </div>

              {initialUpdate?.attachment?.url ? (
                <a
                  href={initialUpdate.attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ghost-action"
                >
                  Open current file
                </a>
              ) : null}
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-sm font-medium text-ink-700">Upload file</span>
              <input
                name="attachment"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg,video/mp4,video/quicktime"
                onChange={handleChange}
                className="auth-input file:mr-4 file:rounded-full file:border-0 file:bg-verdigris-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-verdigris-700"
              />
            </label>

            {initialUpdate?.attachment?.url ? (
              <label className="mt-4 flex items-center gap-3 text-sm text-ink-600">
                <input
                  name="removeAttachment"
                  type="checkbox"
                  checked={formData.removeAttachment}
                  onChange={handleChange}
                />
                Remove the current attachment
              </label>
            ) : null}
          </section>

          {error ? (
            <div className="rounded-[18px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="ghost-action" disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : initialUpdate ? "Save update" : "Add update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectUpdateComposerModal;
