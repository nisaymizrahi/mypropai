import React, { useMemo, useState } from "react";

import {
  PROJECT_UPDATE_TYPE_OPTIONS,
  formatProjectUpdateDateTime,
  getProjectUpdateTypeLabel,
  getProjectUpdateTypeTone,
} from "../utils/projectUpdates";

const ProjectUpdateCard = ({ update, onEdit, onDelete, compact = false }) => (
  <article className="rounded-[22px] border border-ink-100 bg-white/92 p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getProjectUpdateTypeTone(
              update.type
            )}`}
          >
            {getProjectUpdateTypeLabel(update.type)}
          </span>
          {update.editedAt ? (
            <span className="text-xs font-medium text-ink-400">Edited</span>
          ) : null}
        </div>
        <h4 className="mt-3 text-base font-semibold text-ink-900">{update.title}</h4>
        <p className={`mt-2 text-sm leading-6 text-ink-500 ${compact ? "line-clamp-3" : ""}`}>
          {update.body}
        </p>
      </div>

      <div className="shrink-0 text-xs font-medium text-ink-400">
        {formatProjectUpdateDateTime(update.updatedAt || update.createdAt)}
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
        <span>{update.authorName || "Team member"}</span>
        {update.attachment?.url ? (
          <a
            href={update.attachment.url}
            target="_blank"
            rel="noreferrer"
            className="ghost-action"
          >
            Open attachment
          </a>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onEdit?.(update)} className="ghost-action">
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(update)}
          className="ghost-action text-clay-700 hover:bg-clay-50 hover:text-clay-800"
        >
          Delete
        </button>
      </div>
    </div>
  </article>
);

const ProjectUpdatesPanel = ({
  updates = [],
  isLoading = false,
  error = "",
  compact = false,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [activeFilter, setActiveFilter] = useState("all");

  const visibleUpdates = useMemo(() => {
    const filtered =
      activeFilter === "all" ? updates : updates.filter((update) => update.type === activeFilter);

    return compact ? filtered.slice(0, 4) : filtered;
  }, [activeFilter, compact, updates]);

  return (
    <section className="surface-panel px-6 py-6 sm:px-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="eyebrow">{compact ? "Updates" : "Project updates"}</span>
          <h3 className="mt-4 text-2xl font-semibold text-ink-900">
            {compact ? "What changed most recently" : "Notes, communication, and field signal"}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
            {compact
              ? "Keep the latest internal notes and communication visible from the project home."
              : "Track site visits, lender notes, vendor communication, issues, and internal updates in one running feed."}
          </p>
        </div>

        <button type="button" onClick={onAdd} className="secondary-action">
          Add update
        </button>
      </div>

      {!compact ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`toolbar-chip ${activeFilter === "all" ? "toolbar-chip-active" : ""}`}
          >
            All
          </button>
          {PROJECT_UPDATE_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setActiveFilter(option.value)}
              className={`toolbar-chip ${
                activeFilter === option.value ? "toolbar-chip-active" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-[18px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-ink-500">Loading updates...</p>
      ) : visibleUpdates.length > 0 ? (
        <div className="mt-6 space-y-4">
          {visibleUpdates.map((update) => (
            <ProjectUpdateCard
              key={update._id}
              update={update}
              onEdit={onEdit}
              onDelete={onDelete}
              compact={compact}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[22px] border border-dashed border-ink-200 bg-ink-50/50 px-5 py-8 text-center">
          <p className="text-base font-semibold text-ink-900">No updates yet</p>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Add the first project update so the team can track what happened and what needs follow-up.
          </p>
        </div>
      )}
    </section>
  );
};

export default ProjectUpdatesPanel;
