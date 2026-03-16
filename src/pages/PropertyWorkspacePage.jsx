import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BanknotesIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeModernIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import {
  analyzeLeadComps,
  createSubscriptionCheckout,
  getBidsForLead,
  getBillingAccess,
  getLeadDetails,
  getPropertyReports,
  getPropertyWorkspace,
  previewLeadProperty,
  saveCompsReport,
  updateLead,
  updatePropertyWorkspace,
} from "../utils/api";
import {
  buildAnalysisFromSavedReport,
  buildCompsFilters,
  buildSavedReportFromLegacySnapshot,
  countSavableComparables,
} from "../utils/compsReport";
import { getLocationProviderName, searchAddressSuggestions } from "../utils/locationSearch";
import {
  buildPropertyWorkspacePath,
  PROPERTY_WORKSPACE_NAVIGATION,
  resolvePropertyWorkspaceRoute,
} from "../utils/propertyWorkspaceNavigation";
import BidsTab from "../components/BidsTab";
import CompsReportWorkspace from "../components/CompsReportWorkspace";
import LeadRenovationTab, { buildRenovationForm } from "../components/LeadRenovationTab";
import PropertyCostsPanel from "../components/PropertyCostsPanel";
import PropertyDocumentsPanel from "../components/PropertyDocumentsPanel";
import PropertyFinancePanel from "../components/PropertyFinancePanel";
import PropertyOperationsPanel from "../components/PropertyOperationsPanel";
import PropertySummaryPanel from "../components/PropertySummaryPanel";
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

const workspaceCategoryIcons = {
  property: HomeModernIcon,
  finance: BanknotesIcon,
  costs: ClipboardDocumentListIcon,
  documents: DocumentTextIcon,
  operations: CalendarDaysIcon,
  settings: Cog6ToothIcon,
};

const leadWorkspaceContentKeys = new Set([
  "comps",
  "saved-reports",
  "renovation",
  "bids",
  "settings",
]);

const placeholderSectionCopy = {
  "acquisition-summary": {
    eyebrow: "Property > Acquisition Summary",
    title: "Close summary will live here",
    description:
      "This section will turn the lead-to-close story into one clear property summary: original target, actual purchase, closing costs, and the deal context that came into the workspace.",
    highlights: [
      "Target offer versus actual close price",
      "Closing and acquisition cost rollup",
      "Source lead and saved comps context",
    ],
  },
  "original-assumptions": {
    eyebrow: "Property > Original Assumptions",
    title: "Original underwriting snapshot is next",
    description:
      "This page will preserve the original assumptions behind the property so the team can compare today’s reality against the plan that got the deal approved.",
    highlights: [
      "Original budget and timeline assumptions",
      "Original ARV or rent assumptions",
      "Original financing and hold assumptions",
    ],
  },
  "finance-health": {
    eyebrow: "Finance",
    title: "Financial health is being shaped into the main control tower",
    description:
      "Phase 2 will pull the existing project financial tooling into this property shell so purchase price, expected costs, actual spend, carry, and return metrics live together.",
    highlights: [
      "All-in basis and projected profit",
      "Budget health and burn tracking",
      "Variance from original underwriting",
    ],
  },
  "finance-sources-uses": {
    eyebrow: "Finance",
    title: "Sources and uses will connect the whole capital picture",
    description:
      "This section will show where funds came from and exactly how they were deployed across purchase, closing, rehab, carry, and fees.",
    highlights: [
      "Owner cash and outside capital sources",
      "Purchase, close, rehab, and carry uses",
      "Capital flow tied back to the property record",
    ],
  },
  "finance-budget-vs-actual": {
    eyebrow: "Finance",
    title: "Budget versus actual is queued for the next financial pass",
    description:
      "The budget will become the expected-cost plan, then update continuously with committed and actual amounts as the project evolves.",
    highlights: [
      "Original budget versus approved changes",
      "Committed versus actual versus forecast",
      "Editable expected cost plan",
    ],
  },
  "finance-capital-stack": {
    eyebrow: "Finance",
    title: "Capital stack and multi-loan tracking is planned here",
    description:
      "This is where business loans, personal loans, cards, hard money, and construction debt will be tracked together instead of relying on one simple loan field.",
    highlights: [
      "Multiple funding sources per property",
      "Interest, points, maturity, and payment draft",
      "Hard money and draw-aware structure",
    ],
  },
  "finance-draw-operations": {
    eyebrow: "Finance",
    title: "Draw operations will coordinate lenders and packets here",
    description:
      "This section will operationalize the draw tracker so request status, support files, linked expenses, and packet readiness can be managed from one lender-facing workspace.",
    highlights: [
      "Draw packet readiness and support coverage",
      "Linked expenses and lender support files",
      "Status flow from planned through funded",
    ],
  },
  "finance-payment-schedule": {
    eyebrow: "Finance",
    title: "Payment scheduling will turn debt into a real calendar here",
    description:
      "This section will translate the modeled capital stack into upcoming payment dates, balloon timing, and event-based obligations across all funding sources.",
    highlights: [
      "Upcoming debt payment calendar",
      "Balloon and event-based obligation tracking",
      "Source-by-source timing and monthly draft visibility",
    ],
  },
  "finance-reports": {
    eyebrow: "Finance",
    title: "Printable reports will be generated here",
    description:
      "This section is reserved for polished PDF exports like project financial reports, lender packages, and investor updates.",
    highlights: [
      "Project financial report PDFs",
      "Lender draw and capital summary packages",
      "Investor-ready reporting exports",
    ],
  },
  "costs-budget": {
    eyebrow: "Costs",
    title: "Budget control will move into the property shell next",
    description:
      "The existing scope budget system will be mounted here so budget lines, expected cost, and variance all live under Property Workspace.",
    highlights: [
      "Line-item cost planning",
      "Expected versus actual cost tracking",
      "Cost phases and scope visibility",
    ],
  },
  "costs-expenses": {
    eyebrow: "Costs",
    title: "Expense capture will become a dedicated property section",
    description:
      "Manual expenses and AI receipt capture already exist in the project system. Phase 2 will bring them here and connect them directly to property-level cost controls.",
    highlights: [
      "Manual and AI receipt-driven entry",
      "Category matching and budget matching",
      "Property-wide expense ledger",
    ],
  },
  "costs-commitments": {
    eyebrow: "Costs",
    title: "Commitments and vendor obligations are queued here",
    description:
      "This section will show awarded amounts, unpaid approved costs, and vendor obligations before they become actual spend.",
    highlights: [
      "Awarded vendor amounts",
      "Committed but unpaid cost",
      "Links from awards to actual payments",
    ],
  },
  "documents-overview": {
    eyebrow: "Documents",
    title: "Property documents are being reorganized into one structure",
    description:
      "This area will separate closing files, lender files, receipts, invoices, contracts, permits, and reports instead of relying on a single generic documents view.",
    highlights: [
      "Closing and lender document buckets",
      "Receipts and invoice storage",
      "Report and contract organization",
    ],
  },
  "operations-schedule": {
    eyebrow: "Operations",
    title: "A richer visual schedule is planned for this section",
    description:
      "This page is reserved for a colorful vendor-aware execution schedule with phases, milestones, and a stronger sense of project momentum.",
    highlights: [
      "Vendor swimlanes and milestone grouping",
      "Upcoming work by phase",
      "Visual schedule controls instead of plain lists",
    ],
  },
  "operations-timeline": {
    eyebrow: "Operations",
    title: "The property timeline will live here",
    description:
      "This section is reserved for a colorful timeline of milestones, vendor activity, lender events, payments, and key property changes.",
    highlights: [
      "Vendor and lender event lanes",
      "Milestones and key date history",
      "Print-friendly timeline exports",
    ],
  },
  "operations-vendors": {
    eyebrow: "Operations",
    title: "Property-level vendor coordination is planned here",
    description:
      "This future section will gather the vendors touching this property and connect their bids, compliance files, and work status.",
    highlights: [
      "Property vendor roster",
      "Bid and compliance rollup",
      "Work status across active vendors",
    ],
  },
  "operations-activity": {
    eyebrow: "Operations",
    title: "A shared activity feed is planned for this workspace",
    description:
      "This will become the running event log for changes, uploads, costs, milestones, and approvals tied to the property.",
    highlights: [
      "Recent property events",
      "Financial and document activity",
      "Milestone and decision log",
    ],
  },
};

const WorkspaceSelectField = ({ label, value, options, onChange }) => (
  <label className="space-y-2">
    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
      {label}
    </span>
    <div className="relative">
      <select value={value} onChange={onChange} className="auth-input appearance-none pr-11">
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    </div>
  </label>
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
  const { propertyKey, category: categoryParam, section: sectionParam } = useParams();
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
  const [isUpdatingWorkspaceStatus, setIsUpdatingWorkspaceStatus] = useState(false);

  const activeWorkspaceRoute = useMemo(
    () => resolvePropertyWorkspaceRoute(categoryParam, sectionParam),
    [categoryParam, sectionParam]
  );
  const activeCategory = activeWorkspaceRoute.category;
  const activeSection = activeWorkspaceRoute.section;
  const activeContentKey = activeSection?.contentKey || "details";
  const sectionOptions = activeCategory?.sections || [];
  const ActiveCategoryIcon = workspaceCategoryIcons[activeCategory?.id] || HomeModernIcon;
  const isLeadWorkspaceSection = leadWorkspaceContentKeys.has(activeContentKey);

  const pipelineLeadId = property?.workspaces?.pipeline?.id || "";
  const pipelineLeadPath = property?.workspaces?.pipeline?.path || "";
  const propertyWorkspaceActive = Boolean(property?.workspaces?.pipeline?.inPropertyWorkspace);

  useEffect(() => {
    if (!propertyKey || activeWorkspaceRoute.isCanonical) {
      return;
    }

    navigate(buildPropertyWorkspacePath(propertyKey, activeCategory.id, activeSection.id), {
      replace: true,
    });
  }, [
    activeCategory,
    activeSection,
    activeWorkspaceRoute.isCanonical,
    navigate,
    propertyKey,
  ]);

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
        navigate(
          buildPropertyWorkspacePath(
            nextProperty.propertyKey,
            activeCategory.id,
            activeSection.id
          ),
          { replace: true }
        );
      }
    },
    [activeCategory, activeSection, navigate, propertyKey]
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

    if (countSavableComparables(selectedComps) < 3) {
      const message = "Select at least 3 comparable sales before saving.";
      setLeadWorkspaceError(message);
      toast.error(message);
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
      navigate(buildPropertyWorkspacePath(propertyKey, "property", "saved-reports"));
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

  const handleUpdatePropertyWorkspaceStatus = async (nextValue) => {
    if (!pipelineLeadId) {
      toast.error("This property is not linked to a lead.");
      return;
    }

    try {
      setIsUpdatingWorkspaceStatus(true);
      const updatedLead = await updateLead(pipelineLeadId, {
        inPropertyWorkspace: nextValue,
      });
      const refreshedProperty = await getPropertyWorkspace(propertyKey);
      syncPropertyState(refreshedProperty);
      handleLeadUpdated(updatedLead);
      await loadLeadWorkspace();

      if (nextValue) {
        toast.success("Moved to Property Workspace.");
      } else {
        toast.success("Removed from Property Workspace. The lead stays in Closed - Won.");
        navigate(`/leads/${pipelineLeadId}`);
      }
    } catch (workspaceStatusError) {
      toast.error(workspaceStatusError.message || "Failed to update Property Workspace.");
    } finally {
      setIsUpdatingWorkspaceStatus(false);
    }
  };

  const handleCategoryChange = (event) => {
    const nextCategory =
      PROPERTY_WORKSPACE_NAVIGATION.find((category) => category.id === event.target.value) ||
      PROPERTY_WORKSPACE_NAVIGATION[0];
    const nextSection = nextCategory?.sections?.[0];

    if (!nextCategory || !nextSection) {
      return;
    }

    navigate(buildPropertyWorkspacePath(propertyKey, nextCategory.id, nextSection.id));
  };

  const handleSectionChange = (event) => {
    navigate(buildPropertyWorkspacePath(propertyKey, activeCategory.id, event.target.value));
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

  const renderLeadWorkspaceRequiredState = ({
    eyebrow = "Linked lead workspace",
    title = "This property is not active in Property Workspace",
    description = "Property Workspace is only for deals you explicitly move over from Closed - Won in the lead pipeline.",
  } = {}) => (
    <section className="section-card p-6 sm:p-7">
      <span className="eyebrow">{eyebrow}</span>
      <h3 className="mt-4 text-3xl font-semibold text-ink-900">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{description}</p>
      {pipelineLeadPath ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={pipelineLeadPath} className="primary-action">
            Open source lead
          </Link>
        </div>
      ) : null}
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

  const renderLeadSectionContent = (renderContent, loadingLabel) => {
    if (!pipelineLeadId) {
      return renderLeadWorkspaceRequiredState();
    }

    if (!propertyWorkspaceActive && activeContentKey !== "settings") {
      return renderLeadWorkspaceRequiredState({
        title: "Move this deal into Property Workspace first",
        description:
          "The lead stays in Closed - Won, but it has to be explicitly moved into Property Workspace before these sections are active.",
      });
    }

    if (leadWorkspaceLoading && !leadWorkspace) {
      return renderLeadWorkspaceLoadingState(loadingLabel);
    }

    if (!leadWorkspace) {
      return renderLeadWorkspaceErrorState();
    }

    return renderContent();
  };

  const renderPlaceholderSection = (contentKey) => {
    const copy = placeholderSectionCopy[contentKey] || {
      eyebrow: activeCategory.label,
      title: `${activeSection.label} is scaffolded and ready for phase 2`,
      description:
        "This section now has its place in the new property workspace shell so we can build it properly without overloading the old tab layout.",
      highlights: [
        "Navigation structure is live",
        "Existing property tools remain intact",
        "This section is ready for implementation",
      ],
    };

    return (
      <section className="surface-panel px-6 py-7 sm:px-7">
        <span className="eyebrow">{copy.eyebrow}</span>
        <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h3 className="font-display text-[2.15rem] leading-[0.96] text-ink-900">
              {copy.title}
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
              {copy.description}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {copy.highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4"
                >
                  <p className="text-sm font-medium leading-6 text-ink-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Phase 1 status
            </p>
            <h4 className="mt-4 text-xl font-semibold text-ink-900">Shell is now in place</h4>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              We can build this section next without disturbing the live property details, comps,
              bids, tasks, and settings areas that already work today.
            </p>
            <div className="mt-5 rounded-[18px] bg-sand-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                Current section
              </p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{activeSection.label}</p>
              <p className="mt-2 text-sm leading-6 text-ink-500">{activeSection.description}</p>
            </div>
          </div>
        </div>
      </section>
    );
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
              <Link to="/properties" className="secondary-action">
                Back to Property Workspace
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
              Property workspace status
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
                <span className="text-sm font-medium text-ink-600">In Property Workspace</span>
                <span className="text-sm font-semibold text-ink-900">
                  {propertyWorkspaceActive ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">Source lead stage</span>
                <span className="text-sm font-semibold text-ink-900">
                  {property.workspaces.pipeline ? property.workspaces.pipeline.status : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-sand-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Saved reports</span>
                <span className="text-sm font-semibold text-ink-900">{savedReports.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-panel px-6 py-6 sm:px-7">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] xl:items-end">
          <div>
            <span className="eyebrow">Phase 1 workspace shell</span>
            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-ink-100 text-ink-700">
                <ActiveCategoryIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-ink-900">
                  {activeCategory.label} · {activeSection.label}
                </h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
                  {activeSection.description}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {sectionOptions.map((section) => (
                <span
                  key={section.id}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    section.id === activeSection.id
                      ? "bg-ink-900 text-white"
                      : "bg-white text-ink-600 ring-1 ring-ink-100"
                  }`}
                >
                  {section.label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <WorkspaceSelectField
              label="Category"
              value={activeCategory.id}
              options={PROPERTY_WORKSPACE_NAVIGATION}
              onChange={handleCategoryChange}
            />
            <WorkspaceSelectField
              label="Section"
              value={activeSection.id}
              options={sectionOptions}
              onChange={handleSectionChange}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
              Lead link
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              {pipelineLeadId ? "Connected" : "Not connected"}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {pipelineLeadId
                ? "Lead-driven comps, reports, scope, and bid workflows can stay attached here."
                : "This property is missing a linked lead, so lead-powered sections stay locked."}
            </p>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
              Workspace status
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              {propertyWorkspaceActive ? "Active in Property Workspace" : "Not active yet"}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Lead-only sections still respect the property workspace enrollment setting.
            </p>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
              Saved market history
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              {savedReports.length} saved report{savedReports.length === 1 ? "" : "s"}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              This property now has room for finance, costs, documents, and operations without
              crowding the old tab strip.
            </p>
          </div>
        </div>
      </section>

      {isLeadWorkspaceSection && leadWorkspace && leadWorkspaceError ? (
        <div className="rounded-[16px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {leadWorkspaceError}
        </div>
      ) : null}

      {activeContentKey === "details" ? (
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
          <div className="section-card p-5">
            <span className="eyebrow">Source lead</span>
            <h4 className="mt-4 text-xl font-semibold text-ink-900">Lead-linked workspace</h4>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              This property keeps using the same lead data for comps, saved reports, renovation, bids,
              and tasks.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {pipelineLeadPath ? (
                <Link to={pipelineLeadPath} className="secondary-action">
                  <UsersIcon className="mr-2 h-5 w-5" />
                  Open lead
                </Link>
              ) : null}
            </div>
          </div>

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

          <div className="section-card p-5">
            <span className="eyebrow">Workspace state</span>
            <h4 className="mt-4 text-xl font-semibold text-ink-900">Current placement</h4>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {propertyWorkspaceActive
                ? "This deal is active in Property Workspace and still remains in Closed - Won in the lead pipeline."
                : "This deal is not currently active in Property Workspace."}
            </p>
          </div>
        </div>
      </section>
      ) : activeContentKey === "acquisition-summary" ||
        activeContentKey === "original-assumptions" ? (
        <PropertySummaryPanel
          property={property}
          propertyKey={propertyKey}
          activeContentKey={activeContentKey}
          leadWorkspace={leadWorkspace}
          savedReports={savedReports}
          pipelineLeadPath={pipelineLeadPath}
        />
      ) : activeContentKey === "comps" ? (
        renderLeadSectionContent(
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
      ) : activeContentKey === "saved-reports" ? (
        renderLeadSectionContent(
          () => (
            <SavedCompsReportsTab
              reports={savedReports}
              isLoading={savedReportsLoading}
              title="Saved property reports"
              description="Every saved comps snapshot for this property's linked lead lives here so you can compare different comp sets over time."
              emptyTitle="No property reports saved yet"
              emptyMessage="Run the AI comps analysis, choose the comps you want to keep, and save the report to build the property's comps history."
            />
          ),
          "Loading saved reports..."
        )
      ) : activeContentKey === "renovation" ? (
        renderLeadSectionContent(
          () => (
            <LeadRenovationTab
              lead={leadWorkspace}
              leadId={pipelineLeadId}
              onLeadUpdated={handleLeadUpdated}
            />
          ),
          "Loading renovation plan..."
        )
      ) : activeContentKey === "bids" ? (
        renderLeadSectionContent(
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
      ) : activeContentKey === "settings" ? (
        renderLeadSectionContent(
          () => (
            <section className="section-card p-6 sm:p-7">
              <span className="eyebrow">Workspace settings</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Control where this deal lives</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Property Workspace is separate from the lead pipeline list. Removing it from here
                does not delete the deal and does not remove it from Closed - Won.
              </p>

              <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                <div className="rounded-[24px] border border-ink-100 bg-sand-50/70 p-5">
                  <p className="text-sm font-semibold text-ink-900">Current status</p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    {propertyWorkspaceActive
                      ? "This lead is active in Property Workspace."
                      : "This lead is not currently active in Property Workspace."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {propertyWorkspaceActive ? (
                      <button
                        type="button"
                        onClick={() => handleUpdatePropertyWorkspaceStatus(false)}
                        disabled={isUpdatingWorkspaceStatus}
                        className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isUpdatingWorkspaceStatus ? "Updating..." : "Move Back to Potential Properties"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdatePropertyWorkspaceStatus(true)}
                        disabled={isUpdatingWorkspaceStatus}
                        className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isUpdatingWorkspaceStatus ? "Updating..." : "Move to Property Workspace"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-ink-100 bg-white p-5">
                  <p className="text-sm font-semibold text-ink-900">Source lead</p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    The lead remains in the pipeline under <span className="font-semibold text-ink-900">Closed - Won</span>.
                    Use that record whenever you want to review or change the original lead details.
                  </p>
                  {pipelineLeadPath ? (
                    <div className="mt-5">
                      <Link to={pipelineLeadPath} className="secondary-action">
                        Open source lead
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          ),
          "Loading workspace settings..."
        )
      ) : activeContentKey.startsWith("finance-") ? (
        <PropertyFinancePanel
          property={property}
          propertyKey={propertyKey}
          activeContentKey={activeContentKey}
          onPropertyUpdated={syncPropertyState}
        />
      ) : activeContentKey.startsWith("costs-") ? (
        <PropertyCostsPanel
          property={property}
          propertyKey={propertyKey}
          activeContentKey={activeContentKey}
          onPropertyUpdated={syncPropertyState}
        />
      ) : activeContentKey === "documents-overview" ? (
        <PropertyDocumentsPanel
          property={property}
          propertyKey={propertyKey}
          onPropertyUpdated={syncPropertyState}
        />
      ) : activeContentKey.startsWith("operations-") ? (
        <PropertyOperationsPanel
          property={property}
          propertyKey={propertyKey}
          activeContentKey={activeContentKey}
          onPropertyUpdated={syncPropertyState}
        />
      ) : activeContentKey === "tasks" ? (
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
      ) : (
        renderPlaceholderSection(activeContentKey)
      )}
    </div>
  );
};

export default PropertyWorkspacePage;
