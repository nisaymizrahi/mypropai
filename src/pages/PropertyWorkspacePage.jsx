import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BanknotesIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import {
  analyzeLeadComps,
  createOneTimeCheckout,
  createPropertyWorkspace,
  getBidsForLead,
  getBidsForProject,
  getBillingAccess,
  getLeadDetails,
  getPropertyReports,
  getPropertyWorkspace,
  getTaskList,
  previewLeadProperty,
  saveCompsReport,
  updateLead,
  updatePropertyWorkspace,
} from "../utils/api";
import {
  buildAnalysisFromSavedReport,
  buildCompsFilterPayload,
  buildCompsFilters,
  buildDealForm,
  buildDealPayload,
  buildSavedReportFromLegacySnapshot,
  countSavableComparables,
  normalizeMasterReport,
} from "../utils/compsReport";
import { getLocationProviderName, searchAddressSuggestions } from "../utils/locationSearch";
import {
  buildPropertyWorkspacePath,
  PROPERTY_WORKSPACE_TABS,
  resolvePropertyWorkspaceRoute,
} from "../utils/propertyWorkspaceNavigation";
import { isTaskComplete, isTaskOverdue, sortTasks } from "../utils/tasks";
import BidsTab from "../components/BidsTab";
import LeadRenovationTab, { buildRenovationForm } from "../components/LeadRenovationTab";
import MasterDealReportWorkspace from "../components/MasterDealReportWorkspace";
import PropertyCostsPanel from "../components/PropertyCostsPanel";
import PropertyCopilotPanel from "../components/PropertyCopilotPanel";
import PropertyDocumentsPanel from "../components/PropertyDocumentsPanel";
import PropertyFinancePanel, { EmptyAcquisitionState } from "../components/PropertyFinancePanel";
import PropertyOperationsPanel from "../components/PropertyOperationsPanel";
import PropertySummaryPanel from "../components/PropertySummaryPanel";
import PropertyWorkspaceSection from "../components/PropertyWorkspaceSection";
import PropertyWorkspaceSettingsPanel from "../components/PropertyWorkspaceSettingsPanel";
import SavedCompsReportsTab from "../components/SavedCompsReportsTab";
import TasksPanel from "../components/TasksPanel";
import useSubscriptionCheckoutConsent from "../hooks/useSubscriptionCheckoutConsent";

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

const workspaceTabIcons = {
  home: HomeModernIcon,
  execution: ClipboardDocumentListIcon,
  budget: BanknotesIcon,
  files: DocumentTextIcon,
  deal: ChartBarIcon,
  settings: Cog6ToothIcon,
};

const HOME_SECTION_IDS = {
  priorities: "home-priorities",
  quickLaunch: "home-quick-launch",
  tasks: "home-upcoming-work",
  activity: "home-recent-updates",
  propertyDetails: "home-property-details",
};

const EXECUTION_SECTION_IDS = {
  tasks: "execution-tasks",
  schedule: "execution-schedule",
  vendors: "execution-vendors",
  procurement: "execution-procurement",
};

const BUDGET_SECTION_IDS = {
  snapshot: "budget-snapshot",
  actuals: "budget-vs-actual",
  expenses: "budget-expenses",
  capital: "budget-capital",
  draws: "budget-draws",
  reports: "budget-reports",
};

const DEAL_SECTION_IDS = {
  summary: "analysis-deal-summary",
  reports: "deal-reports-run",
  reportHistory: "deal-report-history",
  scope: "analysis-scope",
  assumptions: "analysis-original-assumptions",
};

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "Not set";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const formatCompactDate = (value, fallback = "No date") => {
  if (!value) return fallback;

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const formatDateTime = (value, fallback = "Recently") => {
  if (!value) return fallback;

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

const isSavedReportsBackendUnavailable = (error) =>
  String(error?.message || "").includes("Saved reports are not available on the server yet");

const buildLeadCompsAnalysisSnapshotFromReport = (report) => {
  if (!report?.generatedAt) return null;

  return {
    generatedAt: report.generatedAt,
    filters: report.compFilters || report.filters || null,
    valuationContext: report.valuationContext || null,
    estimatedValue: report.valuation?.blendedEstimate ?? report.estimatedValue ?? null,
    estimatedValueLow: report.valuation?.blendedLow ?? report.estimatedValueLow ?? null,
    estimatedValueHigh: report.valuation?.blendedHigh ?? report.estimatedValueHigh ?? null,
    averageSoldPrice: report.averageSoldPrice ?? report.comps?.primary?.summary?.averagePrice ?? null,
    medianSoldPrice: report.valuation?.primaryCompMedian ?? report.medianSoldPrice ?? null,
    lowSoldPrice: report.lowSoldPrice ?? null,
    highSoldPrice: report.highSoldPrice ?? null,
    averagePricePerSqft:
      report.averagePricePerSqft ?? report.comps?.primary?.summary?.averagePricePerSqft ?? null,
    medianPricePerSqft:
      report.medianPricePerSqft ?? report.comps?.primary?.summary?.medianPricePerSqft ?? null,
    lowPricePerSqft: report.lowPricePerSqft ?? null,
    highPricePerSqft: report.highPricePerSqft ?? null,
    averageDaysOnMarket: report.averageDaysOnMarket ?? null,
    medianDaysOnMarket: report.medianDaysOnMarket ?? null,
    lowDaysOnMarket: report.lowDaysOnMarket ?? null,
    highDaysOnMarket: report.highDaysOnMarket ?? null,
    saleCompCount: report.comps?.primary?.summary?.count ?? report.saleCompCount ?? null,
    askingPriceDelta: report.askingPriceDelta ?? null,
    recommendedOfferLow: report.recommendedOfferLow ?? null,
    recommendedOfferHigh: report.recommendedOfferHigh ?? null,
    report: report.aiVerdict || report.report || null,
    recentComps: Array.isArray(report.recentComps) ? report.recentComps : [],
  };
};

const sortReportsByGeneratedAt = (reports = []) =>
  [...reports].sort(
    (left, right) =>
      new Date(right?.generatedAt || right?.createdAt || 0).valueOf() -
      new Date(left?.generatedAt || left?.createdAt || 0).valueOf()
  );

const buildWorkspaceSavedReports = ({
  leadData,
  pipelineLeadId,
  leadReports = [],
  projectReports = [],
}) => {
  const combinedReports = sortReportsByGeneratedAt([
    ...projectReports,
    ...leadReports,
  ])
    .map((report) => normalizeMasterReport(report, leadData))
    .filter(Boolean);

  const seenReports = new Set();
  const dedupedReports = combinedReports.filter((report) => {
    const reportKey =
      String(report?._id || "").trim() ||
      [
        report?.contextType || "saved",
        report?.generatedAt || "",
        report?.title || report?.address || "",
      ].join(":");

    if (!reportKey || seenReports.has(reportKey)) {
      return false;
    }

    seenReports.add(reportKey);
    return true;
  });

  const legacySavedReport = buildSavedReportFromLegacySnapshot(
    leadData,
    leadData?.compsAnalysis,
    `legacy-${leadData?._id || pipelineLeadId}`
  );

  if (!legacySavedReport) {
    return dedupedReports;
  }

  const normalizedLegacyReport = normalizeMasterReport(legacySavedReport, leadData);
  const hasMatchingSavedReport = dedupedReports.some(
    (report) =>
      Number(new Date(report?.generatedAt || 0).valueOf()) ===
        Number(new Date(normalizedLegacyReport?.generatedAt || 0).valueOf()) &&
      String(report?.address || report?.subject?.address || "").trim() ===
        String(
          normalizedLegacyReport?.address || normalizedLegacyReport?.subject?.address || ""
        ).trim()
  );

  return hasMatchingSavedReport
    ? dedupedReports
    : sortReportsByGeneratedAt([...dedupedReports, normalizedLegacyReport]);
};

const buildPropertyCopilotSuggestions = ({
  activeTabId,
  hasPipelineWorkspace,
  propertyWorkspaceActive,
  hasAcquisitionWorkspace,
  leadWorkspace,
  savedReports,
  analysis,
  openPropertyTasks,
}) => {
  const suggestions = [];
  const latestReport = savedReports[0] || null;
  const latestRecommendedLow =
    analysis?.recommendedOfferLow ??
    latestReport?.recommendedOfferLow ??
    leadWorkspace?.compsAnalysis?.recommendedOfferLow ??
    null;
  const latestRecommendedHigh =
    analysis?.recommendedOfferHigh ??
    latestReport?.recommendedOfferHigh ??
    leadWorkspace?.compsAnalysis?.recommendedOfferHigh ??
    null;

  if (!hasPipelineWorkspace) {
    suggestions.push("What analysis setup is missing for this property?");
    suggestions.push("Open settings so I can add the deal workspace");
    return suggestions;
  }

  if (!propertyWorkspaceActive) {
    suggestions.push("What do I unlock if I move this deal into Project Workspace?");
    suggestions.push("Open settings so I can activate deal access here");
    return suggestions;
  }

  if (!analysis && savedReports.length === 0) {
    suggestions.push("What comps analysis should I run next for this property?");
  }

  if (latestReport || analysis) {
    suggestions.push("Summarize the latest comps report and recommended offer");

    if (activeTabId === "deal") {
      suggestions.push("What is the biggest comps risk or confidence signal right now?");
    }
  }

  if (leadWorkspace?.sellerAskingPrice && (latestRecommendedLow || latestRecommendedHigh)) {
    if (latestRecommendedHigh && Number(leadWorkspace.sellerAskingPrice) > Number(latestRecommendedHigh)) {
      suggestions.push("How far above the recommended offer range is the asking price?");
    } else {
      suggestions.push("Does the seller asking price fit inside the recommended offer range?");
    }
  }

  if (leadWorkspace?.nextAction || leadWorkspace?.followUpDate) {
    suggestions.push("What seller follow-up is due next on this deal?");
  }

  if ((leadWorkspace?.nextAction || leadWorkspace?.followUpDate) && openPropertyTasks === 0) {
    suggestions.push(
      leadWorkspace?.followUpDate
        ? `Create a task due ${formatCompactDate(
            leadWorkspace.followUpDate
          )} for the next seller follow-up`
        : "Create a task due tomorrow for the next seller follow-up"
    );
  }

  if ((leadWorkspace?.nextAction || leadWorkspace?.followUpDate) && openPropertyTasks > 0) {
    suggestions.push("Do my open property tasks already cover the next seller follow-up?");
  }

  if (!hasAcquisitionWorkspace && (latestReport || analysis)) {
    suggestions.push("Based on the comps, what should I set up next in budget?");
  }

  if (activeTabId === "files") {
    suggestions.push("What do the uploaded property documents say about this deal?");
  }

  return [...new Set(suggestions)].slice(0, 6);
};

const TabButton = ({ tab, isActive, onSelect }) => {
  const Icon = workspaceTabIcons[tab.id] || HomeModernIcon;

  return (
    <button
      type="button"
      onClick={() => onSelect(tab.id)}
      className={`flex min-w-[132px] shrink-0 items-center gap-3 rounded-[20px] px-4 py-3 text-left transition ${
        isActive
          ? "bg-steel-900 text-white shadow-soft"
          : "bg-white/92 text-ink-600 ring-1 ring-ink-100 hover:bg-mist-50"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${
          isActive ? "bg-white/12 text-white" : "bg-mist-50 text-ink-700"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="min-w-0 text-sm font-semibold">{tab.label}</p>
    </button>
  );
};

const HeaderBadge = ({ label, tone = "bg-white/80 text-ink-700 ring-1 ring-white/60" }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>
);

const StatCard = ({ label, value, helper = "", tone = "bg-white/86" }) => (
  <div className={`rounded-[22px] p-4 ring-1 ring-white/70 ${tone}`}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">{label}</p>
    <p className="mt-3 text-2xl font-semibold text-ink-900">{value}</p>
    {helper ? <p className="mt-2 text-sm text-ink-500">{helper}</p> : null}
  </div>
);

const SectionSegmentedControl = ({
  label,
  items,
  activeItemId,
  onSelect,
}) => (
  <section className="surface-panel px-4 py-4 sm:px-5">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          {label}
        </p>
        <p className="mt-1 text-sm text-ink-500">Jump to the part of this workspace you want to operate.</p>
      </div>
      <div className="segmented-control flex-wrap">
        {items.map((item) => {
          const isActive = item.id === activeItemId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`segmented-option ${isActive ? "segmented-option-active" : ""}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  </section>
);

const ActionQueueCard = ({ title, detail, label, onClick, disabled = false }) => (
  <div className="flex flex-col gap-3 rounded-[20px] border border-ink-100 bg-white/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      <p className="mt-1 text-sm text-ink-500">{detail}</p>
    </div>
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="secondary-action shrink-0 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {label}
    </button>
  </div>
);

const WorkspaceLaunchCard = ({
  eyebrow,
  title,
  detail,
  label,
  onClick,
  tone = "bg-white/90",
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-[24px] border border-ink-100 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${tone}`}
  >
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{eyebrow}</p>
    <h3 className="mt-4 text-lg font-semibold text-ink-900">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-ink-500">{detail}</p>
    <span className="mt-5 inline-flex rounded-full bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white">
      {label}
    </span>
  </button>
);

const SetupStateCard = ({
  eyebrow = "Setup",
  title,
  description,
  primaryAction = null,
  secondaryAction = null,
}) => (
  <section className="section-card p-6 sm:p-7">
    <span className="eyebrow">{eyebrow}</span>
    <h3 className="mt-4 text-2xl font-semibold text-ink-900">{title}</h3>
    <p className="mt-2 max-w-2xl text-sm text-ink-500">{description}</p>
    {primaryAction || secondaryAction ? (
      <div className="mt-5 flex flex-wrap gap-3">
        {primaryAction}
        {secondaryAction}
      </div>
    ) : null}
  </section>
);

const LoadingStateCard = ({ label }) => (
  <div className="section-card px-6 py-10 text-center text-ink-500">{label}</div>
);

const ProfileField = ({ label, children, className = "" }) => (
  <label className={`space-y-2 ${className}`}>
    <span className="text-sm font-medium text-ink-700">{label}</span>
    {children}
  </label>
);

const PropertyWorkspacePage = () => {
  const { propertyKey, tab: tabParam, category: categoryParam, section: sectionParam } = useParams();
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
  const [dealOverrides, setDealOverrides] = useState({});
  const [compsNotice, setCompsNotice] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [savedReportsLoading, setSavedReportsLoading] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [bids, setBids] = useState([]);
  const [billingAccess, setBillingAccess] = useState(null);
  const [isBillingAccessLoading, setIsBillingAccessLoading] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isUpdatingWorkspaceStatus, setIsUpdatingWorkspaceStatus] = useState(false);
  const [propertyTasks, setPropertyTasks] = useState([]);
  const [propertyTasksLoading, setPropertyTasksLoading] = useState(false);
  const [propertyTasksError, setPropertyTasksError] = useState("");
  const [isCreatingPipelineWorkspace, setIsCreatingPipelineWorkspace] = useState(false);
  const [isCreatingAcquisitionWorkspace, setIsCreatingAcquisitionWorkspace] = useState(false);
  const [isCreatingManagementWorkspace, setIsCreatingManagementWorkspace] = useState(false);
  const [acquisitionStrategy, setAcquisitionStrategy] = useState("flip");
  const [managementStrategy, setManagementStrategy] = useState("rental");
  const [sectionRevealTokens, setSectionRevealTokens] = useState({});
  const [activeExecutionSection, setActiveExecutionSection] = useState("tasks");
  const [activeBudgetSection, setActiveBudgetSection] = useState("snapshot");
  const [activeDealSection, setActiveDealSection] = useState("summary");
  const subscriptionOffer = billingAccess?.subscriptionOffer || null;

  const handleSubscriptionCheckoutError = useCallback((error) => {
    setLeadWorkspaceError(error.message || "Could not start the Pro checkout.");
  }, []);

  const {
    openSubscriptionConsent: handleStartSubscription,
    isStartingSubscription,
    subscriptionConsentDialog,
  } = useSubscriptionCheckoutConsent({
    planKey: "pro",
    monthlyPriceCents: subscriptionOffer?.monthlyPriceCents ?? null,
    trialPeriodDays: subscriptionOffer?.trialPeriodDays || 0,
    trialEligible: Boolean(billingAccess?.trialEligible),
    source: "property_workspace",
    onError: handleSubscriptionCheckoutError,
  });

  const activeWorkspaceRoute = useMemo(
    () =>
      resolvePropertyWorkspaceRoute({
        tabId: tabParam,
        categoryId: categoryParam,
        sectionId: sectionParam,
      }),
    [categoryParam, sectionParam, tabParam]
  );
  const activeTab = activeWorkspaceRoute.tab;

  const pipelineLeadId = property?.workspaces?.pipeline?.id || "";
  const pipelineLeadPath = property?.workspaces?.pipeline?.path || "";
  const pipelineLeadStatus = property?.workspaces?.pipeline?.status || "";
  const acquisitionWorkspaceId = property?.workspaces?.acquisitions?.id || "";
  const propertyWorkspaceActive = Boolean(property?.workspaces?.pipeline?.inPropertyWorkspace);
  const hasPipelineWorkspace = Boolean(property?.workspaces?.pipeline);
  const hasAcquisitionWorkspace = Boolean(property?.workspaces?.acquisitions);
  const hasManagementWorkspace = Boolean(property?.workspaces?.management);

  useEffect(() => {
    if (!propertyKey || activeWorkspaceRoute.isCanonical) {
      return;
    }

    navigate(buildPropertyWorkspacePath(propertyKey, activeTab.id), { replace: true });
  }, [activeTab.id, activeWorkspaceRoute.isCanonical, navigate, propertyKey]);

  const syncPropertyState = useCallback(
    (nextProperty) => {
      if (!nextProperty) {
        return;
      }

      setProperty(nextProperty);
      setFormData(buildFormState(nextProperty));
      setPreviewMetadata(null);
      selectedSuggestionRef.current = "";
      setAcquisitionStrategy(nextProperty?.workspaces?.acquisitions?.strategy || "flip");
      setManagementStrategy(nextProperty?.workspaces?.management?.strategy || "rental");

      if (nextProperty.propertyKey !== propertyKey) {
        navigate(buildPropertyWorkspacePath(nextProperty.propertyKey, activeTab.id), {
          replace: true,
        });
      }
    },
    [activeTab.id, navigate, propertyKey]
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

  const loadPropertyTasks = useCallback(async (nextPropertyKey) => {
    if (!nextPropertyKey) {
      setPropertyTasks([]);
      setPropertyTasksError("");
      setPropertyTasksLoading(false);
      return;
    }

    try {
      setPropertyTasksLoading(true);
      setPropertyTasksError("");
      const taskData = await getTaskList({ propertyKey: nextPropertyKey });
      setPropertyTasks(Array.isArray(taskData) ? taskData : []);
    } catch (taskError) {
      setPropertyTasks([]);
      setPropertyTasksError(taskError.message || "Failed to load property tasks.");
    } finally {
      setPropertyTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPropertyTasks(property?.propertyKey || "");
  }, [loadPropertyTasks, property?.propertyKey]);

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
      setDealOverrides({});
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

      const [leadData, bidsData, leadSavedReportsData, projectSavedReportsData, access] =
        await Promise.all([
          getLeadDetails(pipelineLeadId),
          acquisitionWorkspaceId
            ? getBidsForProject(acquisitionWorkspaceId).catch((bidsError) => {
                console.error("Failed to load property workspace bids", bidsError);
                return [];
              })
            : getBidsForLead(pipelineLeadId).catch((bidsError) => {
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
          acquisitionWorkspaceId
            ? getPropertyReports({
                kind: "comps",
                contextType: "project",
                investmentId: acquisitionWorkspaceId,
              }).catch((savedReportsError) => {
                if (!isSavedReportsBackendUnavailable(savedReportsError)) {
                  console.error(
                    "Failed to load property workspace project reports",
                    savedReportsError
                  );
                }
                return [];
              })
            : Promise.resolve([]),
          getBillingAccess("comps_report", pipelineLeadId).catch(() => null),
        ]);

      setLeadWorkspace(leadData);
      setBids(bidsData);
      setBillingAccess(access);

      const nextSavedReports = buildWorkspaceSavedReports({
        leadData,
        pipelineLeadId,
        leadReports: leadSavedReportsData,
        projectReports: projectSavedReportsData,
      });

      setSavedReports(nextSavedReports);
      setAnalysis(
        nextSavedReports[0]
          ? buildAnalysisFromSavedReport(nextSavedReports[0], leadData)
          : null
      );
      setFilters(
        buildCompsFilters(
          leadData,
          nextSavedReports[0]?.compFilters ||
            nextSavedReports[0]?.filters ||
            leadData.compsAnalysis?.filters ||
            {}
        )
      );
      setDealOverrides({});
      setCompsNotice("");
    } catch (leadError) {
      setLeadWorkspace(null);
      setAnalysis(null);
      setSavedReports([]);
      setBids([]);
      setBillingAccess(null);
      setLeadWorkspaceError(leadError.message || "Failed to load the linked deal workspace.");
    } finally {
      setLeadWorkspaceLoading(false);
      setSavedReportsLoading(false);
      setIsBillingAccessLoading(false);
    }
  }, [acquisitionWorkspaceId, pipelineLeadId]);

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

    return bits.join(" • ") || "Core property details are ready to fill in.";
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
  const dealForm = useMemo(
    () => ({
      ...buildDealForm(analysis?.dealInputs || savedReports[0]?.dealSnapshot || {}, leadWorkspace || {}),
      ...dealOverrides,
    }),
    [analysis?.dealInputs, dealOverrides, leadWorkspace, savedReports]
  );

  const sortedPropertyTasks = useMemo(() => sortTasks(propertyTasks, "due-asc"), [propertyTasks]);
  const openPropertyTasks = useMemo(
    () => propertyTasks.filter((task) => !isTaskComplete(task)).length,
    [propertyTasks]
  );
  const overduePropertyTasks = useMemo(
    () => propertyTasks.filter((task) => isTaskOverdue(task)).length,
    [propertyTasks]
  );
  const nextPropertyTasks = useMemo(
    () => sortedPropertyTasks.filter((task) => !isTaskComplete(task)).slice(0, 4),
    [sortedPropertyTasks]
  );

  const workspaceCount = useMemo(
    () =>
      [
        property?.workspaces?.pipeline,
        property?.workspaces?.acquisitions,
        property?.workspaces?.management,
      ].filter(Boolean).length,
    [property]
  );

  const recentActivity = useMemo(() => {
    const items = [];

    if (savedReports[0]?.generatedAt) {
      items.push({
        id: `report-${savedReports[0]._id}`,
        title: "Comps report saved",
        detail: savedReports[0].estimatedValue
          ? `Estimated value ${formatCurrency(savedReports[0].estimatedValue)}`
          : "Latest report is ready in Deal.",
        timestamp: savedReports[0].generatedAt,
      });
    }

    if (sortedPropertyTasks[0]?.updatedAt || sortedPropertyTasks[0]?.createdAt) {
      items.push({
        id: `task-${sortedPropertyTasks[0]._id}`,
        title: "Tasks updated",
        detail: `${openPropertyTasks} open task${openPropertyTasks === 1 ? "" : "s"} on this property`,
        timestamp: sortedPropertyTasks[0].updatedAt || sortedPropertyTasks[0].createdAt,
      });
    }

    if (property?.updatedAt) {
      items.push({
        id: "property-updated",
        title: "Property profile updated",
        detail: "Shared property details were edited recently.",
        timestamp: property.updatedAt,
      });
    }

    if (property?.createdAt) {
      items.push({
        id: "property-created",
        title: "Property record created",
        detail: "This shared record is now part of the workspace.",
        timestamp: property.createdAt,
      });
    }

    return items
      .filter((item) => item.timestamp)
      .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
      .slice(0, 4);
  }, [openPropertyTasks, property?.createdAt, property?.updatedAt, savedReports, sortedPropertyTasks]);

  const nextStepCard = useMemo(() => {
    if (!hasPipelineWorkspace) {
      return {
        value: "Add deal",
        helper: "Unlock comps, reports, scope, and bids.",
      };
    }

    if (!propertyWorkspaceActive) {
      return {
        value: "Activate deal access",
        helper: "Use the linked deal inside this project workspace.",
      };
    }

    if (!hasAcquisitionWorkspace) {
      return {
        value: "Add financials",
        helper: "Unlock budgets, expenses, schedule, and documents.",
      };
    }

    return {
      value: "Fully set up",
      helper: `${workspaceCount} linked record${workspaceCount === 1 ? "" : "s"} ready.`,
    };
  }, [
    hasAcquisitionWorkspace,
    hasPipelineWorkspace,
    propertyWorkspaceActive,
    workspaceCount,
  ]);

  const dealHealthCard = useMemo(() => {
    const latestReport = analysis || savedReports[0] || null;
    const askingPrice = Number(leadWorkspace?.sellerAskingPrice);
    const recommendedHigh = Number(
      latestReport?.recommendedOfferHigh ?? leadWorkspace?.compsAnalysis?.recommendedOfferHigh
    );
    const recommendedLow = Number(
      latestReport?.recommendedOfferLow ?? leadWorkspace?.compsAnalysis?.recommendedOfferLow
    );

    if (!hasPipelineWorkspace) {
      return {
        value: "No deal yet",
        helper: "Link a deal to keep the acquisition thesis attached to the project.",
      };
    }

    if (!propertyWorkspaceActive) {
      return {
        value: "Inactive",
        helper: "Activate deal access when you want reports and scope inside the project workspace.",
      };
    }

    if (Number.isFinite(askingPrice) && Number.isFinite(recommendedHigh) && askingPrice > recommendedHigh) {
      return {
        value: "Watch pricing gap",
        helper: `${formatCurrency(askingPrice - recommendedHigh)} above the latest range.`,
      };
    }

    if (Number.isFinite(recommendedLow) || Number.isFinite(recommendedHigh)) {
      return {
        value: "Underwritten",
        helper: `${formatCurrency(recommendedLow)} to ${formatCurrency(recommendedHigh)} saved in Deal.`,
      };
    }

    if (latestReport) {
      return {
        value: "Report ready",
        helper: "The latest deal report is saved and ready to compare against execution.",
      };
    }

    return {
      value: "Needs report",
      helper: "Run the first Deal Report to anchor underwriting inside the project.",
    };
  }, [
    analysis,
    hasPipelineWorkspace,
    leadWorkspace?.compsAnalysis?.recommendedOfferHigh,
    leadWorkspace?.compsAnalysis?.recommendedOfferLow,
    leadWorkspace?.sellerAskingPrice,
    propertyWorkspaceActive,
    savedReports,
  ]);

  const budgetHealthCard = useMemo(() => {
    if (!hasAcquisitionWorkspace) {
      return {
        value: "Needs budget",
        helper: "Create financials to unlock budget, expenses, draws, and reports.",
      };
    }

    if (overduePropertyTasks > 0) {
      return {
        value: "Needs review",
        helper: `${overduePropertyTasks} overdue task${overduePropertyTasks === 1 ? "" : "s"} could affect delivery and spend.`,
      };
    }

    return {
      value: "Tracking",
      helper: "Budget, expenses, draws, and finance reports are available in Budget.",
    };
  }, [hasAcquisitionWorkspace, overduePropertyTasks]);

  const procurementSummary = useMemo(() => {
    if (!hasPipelineWorkspace) {
      return "Link a deal first if you want scope-driven bids in the project workspace.";
    }

    if (!bids.length) {
      return hasAcquisitionWorkspace
        ? "No vendor bids saved yet. Compare scope and commitments when quotes arrive."
        : "No vendor bids saved yet. Scope and bids will land here once the deal is active.";
    }

    return `${bids.length} bid${bids.length === 1 ? "" : "s"} ready to compare against scope and commitments.`;
  }, [bids.length, hasAcquisitionWorkspace, hasPipelineWorkspace]);

  const copilotFollowUpSuggestions = useMemo(
    () =>
      buildPropertyCopilotSuggestions({
        activeTabId: activeTab.id,
        hasPipelineWorkspace,
        propertyWorkspaceActive,
        hasAcquisitionWorkspace,
        leadWorkspace,
        savedReports,
        analysis,
        openPropertyTasks,
      }),
    [
      activeTab.id,
      analysis,
      hasAcquisitionWorkspace,
      hasPipelineWorkspace,
      leadWorkspace,
      openPropertyTasks,
      propertyWorkspaceActive,
      savedReports,
    ]
  );

  const handleTabSelect = useCallback(
    (tabId) => {
      navigate(buildPropertyWorkspacePath(property?.propertyKey || propertyKey, tabId));
    },
    [navigate, property?.propertyKey, propertyKey]
  );

  const revealWorkspaceSection = useCallback((sectionId) => {
    setSectionRevealTokens((current) => ({
      ...current,
      [sectionId]: (current[sectionId] || 0) + 1,
    }));

    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 40);
    });
  }, []);

  const handleOpenPropertyDetails = useCallback(() => {
    if (activeTab.id !== "home") {
      navigate(buildPropertyWorkspacePath(property?.propertyKey || propertyKey, "home"));
      return;
    }

    revealWorkspaceSection(HOME_SECTION_IDS.propertyDetails);
  }, [activeTab.id, navigate, property?.propertyKey, propertyKey, revealWorkspaceSection]);

  const handleSectionControlSelect = useCallback(
    (tabId, nextSection) => {
      if (tabId === "execution") {
        setActiveExecutionSection(nextSection);
        revealWorkspaceSection(EXECUTION_SECTION_IDS[nextSection]);
        return;
      }

      if (tabId === "budget") {
        setActiveBudgetSection(nextSection);
        revealWorkspaceSection(BUDGET_SECTION_IDS[nextSection]);
        return;
      }

      if (tabId === "deal") {
        setActiveDealSection(nextSection);
        revealWorkspaceSection(DEAL_SECTION_IDS[nextSection]);
      }
    },
    [revealWorkspaceSection]
  );

  const buildDealSectionAction = useCallback(
    (readyLabel, sectionId) => {
      if (!hasPipelineWorkspace) {
        return {
          label: "Add deal",
          onClick: () => handleTabSelect("settings"),
        };
      }

      if (!propertyWorkspaceActive) {
        return {
          label: "Activate deal access",
          onClick: () => handleTabSelect("settings"),
        };
      }

      return {
        label: readyLabel,
        onClick: () => revealWorkspaceSection(sectionId),
      };
    },
    [handleTabSelect, hasPipelineWorkspace, propertyWorkspaceActive, revealWorkspaceSection]
  );

  const renderWorkspaceButtons = useCallback(
    (actions, tone = "secondary-action") =>
      actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          className={tone}
        >
          {action.label}
        </button>
      )),
    []
  );

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
          sellerAskingPrice:
            mappedPreview.sellerAskingPrice !== ""
              ? mappedPreview.sellerAskingPrice
              : previewSource.sellerAskingPrice,
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
          formData.listingStatus || formData.sellerAskingPrice
            ? formData.listingStatus || "For Sale"
            : undefined,
        sellerAskingPrice:
          formData.listingStatus || formData.sellerAskingPrice
            ? toOptionalNumber(formData.sellerAskingPrice)
            : undefined,
      });

      syncPropertyState(updatedProperty);
      toast.success("Property profile updated.");
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

  const handleLeadDealChange = (event) => {
    const { name, value } = event.target;
    setDealOverrides((previous) => ({ ...previous, [name]: value }));
  };

  const handleRunLeadAnalysis = async () => {
    if (!pipelineLeadId) {
      toast.error("Create a linked deal first.");
      return;
    }

    setIsAnalyzing(true);
    setLeadWorkspaceError("");
    setCompsNotice("");

    try {
      const result = await analyzeLeadComps(pipelineLeadId, {
        filters: buildCompsFilterPayload(filters),
        deal: buildDealPayload(dealForm),
      });
      if (result?.noResults) {
        setAnalysis(null);
        setCompsNotice(
          result.msg ||
            "No comparable properties matched these filters. Try widening the radius or relaxing the size filters."
        );
        setLeadWorkspace((previous) =>
          previous
            ? {
                ...previous,
                ...(result.subject || {}),
              }
            : previous
        );
        toast(result.msg || "No comparable properties matched these filters.");
        return;
      }

      const normalized = normalizeMasterReport(result, leadWorkspace);
      setAnalysis(normalized);
      setCompsNotice("");
      setLeadWorkspace((previous) =>
        previous
          ? {
              ...previous,
              ...normalized.subject,
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
    deal: reportDeal,
    valuationContext,
    selectedComps,
    reportData,
  }) => {
    if (!pipelineLeadId) {
      toast.error("Create a linked deal first.");
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
        contextType: acquisitionWorkspaceId ? "project" : "lead",
        ...(acquisitionWorkspaceId
          ? { investmentId: acquisitionWorkspaceId }
          : { leadId: pipelineLeadId }),
        subject,
        deal: reportDeal,
        filters: reportFilters,
        valuationContext,
        selectedComps,
        reportData,
      });
      const normalized = normalizeMasterReport(savedReport, subject);

      setSavedReports((previous) => [
        normalized,
        ...previous.filter(
          (report) =>
            report._id !== normalized._id && !String(report._id || "").startsWith("legacy-")
        ),
      ]);
      setAnalysis(normalized);
      setLeadWorkspace((previous) =>
        previous
          ? {
              ...previous,
              compsAnalysis: buildLeadCompsAnalysisSnapshotFromReport(normalized),
            }
          : previous
      );
      navigate(buildPropertyWorkspacePath(propertyKey, "deal"));
      toast.success(
        acquisitionWorkspaceId
          ? "Deal Report saved to the project."
          : "Deal Report saved."
      );
    } catch (saveError) {
      setLeadWorkspaceError(saveError.message || "Failed to save comps report.");
      toast.error(saveError.message || "Failed to save comps report.");
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleBuyCredits = async () => {
    setIsStartingCheckout(true);
    try {
      const kind = billingAccess?.hasActiveSubscription ? "pro_comps_topup_10" : "comps_pack_10";
      const { url } = await createOneTimeCheckout({
        kind,
        returnPath: window.location.pathname,
      });
      window.location.href = url;
    } catch (checkoutError) {
      setLeadWorkspaceError(checkoutError.message || "Could not start the credits checkout.");
      setIsStartingCheckout(false);
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
    if (!pipelineLeadId && !acquisitionWorkspaceId) {
      return;
    }

    try {
      const nextBids = acquisitionWorkspaceId
        ? await getBidsForProject(acquisitionWorkspaceId)
        : await getBidsForLead(pipelineLeadId);
      setBids(nextBids);
    } catch (bidsError) {
      toast.error(bidsError.message || "Failed to refresh bids.");
    }
  }, [acquisitionWorkspaceId, pipelineLeadId]);

  const handleUpdatePropertyWorkspaceStatus = useCallback(
    async (nextValue) => {
      if (!pipelineLeadId) {
        toast.error("This property is not linked to a deal.");
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

        toast.success(nextValue ? "Moved to Project Workspace." : "Removed from Project Workspace.");
      } catch (workspaceStatusError) {
        toast.error(workspaceStatusError.message || "Failed to update Project Workspace.");
      } finally {
        setIsUpdatingWorkspaceStatus(false);
      }
    },
    [handleLeadUpdated, loadLeadWorkspace, pipelineLeadId, propertyKey, syncPropertyState]
  );

  const handleCreatePipelineWorkspace = useCallback(async () => {
    try {
      setIsCreatingPipelineWorkspace(true);
      const result = await createPropertyWorkspace(propertyKey, "pipeline");
      if (result?.property) {
        syncPropertyState(result.property);
      }
      await loadLeadWorkspace();
      toast.success("Deal record created.");
    } catch (createError) {
      toast.error(createError.message || "Failed to create the deal record.");
    } finally {
      setIsCreatingPipelineWorkspace(false);
    }
  }, [loadLeadWorkspace, propertyKey, syncPropertyState]);

  const handleCreateAcquisitionWorkspace = useCallback(async () => {
    try {
      setIsCreatingAcquisitionWorkspace(true);
      const result = await createPropertyWorkspace(propertyKey, "acquisitions", {
        strategy: acquisitionStrategy,
      });
      if (result?.property) {
        syncPropertyState(result.property);
      }
      toast.success("Acquisitions workspace created.");
    } catch (createError) {
      toast.error(createError.message || "Failed to create the acquisitions workspace.");
    } finally {
      setIsCreatingAcquisitionWorkspace(false);
    }
  }, [acquisitionStrategy, propertyKey, syncPropertyState]);

  const handleCreateManagementWorkspace = useCallback(async () => {
    try {
      setIsCreatingManagementWorkspace(true);
      const result = await createPropertyWorkspace(propertyKey, "management", {
        strategy: managementStrategy,
      });
      if (result?.property) {
        syncPropertyState(result.property);
      }
      toast.success("Management workspace created.");
    } catch (createError) {
      toast.error(createError.message || "Failed to create the management workspace.");
    } finally {
      setIsCreatingManagementWorkspace(false);
    }
  }, [managementStrategy, propertyKey, syncPropertyState]);

  const renderLeadWorkspaceState = useCallback(
    ({
      missingLeadTitle,
      missingLeadDescription,
      inactiveTitle,
      inactiveDescription,
      loadingLabel,
      renderContent,
    }) => {
      if (!pipelineLeadId) {
        return (
          <SetupStateCard
            eyebrow="Deal setup"
            title={missingLeadTitle}
            description={missingLeadDescription}
            primaryAction={
              <button
                type="button"
                onClick={handleCreatePipelineWorkspace}
                disabled={isCreatingPipelineWorkspace}
                className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreatingPipelineWorkspace ? "Creating..." : "Create deal record"}
              </button>
            }
          />
        );
      }

      if (!propertyWorkspaceActive) {
        return (
          <SetupStateCard
            eyebrow="Activation"
            title={inactiveTitle}
            description={inactiveDescription}
            primaryAction={
              <button
                type="button"
                onClick={() => handleUpdatePropertyWorkspaceStatus(true)}
                disabled={isUpdatingWorkspaceStatus}
                className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isUpdatingWorkspaceStatus ? "Updating..." : "Move to Project Workspace"}
              </button>
            }
            secondaryAction={
              pipelineLeadPath ? (
                <Link to={pipelineLeadPath} className="secondary-action">
                  Open deal
                </Link>
              ) : null
            }
          />
        );
      }

      if (leadWorkspaceLoading && !leadWorkspace) {
        return <LoadingStateCard label={loadingLabel} />;
      }

      if (!leadWorkspace) {
        return (
          <SetupStateCard
            eyebrow="Linked deal"
            title="We could not load the linked deal"
            description={leadWorkspaceError || "Try again or open the source deal directly."}
            primaryAction={
              <button type="button" onClick={loadLeadWorkspace} className="primary-action">
                Try again
              </button>
            }
            secondaryAction={
              pipelineLeadPath ? (
                <Link to={pipelineLeadPath} className="secondary-action">
                  Open deal
                </Link>
              ) : null
            }
          />
        );
      }

      return renderContent();
    },
    [
      handleCreatePipelineWorkspace,
      handleUpdatePropertyWorkspaceStatus,
      isCreatingPipelineWorkspace,
      isUpdatingWorkspaceStatus,
      leadWorkspace,
      leadWorkspaceError,
      leadWorkspaceLoading,
      loadLeadWorkspace,
      pipelineLeadId,
      pipelineLeadPath,
      propertyWorkspaceActive,
    ]
  );

  const renderAcquisitionSetup = useCallback(
    ({ title, description, buttonLabel = "Create acquisitions workspace" }) => (
      <EmptyAcquisitionState
        compact
        property={property}
        selectedStrategy={acquisitionStrategy}
        onStrategyChange={(event) => setAcquisitionStrategy(event.target.value)}
        onCreate={handleCreateAcquisitionWorkspace}
        isCreating={isCreatingAcquisitionWorkspace}
        eyebrow="Setup"
        title={title}
        description={description}
        buttonLabel={buttonLabel}
      />
    ),
    [acquisitionStrategy, handleCreateAcquisitionWorkspace, isCreatingAcquisitionWorkspace, property]
  );

  const homeActionQueue = useMemo(() => {
    const actions = [];

    if (!hasPipelineWorkspace) {
      actions.push({
        id: "lead",
        title: "Add deal",
        detail: "Unlock comps, reports, renovation, and bids.",
        label: isCreatingPipelineWorkspace ? "Creating..." : "Create deal",
        disabled: isCreatingPipelineWorkspace,
        onClick: handleCreatePipelineWorkspace,
      });
    } else if (!propertyWorkspaceActive) {
      actions.push({
        id: "activate",
        title: "Activate deal access",
        detail: "Bring the linked deal into this project workspace.",
        label: isUpdatingWorkspaceStatus ? "Updating..." : "Activate",
        disabled: isUpdatingWorkspaceStatus,
        onClick: () => handleUpdatePropertyWorkspaceStatus(true),
      });
    }

    if (!hasAcquisitionWorkspace) {
      actions.push({
        id: "financials",
        title: "Add financials",
        detail: "Budget, expenses, documents, and schedule all start here.",
        label: isCreatingAcquisitionWorkspace ? "Creating..." : "Create financials",
        disabled: isCreatingAcquisitionWorkspace,
        onClick: handleCreateAcquisitionWorkspace,
      });
    }

    actions.push({
      id: "tasks",
      title: openPropertyTasks > 0 ? "Review execution" : "Add first task",
      detail:
        openPropertyTasks > 0
          ? overduePropertyTasks > 0
            ? `${overduePropertyTasks} overdue task${overduePropertyTasks === 1 ? "" : "s"} need attention.`
            : `${openPropertyTasks} open task${openPropertyTasks === 1 ? "" : "s"} in progress.`
          : "Keep the next step visible from day one.",
      label: "Open execution",
      onClick: () => handleTabSelect("execution"),
    });

    if (hasAcquisitionWorkspace) {
      actions.push({
        id: "budget",
        title: "Review budget",
        detail: "Open budget vs actuals, expenses, capital, and draw activity.",
        label: "Open budget",
        onClick: () => handleTabSelect("budget"),
      });
    }

    if (hasPipelineWorkspace) {
      actions.push({
        id: "deal-health",
        title: "Review deal context",
        detail: "Keep the original underwriting, scope, and reports in view while the project runs.",
        label: "Open deal",
        onClick: () => handleTabSelect("deal"),
      });
    }

    return actions.slice(0, 4);
  }, [
    handleCreateAcquisitionWorkspace,
    handleCreatePipelineWorkspace,
    handleTabSelect,
    handleUpdatePropertyWorkspaceStatus,
    hasAcquisitionWorkspace,
    hasPipelineWorkspace,
    isCreatingAcquisitionWorkspace,
    isCreatingPipelineWorkspace,
    isUpdatingWorkspaceStatus,
    openPropertyTasks,
    overduePropertyTasks,
    propertyWorkspaceActive,
  ]);

  if (loading) {
    return <LoadingStateCard label="Loading project workspace..." />;
  }

  if (error) {
    return <div className="section-card px-6 py-10 text-center text-clay-700">{error}</div>;
  }

  if (!property) {
    return <div className="section-card px-6 py-10 text-center text-ink-500">Property not found.</div>;
  }

  const renderHomeTab = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Next step"
          value={nextStepCard.value}
          helper={nextStepCard.helper}
        />
        <StatCard
          label="Deal health"
          value={dealHealthCard.value}
          helper={dealHealthCard.helper}
          tone="bg-white/88"
        />
        <StatCard
          label="Budget health"
          value={budgetHealthCard.value}
          helper={budgetHealthCard.helper}
          tone="bg-white/84"
        />
        <StatCard
          label="Open tasks"
          value={String(openPropertyTasks)}
          helper={
            overduePropertyTasks > 0
              ? `${overduePropertyTasks} overdue`
              : "Nothing overdue"
          }
          tone="bg-white/84"
        />
      </div>

      <section className="surface-panel px-6 py-6 sm:px-7" id={HOME_SECTION_IDS.priorities}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
          <div>
            <span className="eyebrow">Command center</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Run the project from the top down</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              Keep the next move, execution pressure, and deal context visible without bouncing across tabs.
            </p>

            <div className="mt-6 space-y-3">
              {homeActionQueue.map((action) => (
                <ActionQueueCard
                  key={action.id}
                  title={action.title}
                  detail={action.detail}
                  label={action.label}
                  onClick={action.onClick}
                  disabled={action.disabled}
                />
              ))}
            </div>
          </div>

          <div id={HOME_SECTION_IDS.quickLaunch}>
            <span className="eyebrow">Quick launch</span>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <WorkspaceLaunchCard
                eyebrow="Execution"
                title="Tasks, schedule, and vendors"
                detail={
                  openPropertyTasks > 0
                    ? `${openPropertyTasks} open task${openPropertyTasks === 1 ? "" : "s"} with ${overduePropertyTasks} overdue.`
                    : "Open the working side of the project and keep field execution visible."
                }
                label="Open Execution"
                onClick={() => handleTabSelect("execution")}
                tone="bg-sky-50/55"
              />
              <WorkspaceLaunchCard
                eyebrow="Budget"
                title={hasAcquisitionWorkspace ? "Budget and actual spend" : "Set up budget tools"}
                detail={
                  hasAcquisitionWorkspace
                    ? "Review basis, capital, expenses, draws, and reports in one budget lane."
                    : "Create financials to unlock budget vs actuals, expenses, and lender workflows."
                }
                label={hasAcquisitionWorkspace ? "Open Budget" : "Open Setup"}
                onClick={() => handleTabSelect(hasAcquisitionWorkspace ? "budget" : "settings")}
                tone="bg-white/90"
              />
              <WorkspaceLaunchCard
                eyebrow="Files"
                title="Documents and support files"
                detail={
                  hasAcquisitionWorkspace
                    ? "Receipts, draw support, contracts, and scope files stay organized here."
                    : "Files open as soon as the budget workspace is created."
                }
                label={hasAcquisitionWorkspace ? "Open Files" : "Set Up Files"}
                onClick={() => handleTabSelect(hasAcquisitionWorkspace ? "files" : "settings")}
                tone="bg-white/90"
              />
              <WorkspaceLaunchCard
                eyebrow="Deal"
                title={hasPipelineWorkspace ? "Underwriting and scope" : "Add deal context"}
                detail={
                  hasPipelineWorkspace
                    ? `${savedReports.length} saved report${savedReports.length === 1 ? "" : "s"} and ${bids.length} bid${bids.length === 1 ? "" : "s"} tied to the deal story.`
                    : "Link a deal so comps, scope, and reports stay attached to the project."
                }
                label={hasPipelineWorkspace ? "Open Deal" : "Open Setup"}
                onClick={() => handleTabSelect(hasPipelineWorkspace ? "deal" : "settings")}
                tone="bg-sand-50/75"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="surface-panel px-6 py-6 sm:px-7" id={HOME_SECTION_IDS.tasks}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Upcoming work</span>
              <h3 className="mt-3 text-xl font-semibold text-ink-900">What needs attention next</h3>
            </div>
            <button
              type="button"
              onClick={() => handleTabSelect("execution")}
              className="ghost-action"
            >
              Open execution
            </button>
          </div>

          {propertyTasksError ? (
            <p className="mt-4 text-sm text-clay-700">{propertyTasksError}</p>
          ) : propertyTasksLoading ? (
            <p className="mt-4 text-sm text-ink-500">Loading tasks...</p>
          ) : nextPropertyTasks.length > 0 ? (
            <div className="mt-5 space-y-3">
              {nextPropertyTasks.map((task) => (
                <div key={task._id} className="rounded-[18px] border border-ink-100 bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">{task.title || "Untitled task"}</p>
                      <p className="mt-1 text-sm text-ink-500">
                        {task.endDate ? `Due ${formatCompactDate(task.endDate)}` : "No due date"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isTaskOverdue(task)
                          ? "bg-clay-50 text-clay-700"
                          : "bg-sand-50 text-ink-700"
                      }`}
                    >
                      {task.status || "Open"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-500">No upcoming tasks yet.</p>
          )}
        </section>

        <section className="surface-panel px-6 py-6 sm:px-7" id={HOME_SECTION_IDS.activity}>
          <span className="eyebrow">Recent updates</span>
          <h3 className="mt-3 text-xl font-semibold text-ink-900">Project signal</h3>

          <div className="mt-5 rounded-[18px] bg-sand-50/80 px-4 py-4">
            <p className="text-sm font-semibold text-ink-900">Procurement</p>
            <p className="mt-1 text-sm leading-6 text-ink-500">{procurementSummary}</p>
            <button
              type="button"
              onClick={() => handleTabSelect("execution")}
              className="mt-4 ghost-action"
            >
              Open procurement
            </button>
          </div>

          {recentActivity.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="rounded-[18px] bg-ink-50/60 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                      <p className="mt-1 text-sm text-ink-500">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-ink-400">
                      {formatDateTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-500">No recent activity yet.</p>
          )}
        </section>
      </div>

      <section className="surface-panel px-6 py-6 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="eyebrow">Property details</span>
            <h3 className="mt-4 text-2xl font-semibold text-ink-900">Keep the physical asset easy to reference</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              Address, facts, and listing details stay available here, but editing is secondary so the project home stays focused on operations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleOpenPropertyDetails} className="secondary-action">
              Edit property details
            </button>
            <button type="button" onClick={() => handleTabSelect("settings")} className="ghost-action">
              Project setup
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Asset profile</p>
            <p className="mt-2 text-sm font-semibold text-ink-900">{detailLine}</p>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Listing</p>
            <p className="mt-2 text-sm font-semibold text-ink-900">{listingSummary?.label || "Not listed"}</p>
            <p className="mt-1 text-xs text-ink-500">{listingSummary?.price || "No asking price saved."}</p>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Property key</p>
            <p className="mt-2 break-all text-sm font-semibold text-ink-900">{property.propertyKey}</p>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Linked records</p>
            <p className="mt-2 text-sm font-semibold text-ink-900">{workspaceCount}</p>
            <p className="mt-1 text-xs text-ink-500">Deal, budget, and management records</p>
          </div>
        </div>
      </section>

      <PropertyWorkspaceSection
        title="Edit property details"
        helper="Update address, facts, and listing details when the physical asset changes."
        sectionId={HOME_SECTION_IDS.propertyDetails}
        revealToken={sectionRevealTokens[HOME_SECTION_IDS.propertyDetails] || 0}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="relative md:col-span-2">
              <ProfileField label="Address">
                <input
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
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
                      onClick={() => handleSelectSuggestion(suggestion)}
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
                onClick={() => handlePreviewLookup()}
                disabled={isPreviewLoading || !composeAddress(formData).trim()}
                className="secondary-action disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPreviewLoading ? "Loading details..." : "Auto-fill details"}
              </button>
              <p className="text-sm text-ink-500">Suggestions from {getLocationProviderName()}.</p>
              {previewMetadata ? (
                <span className="text-sm text-ink-500">
                  {previewMetadata.propertyFound ? "Facts found." : "No facts found."}{" "}
                  {previewMetadata.activeListingFound ? "Listing found." : "No listing found."}
                </span>
              ) : null}
            </div>

            <ProfileField label="City">
              <input name="city" value={formData.city} onChange={handleChange} className="auth-input" />
            </ProfileField>
            <ProfileField label="State">
              <input name="state" value={formData.state} onChange={handleChange} className="auth-input" />
            </ProfileField>
            <ProfileField label="Zip code">
              <input name="zipCode" value={formData.zipCode} onChange={handleChange} className="auth-input" />
            </ProfileField>
            <ProfileField label="Property type">
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
            </ProfileField>
            {showsUnitCount ? (
              <ProfileField label="Unit count">
                <input
                  name="unitCount"
                  type="number"
                  value={formData.unitCount}
                  onChange={handleChange}
                  className="auth-input"
                />
              </ProfileField>
            ) : (
              <div className="hidden md:block" />
            )}
            <ProfileField label="Bedrooms">
              <input
                name="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={handleChange}
                className="auth-input"
              />
            </ProfileField>
            <ProfileField label="Bathrooms">
              <input
                name="bathrooms"
                type="number"
                step="0.5"
                value={formData.bathrooms}
                onChange={handleChange}
                className="auth-input"
              />
            </ProfileField>
            <ProfileField label="Square footage">
              <input
                name="squareFootage"
                type="number"
                value={formData.squareFootage}
                onChange={handleChange}
                className="auth-input"
              />
            </ProfileField>
            <ProfileField label="Lot size">
              <input
                name="lotSize"
                type="number"
                value={formData.lotSize}
                onChange={handleChange}
                className="auth-input"
              />
            </ProfileField>
            <ProfileField label="Year built">
              <input
                name="yearBuilt"
                type="number"
                value={formData.yearBuilt}
                onChange={handleChange}
                className="auth-input"
              />
            </ProfileField>

            <div className="md:col-span-2 grid gap-5 rounded-[20px] border border-ink-100 bg-sand-50/60 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(220px,0.9fr)]">
              <ProfileField label="Listing status">
                <input
                  name="listingStatus"
                  value={formData.listingStatus}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="For Sale"
                />
              </ProfileField>
              <ProfileField label="Asking price">
                <input
                  name="sellerAskingPrice"
                  type="number"
                  value={formData.sellerAskingPrice}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="0"
                />
              </ProfileField>
              <div className="rounded-[18px] border border-ink-100 bg-white/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Snapshot
                </p>
                <p className="mt-2 text-sm font-semibold text-ink-900">
                  {formData.listingStatus || formData.sellerAskingPrice ? formData.listingStatus || "For Sale" : "Not listed"}
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
              Property key <span className="font-semibold text-ink-900">{property.propertyKey}</span>
            </p>
            <button
              type="submit"
              disabled={isSaving}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </PropertyWorkspaceSection>
    </div>
  );

  const renderBudgetTab = () => (
    <div className="space-y-4">
      <SectionSegmentedControl
        label="Budget views"
        items={[
          { id: "snapshot", label: "Snapshot" },
          { id: "actuals", label: "Budget vs Actual" },
          { id: "expenses", label: "Expenses" },
          { id: "capital", label: "Capital" },
          { id: "draws", label: "Draws" },
          { id: "reports", label: "Reports" },
        ]}
        activeItemId={activeBudgetSection}
        onSelect={(nextSection) => handleSectionControlSelect("budget", nextSection)}
      />

      {!hasAcquisitionWorkspace
        ? renderAcquisitionSetup({
            title: "Add financials to this project",
            description:
              "Budget, debt, expenses, draws, payments, and finance reports all start here.",
          })
        : null}

      {hasAcquisitionWorkspace ? (
        <>
          <PropertyWorkspaceSection
            title="Snapshot & profitability"
            helper="Basis, holding costs, and returns."
            defaultOpen
            sectionId={BUDGET_SECTION_IDS.snapshot}
            revealToken={sectionRevealTokens[BUDGET_SECTION_IDS.snapshot] || 0}
          >
            <PropertyFinancePanel
              property={property}
              propertyKey={propertyKey}
              activeContentKey="finance-health"
              onPropertyUpdated={syncPropertyState}
              embedded
            />
          </PropertyWorkspaceSection>

          <PropertyWorkspaceSection
            title="Budget vs actuals"
            helper="Budget, commitments, and real spend."
            sectionId={BUDGET_SECTION_IDS.actuals}
            revealToken={sectionRevealTokens[BUDGET_SECTION_IDS.actuals] || 0}
          >
            <PropertyFinancePanel
              property={property}
              propertyKey={propertyKey}
              activeContentKey="finance-budget-vs-actual"
              onPropertyUpdated={syncPropertyState}
              embedded
            />
          </PropertyWorkspaceSection>

          <PropertyWorkspaceSection
            title="Expenses"
            helper="Expense ledger, receipts, and carrying costs."
            sectionId={BUDGET_SECTION_IDS.expenses}
            revealToken={sectionRevealTokens[BUDGET_SECTION_IDS.expenses] || 0}
          >
            <PropertyCostsPanel
              property={property}
              propertyKey={propertyKey}
              activeContentKey="costs-expenses"
              onPropertyUpdated={syncPropertyState}
              embedded
            />
          </PropertyWorkspaceSection>

          <PropertyWorkspaceSection
            title="Capital & lenders"
            helper="Funding sources, lender terms, and draw structure."
            sectionId={BUDGET_SECTION_IDS.capital}
            revealToken={sectionRevealTokens[BUDGET_SECTION_IDS.capital] || 0}
          >
            <PropertyFinancePanel
              property={property}
              propertyKey={propertyKey}
              activeContentKey="finance-capital-stack"
              onPropertyUpdated={syncPropertyState}
              embedded
            />
          </PropertyWorkspaceSection>

          <PropertyWorkspaceSection
            title="Draws & payments"
            helper="Draw requests, servicing, and repayment timing."
            sectionId={BUDGET_SECTION_IDS.draws}
            revealToken={sectionRevealTokens[BUDGET_SECTION_IDS.draws] || 0}
          >
            <div className="space-y-5">
              <PropertyFinancePanel
                property={property}
                propertyKey={propertyKey}
                activeContentKey="finance-draw-operations"
                onPropertyUpdated={syncPropertyState}
                embedded
              />
              <PropertyFinancePanel
                property={property}
                propertyKey={propertyKey}
                activeContentKey="finance-payment-schedule"
                onPropertyUpdated={syncPropertyState}
                embedded
              />
            </div>
          </PropertyWorkspaceSection>

          <PropertyWorkspaceSection
            title="Reports"
            helper="Export the finance view for lenders, partners, and internal review."
            sectionId={BUDGET_SECTION_IDS.reports}
            revealToken={sectionRevealTokens[BUDGET_SECTION_IDS.reports] || 0}
          >
            <PropertyFinancePanel
              property={property}
              propertyKey={propertyKey}
              activeContentKey="finance-reports"
              onPropertyUpdated={syncPropertyState}
              embedded
            />
          </PropertyWorkspaceSection>
        </>
      ) : null}
    </div>
  );

  const renderExecutionTab = () => (
    <div className="space-y-4">
      <SectionSegmentedControl
        label="Execution views"
        items={[
          { id: "tasks", label: "Tasks" },
          { id: "schedule", label: "Schedule" },
          { id: "vendors", label: "Vendors" },
          { id: "procurement", label: "Procurement" },
        ]}
        activeItemId={activeExecutionSection}
        onSelect={(nextSection) => handleSectionControlSelect("execution", nextSection)}
      />

      <PropertyWorkspaceSection
        title="Tasks"
        helper="Property-level action items and daily execution work."
        defaultOpen
        sectionId={EXECUTION_SECTION_IDS.tasks}
        revealToken={sectionRevealTokens[EXECUTION_SECTION_IDS.tasks] || 0}
      >
        <TasksPanel
          title="Project tasks"
          description="Track follow-ups, next steps, and operating work for this project."
          query={{
            propertyKey: property.propertyKey,
          }}
          defaults={{
            sourceType: "property",
            sourceId: property.propertyKey,
            sourceLabel: property.title || "Property",
            propertyKey: property.propertyKey,
          }}
          emptyTitle="No tasks yet"
          emptyDescription="Add the first task and it will also show up in the main task center."
          embedded
          onTasksChanged={() => loadPropertyTasks(property.propertyKey)}
        />
      </PropertyWorkspaceSection>

      {!hasAcquisitionWorkspace
        ? renderAcquisitionSetup({
            title: "Add financials to unlock execution tools",
            description:
              "Schedule, vendor coordination, commitments, and project files run from the budget workspace.",
            buttonLabel: "Create financials",
          })
        : null}

      {hasAcquisitionWorkspace ? (
        <>
          <PropertyWorkspaceSection
            title="Schedule & timeline"
            helper="Calendar, gantt, milestones, and the project timeline."
            defaultOpen
            sectionId={EXECUTION_SECTION_IDS.schedule}
            revealToken={sectionRevealTokens[EXECUTION_SECTION_IDS.schedule] || 0}
          >
            <div className="space-y-5">
              <PropertyOperationsPanel
                property={property}
                propertyKey={propertyKey}
                activeContentKey="operations-schedule"
                onPropertyUpdated={syncPropertyState}
                embedded
              />
              <PropertyOperationsPanel
                property={property}
                propertyKey={propertyKey}
                activeContentKey="operations-timeline"
                onPropertyUpdated={syncPropertyState}
                embedded
              />
            </div>
          </PropertyWorkspaceSection>

          <PropertyWorkspaceSection
            title="Vendors"
            helper="Vendor roster, readiness, and assigned relationships."
            sectionId={EXECUTION_SECTION_IDS.vendors}
            revealToken={sectionRevealTokens[EXECUTION_SECTION_IDS.vendors] || 0}
          >
            <PropertyOperationsPanel
              property={property}
              propertyKey={propertyKey}
              activeContentKey="operations-vendors"
              onPropertyUpdated={syncPropertyState}
              embedded
            />
          </PropertyWorkspaceSection>
        </>
      ) : null}

      <PropertyWorkspaceSection
        title="Procurement"
        helper="Commitments, awarded work, and vendor bids tied back to scope."
        sectionId={EXECUTION_SECTION_IDS.procurement}
        revealToken={sectionRevealTokens[EXECUTION_SECTION_IDS.procurement] || 0}
      >
        <div className="space-y-5">
          {hasAcquisitionWorkspace ? (
            <PropertyCostsPanel
              property={property}
              propertyKey={propertyKey}
              activeContentKey="costs-commitments"
              onPropertyUpdated={syncPropertyState}
              embedded
            />
          ) : (
            <div className="rounded-[18px] border border-ink-100 bg-sand-50/70 px-5 py-4 text-sm leading-6 text-ink-600">
              Commitments and awarded work will appear here once the budget workspace is created.
            </div>
          )}

          {renderLeadWorkspaceState({
            missingLeadTitle: "Add a deal to manage bids",
            missingLeadDescription:
              "Bids start on the linked deal and carry into the project scope once financials are created.",
            inactiveTitle: "Activate deal access to manage bids here",
            inactiveDescription:
              "Turn on the linked deal inside this project to use bid tools here.",
            loadingLabel: "Loading bid management...",
            renderContent: () => (
              <BidsTab
                leadId={pipelineLeadId}
                investmentId={property?.workspaces?.acquisitions?.id || ""}
                bids={bids}
                renovationItems={renovationItems}
                onUpdate={handleBidsUpdated}
              />
            ),
          })}
        </div>
      </PropertyWorkspaceSection>
    </div>
  );

  const renderFilesTab = () => (
    <div className="space-y-4">
      <section className="surface-panel px-6 py-6 sm:px-7">
        <span className="eyebrow">Files</span>
        <h3 className="mt-4 text-2xl font-semibold text-ink-900">Keep project files where the work happens</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
          Receipts, draw support, contracts, photos, and scope files belong inside the active project workspace, not in scattered folders.
        </p>
      </section>

      {!hasAcquisitionWorkspace
        ? renderAcquisitionSetup({
            title: "Add financials to unlock files",
            description:
              "Uploads, draw support files, contracts, and document links open as soon as the budget workspace exists.",
            buttonLabel: "Create financials",
          })
        : (
          <PropertyDocumentsPanel
            property={property}
            propertyKey={propertyKey}
            onPropertyUpdated={syncPropertyState}
            embedded
          />
        )}
    </div>
  );

  const renderDealTab = () => {
    const reportAction = buildDealSectionAction("Run Deal Report", DEAL_SECTION_IDS.reports);
    const scopeAction = buildDealSectionAction("Edit scope", DEAL_SECTION_IDS.scope);
    const summaryActions = [
      {
        label: "Property details",
        onClick: handleOpenPropertyDetails,
      },
      {
        label: "Open budget",
        onClick: () => handleTabSelect("budget"),
      },
      scopeAction,
    ];
    const reportActions = [
      reportAction,
      {
        label: "Open budget",
        onClick: () => handleTabSelect("budget"),
      },
      scopeAction,
    ];

    return (
      <div className="space-y-4">
        <SectionSegmentedControl
          label="Deal views"
          items={[
            { id: "summary", label: "Summary" },
            { id: "reports", label: "Reports" },
            { id: "scope", label: "Scope" },
            { id: "assumptions", label: "Underwriting vs Actuals" },
          ]}
          activeItemId={activeDealSection}
          onSelect={(nextSection) => handleSectionControlSelect("deal", nextSection)}
        />

        <section className="surface-panel px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="eyebrow">Deal context</span>
              <h3 className="mt-4 text-2xl font-semibold text-ink-900">Keep underwriting attached to execution</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                The original thesis, report history, scope, and actual-vs-assumption comparison all stay here so the project never loses its deal story.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Saved reports</p>
                <p className="mt-2 text-sm font-semibold text-ink-900">{savedReports.length}</p>
              </div>
              <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Bid coverage</p>
                <p className="mt-2 text-sm font-semibold text-ink-900">{bids.length} bid{bids.length === 1 ? "" : "s"}</p>
              </div>
            </div>
          </div>
        </section>

        <PropertyWorkspaceSection
          title="Deal summary"
          helper="The working property story from assumptions through current numbers."
          defaultOpen
          sectionId={DEAL_SECTION_IDS.summary}
          revealToken={sectionRevealTokens[DEAL_SECTION_IDS.summary] || 0}
          action={<div className="flex flex-wrap gap-3">{renderWorkspaceButtons(summaryActions)}</div>}
        >
          <PropertySummaryPanel
            property={property}
            propertyKey={propertyKey}
            activeContentKey="acquisition-summary"
            leadWorkspace={leadWorkspace}
            savedReports={savedReports}
            pipelineLeadPath={pipelineLeadPath}
            embedded
            embeddedActions={renderWorkspaceButtons(summaryActions)}
            emptyActions={renderWorkspaceButtons([
              reportAction,
              {
                label: "Property details",
                onClick: handleOpenPropertyDetails,
              },
            ])}
          />
        </PropertyWorkspaceSection>

        <PropertyWorkspaceSection
          title="Deal Report"
          helper="Run comps and save reports that carry into execution."
          sectionId={DEAL_SECTION_IDS.reports}
          revealToken={sectionRevealTokens[DEAL_SECTION_IDS.reports] || 0}
          action={<div className="flex flex-wrap gap-3">{renderWorkspaceButtons(reportActions)}</div>}
        >
          {renderLeadWorkspaceState({
            missingLeadTitle: "Add a deal to run the Deal Report",
            missingLeadDescription:
              "Comps start on the linked deal, then saved reports can carry into the project once financials exist.",
            inactiveTitle: "Activate deal access to run reports here",
            inactiveDescription:
              "Turn on the linked deal inside this project to use the Deal tab here.",
            loadingLabel: "Loading Deal Report...",
            renderContent: () => (
              <MasterDealReportWorkspace
                subject={leadWorkspace}
                report={analysis}
                filters={filters}
                deal={dealForm}
                onFilterChange={handleLeadFilterChange}
                onDealChange={handleLeadDealChange}
                isAnalyzing={isAnalyzing}
                onRunAnalysis={handleRunLeadAnalysis}
                billingAccess={billingAccess}
                isBillingAccessLoading={isBillingAccessLoading}
                onStartSubscription={handleStartSubscription}
                isStartingSubscription={isStartingSubscription}
                onBuyReport={handleBuyCredits}
                isStartingCheckout={isStartingCheckout}
                onSaveReport={handleSaveLeadReport}
                isSavingReport={isSavingReport}
                saveButtonLabel={
                  acquisitionWorkspaceId ? "Save to project history" : "Save Deal Report"
                }
                runButtonLabel="Run Deal Report"
                showOneTimeCheckout
                reportNotice={compsNotice}
                renderSubjectPanel={() => (
                  <div className="section-card p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-ink-900">Deal snapshot</h3>
                        <p className="mt-1 text-sm text-ink-500">
                          Subject facts and pricing come from the linked deal.
                        </p>
                      </div>
                      {pipelineLeadPath ? (
                        <Link to={pipelineLeadPath} className="ghost-action">
                          Open deal
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
          })}
        </PropertyWorkspaceSection>

        <PropertyWorkspaceSection
          title="Saved deal reports"
          helper="Deal and project report history in one underwriting thread."
          sectionId={DEAL_SECTION_IDS.reportHistory}
          revealToken={sectionRevealTokens[DEAL_SECTION_IDS.reportHistory] || 0}
          action={<div className="flex flex-wrap gap-3">{renderWorkspaceButtons(reportActions)}</div>}
        >
          {renderLeadWorkspaceState({
            missingLeadTitle: "Add a deal to store reports",
            missingLeadDescription:
              "Saved reports begin on the linked deal and continue on the project once financials exist.",
            inactiveTitle: "Activate deal access to use saved reports",
            inactiveDescription:
              "Turn on the linked deal inside this project to keep report history here.",
            loadingLabel: "Loading saved reports...",
            renderContent: () => (
              <SavedCompsReportsTab
                reports={savedReports}
                isLoading={savedReportsLoading}
                title={
                  acquisitionWorkspaceId
                    ? "Saved project and deal reports"
                    : "Saved deal reports"
                }
                description={
                  acquisitionWorkspaceId
                    ? "Deal-era analysis and project-era report updates live together here so execution never loses the underwriting thread."
                    : "Every saved Deal Report for this property lives here."
                }
                emptyTitle="No reports saved yet"
                emptyMessage={
                  acquisitionWorkspaceId
                    ? "Run the Deal Report and save it. New reports will attach to the project while older deal analysis stays visible here."
                    : "Run the Deal Report, save it, and it will appear here."
                }
                actions={renderWorkspaceButtons(reportActions)}
              />
            ),
          })}
        </PropertyWorkspaceSection>

        <PropertyWorkspaceSection
          title="Scope & renovation"
          helper="Renovation assumptions and scope."
          sectionId={DEAL_SECTION_IDS.scope}
          revealToken={sectionRevealTokens[DEAL_SECTION_IDS.scope] || 0}
          action={
            <div className="flex flex-wrap gap-3">
              {renderWorkspaceButtons([
                {
                  label: "Property details",
                  onClick: handleOpenPropertyDetails,
                },
                {
                  label: "Open budget",
                  onClick: () => handleTabSelect("budget"),
                },
              ])}
            </div>
          }
        >
          {renderLeadWorkspaceState({
            missingLeadTitle: "Add a deal to manage scope",
            missingLeadDescription:
              "Renovation scope starts on the linked deal.",
            inactiveTitle: "Activate deal access to edit scope here",
            inactiveDescription:
              "Turn on the linked deal inside this project to edit scope here.",
            loadingLabel: "Loading renovation plan...",
            renderContent: () => (
              <LeadRenovationTab
                lead={leadWorkspace}
                leadId={pipelineLeadId}
                onLeadUpdated={handleLeadUpdated}
              />
            ),
          })}
        </PropertyWorkspaceSection>

        <PropertyWorkspaceSection
          title="Underwriting vs actuals"
          helper="Compare the original deal thesis against what the project is now telling you."
          sectionId={DEAL_SECTION_IDS.assumptions}
          revealToken={sectionRevealTokens[DEAL_SECTION_IDS.assumptions] || 0}
          action={<div className="flex flex-wrap gap-3">{renderWorkspaceButtons(summaryActions)}</div>}
        >
          <PropertySummaryPanel
            property={property}
            propertyKey={propertyKey}
            activeContentKey="original-assumptions"
            leadWorkspace={leadWorkspace}
            savedReports={savedReports}
            pipelineLeadPath={pipelineLeadPath}
            embedded
            embeddedActions={renderWorkspaceButtons(summaryActions)}
            emptyActions={renderWorkspaceButtons([
              reportAction,
              {
                label: "Property details",
                onClick: handleOpenPropertyDetails,
              },
            ])}
          />
        </PropertyWorkspaceSection>
      </div>
    );
  };

  const renderSettingsTab = () => (
    <PropertyWorkspaceSettingsPanel
      property={property}
      propertyWorkspaceActive={propertyWorkspaceActive}
      pipelineLeadPath={pipelineLeadPath}
      pipelineLeadStatus={pipelineLeadStatus}
      onActivateWorkspace={() => handleUpdatePropertyWorkspaceStatus(true)}
      onDeactivateWorkspace={() => handleUpdatePropertyWorkspaceStatus(false)}
      isUpdatingWorkspaceStatus={isUpdatingWorkspaceStatus}
      onCreatePipelineWorkspace={handleCreatePipelineWorkspace}
      onCreateAcquisitionWorkspace={handleCreateAcquisitionWorkspace}
      onCreateManagementWorkspace={handleCreateManagementWorkspace}
      isCreatingPipelineWorkspace={isCreatingPipelineWorkspace}
      isCreatingAcquisitionWorkspace={isCreatingAcquisitionWorkspace}
      isCreatingManagementWorkspace={isCreatingManagementWorkspace}
      acquisitionStrategy={acquisitionStrategy}
      managementStrategy={managementStrategy}
      onAcquisitionStrategyChange={(event) => setAcquisitionStrategy(event.target.value)}
      onManagementStrategyChange={(event) => setManagementStrategy(event.target.value)}
    />
  );

  const renderActiveTab = () => {
    if (activeTab.id === "home") return renderHomeTab();
    if (activeTab.id === "budget") return renderBudgetTab();
    if (activeTab.id === "execution") return renderExecutionTab();
    if (activeTab.id === "files") return renderFilesTab();
    if (activeTab.id === "deal") return renderDealTab();
    return renderSettingsTab();
  };

  return (
    <div className="space-y-4">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-6 sm:px-7">
        <div className="absolute inset-y-0 right-0 w-[44%] bg-[radial-gradient(circle_at_top_right,rgba(73,169,184,0.18),transparent_58%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.85)_100%)]" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <span className="eyebrow">Project workspace</span>
            <h1 className="mt-4 font-display text-[2.65rem] leading-[0.94] text-ink-900">
              {property.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500 sm:text-base">{detailLine}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <HeaderBadge
                label={propertyWorkspaceActive ? "Deal access active" : hasPipelineWorkspace ? "Deal linked" : "Standalone property"}
              />
              {listingSummary ? (
                <HeaderBadge
                  label={`${listingSummary.label}${listingSummary.price ? ` • ${listingSummary.price}` : ""}`}
                  tone="bg-verdigris-50 text-verdigris-700"
                />
              ) : (
                <HeaderBadge label="Not listed" tone="bg-sand-50 text-ink-700" />
              )}
              <HeaderBadge
                label={hasAcquisitionWorkspace ? "Budget ready" : "Needs budget"}
                tone={hasAcquisitionWorkspace ? "bg-sky-50 text-sky-700" : "bg-clay-50 text-clay-700"}
              />
              <HeaderBadge
                label={hasManagementWorkspace ? "Management linked" : "Management optional"}
                tone={hasManagementWorkspace ? "bg-verdigris-50 text-verdigris-700" : "bg-white/80 text-ink-700 ring-1 ring-white/60"}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/properties" className="secondary-action">
                Back to projects
              </Link>
              <button type="button" onClick={handleOpenPropertyDetails} className="secondary-action">
                Property details
              </button>
              <button type="button" onClick={() => handleTabSelect("settings")} className="secondary-action">
                Project setup
              </button>
              {pipelineLeadPath ? (
                <Link to={pipelineLeadPath} className="secondary-action">
                  Open deal
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <StatCard
              label="Next step"
              value={nextStepCard.value}
              helper={nextStepCard.helper}
              tone="bg-white/88"
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
              <StatCard
                label="Linked records"
                value={String(workspaceCount)}
                helper="Deal, budget, management"
                tone="bg-white/82"
              />
              <StatCard
                label="Open tasks"
                value={String(openPropertyTasks)}
                helper={overduePropertyTasks > 0 ? `${overduePropertyTasks} overdue` : "Nothing overdue"}
                tone="bg-white/82"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-card sticky top-24 z-10 overflow-hidden bg-white/92 px-2 py-2 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PROPERTY_WORKSPACE_TABS.filter((tab) => tab.id !== "settings").map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTab.id}
              onSelect={handleTabSelect}
            />
          ))}
        </div>
      </section>

      {activeTab.id === "deal" && leadWorkspaceError && leadWorkspace ? (
        <div className="rounded-[16px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {leadWorkspaceError}
        </div>
      ) : null}

      {renderActiveTab()}

      {property ? (
        <PropertyCopilotPanel
          propertyKey={property.propertyKey}
          propertyTitle={property.title}
          activeTab={activeTab}
          followUpSuggestions={copilotFollowUpSuggestions}
          onTasksChanged={() => loadPropertyTasks(property.propertyKey)}
        />
      ) : null}

      {subscriptionConsentDialog}
    </div>
  );
};

export default PropertyWorkspacePage;
