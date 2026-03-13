import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { createProperty, previewLeadProperty } from "../utils/api";
import { getLocationProviderName, searchAddressSuggestions } from "../utils/locationSearch";
import { PROPERTY_STRATEGIES } from "../utils/propertyStrategy";

const propertyTypeOptions = [
  { value: "", label: "Select property type" },
  { value: "single-family", label: "Single Family" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "mixed-use", label: "Mixed Use" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "other", label: "Other" },
];

const occupancyOptions = ["Unknown", "Vacant", "Owner Occupied", "Tenant Occupied"];

const workspaceOptions = [
  {
    value: "property_only",
    label: "Property only",
    description: "Create the shared property record first, then place it into a workspace later.",
  },
  {
    value: "pipeline",
    label: "Start in pipeline",
    description: "Create the property and attach a lead workspace for seller-side tracking.",
  },
  {
    value: "acquisitions",
    label: "Start in acquisitions",
    description: "Create the property and open an investment workspace right away.",
  },
  {
    value: "management",
    label: "Start in management",
    description: "Create the property, seed an eligible investment, and open the management workspace.",
  },
];

const normalizeWorkspaceKey = (value) => {
  if (["property_only", "pipeline", "acquisitions", "management"].includes(value)) {
    return value;
  }

  return "property_only";
};

const mapPreviewToForm = (preview = {}) => ({
  address: preview.address || "",
  addressLine1: preview.addressLine1 || "",
  addressLine2: preview.addressLine2 || "",
  city: preview.city || "",
  state: preview.state || "",
  zipCode: preview.zipCode || "",
  county: preview.county || "",
  latitude: preview.latitude ?? "",
  longitude: preview.longitude ?? "",
  propertyType: preview.propertyType || "",
  bedrooms: preview.bedrooms ?? "",
  bathrooms: preview.bathrooms ?? "",
  squareFootage: preview.squareFootage ?? "",
  lotSize: preview.lotSize ?? "",
  yearBuilt: preview.yearBuilt ?? "",
  sellerAskingPrice: preview.sellerAskingPrice ?? "",
  listingStatus: preview.listingStatus || "",
  daysOnMarket: preview.daysOnMarket ?? "",
  lastSalePrice: preview.lastSalePrice ?? "",
  lastSaleDate: preview.lastSaleDate ? String(preview.lastSaleDate).slice(0, 10) : "",
});

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const managementStrategyOptions = PROPERTY_STRATEGIES.filter(
  (option) => option.value === "fix_and_rent" || option.value === "rental"
);

const CreatePropertyPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSuggestionRef = useRef("");
  const initialWorkspace = normalizeWorkspaceKey(searchParams.get("workspace"));

  const [formData, setFormData] = useState({
    address: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    county: "",
    latitude: "",
    longitude: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    squareFootage: "",
    lotSize: "",
    yearBuilt: "",
    unitCount: "",
    workspaceKey: initialWorkspace,
    strategy: initialWorkspace === "management" ? "rental" : "flip",
    purchasePrice: "",
    arv: "",
    sellerAskingPrice: "",
    sellerName: "",
    sellerPhone: "",
    sellerEmail: "",
    leadSource: "",
    occupancyStatus: "Unknown",
    motivation: "",
    targetOffer: "",
    rehabEstimate: "",
    nextAction: "",
    followUpDate: "",
    notes: "",
    listingStatus: "",
    daysOnMarket: "",
    lastSalePrice: "",
    lastSaleDate: "",
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewMetadata, setPreviewMetadata] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const workspaceDetails = useMemo(
    () => workspaceOptions.find((option) => option.value === formData.workspaceKey),
    [formData.workspaceKey]
  );

  const showsUnitCount = ["multi-family", "mixed-use", "commercial"].includes(
    formData.propertyType
  );

  useEffect(() => {
    const query = formData.address.trim();
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
  }, [formData.address]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => {
      const nextState = {
        ...current,
        [name]: value,
      };

      if (name === "workspaceKey") {
        if (value === "management" && nextState.strategy === "flip") {
          nextState.strategy = "rental";
        }

        setSearchParams(value === "property_only" ? {} : { workspace: value }, { replace: true });
      }

      return nextState;
    });

    if (name === "address") {
      selectedSuggestionRef.current = "";
      setPreviewMetadata(null);
    }
  };

  const handlePreviewLookup = async (addressOverride) => {
    const address = addressOverride || formData.address.trim();
    if (!address) {
      toast.error("Select or type an address first.");
      return;
    }

    setIsPreviewLoading(true);
    try {
      const preview = await previewLeadProperty({
        ...formData,
        address,
      });

      setFormData((current) => ({
        ...current,
        ...mapPreviewToForm(preview),
        strategy:
          current.workspaceKey === "management" && current.strategy === "flip"
            ? "rental"
            : current.strategy,
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
    selectedSuggestionRef.current = suggestion.place_name;
    setSuggestions([]);
    setFormData((current) => ({
      ...current,
      address: suggestion.place_name,
      longitude: suggestion.center?.[0] ?? current.longitude,
      latitude: suggestion.center?.[1] ?? current.latitude,
    }));
    await handlePreviewLookup(suggestion.place_name);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        address: formData.address,
        addressLine1: formData.addressLine1 || undefined,
        addressLine2: formData.addressLine2 || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        county: formData.county || undefined,
        latitude: toOptionalNumber(formData.latitude),
        longitude: toOptionalNumber(formData.longitude),
        propertyType: formData.propertyType || undefined,
        bedrooms: toOptionalNumber(formData.bedrooms),
        bathrooms: toOptionalNumber(formData.bathrooms),
        squareFootage: toOptionalNumber(formData.squareFootage),
        lotSize: toOptionalNumber(formData.lotSize),
        yearBuilt: toOptionalNumber(formData.yearBuilt),
        unitCount: showsUnitCount ? toOptionalNumber(formData.unitCount) : undefined,
        workspaceKey: formData.workspaceKey,
        strategy: formData.strategy,
        purchasePrice: toOptionalNumber(formData.purchasePrice),
        arv: toOptionalNumber(formData.arv),
        sellerAskingPrice: toOptionalNumber(formData.sellerAskingPrice),
        sellerName: formData.sellerName || undefined,
        sellerPhone: formData.sellerPhone || undefined,
        sellerEmail: formData.sellerEmail || undefined,
        leadSource: formData.leadSource || undefined,
        occupancyStatus: formData.occupancyStatus || undefined,
        motivation: formData.motivation || undefined,
        targetOffer: toOptionalNumber(formData.targetOffer),
        rehabEstimate: toOptionalNumber(formData.rehabEstimate),
        nextAction: formData.nextAction || undefined,
        followUpDate: formData.followUpDate || undefined,
        notes: formData.notes || undefined,
        listingStatus: formData.listingStatus || undefined,
        daysOnMarket: toOptionalNumber(formData.daysOnMarket),
        lastSalePrice: toOptionalNumber(formData.lastSalePrice),
        lastSaleDate: formData.lastSaleDate || undefined,
      };

      const result = await createProperty(payload);

      if (result.managedPropertyId) {
        toast.success("Property created and launched into management.");
        navigate(`/management/${result.managedPropertyId}`);
        return;
      }

      if (result.investmentId) {
        toast.success("Property created and sent to acquisitions.");
        navigate(`/investments/${result.investmentId}`);
        return;
      }

      if (result.leadId) {
        toast.success("Property created and added to pipeline.");
        navigate(`/leads/${result.leadId}`);
        return;
      }

      if (result.property?.propertyKey) {
        toast.success("Property created.");
        navigate(`/properties/${encodeURIComponent(result.property.propertyKey)}`);
        return;
      }

      toast.success("Property created.");
      navigate("/properties");
    } catch (submitError) {
      setError(submitError.message || "Failed to create property.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Property-first creation</span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900">
              Create the property once, then launch the right workspace.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">
              This is now the shared front door for leads, acquisitions, and management. Start
              with the address, auto-fill what we can, and then add only the extra fields needed
              for the workflow you want.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/properties" className="secondary-action">
                Back to properties
              </Link>
            </div>
          </div>

          <div className="section-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Starting mode
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-ink-900">
              {workspaceDetails?.label || "Property only"}
            </h3>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              {workspaceDetails?.description}
            </p>

            <div className="mt-6 rounded-[22px] border border-ink-100 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Autofill source
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                Address suggestions come from {getLocationProviderName()}, and the property detail
                lookup uses the backend preview service to pull address context and property facts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Shared profile</span>
          <h3 className="mt-4 text-2xl font-semibold text-ink-900">Core property details</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            These fields become the shared property identity used across leads, investments, and
            management.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="relative md:col-span-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Address</span>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Start typing an address..."
                  required
                />
              </label>

              {suggestions.length > 0 ? (
                <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-[22px] border border-ink-100 bg-white shadow-luxe">
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

            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePreviewLookup()}
                  disabled={isPreviewLoading || !formData.address.trim()}
                  className="secondary-action disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPreviewLoading ? "Loading property details..." : "Auto-fill property details"}
                </button>
                {previewMetadata ? (
                  <p className="text-sm text-ink-500">
                    {previewMetadata.propertyFound
                      ? "Property record found."
                      : "No property record found."}{" "}
                    {previewMetadata.activeListingFound
                      ? "Active listing found."
                      : "No active listing found."}
                  </p>
                ) : null}
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
            ) : (
              <div className="hidden md:block" />
            )}

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
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Placement</span>
          <h3 className="mt-4 text-2xl font-semibold text-ink-900">Where should it start?</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Choose the first behavior this property should have. The shared property profile stays
            in one place even as you add more workspaces later.
          </p>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {workspaceOptions.map((option) => (
              <label
                key={option.value}
                className={`block cursor-pointer rounded-[22px] border px-4 py-4 transition ${
                  formData.workspaceKey === option.value
                    ? "border-verdigris-300 bg-verdigris-50/70"
                    : "border-ink-100 bg-white/90 hover:border-ink-200"
                }`}
              >
                <input
                  type="radio"
                  name="workspaceKey"
                  value={option.value}
                  checked={formData.workspaceKey === option.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <p className="text-sm font-semibold text-ink-900">{option.label}</p>
                <p className="mt-1 text-sm leading-6 text-ink-500">{option.description}</p>
              </label>
            ))}
          </div>

          {formData.workspaceKey === "pipeline" ? (
            <div className="mt-6 space-y-5 rounded-[24px] border border-ink-100 bg-sand-50/70 p-5">
              <div>
                <p className="text-sm font-semibold text-ink-900">Pipeline setup</p>
                <p className="mt-1 text-sm text-ink-500">
                  Seller and deal-specific fields that only matter for lead workflow.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Seller asking price</span>
                  <input
                    name="sellerAskingPrice"
                    type="number"
                    value={formData.sellerAskingPrice}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Target offer</span>
                  <input
                    name="targetOffer"
                    type="number"
                    value={formData.targetOffer}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">ARV / exit value</span>
                  <input
                    name="arv"
                    type="number"
                    value={formData.arv}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Rehab estimate</span>
                  <input
                    name="rehabEstimate"
                    type="number"
                    value={formData.rehabEstimate}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Seller name</span>
                  <input
                    name="sellerName"
                    value={formData.sellerName}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Seller phone</span>
                  <input
                    name="sellerPhone"
                    value={formData.sellerPhone}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Seller email</span>
                  <input
                    name="sellerEmail"
                    type="email"
                    value={formData.sellerEmail}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Lead source</span>
                  <input
                    name="leadSource"
                    value={formData.leadSource}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="Agent, direct mail, cold call..."
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Occupancy</span>
                  <select
                    name="occupancyStatus"
                    value={formData.occupancyStatus}
                    onChange={handleChange}
                    className="auth-input appearance-none"
                  >
                    {occupancyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Next action</span>
                  <input
                    name="nextAction"
                    value={formData.nextAction}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="Call seller, request rent roll..."
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-ink-700">Follow-up date</span>
                  <input
                    name="followUpDate"
                    type="date"
                    value={formData.followUpDate}
                    onChange={handleChange}
                    className="auth-input"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-ink-700">Seller motivation</span>
                  <textarea
                    name="motivation"
                    rows="4"
                    value={formData.motivation}
                    onChange={handleChange}
                    className="auth-input min-h-[120px]"
                    placeholder="Why might this seller move quickly or accept a discount?"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-ink-700">Notes</span>
                  <textarea
                    name="notes"
                    rows="4"
                    value={formData.notes}
                    onChange={handleChange}
                    className="auth-input min-h-[120px]"
                    placeholder="Anything important to remember about this lead."
                  />
                </label>
              </div>
            </div>
          ) : null}

          {formData.workspaceKey === "acquisitions" || formData.workspaceKey === "management" ? (
            <div className="mt-6 space-y-4 rounded-[24px] border border-ink-100 bg-sand-50/70 p-5">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {formData.workspaceKey === "management" ? "Management launch" : "Acquisitions setup"}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  Strategy and valuation inputs that belong to investment and operations workflow.
                </p>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-ink-700">Strategy</span>
                <select
                  name="strategy"
                  value={formData.strategy}
                  onChange={handleChange}
                  className="auth-input appearance-none"
                >
                  {(formData.workspaceKey === "management"
                    ? managementStrategyOptions
                    : PROPERTY_STRATEGIES
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">Purchase price</span>
                  <input
                    name="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-ink-700">ARV / future value</span>
                  <input
                    name="arv"
                    type="number"
                    value={formData.arv}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </label>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-[18px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Link to="/properties" className="ghost-action">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Create property"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default CreatePropertyPage;
