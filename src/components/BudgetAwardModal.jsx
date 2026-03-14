import React, { useEffect, useState } from "react";

const buildInitialForm = (award = null) => ({
  vendorId:
    typeof award?.vendor === "object" ? award?.vendor?._id || "" : award?.vendor || "",
  vendorName:
    award?.vendorName || (typeof award?.vendor === "object" ? award?.vendor?.name || "" : ""),
  description: award?.description || "",
  amount: award?.amount ?? "",
  notes: award?.notes || "",
});

const BudgetAwardModal = ({
  isOpen,
  onClose,
  onSave,
  vendors = [],
  budgetItem = null,
  initialAward = null,
}) => {
  const [formData, setFormData] = useState(() => buildInitialForm(initialAward));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(buildInitialForm(initialAward));
    setError("");
    setIsSaving(false);
  }, [initialAward, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === "vendorId" && value) {
        const selectedVendor = vendors.find((vendor) => vendor._id === value);
        next.vendorName = selectedVendor?.name || "";
      }

      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.vendorId && !formData.vendorName.trim()) {
      setError("Choose a vendor or enter the payee name.");
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await onSave({
        vendor: formData.vendorId || "",
        vendorName: formData.vendorId ? "" : formData.vendorName.trim(),
        description: formData.description.trim(),
        amount: Number(formData.amount),
        notes: formData.notes.trim(),
      });
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Failed to save vendor commitment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="surface-panel-strong w-full max-w-2xl px-6 py-6 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">Vendor commitment</span>
            <h2 className="mt-4 text-[2rem] font-medium tracking-tight text-ink-900">
              {initialAward ? "Edit selected vendor" : "Add selected vendor"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              {budgetItem?.category
                ? `Track the committed amount for ${budgetItem.category} without losing the original project budget.`
                : "Track the committed amount for this scope item without losing the original project budget."}
            </p>
          </div>

          <button type="button" onClick={onClose} className="ghost-action">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-700">Vendor from your list</span>
            <select
              name="vendorId"
              value={formData.vendorId}
              onChange={handleChange}
              className="auth-input appearance-none"
            >
              <option value="">Select a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                  {vendor.trade ? ` - ${vendor.trade}` : ""}
                </option>
              ))}
            </select>
          </label>

          {!formData.vendorId ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Or enter a payee name</span>
              <input
                name="vendorName"
                value={formData.vendorName}
                onChange={handleChange}
                className="auth-input"
                placeholder="Example: Home Depot, Stone Gallery, Cash tile crew"
              />
            </label>
          ) : null}

          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_180px]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Scope / quote note</span>
              <input
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="auth-input"
                placeholder="Labor only, cabinets + counters, deposit, appliance order"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Committed amount</span>
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                className="auth-input"
                placeholder="0.00"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-700">Notes</span>
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              className="auth-input"
              placeholder="Example: price includes install, tax excluded, 50% deposit due up front."
            />
          </label>

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
              disabled={isSaving}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : initialAward ? "Save changes" : "Add vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetAwardModal;
