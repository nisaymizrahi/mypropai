import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { createWorkspaceTask, updateWorkspaceTask } from "../utils/api";
import {
  TASK_STATUS_OPTIONS,
  TASK_URGENCY_OPTIONS,
  toDateInputValue,
} from "../utils/tasks";

const buildFormState = (task, defaults = {}) => ({
  title: task?.title || "",
  description: task?.description || "",
  dueDate: toDateInputValue(task?.dueDate || defaults?.dueDate),
  urgency: task?.urgency || defaults?.urgency || "medium",
  status: task?.status || defaults?.status || "open",
  propertyKey: task?.propertyKey || defaults?.propertyKey || "",
  sourceType: task?.sourceType || defaults?.sourceType || "general",
  sourceId: task?.sourceId || defaults?.sourceId || "",
  sourceLabel: task?.sourceLabel || defaults?.sourceLabel || "General",
});

const TaskFormModal = ({
  isOpen,
  onClose,
  onSaved,
  task = null,
  properties = [],
  defaults = {},
}) => {
  const [formData, setFormData] = useState(() => buildFormState(task, defaults));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedProperties = useMemo(
    () =>
      [...properties].sort((left, right) =>
        String(left?.sharedProfile?.address || left?.title || "").localeCompare(
          String(right?.sharedProfile?.address || right?.title || "")
        )
      ),
    [properties]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(buildFormState(task, defaults));
    setError("");
    setIsSubmitting(false);
  }, [defaults, isOpen, task]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.dueDate) {
      setError("Task name and due date are required.");
      return;
    }

    const selectedProperty = sortedProperties.find(
      (property) => property.propertyKey === formData.propertyKey
    );

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      dueDate: formData.dueDate,
      urgency: formData.urgency,
      status: formData.status,
      propertyKey: selectedProperty?.propertyKey || "",
      propertyAddress: selectedProperty?.sharedProfile?.address || "",
      sourceType: formData.sourceType,
      sourceId: formData.sourceId,
      sourceLabel: formData.sourceLabel,
    };

    try {
      setIsSubmitting(true);

      const savedTask = task
        ? await updateWorkspaceTask(task._id, payload)
        : await createWorkspaceTask(payload);

      toast.success(task ? "Task updated." : "Task created.");
      onSaved?.(savedTask);
      onClose?.();
    } catch (submitError) {
      setError(submitError.message || "Failed to save task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm">
      <div className="surface-panel-strong w-full max-w-2xl px-6 py-6 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">{task ? "Edit task" : "Add task"}</span>
            <h2 className="mt-4 text-[1.9rem] font-medium tracking-tight text-ink-900">
              {task ? "Update task details" : "Create a new task"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Every task created here also rolls into the main task center for filtering,
              sorting, and completion tracking.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-ink-100 bg-white text-ink-600"
          >
            <span className="sr-only">Close</span>
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-700">Task name</span>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="auth-input"
              placeholder="Call seller, review contractor quote, order inspection"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-700">Description</span>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="auth-input"
              placeholder="Add the context, next step, blocker, or handoff notes."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block space-y-2 xl:col-span-2">
              <span className="text-sm font-medium text-ink-700">Property</span>
              <select
                name="propertyKey"
                value={formData.propertyKey}
                onChange={handleChange}
                className="auth-input"
              >
                <option value="">General task</option>
                {sortedProperties.map((property) => (
                  <option key={property.propertyKey} value={property.propertyKey}>
                    {property.sharedProfile?.address || property.title || property.propertyKey}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Due date</span>
              <input
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Urgency</span>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="auth-input"
              >
                {TASK_URGENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-700">Status</span>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="auth-input"
            >
              {TASK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <div className="rounded-[16px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="ghost-action">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : task ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
