import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { createVendor, updateVendor } from "../utils/api";
import {
  VENDOR_SPECIALTY_OPTIONS,
  VENDOR_STATUS_OPTIONS,
  getVendorSpecialties,
} from "../utils/vendors";

const buildFormState = (vendor = null) => ({
  name: vendor?.name || "",
  specialties: getVendorSpecialties(vendor),
  customSpecialty: "",
  description: vendor?.description || "",
  contactName: vendor?.contactInfo?.contactName || "",
  email: vendor?.contactInfo?.email || "",
  phone: vendor?.contactInfo?.phone || "",
  address: vendor?.contactInfo?.address || "",
  serviceArea: vendor?.serviceArea || "",
  status: vendor?.status || (vendor?.isActive === false ? "inactive" : "active"),
  afterHoursAvailable: Boolean(vendor?.afterHoursAvailable),
  notes: vendor?.notes || "",
});

const VendorFormModal = ({ isOpen, onClose, onSaved, vendor = null }) => {
  const [formData, setFormData] = useState(() => buildFormState(vendor));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const specialtyOptions = useMemo(
    () => [...new Set([...VENDOR_SPECIALTY_OPTIONS, ...(formData.specialties || [])])],
    [formData.specialties]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(buildFormState(vendor));
    setError("");
    setIsSubmitting(false);
  }, [isOpen, vendor]);

  if (!isOpen) {
    return null;
  }

  const toggleSpecialty = (specialty) => {
    setFormData((current) => {
      const exists = current.specialties.includes(specialty);
      return {
        ...current,
        specialties: exists
          ? current.specialties.filter((item) => item !== specialty)
          : [...current.specialties, specialty],
      };
    });
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddCustomSpecialty = () => {
    const specialty = String(formData.customSpecialty || "").trim();
    if (!specialty) {
      return;
    }

    setFormData((current) => ({
      ...current,
      specialties: current.specialties.includes(specialty)
        ? current.specialties
        : [...current.specialties, specialty],
      customSpecialty: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Vendor name is required.");
      return;
    }

    if (formData.specialties.length === 0) {
      setError("Select at least one specialty.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      trade: formData.specialties[0],
      specialties: formData.specialties,
      description: formData.description.trim(),
      notes: formData.notes.trim(),
      status: formData.status,
      afterHoursAvailable: formData.afterHoursAvailable,
      serviceArea: formData.serviceArea.trim(),
      contactInfo: {
        contactName: formData.contactName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      },
    };

    try {
      setIsSubmitting(true);
      setError("");

      const savedVendor = vendor?._id
        ? await updateVendor(vendor._id, payload)
        : await createVendor(payload);

      toast.success(vendor?._id ? "Vendor updated." : "Vendor created.");
      onSaved?.(savedVendor);
      onClose?.();
    } catch (submitError) {
      setError(submitError.message || "Failed to save vendor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm">
      <div className="surface-panel-strong max-h-[92vh] w-full max-w-4xl overflow-y-auto px-6 py-6 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow">Vendor directory</span>
            <h2 className="mt-4 text-[2rem] font-medium tracking-tight text-ink-900">
              {vendor?._id ? "Edit vendor" : "Add vendor"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              Keep specialties, contact information, coverage, and assignment readiness in one
              place so vendor decisions stay fast.
            </p>
          </div>

          <button type="button" onClick={onClose} className="ghost-action">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Vendor / company name</span>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="auth-input"
                placeholder="Northline Plumbing"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Primary contact name</span>
              <input
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className="auth-input"
                placeholder="Maria Alvarez"
              />
            </label>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink-700">Specialties</p>
                <p className="mt-1 text-sm text-ink-500">
                  Select the work this vendor can cover, then add anything custom.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  name="customSpecialty"
                  value={formData.customSpecialty}
                  onChange={handleChange}
                  className="auth-input min-w-[180px]"
                  placeholder="Custom specialty"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSpecialty}
                  className="secondary-action"
                >
                  Add custom
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {specialtyOptions.map((specialty) => {
                const selected = formData.specialties.includes(specialty);
                return (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => toggleSpecialty(specialty)}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                      selected
                        ? "bg-ink-900 text-white"
                        : "border border-ink-100 bg-white text-ink-600 hover:bg-ink-50"
                    }`}
                  >
                    {specialty}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 xl:col-span-2">
              <span className="text-sm font-medium text-ink-700">Email</span>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="auth-input"
                placeholder="crew@northline.com"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Phone</span>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="auth-input"
                placeholder="(555) 555-0123"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Status</span>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="auth-input"
              >
                {VENDOR_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Address</span>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="auth-input"
                placeholder="123 Main St, Dallas, TX"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Service area</span>
              <input
                name="serviceArea"
                value={formData.serviceArea}
                onChange={handleChange}
                className="auth-input"
                placeholder="Dallas-Fort Worth, Collin County, North Austin"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-[18px] border border-ink-100 bg-white/85 px-4 py-3 text-sm text-ink-700">
            <input
              type="checkbox"
              name="afterHoursAvailable"
              checked={formData.afterHoursAvailable}
              onChange={handleChange}
              className="h-4 w-4 rounded border-ink-300 text-verdigris-600 focus:ring-verdigris-500"
            />
            Available for after-hours or emergency work
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-ink-700">Description</span>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="auth-input"
              placeholder="Preferred scope, crew strengths, pricing position, or general summary."
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-ink-700">Internal notes</span>
            <textarea
              name="notes"
              rows="4"
              value={formData.notes}
              onChange={handleChange}
              className="auth-input"
              placeholder="Insurance concerns, pricing notes, quality observations, or assignment rules."
            />
          </label>

          {error ? (
            <div className="rounded-[16px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={onClose} className="ghost-action" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="primary-action" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : vendor?._id ? "Save changes" : "Create vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorFormModal;
