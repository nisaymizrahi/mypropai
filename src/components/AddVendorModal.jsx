import React, { useEffect, useState } from "react";

import { createVendor } from "../utils/api";

const buildInitialFormState = (initialValues = {}) => ({
  name: "",
  trade: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  ...initialValues,
});

const AddVendorModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialValues = {},
  title = "Add vendor",
  eyebrow = "Vendor roster",
  description = "Save a contractor or specialist so they can be reused across tasks and expenses.",
  submitLabel = "Save vendor",
}) => {
  const [formData, setFormData] = useState(() => buildInitialFormState(initialValues));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(buildInitialFormState(initialValues));
      setError("");
      setIsSubmitting(false);
    }
  }, [initialValues, isOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleClose = () => {
    setFormData(buildInitialFormState(initialValues));
    setError("");
    setIsSubmitting(false);
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.trade.trim()) {
      setError("Vendor name and trade are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const savedVendor = await createVendor({
        name: formData.name.trim(),
        trade: formData.trade.trim(),
        notes: formData.notes.trim(),
        contactInfo: {
          contactName: formData.contactName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
        },
      });

      onSuccess?.(savedVendor);
      handleClose();
    } catch (err) {
      setError(err.message || "Failed to save vendor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="surface-panel-strong w-full max-w-2xl rounded-[32px] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-6">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2 className="mt-4 text-3xl font-semibold text-ink-900">{title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-500">
              {description}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Vendor name</label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="auth-input"
                placeholder="Northline Plumbing"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">
                Primary contact name
              </label>
              <input
                name="contactName"
                type="text"
                value={formData.contactName}
                onChange={handleChange}
                className="auth-input"
                placeholder="Maria Alvarez"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Trade</label>
              <input
                name="trade"
                type="text"
                value={formData.trade}
                onChange={handleChange}
                className="auth-input"
                placeholder="Plumbing"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Address</label>
              <input
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="auth-input"
                placeholder="123 Main St, Philadelphia, PA"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="auth-input"
                placeholder="crew@northline.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Phone</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="auth-input"
                placeholder="(555) 555-0123"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">Notes</label>
            <textarea
              name="notes"
              rows="4"
              value={formData.notes}
              onChange={handleChange}
              className="auth-input"
              placeholder="Licensing, preferred scope, pricing notes, or availability."
            />
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
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVendorModal;
