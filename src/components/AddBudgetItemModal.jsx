import React, { useState } from "react";

import { createBudgetItem } from "../utils/api";
import { getProjectScopeLabel, PROJECT_SCOPE_OPTIONS } from "../utils/projectScopes";

const AddBudgetItemModal = ({ isOpen, onClose, onSuccess, investmentId }) => {
  const [formData, setFormData] = useState({
    scopeKey: "kitchen",
    category: "",
    description: "",
    budgetedAmount: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "scopeKey" &&
      (!prev.category || prev.category === getProjectScopeLabel(prev.scopeKey, "Other"))
        ? { category: getProjectScopeLabel(value, "Other") }
        : {}),
    }));
  };

  const handleClose = () => {
    setFormData({
      scopeKey: "kitchen",
      category: getProjectScopeLabel("kitchen", "Kitchen"),
      description: "",
      budgetedAmount: "",
    });
    setError("");
    onClose();
  };

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        scopeKey: "kitchen",
        category: getProjectScopeLabel("kitchen", "Kitchen"),
        description: "",
        budgetedAmount: "",
      });
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.category || !formData.budgetedAmount) {
      setError("Category and budgeted amount are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createBudgetItem({
        ...formData,
        investmentId,
        budgetedAmount: Number(formData.budgetedAmount),
      });
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="surface-panel-strong w-full max-w-2xl rounded-[32px] p-6 sm:p-7">
        <div>
          <span className="eyebrow">Scope budget</span>
          <h2 className="mt-4 text-3xl font-semibold text-ink-900">Add scope category</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            Start with a scope template, then set the working category name and budget so the rest
            of the project can connect to it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">Scope template</label>
            <select
              name="scopeKey"
              value={formData.scopeKey}
              onChange={handleChange}
              className="auth-input"
            >
              {PROJECT_SCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Category name</label>
              <input
                name="category"
                type="text"
                placeholder="Kitchen, electrical, permits"
                value={formData.category}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Budgeted amount</label>
              <input
                name="budgetedAmount"
                type="number"
                placeholder="10000"
                value={formData.budgetedAmount}
                onChange={handleChange}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">Description</label>
            <textarea
              name="description"
              rows="4"
              placeholder="What is included in this category, what the team should know, or where the budget may move."
              value={formData.description}
              onChange={handleChange}
              className="auth-input"
            />
          </div>

          {error ? <p className="text-sm text-clay-700">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} disabled={isSubmitting} className="ghost-action">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="primary-action">
              {isSubmitting ? "Saving..." : "Save category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBudgetItemModal;
