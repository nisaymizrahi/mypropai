import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { createProperty, previewLeadProperty } from "../utils/api";
import { getLocationProviderName, searchAddressSuggestions } from "../utils/locationSearch";
import { buildPropertyWorkspacePath } from "../utils/propertyWorkspaceNavigation";

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

const workspaceModeOptions = [
  {
    value: "pipeline",
    label: "Lead + property",
    helper: "Recommended for the first deal flow.",
    badge: "Recommended",
  },
  {
    value: "property_only",
    label: "Property only",
    helper: "Start with the project record only.",
  },
  {
    value: "acquisitions",
    label: "Property + financials",
    helper: "Advanced setup for financial work now.",
  },
  {
    value: "management",
    label: "Management-ready",
    helper: "Advanced setup for management now.",
  },
];

const workspaceModeMeta = {
  property_only: {
    eyebrow: "New property",
    title: "Create the shared property first",
    description:
      "Start with one clean project record now and add the lead or other workspaces later if needed.",
    backTo: "/properties",
    backLabel: "Back to properties",
    submitLabel: "Create property",
    successMessage: "Property created.",
    outcomes: [
      "Property record",
      "Editable profile",
      "Setup later",
    ],
  },
  pipeline: {
    eyebrow: "New property + lead",
    title: "Create the property and linked lead together",
    description:
      "This is the default launch path: create the property and lead together so deal analysis is ready right away.",
    backTo: "/leads",
    backLabel: "Back to leads",
    submitLabel: "Create property + lead",
    successMessage: "Lead and property created.",
    outcomes: [
      "Linked lead",
      "Analysis ready",
      "Project workspace later",
    ],
  },
  acquisitions: {
    eyebrow: "New property + financials",
    title: "Create the property with financials ready",
    description:
      "Create the property and financial workspace together.",
    backTo: "/properties",
    backLabel: "Back to properties",
    submitLabel: "Create financial workspace",
    successMessage: "Property and acquisitions workspace created.",
    outcomes: [
      "Property record",
      "Financials ready",
      "Work + docs ready",
    ],
  },
  management: {
    eyebrow: "New property + management",
    title: "Create the property ready for management",
    description:
      "Create the property with management ready to link in.",
    backTo: "/properties",
    backLabel: "Back to properties",
    submitLabel: "Create management-ready property",
    successMessage: "Property and management workspace created.",
    outcomes: [
      "Property record",
      "Management ready",
      "Financials later",
    ],
  },
};

const ModeCard = ({ option, isActive, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(option.value)}
    className={`rounded-[22px] border p-4 text-left transition ${
      isActive
        ? "border-steel-900 bg-steel-900 text-white shadow-soft"
        : "border-ink-100 bg-white/92 text-ink-700 hover:border-ink-200 hover:bg-mist-50"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        {option.badge ? (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isActive ? "bg-white/15 text-white" : "bg-verdigris-50 text-verdigris-700"
            }`}
          >
            {option.badge}
          </span>
        ) : null}
        <p className="text-sm font-semibold">{option.label}</p>
        <p className={`mt-2 text-sm leading-6 ${isActive ? "text-white/75" : "text-ink-500"}`}>
          {option.helper}
        </p>
      </div>
      <span
        className={`mt-0.5 h-4 w-4 rounded-full border ${
          isActive ? "border-white bg-white" : "border-ink-300 bg-transparent"
        }`}
      />
    </div>
  </button>
);

const Field = ({ label, children, className = "" }) => (
  <label className={`space-y-2 ${className}`}>
    <span className="text-sm font-medium text-ink-700">{label}</span>
    {children}
  </label>
);

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
  unitCount: preview.unitCount ?? "",
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
  const suppressSuggestionsRef = useRef(false);
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
  const [showAdvancedModes, setShowAdvancedModes] = useState(
    ["acquisitions", "management"].includes(initialWorkspace)
  );

  const currentMode = workspaceModeMeta[formData.workspaceKey] || workspaceModeMeta.pipeline;
  const visibleModeOptions = showAdvancedModes
    ? workspaceModeOptions
    : workspaceModeOptions.filter((option) => ["property_only", "pipeline"].includes(option.value));

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
    if (suppressSuggestionsRef.current || query.length < 4 || query === selectedSuggestionRef.current) {
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
      suppressSuggestionsRef.current = false;
      selectedSuggestionRef.current = "";
      setPreviewMetadata(null);
    }
  };

  const handleModeSelect = (workspaceKey) => {
    setFormData((current) => ({
      ...current,
      workspaceKey,
    }));
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

      const mappedPreview = mapPreviewToForm(preview);
      suppressSuggestionsRef.current = true;
      setFormData((current) => {
        const next = {
          ...current,
          ...mappedPreview,
        };
        selectedSuggestionRef.current = composeAddress(next) || address;
        return next;
      });
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
    suppressSuggestionsRef.current = true;
    selectedSuggestionRef.current = composeAddress(parsedAddress) || suggestion.place_name;
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
      };

      const result = await createProperty(payload);

      if (formData.workspaceKey === "pipeline" && result.leadId) {
        toast.success(currentMode.successMessage);
        navigate(`/leads/${result.leadId}`);
        return;
      }

      if (result.property?.propertyKey) {
        toast.success(currentMode.successMessage);
        navigate(buildPropertyWorkspacePath(result.property.propertyKey));
        return;
      }

      toast.success(currentMode.successMessage);
      navigate(currentMode.backTo);
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
            <span className="eyebrow">{currentMode.eyebrow}</span>
            <h2 className="mt-4 font-display text-[2.5rem] leading-[0.96] text-ink-900">
              {currentMode.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-500 sm:text-base">
              {currentMode.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={currentMode.backTo} className="secondary-action">
                {currentMode.backLabel}
              </Link>
            </div>
          </div>

          <div className="visual-feature-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Starts with
            </p>
            <div className="mt-5 space-y-3">
              {currentMode.outcomes.map((item) => (
                <div key={item} className="rounded-[16px] border border-ink-100 bg-white/90 px-4 py-4">
                  <p className="text-sm font-medium text-ink-700">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[16px] border border-ink-100 bg-sand-50/70 p-4">
              <p className="text-sm text-ink-600">
                Autofill uses {getLocationProviderName()} for address suggestions plus any available
                property facts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow">Starting mode</span>
              <h3 className="mt-4 text-2xl font-semibold text-ink-900">Start simple</h3>
              <p className="mt-2 text-sm text-ink-500">
                Lead + property is the recommended launch path. You can still open advanced setup when needed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (showAdvancedModes && ["acquisitions", "management"].includes(formData.workspaceKey)) {
                  handleModeSelect("pipeline");
                }
                setShowAdvancedModes((current) => !current);
              }}
              className="ghost-action"
            >
              {showAdvancedModes ? "Hide advanced setup" : "Show advanced setup"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleModeOptions.map((option) => (
              <ModeCard
                key={option.value}
                option={option}
                isActive={formData.workspaceKey === option.value}
                onSelect={handleModeSelect}
              />
            ))}
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Property details</span>
              <h3 className="mt-4 text-2xl font-semibold text-ink-900">Address first</h3>
              <p className="mt-2 text-sm text-ink-500">Fill the basics once, then refine.</p>
            </div>
            <button
              type="button"
              onClick={() => handlePreviewLookup()}
              disabled={isPreviewLoading || !addressQuery.trim()}
              className="secondary-action disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPreviewLoading ? "Loading details..." : "Auto-fill details"}
            </button>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="relative md:col-span-2">
              <Field label="Address">
                <input
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Start typing the property address..."
                  required
                />
              </Field>

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

            <Field label="City">
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="auth-input"
                placeholder="City"
                required
              />
            </Field>

            <Field label="State">
              <input
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="auth-input"
                placeholder="State"
                required
              />
            </Field>

            <Field label="Zip code">
              <input
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="auth-input"
                placeholder="Zip code"
                required
              />
            </Field>

            <div className="md:col-span-2 rounded-[18px] border border-ink-100 bg-sand-50/60 px-4 py-4">
              <p className="text-sm text-ink-600">
                {previewMetadata ? (
                  <>
                    {previewMetadata.propertyFound ? "Facts found." : "No facts found."}{" "}
                    {previewMetadata.activeListingFound ? "Listing found." : "No active listing found."}
                  </>
                ) : (
                  "Use autofill to pull in property facts and listing details."
                )}
              </p>
            </div>

            <Field label="Property type">
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
            </Field>

            <Field label="Bedrooms">
              <input
                name="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={handleChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>

            <Field label="Bathrooms">
              <input
                name="bathrooms"
                type="number"
                step="0.5"
                value={formData.bathrooms}
                onChange={handleChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>

            <Field label="Square footage">
              <input
                name="squareFootage"
                type="number"
                value={formData.squareFootage}
                onChange={handleChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>

            <Field label="Lot size">
              <input
                name="lotSize"
                type="number"
                value={formData.lotSize}
                onChange={handleChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>

            <Field label="Year built">
              <input
                name="yearBuilt"
                type="number"
                value={formData.yearBuilt}
                onChange={handleChange}
                className="auth-input"
                placeholder="0"
              />
            </Field>

            {showsUnitCount ? (
              <Field label="Unit count">
                <input
                  name="unitCount"
                  type="number"
                  value={formData.unitCount}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="0"
                />
              </Field>
            ) : null}

            <div className="md:col-span-2 rounded-[20px] border border-ink-100 bg-sand-50/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">Sale status</p>
                  <p className="mt-1 text-sm text-ink-500">Keep current listing info here.</p>
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
                  <Field label="Sale price">
                    <input
                      name="sellerAskingPrice"
                      type="number"
                      value={formData.sellerAskingPrice}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="0"
                    />
                  </Field>

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
                        : "Listed for sale, but no asking price was found."}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-ink-500">No active sale listing found.</p>
              )}
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-[16px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link to={currentMode.backTo} className="ghost-action">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : currentMode.submitLabel}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default CreatePropertyPage;
