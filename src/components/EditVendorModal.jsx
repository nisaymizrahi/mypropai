import React, { useEffect, useState } from "react";

import { updateVendor } from "../utils/api";

const emptyState = {
  name: "",
  trade: "",
  email: "",
  phone: "",
  notes: "",
  isActive: true,
};

const EditVendorModal = ({ isOpen, onClose, onSuccess, vendor }) => {
  const [formData, setFormData] = useState(emptyState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (vendor && isOpen) {
      setFormData({
        name: vendor.name || "",
        trade: vendor.trade || "",
        email: vendor.contactInfo?.email || "",
        phone: vendor.contactInfo?.phone || "",
        notes: vendor.notes || "",
        isActive: vendor.isActive !== false,
      });
      setError("");
      setIsSubmitting(false);
    }
  }, [vendor, isOpen]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleClose = () => {
    setError("");
    setIsSubmitting(false);
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!vendor?._id) {
      setError("Vendor details are not available.");
      return;
    }

    if (!formData.name.trim() || !formData.trade.trim()) {
      setError("Vendor name and trade are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await updateVendor(vendor._id, {
        name: formData.name.trim(),
        trade: formData.trade.trim(),
        notes: formData.notes.trim(),
        isActive: formData.isActive,
        contactInfo: {
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        },
      });

      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err.message || "Failed to update vendor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !vendor) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="surface-panel-strong w-full max-w-2xl rounded-[32px] p-6 sm:p-7">
        <div>
          <span className="eyebrow">Vendor roster</span>
          <h2 className="mt-4 text-3xl font-semibold text-ink-900">Edit vendor</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            Keep contact details, notes, and activity status current for this project partner.
          </p>
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
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">Trade</label>
              <input
                name="trade"
                type="text"
                value={formData.trade}
                onChange={handleChange}
                className="auth-input"
                required
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
            />
          </div>

          <label className="flex items-center gap-3 rounded-[20px] border border-ink-100 bg-white/85 px-4 py-3 text-sm text-ink-700">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-ink-300 text-verdigris-600 focus:ring-verdigris-500"
            />
            Vendor is currently active for assignments and project work
          </label>

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
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVendorModal;
