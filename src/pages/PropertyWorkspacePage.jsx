import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  PencilSquareIcon,
  SparklesIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import {
  analyzeLeadComps,
  createPropertyWorkspace,
  createSubscriptionCheckout,
  getBidsForLead,
  getBillingAccess,
  getLeadDetails,
  getPropertyReports,
  getPropertyWorkspace,
  previewLeadProperty,
  saveCompsReport,
  updatePropertyWorkspace,
} from "../utils/api";
import {
  buildAnalysisFromSavedReport,
  buildCompsFilters,
  buildSavedReportFromLegacySnapshot,
} from "../utils/compsReport";
import { getLocationProviderName, searchAddressSuggestions } from "../utils/locationSearch";
import BidsTab from "../components/BidsTab";
import CompsReportWorkspace from "../components/CompsReportWorkspace";
import LeadRenovationTab, { buildRenovationForm } from "../components/LeadRenovationTab";
import SavedCompsReportsTab from "../components/SavedCompsReportsTab";
import TasksPanel from "../components/TasksPanel";

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

const isSavedReportsBackendUnavailable = (error) =>
  String(error?.message || "").includes("Saved reports are not available on the server yet");

const buildLeadCompsAnalysisSnapshotFromReport = (report) => {
  if (!report?.generatedAt) return null;

  return {
    generatedAt: report.generatedAt,
    filters: report.filters || null,
    valuationContext: report.valuationContext || null,
    estimatedValue: report.estimatedValue ?? null,
    estimatedValueLow: report.estimatedValueLow ?? null,
    estimatedValueHigh: report.estimatedValueHigh ?? null,
    averageSoldPrice: report.averageSoldPrice ?? null,
    medianSoldPrice: report.medianSoldPrice ?? null,
    lowSoldPrice: report.lowSoldPrice ?? null,
    highSoldPrice: report.highSoldPrice ?? null,
    averagePricePerSqft: report.averagePricePerSqft ?? null,
    medianPricePerSqft: report.medianPricePerSqft ?? null,
    lowPricePerSqft: report.lowPricePerSqft ?? null,
    highPricePerSqft: report.highPricePerSqft ?? null,
    averageDaysOnMarket: report.averageDaysOnMarket ?? null,
    medianDaysOnMarket: report.medianDaysOnMarket ?? null,
    lowDaysOnMarket: report.lowDaysOnMarket ?? null,
    highDaysOnMarket: report.highDaysOnMarket ?? null,
    saleCompCount: report.saleCompCount ?? null,
    askingPriceDelta: report.askingPriceDelta ?? null,
    recommendedOfferLow: report.recommendedOfferLow ?? null,
    recommendedOfferHigh: report.recommendedOfferHigh ?? null,
    report: report.report || null,
    recentComps: Array.isArray(report.recentComps) ? report.recentComps : [],
  };
};

const PropertyWorkspacePage = () => {
  const { propertyKey } = useParams();
  const navigate = useNavigate();
  const selectedSuggestionRef = useRef("");
  const suppressSuggestionsRef = useRef(false);

  const [property, setProperty] = useState(null);
  const [formData, setFormData] = useState(buildFormState(null));
  const [suggestions, setSuggestions] = useState([]);
  const [previewMetadata, setPreviewMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isAddingLeadWorkspace, setIsAddingLeadWorkspace] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [leadWorkspace, setLeadWorkspace] = useState(null);
  const [leadWorkspaceLoading, setLeadWorkspaceLoading] = useState(false);
  const [leadWorkspaceError, setLeadWorkspaceError] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [filters, setFilters] = useState(() => buildCompsFilters());
  const [compsNotice, setCompsNotice] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [savedReportsLoading, setSavedReportsLoading] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [bids, setBids] = useState([]);
  const [billingAccess, setBillingAccess] = useState(null);
  const [isBillingAccessLoading, setIsBillingAccessLoading] = useState(false);
  const [isStartingSubscription, setIsStartingSubscription] = useState(false);

  const pipelineLeadId = property?.workspaces?.pipeline?.id || "";
  const pipelineLeadPath = property?.workspaces?.pipeline?.path || "";

  const syncPropertyState = useCallback(
    (nextProperty) => {
      if (!nextProperty) {
        return;
      }

      setProperty(nextProperty);
      setFormData(buildFormState(nextProperty));
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

  const loadLeadBillingAccess = useCallback(async () => {
    if (!pipelineLeadId) {
      setBillingAccess(null);
      return;
    }

    try {
      setIsBillingAccessLoading(true);
      const access = await getBillingAccess("comps_report", pipelineLeadId);
      setBillingAccess(access);
    } catch (billingError) {
      setBillingAccess(null);
    } finally {
      setIsBillingAccessLoading(false);
    }
  }, [pipelineLeadId]);

  const loadLeadWorkspace = useCallback(async () => {
    if (!pipelineLeadId) {
      setLeadWorkspace(null);
      setLeadWorkspaceError("");
      setAnalysis(null);
      setFilters(buildCompsFilters());
      setCompsNotice("");
      setSavedReports([]);
      setSavedReportsLoading(false);
      setBids([]);
      setBillingAccess(null);
      setIsBillingAccessLoading(false);
      return;
    }

    try {
      setLeadWorkspaceLoading(true);
      setSavedReportsLoading(true);
      setIsBillingAccessLoading(true);
      setLeadWorkspaceError("");

      const [leadData, bidsData, savedReportsData, access] = await Promise.all([
        getLeadDetails(pipelineLeadId),
        getBidsForLead(pipelineLeadId).catch((bidsError) => {
          console.error("Failed to load property workspace bids", bidsError);
          return [];
        }),
        getPropertyReports({
          kind: "comps",
          contextType: "lead",
          leadId: pipelineLeadId,
        }).catch((savedReportsError) => {
          if (!isSavedReportsBackendUnavailable(savedReportsError)) {
            console.error("Failed to load property workspace reports", savedReportsError);
          }
          return [];
        }),
        getBillingAccess("comps_report", pipelineLeadId).catch(() => null),
      ]);

      setLeadWorkspace(leadData);
      setBids(bidsData);
      setBillingAccess(access);

      const legacySavedReport = buildSavedReportFromLegacySnapshot(
        leadData,
        leadData.compsAnalysis,
        `legacy-${leadData._id || pipelineLeadId}`
      );

      const nextSavedReports =
        savedReportsData.length > 0
          ? savedReportsData
          : legacySavedReport
            ? [legacySavedReport]
            : [];

      setSavedReports(nextSavedReports);
      setAnalysis(
        nextSavedReports[0]
          ? buildAnalysisFromSavedReport(nextSavedReports[0], leadData)
          : null
      );
      setFilters(
        buildCompsFilters(
          leadData,
          nextSavedReports[0]?.filters || leadData.compsAnalysis?.filters || {}
        )
      );
      setCompsNotice("");
    } catch (leadError) {
      setLeadWorkspace(null);
      setAnalysis(null);
      setSavedReports([]);
      setBids([]);
      setBillingAccess(null);
      setLeadWorkspaceError(leadError.message || "Failed to load the linked lead workspace.");
    } finally {
      setLeadWorkspaceLoading(false);
      setSavedReportsLoading(false);
      setIsBillingAccessLoading(false);
    }
  }, [pipelineLeadId]);

  useEffect(() => {
    loadLeadWorkspace();
  }, [loadLeadWorkspace]);

  useEffect(() => {
    const query = composeAddress({
      addressLine1: formData.addressLine1,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
    }).trim();
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

  const renovationItems = useMemo(
    () => buildRenovationForm(leadWorkspace || {}).items,
    [leadWorkspace]
  );

  const leadPricingSummary = useMemo(() => {
    if (!leadWorkspace) {
      return {
        askingPrice: null,
        targetOffer: null,
      };
    }

    return {
      askingPrice: leadWorkspace.sellerAskingPrice ?? null,
      targetOffer: leadWorkspace.targetOffer ?? null,
    };
  }, [leadWorkspace]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (["addressLine1", "city", "state", "zipCode"].includes(name)) {
      suppressSuggestionsRef.current = false;
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

  const handleCreateLeadWorkspace = async () => {
    try {
      setIsAddingLeadWorkspace(true);
      const response = await createPropertyWorkspace(propertyKey, "pipeline");
      syncPropertyState(response.property);
      toast.success("Lead workspace added.");
    } catch (workspaceError) {
      toast.error(workspaceError.message || "Failed to add the lead workspace.");
    } finally {
      setIsAddingLeadWorkspace(false);
    }
  };

  const handleLeadFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleRunLeadAnalysis = async () => {
    if (!pipelineLeadId) {
      toast.error("Add this property to leads first.");
      return;
    }

    setIsAnalyzing(true);
    setLeadWorkspaceError("");
    setCompsNotice("");

    try {
      const result = await analyzeLeadComps(pipelineLeadId, filters);
      if (result?.noResults) {
        setAnalysis(null);
        setCompsNotice(
          result.msg ||
            "No comparable properties matched the selected filters. Try widening the radius or relaxing the size filters."
        );
        setLeadWorkspace((previous) =>
          previous
            ? {
                ...previous,
                ...(result.subject || {}),
              }
            : previous
        );
        toast(result.msg || "No comparable properties matched the selected filters.");
        return;
      }

      setAnalysis(result);
      setCompsNotice("");
      setLeadWorkspace((previous) =>
        previous
          ? {
              ...previous,
              ...(result.subject || {}),
            }
          : previous
      );
      await loadLeadBillingAccess();
    } catch (analysisError) {
      setLeadWorkspaceError(analysisError.message || "Analysis failed.");
      toast.error(analysisError.message || "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveLeadReport = async ({
    subject,
    filters: reportFilters,
    valuationContext,
    selectedComps,
  }) => {
    if (!pipelineLeadId) {
      toast.error("Add this property to leads first.");
      return;
    }

    setIsSavingReport(true);
    setLeadWorkspaceError("");

    try {
      const savedReport = await saveCompsReport({
        contextType: "lead",
        leadId: pipelineLeadId,
        subject,
        filters: reportFilters,
        valuationContext,
        selectedComps,
      });

      setSavedReports((previous) => [
        savedReport,
        ...previous.filter(
          (report) =>
            report._id !== savedReport._id && !String(report._id || "").startsWith("legacy-")
        ),
      ]);
      setAnalysis(buildAnalysisFromSavedReport(savedReport, subject));
      setLeadWorkspace((previous) =>
        previous
          ? {
              ...previous,
              compsAnalysis: buildLeadCompsAnalysisSnapshotFromReport(savedReport),
            }
          : previous
      );
      setActiveTab("saved-reports");
      toast.success("Comps report saved.");
    } catch (saveError) {
      setLeadWorkspaceError(saveError.message || "Failed to save comps report.");
      toast.error(saveError.message || "Failed to save comps report.");
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleStartSubscription = async () => {
    setIsStartingSubscription(true);
    try {
      const { url } = await createSubscriptionCheckout("pro");
      window.location.href = url;
    } catch (subscriptionError) {
      setLeadWorkspaceError(subscriptionError.message || "Could not start the Pro checkout.");
      setIsStartingSubscription(false);
    }
  };

  const handleLeadUpdated = useCallback((updatedLead) => {
    if (!updatedLead) {
      return;
    }

    setLeadWorkspace(updatedLead);
    setAnalysis((previous) =>
      previous
        ? {
            ...previous,
            subject: {
              ...previous.subject,
              ...updatedLead,
            },
          }
        : previous
    );
  }, []);

  const handleBidsUpdated = useCallback(async () => {
    if (!pipelineLeadId) {
      return;
    }

    try {
      const nextBids = await getBidsForLead(pipelineLeadId);
      setBids(nextBids);
    } catch (bidsError) {
      toast.error(bidsError.message || "Failed to refresh bids.");
    }
  }, [pipelineLeadId]);

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

  const renderLeadWorkspaceRequiredState = ({
    eyebrow = "Linked lead workspace",
    title = "Add this property to leads first",
    description = "This section uses the lead workspace for saved reports, AI analysis, renovation planning, and bid management.",
  } = {}) => (
    <section className="section-card p-6 sm:p-7">
      <span className="eyebrow">{eyebrow}</span>
      <h3 className="mt-4 text-3xl font-semibold text-ink-900">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCreateLeadWorkspace}
          disabled={isAddingLeadWorkspace}
          className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isAddingLeadWorkspace ? "Adding..." : "Add to leads"}
        </button>
      </div>
    </section>
  );

  const renderLeadWorkspaceLoadingState = (label = "Loading linked lead workspace...") => (
    <div className="section-card px-6 py-10 text-center text-ink-500">{label}</div>
  );

  const renderLeadWorkspaceErrorState = () => (
    <section className="section-card p-6 sm:p-7">
      <span className="eyebrow">Linked lead workspace</span>
      <h3 className="mt-4 text-3xl font-semibold text-ink-900">We could not load the lead data</h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
        {leadWorkspaceError || "The linked lead workspace could not be loaded right now."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={loadLeadWorkspace} className="primary-action">
          Try again
        </button>
        {pipelineLeadPath ? (
          <Link to={pipelineLeadPath} className="secondary-action">
            Open lead
          </Link>
        ) : null}
      </div>
    </section>
  );

  const renderLeadTabContent = (renderContent, loadingLabel) => {
    if (!pipelineLeadId) {
      return renderLeadWorkspaceRequiredState();
    }

    if (leadWorkspaceLoading && !leadWorkspace) {
      return renderLeadWorkspaceLoadingState(loadingLabel);
    }

    if (!leadWorkspace) {
      return renderLeadWorkspaceErrorState();
    }

    return renderContent();
  };

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
              <div className="flex items-center justify-between rounded-[14px] bg-verdigris-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Property workspace</span>
                <span className="text-sm font-semibold text-ink-900">Active</span>
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">Lead record</span>
                <span className="text-sm font-semibold text-ink-900">
                  {property.workspaces.pipeline ? property.workspaces.pipeline.status : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-sand-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Execution data</span>
                <span className="text-sm font-semibold text-ink-900">
                  {property.workspaces.acquisitions
                    ? property.workspaces.acquisitions.strategyLabel
                    : "Missing"}
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
          active={activeTab === "comps"}
          icon={SparklesIcon}
          label="AI Comps Analysis"
          onClick={() => setActiveTab("comps")}
        />
        <TabButton
          active={activeTab === "saved-reports"}
          icon={PencilSquareIcon}
          label="Saved AI Reports"
          onClick={() => setActiveTab("saved-reports")}
        />
        <TabButton
          active={activeTab === "renovation"}
          icon={WrenchScrewdriverIcon}
          label="Renovation Plan"
          onClick={() => setActiveTab("renovation")}
        />
        <TabButton
          active={activeTab === "bids"}
          icon={ClipboardDocumentListIcon}
          label="Bid Management"
          onClick={() => setActiveTab("bids")}
        />
        <TabButton
          active={activeTab === "tasks"}
          icon={CheckCircleIcon}
          label="Tasks"
          onClick={() => setActiveTab("tasks")}
        />
      </div>

      {leadWorkspaceError && activeTab !== "overview" ? (
        <div className="rounded-[16px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {leadWorkspaceError}
        </div>
      ) : null}

      {activeTab === "overview" ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(320px,0.84fr)]">
        <form onSubmit={handleSave} className="section-card p-6 sm:p-7">
          <span className="eyebrow">Shared profile</span>
          <h3 className="mt-4 font-display text-[2rem] leading-none text-ink-900">
            Edit the core property details once
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            The address lookup here feeds the shared property profile, so every lead and connected
            property tool stays anchored to the same property data.
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
                  onClick={handleCreateLeadWorkspace}
                  disabled={isAddingLeadWorkspace}
                  className="secondary-action w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UsersIcon className="mr-2 h-5 w-5" />
                  {isAddingLeadWorkspace ? "Adding..." : "Add to leads"}
                </button>
              )
            }
            tone="sand"
          />

          <WorkspaceCard
            eyebrow="Unified workspace"
            title="Work from the property workspace"
            status="Single workspace active"
            detail="Project-management and management navigation are being retired, so this shared property record is now the main place to work."
            action={null}
            tone="verdigris"
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
      ) : activeTab === "comps" ? (
        renderLeadTabContent(
          () => (
            <CompsReportWorkspace
              subject={leadWorkspace}
              analysis={analysis}
              filters={filters}
              onFilterChange={handleLeadFilterChange}
              isAnalyzing={isAnalyzing}
              onRunAnalysis={handleRunLeadAnalysis}
              billingAccess={billingAccess}
              isBillingAccessLoading={isBillingAccessLoading}
              onStartSubscription={handleStartSubscription}
              isStartingSubscription={isStartingSubscription}
              onSaveReport={handleSaveLeadReport}
              isSavingReport={isSavingReport}
              saveButtonLabel="Save Property Report"
              showOneTimeCheckout={false}
              compsNotice={compsNotice}
              renderSubjectPanel={() => (
                <div className="section-card p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-ink-900">Lead-linked deal snapshot</h3>
                      <p className="mt-1 text-sm text-ink-500">
                        This pulls from the connected lead so the property workspace stays aligned with
                        saved comps reports and deal assumptions.
                      </p>
                    </div>
                    {pipelineLeadPath ? (
                      <Link to={pipelineLeadPath} className="ghost-action">
                        Open lead
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Property
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {[
                          leadWorkspace.propertyType,
                          leadWorkspace.squareFootage
                            ? `${Number(leadWorkspace.squareFootage).toLocaleString()} sqft`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "No property facts saved yet"}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Pricing
                      </p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        Ask {formatCurrency(leadPricingSummary.askingPrice)}
                      </p>
                      <p className="mt-1 text-xs text-ink-500">
                        Target {formatCurrency(leadPricingSummary.targetOffer)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            />
          ),
          "Loading AI comps analysis..."
        )
      ) : activeTab === "saved-reports" ? (
        renderLeadTabContent(
          () => (
            <SavedCompsReportsTab
              reports={savedReports}
              isLoading={savedReportsLoading}
              title="Saved property AI reports"
              description="Every saved comps snapshot for this property's linked lead lives here so you can compare different comp sets over time."
              emptyTitle="No property AI reports saved yet"
              emptyMessage="Run the AI comps analysis, choose the comps you want to keep, and save the report to build the property's comps history."
            />
          ),
          "Loading saved AI reports..."
        )
      ) : activeTab === "renovation" ? (
        renderLeadTabContent(
          () => (
            <LeadRenovationTab
              lead={leadWorkspace}
              leadId={pipelineLeadId}
              onLeadUpdated={handleLeadUpdated}
            />
          ),
          "Loading renovation plan..."
        )
      ) : activeTab === "bids" ? (
        renderLeadTabContent(
          () => (
            <BidsTab
              leadId={pipelineLeadId}
              bids={bids}
              renovationItems={renovationItems}
              onUpdate={handleBidsUpdated}
            />
          ),
          "Loading bid management..."
        )
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
