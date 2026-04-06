import React, { useEffect, useState } from "react";

import { createProjectTask } from "../utils/api";

const createInitialState = (defaultBudgetItemId = "") => ({
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  assignee: "",
  budgetItemId: defaultBudgetItemId,
  status: "Not Started",
  type: "vendor",
  phase: "",
  reminderOn: "",
});

const AddTaskModal = ({
  isOpen,
  onClose,
  onSuccess,
  investmentId,
  vendors = [],
  budgetItems = [],
  defaultBudgetItemId = "",
}) => {
  const [formData, setFormData] = useState(createInitialState(defaultBudgetItemId));
  const [subtasks, setSubtasks] = useState([{ title: "", done: false }]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(createInitialState(defaultBudgetItemId));
      setSubtasks([{ title: "", done: false }]);
      setError("");
      setIsSubmitting(false);
    }
  }, [defaultBudgetItemId, isOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "type" && value === "owner" ? { assignee: "" } : {}),
    }));
  };

  const handleSubtaskChange = (index, value) => {
    setSubtasks((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, title: value } : item
      )
    );
  };

  const addSubtask = () => {
    setSubtasks((current) => [...current, { title: "", done: false }]);
  };

  const removeSubtask = (index) => {
    setSubtasks((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleClose = () => {
    setFormData(createInitialState(defaultBudgetItemId));
    setSubtasks([{ title: "", done: false }]);
    setError("");
    setIsSubmitting(false);
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.startDate || !formData.endDate) {
      setError("Title, start date, and end date are required.");
      return;
    }

    if (!investmentId) {
      setError("This task cannot be saved because the project is unavailable.");
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("End date must be the same as or later than the start date.");
      return;
    }

    try {
      setIsSubmitting(true);

      await createProjectTask({
        investmentId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        assignee: formData.type === "vendor" ? formData.assignee || undefined : undefined,
        budgetItemId: formData.budgetItemId || undefined,
        status: formData.status,
        type: formData.type,
        phase: formData.phase.trim(),
        reminderOn: formData.reminderOn || undefined,
        subtasks: subtasks
          .filter((item) => item.title.trim() !== "")
          .map((item) => ({ title: item.title.trim(), done: false })),
      });

      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err.message || "Failed to save task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="surface-panel-strong w-full max-w-3xl rounded-[32px] p-6 sm:p-7">
        <div>
          <span className="eyebrow">Project schedule</span>
          <h2 className="mt-4 text-3xl font-semibold text-ink-900">Add task</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
            Capture scope, timing, ownership, and subtasks so the gantt and task list stay in sync.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">Task title</label>
            <input
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="auth-input"
              placeholder="Demo kitchen, order windows, finalize insurance"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">Description</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="auth-input"
              placeholder="Outline what needs to happen, what is blocked, or what to inspect."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Start date</label>
              <input
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">End date</label>
              <input
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="auth-input"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Complete">Complete</option>
                <option value="Blocked">Blocked</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Reminder</label>
              <input
                name="reminderOn"
                type="date"
                value={formData.reminderOn}
                onChange={handleChange}
                className="auth-input"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Task type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="auth-input"
              >
                <option value="vendor">Vendor task</option>
                <option value="owner">Owner / internal task</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Phase</label>
              <input
                name="phase"
                type="text"
                value={formData.phase}
                onChange={handleChange}
                className="auth-input"
                placeholder="Demo, framing, lease-up"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Scope item</label>
              <select
                name="budgetItemId"
                value={formData.budgetItemId}
                onChange={handleChange}
                className="auth-input"
              >
                <option value="">Project-wide task</option>
                {budgetItems.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Assign vendor</label>
              <select
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className="auth-input"
                disabled={formData.type !== "vendor"}
              >
                <option value="">Unassigned</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name} ({vendor.trade})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Subtasks
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Break larger tasks into checkpoints for the field team.
                </p>
              </div>
              <button type="button" onClick={addSubtask} className="secondary-action">
                Add subtask
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={(event) => handleSubtaskChange(index, event.target.value)}
                    className="auth-input"
                    placeholder={`Subtask ${index + 1}`}
                  />
                  {subtasks.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="ghost-action text-clay-700"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {error ? <p className="text-sm text-clay-700">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="ghost-action"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="primary-action">
              {isSubmitting ? "Saving..." : "Save task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
