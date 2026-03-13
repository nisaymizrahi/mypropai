import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BriefcaseIcon,
  BuildingOffice2Icon,
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

const managementStrategyOptions = PROPERTY_STRATEGIES.filter(
  (option) => option.value === "fix_and_rent" || option.value === "rental"
);

const isUnitCountRelevant = (propertyType) =>
  ["multi-family", "mixed-use", "commercial"].includes(propertyType);

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
});

const buildFormState = (property) => ({
  address: property?.sharedProfile.address || "",
  addressLine1: property?.sharedProfile.addressLine1 || "",
  addressLine2: property?.sharedProfile.addressLine2 || "",
  city: property?.sharedProfile.city || "",
  state: property?.sharedProfile.state || "",
  zipCode: property?.sharedProfile.zipCode || "",
  county: property?.sharedProfile.county || "",
  latitude: property?.sharedProfile.latitude ?? "",
  longitude: property?.sharedProfile.longitude ?? "",
  propertyType: property?.sharedProfile.propertyType || "",
  bedrooms: property?.sharedProfile.bedrooms ?? "",
  bathrooms: property?.sharedProfile.bathrooms ?? "",
  squareFootage: property?.sharedProfile.squareFootage ?? "",
  lotSize: property?.sharedProfile.lotSize ?? "",
  yearBuilt: property?.sharedProfile.yearBuilt ?? "",
  unitCount: property?.sharedProfile.unitCount ?? "",
});

const WorkspaceCard = ({ title, eyebrow, status, detail, action, tone = "sand" }) => {
  const toneClasses = {
    sand: "bg-sand-50",
    verdigris: "bg-verdigris-50",
    clay: "bg-clay-50",
  };

  return (
    <div className={`rounded-[24px] ${toneClasses[tone]} p-5`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{eyebrow}</p>
      <h3 className="mt-3 text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm font-medium text-ink-700">{status}</p>
      <p className="mt-3 text-sm leading-6 text-ink-500">{detail}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
};

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

  const showsUnitCount = useMemo(
    () => isUnitCountRelevant(formData.propertyType),
    [formData.propertyType]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "address") {
      selectedSuggestionRef.current = "";
      setPreviewMetadata(null);
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
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

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);

      const updatedProperty = await updatePropertyWorkspace(propertyKey, {
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
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div>
            <span className="eyebrow">Shared property workspace</span>
            <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900">
              {property.title}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink-500">{detailLine}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/properties" className="secondary-action">
                Back to properties
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

          <div className="section-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              Active workspaces
            </p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">Leads</span>
                <span className="text-sm font-semibold text-ink-900">
                  {property.workspaces.pipeline ? property.workspaces.pipeline.status : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-sand-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Investments</span>
                <span className="text-sm font-semibold text-ink-900">
                  {property.workspaces.acquisitions
                    ? property.workspaces.acquisitions.strategyLabel
                    : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[18px] bg-clay-50 px-4 py-3">
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <form onSubmit={handleSave} className="section-card p-6 sm:p-7">
          <span className="eyebrow">Shared profile</span>
          <h3 className="mt-4 text-2xl font-semibold text-ink-900">
            Edit the core property details once
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            The address lookup here feeds the shared property profile, so leads, investments, and
            management all stay anchored to the same property data.
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
                <p className="text-sm text-ink-500">
                  Suggestions come from {getLocationProviderName()}.
                </p>
              </div>
              {previewMetadata ? (
                <p className="mt-3 text-sm text-ink-500">
                  {previewMetadata.propertyFound
                    ? "Property record found."
                    : "No property record found."}{" "}
                  {previewMetadata.activeListingFound
                    ? "Active listing found."
                    : "No active listing found."}
                </p>
              ) : null}
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Address line 1</span>
              <input
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className="auth-input"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Address line 2</span>
              <input
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className="auth-input"
              />
            </label>
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
              <span className="text-sm font-medium text-ink-700">County</span>
              <input
                name="county"
                value={formData.county}
                onChange={handleChange}
                className="auth-input"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-ink-700">Property type</span>
              <input
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="auth-input"
                placeholder="single-family, multi-family, mixed-use..."
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

          <div className="section-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-100 text-ink-700">
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
    </div>
  );
};

export default PropertyWorkspacePage;
