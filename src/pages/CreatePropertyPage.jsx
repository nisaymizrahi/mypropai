import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { createProperty, previewLeadProperty } from "../utils/api";
import { getLocationProviderName, searchAddressSuggestions } from "../utils/locationSearch";

const propertyTypeOptions = [
  { value: "", label: "Select property type" },
  { value: "single-family", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "mixed-use", label: "Mixed Use" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "other", label: "Other" },
];

const normalizeWorkspaceKey = (value) => {
  if (["property_only", "pipeline", "acquisitions", "management"].includes(value)) {
    return value;
  }

  return "pipeline";
};

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const extractAddressLine1 = (value = "") => String(value).split(",")[0]?.trim() || "";

const parseAddressLabel = (value = "") => {
  const [addressLine1 = "", city = "", region = ""] = String(value)
    .split(",")
    .map((part) => part.trim());
  const regionTokens = region.split(/\s+/).filter(Boolean);

  return {
    addressLine1,
    city,
    state: regionTokens[0] || "",
    zipCode: regionTokens[1] || "",
  };
};

const composeAddress = (parts = {}) =>
  [parts.addressLine1, parts.city, parts.state, parts.zipCode].filter(Boolean).join(", ");

const normalizePropertyType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (!normalized) return "";
  if (propertyTypeOptions.some((option) => option.value === normalized)) {
    return normalized;
  }
  if (normalized.includes("single")) return "single-family";
  if (normalized.includes("condo")) return "condo";
  if (normalized.includes("town")) return "townhouse";
  if (normalized.includes("multi")) return "multi-family";
  if (normalized.includes("mixed")) return "mixed-use";
  if (normalized.includes("commercial")) return "commercial";
  if (normalized.includes("land") || normalized.includes("lot")) return "land";
  return "other";
};

const mapPreviewToForm = (preview = {}) => ({
  addressLine1: preview.addressLine1 || extractAddressLine1(preview.address),
  city: preview.city || "",
  state: preview.state || "",
  zipCode: preview.zipCode || "",
  propertyType: normalizePropertyType(preview.propertyType),
  bedrooms: preview.bedrooms ?? "",
  bathrooms: preview.bathrooms ?? "",
  squareFootage: preview.squareFootage ?? "",
  lotSize: preview.lotSize ?? "",
  yearBuilt: preview.yearBuilt ?? "",
  listingStatus: preview.listingStatus || "",
  sellerAskingPrice: preview.sellerAskingPrice ?? "",
  latitude: preview.latitude ?? "",
  longitude: preview.longitude ?? "",
});

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const CreatePropertyPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedSuggestionRef = useRef("");
  const initialWorkspace = normalizeWorkspaceKey(searchParams.get("workspace"));

  const [formData, setFormData] = useState({
    addressLine1: "",
    city: "",
    state: "",
    zipCode: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    squareFootage: "",
    lotSize: "",
    yearBuilt: "",
    unitCount: "",
    listingStatus: "",
    sellerAskingPrice: "",
    latitude: "",
    longitude: "",
    workspaceKey: initialWorkspace,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewMetadata, setPreviewMetadata] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addressQuery = useMemo(
    () =>
      composeAddress({
        addressLine1: formData.addressLine1,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      }),
    [formData.addressLine1, formData.city, formData.state, formData.zipCode]
  );

  const showsUnitCount = formData.propertyType === "multi-family";
  const isForSale = Boolean(
    previewMetadata?.activeListingFound || formData.listingStatus || formData.sellerAskingPrice
  );

  useEffect(() => {
    const query = addressQuery.trim();
    if (query.length < 4 || query === selectedSuggestionRef.current) {
      setSuggestions([]);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(query, controller.signal);
        setSuggestions(results);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          console.error("Address suggestion error", fetchError);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [addressQuery]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => {
      const nextState = {
        ...current,
        [name]: value,
      };

      if (name === "propertyType" && value !== "multi-family") {
        nextState.unitCount = "";
      }

      return nextState;
    });

    if (["addressLine1", "city", "state", "zipCode"].includes(name)) {
      setPreviewMetadata(null);
      if (name === "addressLine1") {
        selectedSuggestionRef.current = "";
      }
    }
  };

  const handlePreviewLookup = async (addressOverride, fieldOverrides = {}) => {
    const previewSource = {
      ...formData,
      ...fieldOverrides,
    };
    const address = addressOverride || composeAddress(previewSource);
    if (!address.trim()) {
      toast.error("Enter an address first.");
      return;
    }

    setIsPreviewLoading(true);
    try {
      const preview = await previewLeadProperty({
        address,
        addressLine1: previewSource.addressLine1,
        city: previewSource.city,
        state: previewSource.state,
        zipCode: previewSource.zipCode,
        propertyType: previewSource.propertyType || undefined,
        bedrooms: toOptionalNumber(previewSource.bedrooms),
        bathrooms: toOptionalNumber(previewSource.bathrooms),
        squareFootage: toOptionalNumber(previewSource.squareFootage),
        lotSize: toOptionalNumber(previewSource.lotSize),
        yearBuilt: toOptionalNumber(previewSource.yearBuilt),
        sellerAskingPrice: toOptionalNumber(previewSource.sellerAskingPrice),
        listingStatus: previewSource.listingStatus || undefined,
      });

      setFormData((current) => ({
        ...current,
        ...mapPreviewToForm(preview),
      }));
      setPreviewMetadata(preview.metadata || null);
      setSuggestions([]);
    } catch (previewError) {
      toast.error(previewError.message || "Failed to auto-fill property details.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    const parsedAddress = parseAddressLabel(suggestion.place_name);
    selectedSuggestionRef.current = suggestion.place_name;
    setSuggestions([]);
    setFormData((current) => ({
      ...current,
      ...parsedAddress,
    }));
    await handlePreviewLookup(suggestion.place_name, parsedAddress);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        address: composeAddress(formData),
        addressLine1: formData.addressLine1 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        latitude: toOptionalNumber(formData.latitude),
        longitude: toOptionalNumber(formData.longitude),
        propertyType: formData.propertyType || undefined,
        bedrooms: toOptionalNumber(formData.bedrooms),
        bathrooms: toOptionalNumber(formData.bathrooms),
        squareFootage: toOptionalNumber(formData.squareFootage),
        lotSize: toOptionalNumber(formData.lotSize),
        yearBuilt: toOptionalNumber(formData.yearBuilt),
        unitCount: showsUnitCount ? toOptionalNumber(formData.unitCount) : undefined,
        listingStatus: isForSale ? formData.listingStatus || "For Sale" : undefined,
        sellerAskingPrice: isForSale ? toOptionalNumber(formData.sellerAskingPrice) : undefined,
        workspaceKey: formData.workspaceKey,
        strategy:
          formData.workspaceKey === "management"
            ? "rental"
            : formData.workspaceKey === "acquisitions"
              ? "flip"
              : undefined,
      };

      const result = await createProperty(payload);

      if (result.managedPropertyId) {
        toast.success("Property created and launched into management.");
        navigate(`/management/${result.managedPropertyId}`);
        return;
      }

      if (result.investmentId) {
        toast.success("Property created and sent to investments.");
        navigate(`/investments/${result.investmentId}`);
        return;
      }

      if (result.leadId) {
        toast.success("Property created and added to leads.");
        navigate(`/leads/${result.leadId}`);
        return;
      }

      if (result.property?.propertyKey) {
        toast.success("Property created.");
        navigate(`/properties/${encodeURIComponent(result.property.propertyKey)}`);
        return;
      }

      toast.success("Property created.");
      navigate("/leads");
    } catch (submitError) {
      setError(submitError.message || "Failed to create property.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="surface-panel px-6 py-6 sm:px-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <span className="eyebrow">Add property</span>
            <h2 className="mt-4 font-display text-[2.5rem] leading-[0.96] text-ink-900">
              Start with the address, then fill in only the details you need.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-500 sm:text-base">
              Add a potential property to the pipeline with one clean form. Address lookup can fill the basics, and sale status appears automatically when the property is actively listed.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/leads" className="secondary-action">
                Back to leads
              </Link>
            </div>
          </div>

          <div className="section-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Autofill
            </p>
            <h3 className="mt-3 font-display text-[1.9rem] leading-none text-ink-900">
              Address first, details second
            </h3>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              Start typing an address, choose the right result, and let the lookup prefill any property facts and sale information it can find.
            </p>

            <div className="mt-5 rounded-[16px] border border-ink-100 bg-white/90 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
                Autofill source
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                Address suggestions come from {getLocationProviderName()}, and the property detail
                lookup checks for sale activity plus available property facts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit}>
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Property details</span>
          <h3 className="mt-4 font-display text-[2rem] leading-none text-ink-900">Keep the first form simple</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Select an address, auto-fill the basics, and only enter unit count when the property is
            multi-family.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="relative md:col-span-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Address line</span>
                <input
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Start typing the property address..."
                  required
                />
              </label>

              {suggestions.length > 0 ? (
                <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-[16px] border border-ink-100 bg-white shadow-soft">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full border-b border-ink-100 px-4 py-3 text-left text-sm text-ink-700 transition hover:bg-sand-50 last:border-b-0"
                    >
                      {suggestion.place_name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">City</span>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="auth-input"
                placeholder="City"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">State</span>
              <input
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="auth-input"
                placeholder="State"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Zip code</span>
              <input
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="auth-input"
                placeholder="Zip code"
                required
              />
            </label>

            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePreviewLookup()}
                  disabled={isPreviewLoading || !addressQuery.trim()}
                  className="secondary-action disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPreviewLoading ? "Loading property details..." : "Auto-fill property details"}
                </button>
                {previewMetadata ? (
                  <p className="text-sm text-ink-500">
                    {previewMetadata.propertyFound
                      ? "Property facts found."
                      : "No property facts found."}{" "}
                    {previewMetadata.activeListingFound
                      ? "Active sale listing found."
                      : "No active sale listing found."}
                  </p>
                ) : (
                  <p className="text-sm text-ink-500">
                    Use the lookup after selecting an address to fill the property facts and sale
                    status.
                  </p>
                )}
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Property type</span>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="auth-input appearance-none"
              >
                {propertyTypeOptions.map((option) => (
                  <option key={option.value || "empty"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Bedrooms</span>
              <input
                name="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={handleChange}
                className="auth-input"
                placeholder="0"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Bathrooms</span>
              <input
                name="bathrooms"
                type="number"
                step="0.5"
                value={formData.bathrooms}
                onChange={handleChange}
                className="auth-input"
                placeholder="0"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Square footage</span>
              <input
                name="squareFootage"
                type="number"
                value={formData.squareFootage}
                onChange={handleChange}
                className="auth-input"
                placeholder="0"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Lot size</span>
              <input
                name="lotSize"
                type="number"
                value={formData.lotSize}
                onChange={handleChange}
                className="auth-input"
                placeholder="0"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Year built</span>
              <input
                name="yearBuilt"
                type="number"
                value={formData.yearBuilt}
                onChange={handleChange}
                className="auth-input"
                placeholder="0"
              />
            </label>

            {showsUnitCount ? (
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Unit count</span>
                <input
                  name="unitCount"
                  type="number"
                  value={formData.unitCount}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="0"
                />
              </label>
            ) : null}

            <div className="md:col-span-2 rounded-[16px] border border-ink-100 bg-sand-50/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">Sale status</p>
                  <p className="mt-1 text-sm text-ink-500">
                    If the property has an active listing, we show that here automatically.
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    isForSale
                      ? "bg-verdigris-50 text-verdigris-700"
                      : "bg-white text-ink-600 ring-1 ring-ink-100"
                  }`}
                >
                  {isForSale ? "For sale" : "Not listed"}
                </span>
              </div>

              {isForSale ? (
                <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-ink-700">Sale price</span>
                    <input
                      name="sellerAskingPrice"
                      type="number"
                      value={formData.sellerAskingPrice}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="0"
                    />
                  </label>

                  <div className="rounded-[16px] border border-ink-100 bg-white/90 p-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
                      Listing snapshot
                    </p>
                    <p className="mt-2 text-sm font-medium text-ink-800">
                      {formData.listingStatus || "For Sale"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      {formData.sellerAskingPrice
                        ? `Current sale price: ${formatCurrency(formData.sellerAskingPrice)}`
                        : "The property is listed for sale, but the asking price was not available from the lookup."}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-ink-500">
                  No active sale listing was found for this address yet.
                </p>
              )}
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-[16px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link to="/leads" className="ghost-action">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Add property"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default CreatePropertyPage;
