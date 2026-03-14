import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BriefcaseIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import {
  createPropertyWorkspace,
  getPropertyWorkspace,
  previewLeadProperty,
  updatePropertyWorkspace,
} from "../utils/api";
import { getLocationProviderName, searchAddressSuggestions } from "../utils/locationSearch";
import { PROPERTY_STRATEGIES } from "../utils/propertyStrategy";
import TasksPanel from "../components/TasksPanel";

const managementStrategyOptions = PROPERTY_STRATEGIES.filter(
  (option) => option.value === "fix_and_rent" || option.value === "rental"
);

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

const normalizeStrategy = (value, fallback = "flip") => {
  if (PROPERTY_STRATEGIES.some((option) => option.value === value)) {
    return value;
  }

  return fallback;
};

const normalizeManagementStrategy = (value) =>
  managementStrategyOptions.some((option) => option.value === value) ? value : "rental";

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed);
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
  latitude: preview.latitude ?? "",
  longitude: preview.longitude ?? "",
  propertyType: normalizePropertyType(preview.propertyType),
  bedrooms: preview.bedrooms ?? "",
  bathrooms: preview.bathrooms ?? "",
  squareFootage: preview.squareFootage ?? "",
  lotSize: preview.lotSize ?? "",
  yearBuilt: preview.yearBuilt ?? "",
  listingStatus: preview.listingStatus || "",
  sellerAskingPrice: preview.sellerAskingPrice ?? "",
});

const buildFormState = (property) => ({
  addressLine1: property?.sharedProfile.addressLine1 || "",
  city: property?.sharedProfile.city || "",
  state: property?.sharedProfile.state || "",
  zipCode: property?.sharedProfile.zipCode || "",
  latitude: property?.sharedProfile.latitude ?? "",
  longitude: property?.sharedProfile.longitude ?? "",
  propertyType: normalizePropertyType(property?.sharedProfile.propertyType),
  bedrooms: property?.sharedProfile.bedrooms ?? "",
  bathrooms: property?.sharedProfile.bathrooms ?? "",
  squareFootage: property?.sharedProfile.squareFootage ?? "",
  lotSize: property?.sharedProfile.lotSize ?? "",
  yearBuilt: property?.sharedProfile.yearBuilt ?? "",
  unitCount: property?.sharedProfile.unitCount ?? "",
  listingStatus: property?.sharedProfile.listingStatus || "",
  sellerAskingPrice: property?.sharedProfile.sellerAskingPrice ?? "",
});

const WorkspaceCard = ({ title, eyebrow, status, detail, action, tone = "sand" }) => {
  const toneClasses = {
    sand: "bg-sand-50",
    verdigris: "bg-verdigris-50",
    clay: "bg-clay-50",
  };

  return (
    <div className={`rounded-[16px] ${toneClasses[tone]} p-4`}>
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">{eyebrow}</p>
      <h3 className="mt-3 text-base font-medium text-ink-900">{title}</h3>
      <p className="mt-2 text-sm font-medium text-ink-700">{status}</p>
      <p className="mt-3 text-sm leading-6 text-ink-500">{detail}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
};

const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
      active
        ? "bg-ink-900 text-white"
        : "border border-ink-100 bg-white text-ink-600 hover:bg-ink-50"
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

const PropertyWorkspacePage = () => {
  const { propertyKey } = useParams();
  const navigate = useNavigate();
  const selectedSuggestionRef = useRef("");

  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState(buildFormState(null));
  const [acquisitionStrategy, setAcquisitionStrategy] = useState("flip");
  const [managementStrategy, setManagementStrategy] = useState("rental");
  const [suggestions, setSuggestions] = useState([]);
  const [previewMetadata, setPreviewMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeWorkspaceAction, setActiveWorkspaceAction] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const syncPropertyState = useCallback(
    (nextProperty) => {
      if (!nextProperty) {
        return;
      }

      setProperty(nextProperty);
      setFormData(buildFormState(nextProperty));
      setAcquisitionStrategy(
        normalizeStrategy(nextProperty.workspaces.acquisitions?.strategy, "flip")
      );
      setManagementStrategy(
        normalizeManagementStrategy(nextProperty.workspaces.acquisitions?.strategy)
      );
      setPreviewMetadata(null);
      selectedSuggestionRef.current = "";

      if (nextProperty.propertyKey !== propertyKey) {
        navigate(`/properties/${encodeURIComponent(nextProperty.propertyKey)}`, { replace: true });
      }
    },
    [navigate, propertyKey]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getPropertyWorkspace(propertyKey);
        if (!isMounted) {
          return;
        }
        syncPropertyState(data);
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.message || "Failed to load the property workspace.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProperty();

    return () => {
      isMounted = false;
    };
  }, [propertyKey, syncPropertyState]);

  useEffect(() => {
    const query = composeAddress({
      addressLine1: formData.addressLine1,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
    }).trim();
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
  }, [formData.addressLine1, formData.city, formData.state, formData.zipCode]);

  const detailLine = useMemo(() => {
    if (!property) {
      return "";
    }

    const bits = [
      property.sharedProfile.propertyType || null,
      property.sharedProfile.squareFootage
        ? `${property.sharedProfile.squareFootage.toLocaleString()} sqft`
        : null,
      property.sharedProfile.bedrooms ? `${property.sharedProfile.bedrooms} bd` : null,
      property.sharedProfile.bathrooms ? `${property.sharedProfile.bathrooms} ba` : null,
      property.sharedProfile.unitCount
        ? `${property.sharedProfile.unitCount} unit${property.sharedProfile.unitCount === 1 ? "" : "s"}`
        : null,
    ].filter(Boolean);

    return bits.join(" • ") || "Shared property profile is still lightweight.";
  }, [property]);

  const showsUnitCount = useMemo(() => formData.propertyType === "multi-family", [formData.propertyType]);

  const listingSummary = useMemo(() => {
    if (!property?.sharedProfile) {
      return null;
    }

    if (!property.sharedProfile.listingStatus && !property.sharedProfile.sellerAskingPrice) {
      return null;
    }

    return {
      label: property.sharedProfile.listingStatus || "For Sale",
      price: property.sharedProfile.sellerAskingPrice
        ? formatCurrency(property.sharedProfile.sellerAskingPrice)
        : "",
    };
  }, [property]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (["addressLine1", "city", "state", "zipCode"].includes(name)) {
      selectedSuggestionRef.current = "";
      setPreviewMetadata(null);
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "propertyType" && value !== "multi-family" ? { unitCount: "" } : {}),
    }));
  };

  const handlePreviewLookup = async (addressOverride, fieldOverrides = {}) => {
    const previewSource = {
      ...formData,
      ...fieldOverrides,
    };
    const address = addressOverride || composeAddress(previewSource);
    if (!address) {
      toast.error("Select or type an address first.");
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
    selectedSuggestionRef.current = composeAddress(parsedAddress) || suggestion.place_name;
    setSuggestions([]);
    setFormData((current) => ({
      ...current,
      ...parsedAddress,
      longitude: suggestion.center?.[0] ?? current.longitude,
      latitude: suggestion.center?.[1] ?? current.latitude,
    }));
    await handlePreviewLookup(suggestion.place_name, parsedAddress);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);

      const updatedProperty = await updatePropertyWorkspace(propertyKey, {
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
        listingStatus:
          formData.listingStatus || formData.sellerAskingPrice ? formData.listingStatus || "For Sale" : undefined,
        sellerAskingPrice:
          formData.listingStatus || formData.sellerAskingPrice
            ? toOptionalNumber(formData.sellerAskingPrice)
            : undefined,
      });

      syncPropertyState(updatedProperty);
      toast.success("Shared property profile updated.");
    } catch (saveError) {
      toast.error(saveError.message || "Failed to update the property.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateWorkspace = async (workspaceKey) => {
    try {
      setActiveWorkspaceAction(workspaceKey);

      const payload =
        workspaceKey === "acquisitions"
          ? { strategy: acquisitionStrategy }
          : workspaceKey === "management"
            ? { strategy: managementStrategy }
            : {};

      const response = await createPropertyWorkspace(propertyKey, workspaceKey, payload);
      syncPropertyState(response.property);

      if (workspaceKey === "pipeline") {
        toast.success("Lead workspace added.");
        return;
      }

      if (workspaceKey === "acquisitions") {
        toast.success("Investment workspace created.");
        return;
      }

      toast.success("Management workspace started.");
      if (response.managedPropertyId) {
        navigate(`/management/${response.managedPropertyId}`);
      }
    } catch (workspaceError) {
      toast.error(workspaceError.message || "Failed to create the workspace.");
    } finally {
      setActiveWorkspaceAction("");
    }
  };

  if (loading) {
    return (
      <div className="section-card px-6 py-10 text-center text-ink-500">
        Loading property workspace...
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-card px-6 py-10 text-center text-clay-700">
        {error}
      </div>
    );
  }

  if (!property) {
    return (
      <div className="section-card px-6 py-10 text-center text-ink-500">
        Property not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="surface-panel px-6 py-6 sm:px-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <span className="eyebrow">Shared property workspace</span>
            <h2 className="mt-4 font-display text-[2.5rem] leading-[0.96] text-ink-900">
              {property.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-500 sm:text-base">{detailLine}</p>
            {listingSummary ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-verdigris-50 px-3 py-1 text-[11px] font-medium text-verdigris-700">
                  For sale
                </span>
                {listingSummary.price ? (
                  <span className="text-sm font-medium text-ink-700">{listingSummary.price}</span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/leads" className="secondary-action">
                Back to leads
              </Link>
              {property.workspaces.pipeline ? (
                <Link to={property.workspaces.pipeline.path} className="secondary-action">
                  Open lead
                </Link>
              ) : null}
              {property.workspaces.management ? (
                <Link to={property.workspaces.management.path} className="primary-action">
                  Open management
                </Link>
              ) : property.workspaces.acquisitions ? (
                <Link to={property.workspaces.acquisitions.path} className="primary-action">
                  Open investment
                </Link>
              ) : null}
            </div>
          </div>

          <div className="section-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Active workspaces
            </p>
            {listingSummary ? (
              <div className="mt-4 rounded-[14px] bg-verdigris-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink-600">Market status</span>
                  <span className="text-sm font-semibold text-ink-900">{listingSummary.label}</span>
                </div>
                {listingSummary.price ? (
                  <p className="mt-2 text-sm font-medium text-verdigris-700">
                    Asking {listingSummary.price}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between rounded-[14px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">Leads</span>
                <span className="text-sm font-semibold text-ink-900">
                  {property.workspaces.pipeline ? property.workspaces.pipeline.status : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-sand-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Investments</span>
                <span className="text-sm font-semibold text-ink-900">
                  {property.workspaces.acquisitions
                    ? property.workspaces.acquisitions.strategyLabel
                    : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-clay-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Managed properties</span>
                <span className="text-sm font-semibold text-ink-900">
                  {property.workspaces.management
                    ? property.workspaces.management.status
                    : "Not started"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-card flex flex-wrap items-center gap-2 p-1.5">
        <TabButton
          active={activeTab === "overview"}
          icon={HomeModernIcon}
          label="Overview"
          onClick={() => setActiveTab("overview")}
        />
        <TabButton
          active={activeTab === "tasks"}
          icon={ClipboardDocumentListIcon}
          label="Tasks"
          onClick={() => setActiveTab("tasks")}
        />
      </div>

      {activeTab === "overview" ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(320px,0.84fr)]">
        <form onSubmit={handleSave} className="section-card p-6 sm:p-7">
          <span className="eyebrow">Shared profile</span>
          <h3 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
            Edit the core property details once
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            The address lookup here feeds the shared property profile, so leads, investments, and
            management all stay anchored to the same property data.
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

            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePreviewLookup()}
                  disabled={isPreviewLoading || !composeAddress(formData).trim()}
                  className="secondary-action disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPreviewLoading ? "Loading property details..." : "Auto-fill property details"}
                </button>
                <p className="text-sm text-ink-500">
                  Suggestions come from {getLocationProviderName()}.
                </p>
              </div>
              {previewMetadata ? (
                <p className="mt-3 text-sm text-ink-500">
                  {previewMetadata.propertyFound ? "Property facts found." : "No property facts found."}{" "}
                  {previewMetadata.activeListingFound ? "Active sale listing found." : "No active sale listing found."}
                </p>
              ) : null}
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">City</span>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="auth-input"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">State</span>
              <input
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="auth-input"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Zip code</span>
              <input
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="auth-input"
              />
            </label>
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
              />
            </label>

            <div className="md:col-span-2 rounded-[16px] border border-ink-100 bg-sand-50/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">Sale status</p>
                  <p className="mt-1 text-sm text-ink-500">
                    If the property has an active listing, we keep that visible here.
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    formData.listingStatus || formData.sellerAskingPrice
                      ? "bg-verdigris-50 text-verdigris-700"
                      : "bg-white text-ink-600 ring-1 ring-ink-100"
                  }`}
                >
                  {formData.listingStatus || formData.sellerAskingPrice ? "For sale" : "Not listed"}
                </span>
              </div>

              {formData.listingStatus || formData.sellerAskingPrice ? (
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

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save shared profile"}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <WorkspaceCard
            eyebrow="Leads"
            title="Lead workspace"
            status={
              property.workspaces.pipeline
                ? property.workspaces.pipeline.status
                : "No lead workspace yet"
            }
            detail={
              property.workspaces.pipeline
                ? "Seller-facing notes, outreach, and lead tracking stay connected to this shared property."
                : "Add this property into leads whenever you need seller outreach, follow-up, or pipeline tracking."
            }
            action={
              property.workspaces.pipeline ? (
                <Link to={property.workspaces.pipeline.path} className="secondary-action w-full">
                  <UsersIcon className="mr-2 h-5 w-5" />
                  Open lead
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCreateWorkspace("pipeline")}
                  disabled={!!activeWorkspaceAction}
                  className="secondary-action w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UsersIcon className="mr-2 h-5 w-5" />
                  {activeWorkspaceAction === "pipeline" ? "Adding..." : "Add to leads"}
                </button>
              )
            }
            tone="sand"
          />

          <WorkspaceCard
            eyebrow="Investments"
            title="Investment workspace"
            status={
              property.workspaces.acquisitions
                ? property.workspaces.acquisitions.strategyLabel
                : "No investment workspace yet"
            }
            detail={
              property.workspaces.acquisitions
                ? "Underwriting, budgets, and execution stay linked back to this core property record."
                : "Create an investment workspace when the property moves from lead tracking into underwriting or project execution."
            }
            action={
              property.workspaces.acquisitions ? (
                <Link to={property.workspaces.acquisitions.path} className="secondary-action w-full">
                  <BriefcaseIcon className="mr-2 h-5 w-5" />
                  Open investment
                </Link>
              ) : (
                <div className="space-y-3">
                  <select
                    value={acquisitionStrategy}
                    onChange={(event) => setAcquisitionStrategy(event.target.value)}
                    className="auth-input"
                  >
                    {PROPERTY_STRATEGIES.map((strategy) => (
                      <option key={strategy.value} value={strategy.value}>
                        {strategy.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCreateWorkspace("acquisitions")}
                    disabled={!!activeWorkspaceAction}
                    className="primary-action w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <BriefcaseIcon className="mr-2 h-5 w-5" />
                    {activeWorkspaceAction === "acquisitions"
                      ? "Creating..."
                      : "Create investment workspace"}
                  </button>
                </div>
              )
            }
            tone="verdigris"
          />

          <WorkspaceCard
            eyebrow="Managed Properties"
            title="Management workspace"
            status={
              property.workspaces.management
                ? property.workspaces.management.status
                : property.workspaces.acquisitions
                  ? `Ready to start from ${property.workspaces.acquisitions.strategyLabel}`
                  : "No management workspace yet"
            }
            detail={
              property.workspaces.management
                ? "Units, leasing, and operations continue from the active management dashboard."
                : property.workspaces.acquisitions
                  ? "Start management here and we will keep the shared property details, reuse the linked investment, and update the strategy if needed."
                  : "Start management here and we will create a linked investment first, then open the operations workspace without losing the shared property profile."
            }
            action={
              property.workspaces.management ? (
                <Link to={property.workspaces.management.path} className="secondary-action w-full">
                  <BuildingOffice2Icon className="mr-2 h-5 w-5" />
                  Open management
                </Link>
              ) : (
                <div className="space-y-3">
                  <select
                    value={managementStrategy}
                    onChange={(event) => setManagementStrategy(event.target.value)}
                    className="auth-input"
                  >
                    {managementStrategyOptions.map((strategy) => (
                      <option key={strategy.value} value={strategy.value}>
                        {strategy.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCreateWorkspace("management")}
                    disabled={!!activeWorkspaceAction}
                    className="primary-action w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <BuildingOffice2Icon className="mr-2 h-5 w-5" />
                    {activeWorkspaceAction === "management"
                      ? "Starting..."
                      : "Start management"}
                  </button>
                </div>
              )
            }
            tone="clay"
          />

          <div className="section-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-ink-100 text-ink-700">
                <HomeModernIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">Property identity</p>
                <code className="text-sm text-ink-500">{property.propertyKey}</code>
              </div>
            </div>
          </div>
        </div>
      </section>
      ) : (
        <TasksPanel
          eyebrow="Property tasks"
          title="Tasks for this property"
          description="Use this tab for property-wide action items, vendor follow-ups, and general work that should stay attached to this shared property record."
          query={{
            propertyKey: property.propertyKey,
          }}
          defaults={{
            sourceType: "property",
            sourceId: property.propertyKey,
            sourceLabel: property.title || "Property",
            propertyKey: property.propertyKey,
          }}
          emptyTitle="No property tasks yet"
          emptyDescription="Add the first task for this property and it will also show up in the main task center."
        />
      )}
    </div>
  );
};

export default PropertyWorkspacePage;
