import React, { useState } from "react";
import toast from "react-hot-toast";

import { deleteWorkspaceTask, updateWorkspaceTask } from "../utils/api";
import {
  formatTaskDate,
  getTaskSourceLabel,
  getTaskStatusLabel,
  getTaskUrgencyLabel,
  TASK_STATUS_OPTIONS,
} from "../utils/tasks";

const urgencyClasses = {
  low: "border-ink-200 bg-white text-ink-600",
  medium: "border-sand-200 bg-sand-50 text-sand-700",
  high: "border-clay-200 bg-clay-50 text-clay-700",
  critical: "border-red-200 bg-red-50 text-red-700",
};

const statusClasses = {
  open: "text-ink-700",
  in_progress: "text-sand-700",
  blocked: "text-clay-700",
  complete: "text-verdigris-700",
};

const TaskCard = ({ task, onEdit, onUpdated, onDeleted }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleStatusChange = async (event) => {
    try {
      setIsSaving(true);
      const updatedTask = await updateWorkspaceTask(task._id, { status: event.target.value });
      toast.success("Task status updated.");
      onUpdated?.(updatedTask);
    } catch (error) {
      toast.error(error.message || "Failed to update task.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      await deleteWorkspaceTask(task._id);
      toast.success("Task deleted.");
      onDeleted?.(task._id);
    } catch (error) {
      toast.error(error.message || "Failed to delete task.");
      setIsSaving(false);
    }
  };

  return (
    <article className="section-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                urgencyClasses[task.urgency] || urgencyClasses.medium
              }`}
            >
              {getTaskUrgencyLabel(task.urgency)}
            </span>
            <span className="inline-flex rounded-full border border-ink-100 bg-ink-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
              {getTaskSourceLabel(task)}
            </span>
          </div>

          <h3 className="mt-4 text-lg font-medium text-ink-900">{task.title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            {task.description || "No description yet."}
          </p>
        </div>

        <div className="min-w-[180px]">
          <label className="space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
              Status
            </span>
            <select
              value={task.status}
              onChange={handleStatusChange}
              disabled={isSaving}
              className={`auth-input text-sm ${statusClasses[task.status] || ""}`}
            >
              {TASK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
        <span>Due {formatTaskDate(task.dueDate)}</span>
        <span>{task.propertyAddress || "General task"}</span>
        <span>{getTaskStatusLabel(task.status)}</span>
        {task.completedAt ? <span>Completed {formatTaskDate(task.completedAt)}</span> : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => onEdit?.(task)} className="secondary-action">
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isSaving}
          className="ghost-action text-clay-700"
        >
          Delete
        </button>
      </div>
    </article>
  );
};

export default TaskCard;
