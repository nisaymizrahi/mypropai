import React from "react";

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "No asking price saved.";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const ProfileField = ({ label, children, className = "" }) => (
  <label className={`space-y-2 ${className}`}>
    <span className="text-sm font-medium text-ink-700">{label}</span>
    {children}
  </label>
);

const PropertyDetailsDrawer = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  suggestions = [],
  onSelectSuggestion,
  onPreviewLookup,
  isPreviewLoading,
  previewMetadata,
  locationProviderName,
  propertyTypeOptions = [],
  showsUnitCount = false,
  isSaving = false,
  propertyKey = "",
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-ink-950/45 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-[0_18px_60px_rgba(18,32,45,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-6 sm:px-7">
          <div>
            <span className="eyebrow">Property details</span>
            <h2 className="mt-4 text-3xl font-semibold text-ink-900">Edit asset profile</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-500">
              Keep the physical asset accurate without letting profile editing dominate the project
              workspace.
            </p>
          </div>
          <button type="button" onClick={onClose} className="ghost-action">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-7">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="relative md:col-span-2">
                <ProfileField label="Address">
                  <input
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={onChange}
                    className="auth-input"
                    placeholder="Start typing the property address..."
                    required
                  />
                </ProfileField>

                {suggestions.length > 0 ? (
                  <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-[16px] border border-ink-100 bg-white shadow-soft">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => onSelectSuggestion?.(suggestion)}
                        className="w-full border-b border-ink-100 px-4 py-3 text-left text-sm text-ink-700 transition hover:bg-sand-50 last:border-b-0"
                      >
                        {suggestion.place_name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onPreviewLookup?.()}
                  disabled={isPreviewLoading}
                  className="secondary-action disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPreviewLoading ? "Loading details..." : "Auto-fill details"}
                </button>
                <p className="text-sm text-ink-500">Suggestions from {locationProviderName}.</p>
                {previewMetadata ? (
                  <span className="text-sm text-ink-500">
                    {previewMetadata.propertyFound ? "Facts found." : "No facts found."}{" "}
                    {previewMetadata.activeListingFound ? "Listing found." : "No listing found."}
                  </span>
                ) : null}
              </div>

              <ProfileField label="City">
                <input name="city" value={formData.city} onChange={onChange} className="auth-input" />
              </ProfileField>
              <ProfileField label="State">
                <input name="state" value={formData.state} onChange={onChange} className="auth-input" />
              </ProfileField>
              <ProfileField label="Zip code">
                <input name="zipCode" value={formData.zipCode} onChange={onChange} className="auth-input" />
              </ProfileField>
              <ProfileField label="Property type">
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={onChange}
                  className="auth-input appearance-none"
                >
                  {propertyTypeOptions.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </ProfileField>
              {showsUnitCount ? (
                <ProfileField label="Unit count">
                  <input
                    name="unitCount"
                    type="number"
                    value={formData.unitCount}
                    onChange={onChange}
                    className="auth-input"
                  />
                </ProfileField>
              ) : null}
              <ProfileField label="Bedrooms">
                <input
                  name="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={onChange}
                  className="auth-input"
                />
              </ProfileField>
              <ProfileField label="Bathrooms">
                <input
                  name="bathrooms"
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={onChange}
                  className="auth-input"
                />
              </ProfileField>
              <ProfileField label="Square footage">
                <input
                  name="squareFootage"
                  type="number"
                  value={formData.squareFootage}
                  onChange={onChange}
                  className="auth-input"
                />
              </ProfileField>
              <ProfileField label="Lot size">
                <input
                  name="lotSize"
                  type="number"
                  value={formData.lotSize}
                  onChange={onChange}
                  className="auth-input"
                />
              </ProfileField>
              <ProfileField label="Year built">
                <input
                  name="yearBuilt"
                  type="number"
                  value={formData.yearBuilt}
                  onChange={onChange}
                  className="auth-input"
                />
              </ProfileField>

              <div className="md:col-span-2 grid gap-5 rounded-[20px] border border-ink-100 bg-sand-50/60 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(220px,0.9fr)]">
                <ProfileField label="Listing status">
                  <input
                    name="listingStatus"
                    value={formData.listingStatus}
                    onChange={onChange}
                    className="auth-input"
                    placeholder="For Sale"
                  />
                </ProfileField>
                <ProfileField label="Asking price">
                  <input
                    name="sellerAskingPrice"
                    type="number"
                    value={formData.sellerAskingPrice}
                    onChange={onChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </ProfileField>
                <div className="rounded-[18px] border border-ink-100 bg-white/90 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Snapshot
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    {formData.listingStatus || formData.sellerAskingPrice
                      ? formData.listingStatus || "For Sale"
                      : "Not listed"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    {formData.sellerAskingPrice
                      ? formatCurrency(formData.sellerAskingPrice)
                      : "No asking price saved."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-5">
              <p className="text-sm text-ink-500">
                Property key <span className="font-semibold text-ink-900">{propertyKey}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={onClose} className="ghost-action">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </aside>
    </div>
  );
};

export default PropertyDetailsDrawer;
