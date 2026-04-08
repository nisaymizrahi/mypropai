import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  analyzeLeadComps,
  createBudgetItem,
  createOneTimeCheckout,
  createProjectUpdate,
  createPropertyWorkspace,
  deleteProjectUpdate,
  getBidsForLead,
  getBidsForProject,
  getBudgetItems,
  getBillingAccess,
  getExpenses,
  getInvestment,
  getLeadDetails,
  getProjectDocuments,
  getPropertyReports,
  getProjectReceipts,
  getProjectUpdates,
  getPropertyWorkspace,
  getTaskList,
  getVendors,
  previewLeadProperty,
  saveCompsReport,
  updateLead,
  updateProjectUpdate,
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
  buildPropertyWorkspaceViewPath,
  getPropertyWorkspaceViews,
  PROPERTY_WORKSPACE_TABS,
  resolvePropertyWorkspaceRoute,
} from "../utils/propertyWorkspaceNavigation";
import { isTaskComplete, isTaskOverdue, sortTasks } from "../utils/tasks";
import AddBudgetItemModal from "../components/AddBudgetItemModal";
import AddExpenseModal from "../components/AddExpenseModal";
import AddVendorModal from "../components/AddVendorModal";
import { buildRenovationForm } from "../components/LeadRenovationTab";
import ProjectUpdateComposerModal from "../components/ProjectUpdateComposerModal";
import PropertyDetailsDrawer from "../components/PropertyDetailsDrawer";
import PropertyCopilotPanel from "../components/PropertyCopilotPanel";
import PropertyFinancePanel, { EmptyAcquisitionState } from "../components/PropertyFinancePanel";
import PropertyWorkspaceSettingsPanel from "../components/PropertyWorkspaceSettingsPanel";
import TaskFormModal from "../components/TaskFormModal";
import WorkspaceQuickAddMenu from "../components/WorkspaceQuickAddMenu";
import {
  LoadingStateCard,
  SetupStateCard,
} from "../components/propertyWorkspace/WorkspacePagePrimitives";
import useSubscriptionCheckoutConsent from "../hooks/useSubscriptionCheckoutConsent";
import { getDrawRequests, getFundingSources } from "../utils/capitalStack";
import { getVendorProcurementSummary } from "../utils/vendorProcurement";

const PropertyWorkspaceHomePage = lazy(() =>
  import("../components/propertyWorkspace/PropertyWorkspaceHomePage")
);
const PropertyWorkspaceBudgetPage = lazy(() =>
  import("../components/propertyWorkspace/PropertyWorkspaceBudgetPage")
);
const PropertyWorkspaceExecutionPage = lazy(() =>
  import("../components/propertyWorkspace/PropertyWorkspaceExecutionPage")
);
const PropertyWorkspaceFilesPage = lazy(() =>
  import("../components/propertyWorkspace/PropertyWorkspaceFilesPage")
);
const PropertyWorkspaceDealPage = lazy(() =>
  import("../components/propertyWorkspace/PropertyWorkspaceDealPage")
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

const HOME_VIEW_IDS = {
  today: "today",
  "at-risk": "at-risk",
  updates: "updates",
  "property-details": "property-details",
};

const EXECUTION_VIEW_IDS = {
  scope: "scope",
  tasks: "tasks",
  schedule: "schedule",
  vendors: "vendors",
  procurement: "procurement",
};

const BUDGET_VIEW_IDS = {
  snapshot: "snapshot",
  "cost-plan": "cost-plan",
  payments: "payments",
  capital: "capital",
  draws: "draws",
  reports: "reports",
};

const FILES_VIEW_IDS = {
  "all-files": "all-files",
  "loan-draw": "loan-draw",
  "contracts-bids": "contracts-bids",
  "receipts-invoices": "receipts-invoices",
  photos: "photos",
};

const DEAL_VIEW_IDS = {
  summary: "summary",
  reports: "reports",
  "renovation-scope": "renovation-scope",
  "underwriting-vs-actuals": "underwriting-vs-actuals",
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

const PropertyWorkspacePage = () => {
  const {
    propertyKey,
    tab: tabParam,
    view: viewParam,
    category: categoryParam,
    section: sectionParam,
  } = useParams();
  const location = useLocation();
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
  const [investmentData, setInvestmentData] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [projectDocuments, setProjectDocuments] = useState([]);
  const [workspacePayments, setWorkspacePayments] = useState([]);
  const [workspaceReceipts, setWorkspaceReceipts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [workspaceSupportLoading, setWorkspaceSupportLoading] = useState(false);
  const [projectUpdates, setProjectUpdates] = useState([]);
  const [projectUpdatesLoading, setProjectUpdatesLoading] = useState(false);
  const [projectUpdatesError, setProjectUpdatesError] = useState("");
  const [isUpdateComposerOpen, setIsUpdateComposerOpen] = useState(false);
  const [editingProjectUpdate, setEditingProjectUpdate] = useState(null);
  const [isSavingProjectUpdate, setIsSavingProjectUpdate] = useState(false);
  const [isPropertyDetailsOpen, setIsPropertyDetailsOpen] = useState(false);
  const [isTaskQuickAddOpen, setIsTaskQuickAddOpen] = useState(false);
  const [isExpenseQuickAddOpen, setIsExpenseQuickAddOpen] = useState(false);
  const [expenseQuickAddMode, setExpenseQuickAddMode] = useState("manual");
  const [isBudgetItemQuickAddOpen, setIsBudgetItemQuickAddOpen] = useState(false);
  const [isVendorQuickAddOpen, setIsVendorQuickAddOpen] = useState(false);
  const [documentUploadRequestKey, setDocumentUploadRequestKey] = useState(0);
  const [workspaceSurfaceVersion, setWorkspaceSurfaceVersion] = useState(0);
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

  const bumpWorkspaceSurfaceVersion = useCallback(() => {
    setWorkspaceSurfaceVersion((current) => current + 1);
  }, []);

  const activeWorkspaceRoute = useMemo(
    () =>
      resolvePropertyWorkspaceRoute({
        tabId: tabParam,
        viewId: viewParam,
        categoryId: categoryParam,
        sectionId: sectionParam,
        hashSectionId: location.hash.replace(/^#/, ""),
      }),
    [categoryParam, location.hash, sectionParam, tabParam, viewParam]
  );
  const activeTab = activeWorkspaceRoute.tab;
  const activeView = activeWorkspaceRoute.view;
  const activePrimaryTabId = activeTab.id === "settings" ? "" : activeTab.id;

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

    navigate(
      buildPropertyWorkspacePath(
        propertyKey,
        activeTab.id,
        activeTab.id === "settings" ? "" : activeView?.id
      ),
      { replace: true }
    );
  }, [activeTab.id, activeView?.id, activeWorkspaceRoute.isCanonical, navigate, propertyKey]);

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
        navigate(
          buildPropertyWorkspacePath(
            nextProperty.propertyKey,
            activeTab.id,
            activeTab.id === "settings" ? "" : activeView?.id
          ),
          {
            replace: true,
          }
        );
      }
    },
    [activeTab.id, activeView?.id, navigate, propertyKey]
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

  const loadWorkspaceSupportData = useCallback(async () => {
    if (!acquisitionWorkspaceId) {
      setInvestmentData(null);
      setBudgetItems([]);
      setProjectDocuments([]);
      setWorkspacePayments([]);
      setWorkspaceReceipts([]);
      setVendors([]);
      setWorkspaceSupportLoading(false);
      return;
    }

    try {
      setWorkspaceSupportLoading(true);
      const [investmentRecord, budgetItemRecords, documentRecords, paymentRecords, receiptRecords, vendorRecords] =
        await Promise.all([
        getInvestment(acquisitionWorkspaceId),
        getBudgetItems(acquisitionWorkspaceId),
        getProjectDocuments(acquisitionWorkspaceId),
        getExpenses(acquisitionWorkspaceId),
        getProjectReceipts(acquisitionWorkspaceId),
        getVendors(),
        ]);

      setInvestmentData(investmentRecord || null);
      setBudgetItems(Array.isArray(budgetItemRecords) ? budgetItemRecords : []);
      setProjectDocuments(Array.isArray(documentRecords) ? documentRecords : []);
      setWorkspacePayments(Array.isArray(paymentRecords) ? paymentRecords : []);
      setWorkspaceReceipts(Array.isArray(receiptRecords) ? receiptRecords : []);
      setVendors(Array.isArray(vendorRecords) ? vendorRecords : []);
    } catch (supportError) {
      console.error("Failed to load project workspace support data", supportError);
      setInvestmentData(null);
      setBudgetItems([]);
      setProjectDocuments([]);
      setWorkspacePayments([]);
      setWorkspaceReceipts([]);
      setVendors([]);
    } finally {
      setWorkspaceSupportLoading(false);
    }
  }, [acquisitionWorkspaceId]);

  useEffect(() => {
    loadWorkspaceSupportData();
  }, [loadWorkspaceSupportData]);

  const loadProjectWorkspaceUpdates = useCallback(async () => {
    if (!propertyKey) {
      setProjectUpdates([]);
      setProjectUpdatesError("");
      setProjectUpdatesLoading(false);
      return;
    }

    try {
      setProjectUpdatesLoading(true);
      setProjectUpdatesError("");
      const updateRecords = await getProjectUpdates(propertyKey);
      setProjectUpdates(Array.isArray(updateRecords) ? updateRecords : []);
    } catch (updatesError) {
      setProjectUpdates([]);
      setProjectUpdatesError(updatesError.message || "Failed to load project updates.");
    } finally {
      setProjectUpdatesLoading(false);
    }
  }, [propertyKey]);

  useEffect(() => {
    loadProjectWorkspaceUpdates();
  }, [loadProjectWorkspaceUpdates]);

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

  const fundingSources = useMemo(() => getFundingSources(investmentData || {}), [investmentData]);
  const drawRequests = useMemo(() => getDrawRequests(investmentData || {}), [investmentData]);
  const drawSupportGapCount = useMemo(
    () =>
      drawRequests.filter(
        (request) =>
          !projectDocuments.some(
            (document) => String(document?.drawRequestId || "") === String(request?.drawId || "")
          )
      ).length,
    [drawRequests, projectDocuments]
  );
  const fundingSupportGapCount = useMemo(
    () =>
      fundingSources.filter(
        (source) =>
          !projectDocuments.some(
            (document) =>
              String(document?.fundingSourceId || "") === String(source?.sourceId || "")
          )
      ).length,
    [fundingSources, projectDocuments]
  );
  const receiptFileCount = useMemo(
    () =>
      projectDocuments.filter((document) => document?.category === "Receipts & Invoices").length,
    [projectDocuments]
  );
  const contractFileCount = useMemo(
    () =>
      projectDocuments.filter((document) =>
        ["Contracts & Bids", "Vendor Compliance"].includes(document?.category)
      ).length,
    [projectDocuments]
  );
  const photoFileCount = useMemo(
    () => projectDocuments.filter((document) => document?.category === "Photos").length,
    [projectDocuments]
  );
  const paymentSupportGapCount = useMemo(
    () =>
      workspacePayments.filter(
        (payment) =>
          Number(payment?.amount || 0) > 0 && !payment?.receiptUrl && !payment?.receiptRecord
      ).length,
    [workspacePayments]
  );
  const paymentApprovalCount = useMemo(
    () =>
      workspacePayments.filter((payment) =>
        ["draft", "approved"].includes(payment?.status || "paid")
      ).length,
    [workspacePayments]
  );
  const receiptBacklogCount = useMemo(
    () => workspaceReceipts.filter((receipt) => !receipt.expense).length,
    [workspaceReceipts]
  );
  const overBudgetScopeCount = useMemo(() => {
    if (!budgetItems.length || !workspacePayments.length) {
      return 0;
    }

    return budgetItems.filter((item) => {
      const actualSpent = workspacePayments.reduce((sum, payment) => {
        const paymentBudgetItemId =
          typeof payment?.budgetItem === "object"
            ? payment?.budgetItem?._id || ""
            : payment?.budgetItem || "";

        return paymentBudgetItemId === item._id
          ? sum + Number(payment?.amount || 0)
          : sum;
      }, 0);

      return (
        Number(item?.budgetedAmount || 0) > 0 &&
        actualSpent > Number(item?.budgetedAmount || 0)
      );
    }).length;
  }, [budgetItems, workspacePayments]);
  const uncoveredScopeCount = useMemo(
    () =>
      budgetItems.filter(
        (item) => !Array.isArray(item?.awards) || item.awards.length === 0
      ).length,
    [budgetItems]
  );
  const awardedScopeCount = useMemo(
    () =>
      budgetItems.filter(
        (item) => Array.isArray(item?.awards) && item.awards.length > 0
      ).length,
    [budgetItems]
  );
  const openBidCount = useMemo(
    () =>
      bids.filter((bid) => String(bid?.decisionStatus || "open") !== "awarded").length,
    [bids]
  );
  const awardedBidCount = useMemo(
    () =>
      bids.filter((bid) => String(bid?.decisionStatus || "open") === "awarded").length,
    [bids]
  );
  const unlinkedBidCount = useMemo(
    () =>
      bids.filter(
        (bid) =>
          !bid?.vendor?.name &&
          String(bid?.vendorSnapshot?.name || bid?.contractorName || "").trim()
      ).length,
    [bids]
  );
  const projectVendorRecords = useMemo(() => {
    const projectVendorIds = new Set();

    budgetItems.forEach((item) => {
      (Array.isArray(item?.awards) ? item.awards : []).forEach((award) => {
        const vendorId =
          typeof award?.vendor === "object"
            ? award?.vendor?._id || ""
            : award?.vendor || "";
        if (vendorId) {
          projectVendorIds.add(vendorId);
        }
      });
    });

    workspacePayments.forEach((payment) => {
      const vendorId =
        typeof payment?.vendor === "object"
          ? payment?.vendor?._id || ""
          : payment?.vendor || "";
      if (vendorId) {
        projectVendorIds.add(vendorId);
      }
    });

    return vendors.filter((vendor) => projectVendorIds.has(vendor?._id));
  }, [budgetItems, vendors, workspacePayments]);
  const projectVendorProcurementSummaries = useMemo(
    () =>
      projectVendorRecords.map((vendor) => ({
        vendor,
        procurement: getVendorProcurementSummary(vendor),
      })),
    [projectVendorRecords]
  );
  const projectVendorPacketGapCount = useMemo(
    () =>
      projectVendorProcurementSummaries.filter(
        ({ procurement }) => procurement.blockingIssuesCount > 0
      ).length,
    [projectVendorProcurementSummaries]
  );
  const projectVendorRenewalCount = useMemo(
    () =>
      projectVendorProcurementSummaries.filter(
        ({ procurement }) => procurement.renewalsDueCount > 0
      ).length,
    [projectVendorProcurementSummaries]
  );
  const readyToPayVendorCount = useMemo(
    () =>
      projectVendorProcurementSummaries.filter(
        ({ procurement }) => procurement.paymentReady
      ).length,
    [projectVendorProcurementSummaries]
  );
  const fundingLinkedPaymentCount = useMemo(
    () => workspacePayments.filter((payment) => payment?.fundingSourceId).length,
    [workspacePayments]
  );
  const drawLinkedPaymentCount = useMemo(
    () => workspacePayments.filter((payment) => payment?.drawRequestId).length,
    [workspacePayments]
  );

  const sortedProjectUpdates = useMemo(
    () =>
      [...projectUpdates].sort(
        (left, right) =>
          new Date(right?.updatedAt || right?.createdAt || 0).valueOf() -
          new Date(left?.updatedAt || left?.createdAt || 0).valueOf()
      ),
    [projectUpdates]
  );

  const recentActivity = useMemo(() => {
    const items = [];
    const latestOpenPayment = [...workspacePayments]
      .filter((payment) => ["draft", "approved"].includes(payment?.status || "paid"))
      .sort(
        (left, right) =>
          new Date(right?.updatedAt || right?.createdAt || 0).valueOf() -
          new Date(left?.updatedAt || left?.createdAt || 0).valueOf()
      )[0];

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

    if (latestOpenPayment?.updatedAt || latestOpenPayment?.createdAt) {
      items.push({
        id: `payment-${latestOpenPayment._id}`,
        title: "Payments waiting",
        detail: `${paymentApprovalCount} payment${paymentApprovalCount === 1 ? "" : "s"} still need approval or final payment`,
        timestamp: latestOpenPayment.updatedAt || latestOpenPayment.createdAt,
      });
    }

    if (sortedProjectUpdates[0]?.updatedAt || sortedProjectUpdates[0]?.createdAt) {
      items.push({
        id: `update-${sortedProjectUpdates[0]._id}`,
        title: "Project update logged",
        detail:
          sortedProjectUpdates[0].title ||
          "A fresh internal update was added to the project feed.",
        timestamp: sortedProjectUpdates[0].updatedAt || sortedProjectUpdates[0].createdAt,
      });
    }

    if (projectDocuments[0]?.updatedAt || projectDocuments[0]?.createdAt) {
      items.push({
        id: `document-${projectDocuments[0]._id}`,
        title: "Project file uploaded",
        detail:
          projectDocuments[0].displayName || "A new file landed in the project library.",
        timestamp: projectDocuments[0].updatedAt || projectDocuments[0].createdAt,
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
  }, [
    openPropertyTasks,
    paymentApprovalCount,
    property?.createdAt,
    property?.updatedAt,
    projectDocuments,
    savedReports,
    sortedProjectUpdates,
    sortedPropertyTasks,
    workspacePayments,
  ]);

  const nextStepCard = useMemo(() => {
    if (!hasPipelineWorkspace) {
      return {
        value: "Add deal",
        helper: "Unlock comps, reports, scope, and bids.",
        tone: "bg-sand-50/85",
      };
    }

    if (!propertyWorkspaceActive) {
      return {
        value: "Activate deal access",
        helper: "Use the linked deal inside this project workspace.",
        tone: "bg-sand-50/85",
      };
    }

    if (!hasAcquisitionWorkspace) {
      return {
        value: "Set up budget",
        helper: "Unlock payments, capital, schedule, and project files.",
        tone: "bg-sand-50/85",
      };
    }

    if (overduePropertyTasks > 0) {
      return {
        value: "Review execution",
        helper: `${overduePropertyTasks} overdue task${overduePropertyTasks === 1 ? "" : "s"} need attention now.`,
        tone: "bg-clay-50/85",
      };
    }

    if (paymentApprovalCount > 0 || receiptBacklogCount > 0 || overBudgetScopeCount > 0) {
      return {
        value: "Review budget",
        helper:
          paymentApprovalCount > 0
            ? `${paymentApprovalCount} payment${paymentApprovalCount === 1 ? "" : "s"} still need approval or final payment.`
            : receiptBacklogCount > 0
              ? `${receiptBacklogCount} receipt${receiptBacklogCount === 1 ? "" : "s"} still need to be tied to a payment.`
              : `${overBudgetScopeCount} scope item${overBudgetScopeCount === 1 ? "" : "s"} are already over budget.`,
        tone: "bg-sand-50/85",
      };
    }

    if (uncoveredScopeCount > 0 || projectVendorPacketGapCount > 0 || openBidCount > 0) {
      return {
        value: "Review procurement",
        helper:
          uncoveredScopeCount > 0
            ? `${uncoveredScopeCount} scope item${uncoveredScopeCount === 1 ? "" : "s"} still need awarded vendor coverage.`
            : projectVendorPacketGapCount > 0
              ? `${projectVendorPacketGapCount} vendor packet${projectVendorPacketGapCount === 1 ? "" : "s"} still block clean assignment or payout.`
              : `${openBidCount} quote${openBidCount === 1 ? "" : "s"} still need review before award.`,
        tone: "bg-sand-50/85",
      };
    }

    if (sortedProjectUpdates.length === 0) {
      return {
        value: "Log first update",
        helper: "Keep site notes, lender movement, and vendor follow-ups visible from day one.",
        tone: "bg-mist-50/85",
      };
    }

    return {
      value: "On track",
      helper: `${workspaceCount} linked record${workspaceCount === 1 ? "" : "s"} are active and current.`,
      tone: "bg-verdigris-50/85",
    };
  }, [
    hasAcquisitionWorkspace,
    hasPipelineWorkspace,
    openBidCount,
    overduePropertyTasks,
    overBudgetScopeCount,
    paymentApprovalCount,
    projectVendorPacketGapCount,
    propertyWorkspaceActive,
    receiptBacklogCount,
    sortedProjectUpdates.length,
    uncoveredScopeCount,
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
        tone: "bg-sand-50/85",
      };
    }

    if (!propertyWorkspaceActive) {
      return {
        value: "Inactive",
        helper: "Activate deal access when you want reports and scope inside the project workspace.",
        tone: "bg-sand-50/85",
      };
    }

    if (Number.isFinite(askingPrice) && Number.isFinite(recommendedHigh) && askingPrice > recommendedHigh) {
      return {
        value: "Watch pricing gap",
        helper: `${formatCurrency(askingPrice - recommendedHigh)} above the latest range.`,
        tone: "bg-clay-50/85",
      };
    }

    if (Number.isFinite(recommendedLow) || Number.isFinite(recommendedHigh)) {
      return {
        value: "Underwritten",
        helper: `${formatCurrency(recommendedLow)} to ${formatCurrency(recommendedHigh)} saved in Deal.`,
        tone: "bg-verdigris-50/85",
      };
    }

    if (latestReport) {
      return {
        value: "Report ready",
        helper: "The latest deal report is saved and ready to compare against execution.",
        tone: "bg-mist-50/85",
      };
    }

    return {
      value: "Needs report",
      helper: "Run the first Deal Report to anchor underwriting inside the project.",
      tone: "bg-sand-50/85",
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
        value: "Needs setup",
        helper: "Set up the budget workspace to unlock payments, draws, and reporting.",
        tone: "bg-sand-50/85",
      };
    }

    if (overBudgetScopeCount > 0) {
      return {
        value: "Over plan",
        helper: `${overBudgetScopeCount} scope item${overBudgetScopeCount === 1 ? "" : "s"} are already over budget.`,
        tone: "bg-clay-50/85",
      };
    }

    if (paymentApprovalCount > 0) {
      return {
        value: "Payments waiting",
        helper: `${paymentApprovalCount} payment${paymentApprovalCount === 1 ? "" : "s"} still need approval or final payment.`,
        tone: "bg-sand-50/85",
      };
    }

    if (receiptBacklogCount > 0) {
      return {
        value: "Receipts waiting",
        helper: `${receiptBacklogCount} receipt${receiptBacklogCount === 1 ? "" : "s"} still need to be tied to a payment.`,
        tone: "bg-sand-50/85",
      };
    }

    if (overduePropertyTasks > 0) {
      return {
        value: "Needs review",
        helper: `${overduePropertyTasks} overdue task${overduePropertyTasks === 1 ? "" : "s"} could affect delivery and spend.`,
        tone: "bg-sand-50/85",
      };
    }

    return {
      value: "Tracking",
      helper: "Payments, cost plan, capital, draws, and reports are all active in Budget.",
      tone: "bg-verdigris-50/85",
    };
  }, [
    hasAcquisitionWorkspace,
    overBudgetScopeCount,
    overduePropertyTasks,
    paymentApprovalCount,
    receiptBacklogCount,
  ]);

  const executionHealthCard = useMemo(() => {
    if (propertyTasksLoading) {
      return {
        value: "Loading",
        helper: "Refreshing the current work queue.",
        tone: "bg-white/86",
      };
    }

    if (openPropertyTasks === 0) {
      return {
        value: "Clear",
        helper: "No open tasks yet. Add the next field move when work starts.",
        tone: "bg-verdigris-50/85",
      };
    }

    if (overduePropertyTasks > 0) {
      return {
        value: "At risk",
        helper: `${overduePropertyTasks} overdue task${overduePropertyTasks === 1 ? "" : "s"} need attention first.`,
        tone: "bg-clay-50/85",
      };
    }

    return {
      value: "In motion",
      helper: `${openPropertyTasks} open task${openPropertyTasks === 1 ? "" : "s"} are driving current execution.`,
      tone: "bg-sand-50/85",
    };
  }, [openPropertyTasks, overduePropertyTasks, propertyTasksLoading]);

  const procurementHealthCard = useMemo(() => {
    if (!hasPipelineWorkspace) {
      return {
        value: "No deal yet",
        helper: "Link a deal first if you want bid and scope coverage inside the project.",
        tone: "bg-sand-50/85",
      };
    }

    if (!hasAcquisitionWorkspace) {
      return {
        value: "Needs setup",
        helper: "Set up the budget workspace to compare bids, awards, and vendor packets.",
        tone: "bg-sand-50/85",
      };
    }

    if (budgetItems.length === 0 && bids.length === 0) {
      return {
        value: "No scope yet",
        helper: "Build the cost plan first so procurement can track quotes, awards, and packet readiness.",
        tone: "bg-mist-50/85",
      };
    }

    if (uncoveredScopeCount > 0) {
      return {
        value: "Coverage gaps",
        helper: `${uncoveredScopeCount} scope item${uncoveredScopeCount === 1 ? "" : "s"} still need awarded vendor coverage.`,
        tone: "bg-clay-50/85",
      };
    }

    if (projectVendorPacketGapCount > 0) {
      return {
        value: "Packet gaps",
        helper: `${projectVendorPacketGapCount} vendor packet${projectVendorPacketGapCount === 1 ? "" : "s"} still block clean assignment or payout.`,
        tone: "bg-sand-50/85",
      };
    }

    if (openBidCount > 0) {
      return {
        value: "Quote review",
        helper: `${openBidCount} quote${openBidCount === 1 ? "" : "s"} still need review before award.`,
        tone: "bg-sand-50/85",
      };
    }

    return {
      value: "Covered",
      helper: `${awardedScopeCount} scope item${awardedScopeCount === 1 ? "" : "s"} have awarded coverage and ${readyToPayVendorCount} vendor${readyToPayVendorCount === 1 ? "" : "s"} are ready to pay.`,
      tone: "bg-verdigris-50/85",
    };
  }, [
    bids.length,
    budgetItems.length,
    awardedScopeCount,
    hasAcquisitionWorkspace,
    hasPipelineWorkspace,
    openBidCount,
    projectVendorPacketGapCount,
    readyToPayVendorCount,
    uncoveredScopeCount,
  ]);

  const procurementSummary = useMemo(() => {
    if (!hasPipelineWorkspace) {
      return "Link a deal first if you want scope-driven bids in the project workspace.";
    }

    if (!hasAcquisitionWorkspace) {
      return bids.length
        ? `${bids.length} bid${bids.length === 1 ? "" : "s"} are already saved, but the budget workspace still needs to be created so you can compare them against live scope and commitments.`
        : "No vendor bids saved yet. Scope and bids will land here once the deal is active.";
    }

    if (budgetItems.length === 0 && bids.length === 0) {
      return "Build the cost plan first so procurement can track quote coverage, awards, and packet readiness.";
    }

    if (!bids.length && uncoveredScopeCount === 0 && projectVendorPacketGapCount === 0) {
      return "No vendor bids saved yet. Compare scope and commitments when quotes arrive.";
    }

    if (uncoveredScopeCount > 0) {
      return `${uncoveredScopeCount} scope item${uncoveredScopeCount === 1 ? "" : "s"} still need awarded vendor coverage. ${openBidCount ? `${openBidCount} open quote${openBidCount === 1 ? "" : "s"} are ready for review.` : "Start by collecting or importing quotes."}`;
    }

    if (projectVendorPacketGapCount > 0) {
      return `${projectVendorPacketGapCount} project vendor packet${projectVendorPacketGapCount === 1 ? "" : "s"} still block clean assignment or payout.${projectVendorRenewalCount ? ` ${projectVendorRenewalCount} also need renewal follow-up.` : ""}`;
    }

    if (!bids.length) {
      return "No vendor bids saved yet. Compare scope and commitments when quotes arrive.";
    }

    return `${awardedBidCount} awarded bid${awardedBidCount === 1 ? "" : "s"} and ${openBidCount} open quote${openBidCount === 1 ? "" : "s"} are ready to compare against scope and commitments.${unlinkedBidCount ? ` ${unlinkedBidCount} contractor${unlinkedBidCount === 1 ? "" : "s"} still need vendor linking.` : ""}`;
  }, [
    awardedBidCount,
    bids.length,
    budgetItems.length,
    hasAcquisitionWorkspace,
    hasPipelineWorkspace,
    openBidCount,
    projectVendorPacketGapCount,
    projectVendorRenewalCount,
    uncoveredScopeCount,
    unlinkedBidCount,
  ]);

  const activeViewItems = useMemo(() => getPropertyWorkspaceViews(activeTab.id), [activeTab.id]);
  const activeViewId = activeView?.id || "";

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

  const handleOpenPropertyDetails = useCallback(() => {
    setIsPropertyDetailsOpen(true);
  }, []);

  const handleViewSelect = useCallback(
    (tabId, viewId) => {
      navigate(buildPropertyWorkspaceViewPath(property?.propertyKey || propertyKey, tabId, viewId));
    },
    [navigate, property?.propertyKey, propertyKey]
  );

  const buildDealSectionAction = useCallback(
    (readyLabel, viewId) => {
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
        onClick: () => handleViewSelect("deal", viewId || "summary"),
      };
    },
    [handleTabSelect, handleViewSelect, hasPipelineWorkspace, propertyWorkspaceActive]
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
      setIsPropertyDetailsOpen(false);
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
      navigate(buildPropertyWorkspaceViewPath(propertyKey, "deal", "reports"));
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

  const handleOpenProjectUpdateComposer = useCallback((update = null) => {
    setEditingProjectUpdate(update);
    setIsUpdateComposerOpen(true);
  }, []);

  const handleCloseProjectUpdateComposer = useCallback(() => {
    setEditingProjectUpdate(null);
    setIsUpdateComposerOpen(false);
  }, []);

  const handleSaveProjectUpdate = useCallback(
    async (payload) => {
      try {
        setIsSavingProjectUpdate(true);
        if (editingProjectUpdate?._id) {
          await updateProjectUpdate(propertyKey, editingProjectUpdate._id, payload);
          toast.success("Project update saved.");
        } else {
          await createProjectUpdate(propertyKey, payload);
          toast.success("Project update added.");
        }

        await loadProjectWorkspaceUpdates();
        handleCloseProjectUpdateComposer();
      } catch (updateError) {
        toast.error(updateError.message || "Failed to save the project update.");
        throw updateError;
      } finally {
        setIsSavingProjectUpdate(false);
      }
    },
    [
      editingProjectUpdate?._id,
      handleCloseProjectUpdateComposer,
      loadProjectWorkspaceUpdates,
      propertyKey,
    ]
  );

  const handleDeleteProjectUpdate = useCallback(
    async (update) => {
      if (!update?._id) {
        return;
      }

      if (!window.confirm("Delete this project update?")) {
        return;
      }

      try {
        await deleteProjectUpdate(propertyKey, update._id);
        await loadProjectWorkspaceUpdates();
        toast.success("Project update deleted.");
      } catch (deleteError) {
        toast.error(deleteError.message || "Failed to delete the project update.");
      }
    },
    [loadProjectWorkspaceUpdates, propertyKey]
  );

  const requireAcquisitionWorkspace = useCallback(
    (message = "Set up the budget workspace first to use this tool.") => {
      if (hasAcquisitionWorkspace) {
        return true;
      }

      toast.error(message);
      handleTabSelect("settings");
      return false;
    },
    [handleTabSelect, hasAcquisitionWorkspace]
  );

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
        detail: "Unlock comps, reports, renovation scope, and bid coverage.",
        label: isCreatingPipelineWorkspace ? "Creating..." : "Create deal",
        disabled: isCreatingPipelineWorkspace,
        onClick: handleCreatePipelineWorkspace,
      });
    } else if (!propertyWorkspaceActive) {
      actions.push({
        id: "activate",
        title: "Activate deal access",
        detail: "Bring the linked deal into the project workspace so underwriting stays visible.",
        label: isUpdatingWorkspaceStatus ? "Updating..." : "Activate",
        disabled: isUpdatingWorkspaceStatus,
        onClick: () => handleUpdatePropertyWorkspaceStatus(true),
      });
    }

    if (!hasAcquisitionWorkspace) {
      actions.push({
        id: "financials",
        title: "Set up budget workspace",
        detail: "Payments, capital, vendors, schedule, and project files all open after setup.",
        label: isCreatingAcquisitionWorkspace ? "Creating..." : "Create budget workspace",
        disabled: isCreatingAcquisitionWorkspace,
        onClick: handleCreateAcquisitionWorkspace,
      });
    }

    if (
      hasAcquisitionWorkspace &&
      (uncoveredScopeCount > 0 || projectVendorPacketGapCount > 0 || openBidCount > 0)
    ) {
      const procurementDetail =
        uncoveredScopeCount > 0
          ? `${uncoveredScopeCount} scope item${uncoveredScopeCount === 1 ? "" : "s"} still need awarded vendor coverage.`
          : projectVendorPacketGapCount > 0
            ? `${projectVendorPacketGapCount} vendor packet${projectVendorPacketGapCount === 1 ? "" : "s"} still block assignment or payout.`
            : `${openBidCount} quote${openBidCount === 1 ? "" : "s"} still need review before award.`;

      actions.push({
        id: "procurement-review",
        title: "Review procurement",
        detail: procurementDetail,
        label: "Open procurement",
        onClick: () => handleViewSelect("execution", "procurement"),
      });
    }

    if (hasAcquisitionWorkspace && (paymentApprovalCount > 0 || receiptBacklogCount > 0 || overBudgetScopeCount > 0)) {
      const paymentDetail =
        paymentApprovalCount > 0
          ? `${paymentApprovalCount} payment${paymentApprovalCount === 1 ? "" : "s"} need approval or final payment.`
          : receiptBacklogCount > 0
            ? `${receiptBacklogCount} receipt${receiptBacklogCount === 1 ? "" : "s"} still need to be tied to a payment.`
            : `${overBudgetScopeCount} scope item${overBudgetScopeCount === 1 ? "" : "s"} are over budget.`;

      actions.push({
        id: "payments-review",
        title: "Review budget lane",
        detail: paymentDetail,
        label: "Open payments",
        onClick: () => handleViewSelect("budget", "payments"),
      });
    }

    if (hasAcquisitionWorkspace && (drawSupportGapCount > 0 || paymentSupportGapCount > 0)) {
      actions.push({
        id: "files-review",
        title: "Review file support",
        detail:
          drawSupportGapCount > 0
            ? `${drawSupportGapCount} draw request${drawSupportGapCount === 1 ? "" : "s"} still need attached support.`
            : `${paymentSupportGapCount} payment${paymentSupportGapCount === 1 ? "" : "s"} still need receipt or invoice support.`,
        label: drawSupportGapCount > 0 ? "Open Loan & Draw" : "Open receipts",
        onClick: () =>
          drawSupportGapCount > 0
            ? handleViewSelect("files", "loan-draw")
            : handleViewSelect("files", "receipts-invoices"),
      });
    }

    if (sortedProjectUpdates.length === 0) {
      actions.push({
        id: "log-update",
        title: "Log the first update",
        detail: "Keep site visits, lender movement, and vendor notes visible from the start.",
        label: "Add update",
        onClick: () => handleOpenProjectUpdateComposer(),
      });
    }

    actions.push({
      id: "tasks",
      title: openPropertyTasks > 0 ? "Review execution" : "Add first task",
      detail:
        openPropertyTasks > 0
          ? overduePropertyTasks > 0
            ? `${overduePropertyTasks} overdue task${overduePropertyTasks === 1 ? "" : "s"} need attention.`
            : `${openPropertyTasks} open task${openPropertyTasks === 1 ? "" : "s"} are in motion.`
          : "Keep the next operating move visible from day one.",
      label: "Open tasks",
      onClick: () => handleViewSelect("execution", "tasks"),
    });

    actions.push({
      id: "budget",
      title: hasAcquisitionWorkspace ? "Review budget lane" : "Set up budget lane",
      detail: hasAcquisitionWorkspace
        ? "Jump into payments, cost plan, capital, and draw operations."
        : "Set up the budget workspace to unlock the operating controls.",
      label: hasAcquisitionWorkspace ? "Open budget" : "Open setup",
      onClick: () =>
        hasAcquisitionWorkspace
          ? handleViewSelect("budget", "payments")
          : handleTabSelect("settings"),
    });

    if (hasPipelineWorkspace) {
      actions.push({
        id: "deal",
        title: "Review deal context",
        detail: "Keep report history and original assumptions close to the live project.",
        label: "Open deal",
        onClick: () => handleViewSelect("deal", "summary"),
      });
    }

    return actions.slice(0, 4);
  }, [
    handleCreateAcquisitionWorkspace,
    handleCreatePipelineWorkspace,
    handleTabSelect,
    handleViewSelect,
    handleUpdatePropertyWorkspaceStatus,
    hasAcquisitionWorkspace,
    hasPipelineWorkspace,
    isCreatingAcquisitionWorkspace,
    isCreatingPipelineWorkspace,
    isUpdatingWorkspaceStatus,
    openBidCount,
    openPropertyTasks,
    overduePropertyTasks,
    overBudgetScopeCount,
    paymentSupportGapCount,
    paymentApprovalCount,
    projectVendorPacketGapCount,
    propertyWorkspaceActive,
    receiptBacklogCount,
    sortedProjectUpdates.length,
    drawSupportGapCount,
    uncoveredScopeCount,
    handleOpenProjectUpdateComposer,
  ]);

  const quickAddActions = useMemo(() => {
    if (!property || activeTab.id === "settings") {
      return [];
    }

    const addTaskAction = {
      id: "add-task",
      label: "Add Task",
      detail: "Capture the next project action.",
      onSelect: () => setIsTaskQuickAddOpen(true),
    };

    const addExpenseAction = {
      id: "add-expense",
      label: "Add Payment",
      detail: hasAcquisitionWorkspace
        ? "Log payments, receipts, and AP details."
        : "Set up the budget workspace first to start payment tracking.",
      onSelect: () => {
        if (!requireAcquisitionWorkspace("Set up the budget workspace first to add a payment.")) {
          return;
        }
        setExpenseQuickAddMode("manual");
        setIsExpenseQuickAddOpen(true);
      },
    };

    const scanReceiptAction = {
      id: "scan-receipt",
      label: "Scan Receipt",
      detail: hasAcquisitionWorkspace
        ? "Create a payment from a receipt with AI support."
        : "Set up the budget workspace first to capture receipts.",
      onSelect: () => {
        if (!requireAcquisitionWorkspace("Set up the budget workspace first to scan a receipt.")) {
          return;
        }
        setExpenseQuickAddMode("receipt");
        setIsExpenseQuickAddOpen(true);
      },
    };

    const addBudgetItemAction = {
      id: "add-budget-item",
      label: "Add Budget Item",
      detail: hasAcquisitionWorkspace
        ? "Add a scope category to the working budget."
        : "Set up the budget workspace first to build the project budget.",
      onSelect: () => {
        if (!requireAcquisitionWorkspace("Set up the budget workspace first to add a budget item.")) {
          return;
        }
        setIsBudgetItemQuickAddOpen(true);
      },
    };

    const addVendorAction = {
      id: "add-vendor",
      label: "Add Vendor",
      detail: hasAcquisitionWorkspace
        ? "Save a subcontractor or trade partner."
        : "Set up the budget workspace first to start the vendor roster.",
      onSelect: () => {
        if (!requireAcquisitionWorkspace("Set up the budget workspace first to add a vendor.")) {
          return;
        }
        setIsVendorQuickAddOpen(true);
      },
    };

    const addUpdateAction = {
      id: "add-update",
      label: "Add Update",
      detail: "Log a site note, issue, vendor update, or lender note.",
      onSelect: () => handleOpenProjectUpdateComposer(),
    };

    const addDrawAction = {
      id: "add-draw-request",
      label: "Add Draw Request",
      detail: hasAcquisitionWorkspace
        ? "Jump to the draws page to prepare the next request."
        : "Set up the budget workspace first to manage draws.",
      onSelect: () => {
        if (!requireAcquisitionWorkspace("Set up the budget workspace first to manage draws.")) {
          return;
        }
        handleViewSelect("budget", "draws");
      },
    };

    const uploadFileAction = {
      id: "upload-file",
      label:
        activeView?.id === "loan-draw"
          ? "Upload Draw Support"
          : activeView?.id === "contracts-bids"
            ? "Upload Contract / Bid"
            : activeView?.id === "receipts-invoices"
              ? "Upload Receipt / Invoice"
              : activeView?.id === "photos"
                ? "Upload Photo"
                : "Upload File",
      detail: hasAcquisitionWorkspace
        ? activeView?.id === "loan-draw"
          ? "Focus the upload form for lender and draw support."
          : activeView?.id === "contracts-bids"
            ? "Focus the upload form for contracts, proposals, and compliance."
            : activeView?.id === "receipts-invoices"
              ? "Focus the upload form for receipts and payment support."
              : activeView?.id === "photos"
                ? "Focus the upload form for progress photos."
                : "Focus the upload form in the project library."
        : "Set up the budget workspace first to open the project library.",
      onSelect: () => {
        if (!requireAcquisitionWorkspace("Set up the budget workspace first to upload files.")) {
          return;
        }
        setDocumentUploadRequestKey((current) => current + 1);
      },
    };

    if (activeTab.id === "home") {
      return [addTaskAction, addExpenseAction, addBudgetItemAction, addUpdateAction];
    }

    if (activeTab.id === "execution" && activeView?.id === "vendors") {
      return [addVendorAction, addUpdateAction];
    }

    if (activeTab.id === "execution" && activeView?.id === "procurement") {
      return [addVendorAction, addExpenseAction, addUpdateAction];
    }

    if (activeTab.id === "execution") {
      return [addTaskAction, addUpdateAction];
    }

    if (activeTab.id === "budget" && activeView?.id === "cost-plan") {
      return [addBudgetItemAction, addExpenseAction];
    }

    if (activeTab.id === "budget" && activeView?.id === "payments") {
      return [addExpenseAction, scanReceiptAction, addUpdateAction];
    }

    if (activeTab.id === "budget") {
      return [addExpenseAction, addBudgetItemAction, addDrawAction, addUpdateAction];
    }

    if (activeTab.id === "files") {
      return [uploadFileAction, addUpdateAction];
    }

    return [addUpdateAction];
  }, [
    activeTab.id,
    activeView?.id,
    handleOpenProjectUpdateComposer,
    handleViewSelect,
    hasAcquisitionWorkspace,
    property,
    requireAcquisitionWorkspace,
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

  const activeWorkspacePageProps = {
    activeView,
    activeViewId,
    property,
    propertyKey,
    syncPropertyState,
    workspaceSurfaceVersion,
    handleTabSelect,
    handleViewSelect,
    renderWorkspaceButtons,
    renderAcquisitionSetup,
    renderLeadWorkspaceState,
    hasAcquisitionWorkspace,
    handleOpenProjectUpdateComposer,
    handleDeleteProjectUpdate,
    handleOpenPropertyDetails,
    nextStepCard,
    dealHealthCard,
    budgetHealthCard,
    executionHealthCard,
    procurementHealthCard,
    homeActionQueue,
    procurementSummary,
    fundingLinkedPaymentCount,
    drawLinkedPaymentCount,
    fundingSupportGapCount,
    drawSupportGapCount,
    recentActivity,
    formatDateTime,
    propertyTasksError,
    propertyTasksLoading,
    nextPropertyTasks,
    formatCompactDate,
    isTaskOverdue,
    sortedProjectUpdates,
    projectUpdatesLoading,
    projectUpdatesError,
    detailLine,
    listingSummary,
    workspaceCount,
    contractFileCount,
    receiptFileCount,
    photoFileCount,
    paymentSupportGapCount,
    workspacePayments,
    workspaceReceipts,
    projectVendorRecords,
    documentUploadRequestKey,
    pipelineLeadId,
    bids,
    renovationItems,
    handleBidsUpdated,
    loadPropertyTasks,
    buildDealSectionAction,
    leadWorkspace,
    handleLeadUpdated,
    analysis,
    filters,
    dealForm,
    handleLeadFilterChange,
    handleLeadDealChange,
    isAnalyzing,
    handleRunLeadAnalysis,
    billingAccess,
    isBillingAccessLoading,
    handleStartSubscription,
    isStartingSubscription,
    handleBuyCredits,
    isStartingCheckout,
    handleSaveLeadReport,
    isSavingReport,
    acquisitionWorkspaceId,
    compsNotice,
    pipelineLeadPath,
    leadPricingSummary,
    savedReports,
    savedReportsLoading,
    formatCurrency,
  };

  const ActiveWorkspacePageComponent = useMemo(() => {
    if (activeTab.id === "home") return PropertyWorkspaceHomePage;
    if (activeTab.id === "budget") return PropertyWorkspaceBudgetPage;
    if (activeTab.id === "execution") return PropertyWorkspaceExecutionPage;
    if (activeTab.id === "files") return PropertyWorkspaceFilesPage;
    if (activeTab.id === "deal") return PropertyWorkspaceDealPage;
    return null;
  }, [activeTab.id]);

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
    if (activeTab.id === "settings" || !ActiveWorkspacePageComponent) {
      return renderSettingsTab();
    }

    return (
      <Suspense fallback={<LoadingStateCard label="Loading workspace page..." />}>
        <ActiveWorkspacePageComponent {...activeWorkspacePageProps} />
      </Suspense>
    );
  };

  return (
    <div className="space-y-4 pb-28">
      <section className="workspace-console-rail sticky top-24 z-20">
        <div className="workspace-console-main-row">
          <Link to="/properties" className="workspace-console-back">
            Back to Projects
          </Link>

          <div className="workspace-console-primary segmented-control">
            {PROPERTY_WORKSPACE_TABS.filter((tab) => tab.id !== "settings").map((tab) => (
              <NavLink
                key={tab.id}
                to={buildPropertyWorkspacePath(property.propertyKey, tab.id)}
                className={`segmented-option workspace-console-tab ${
                  tab.id === activePrimaryTabId ? "segmented-option-active" : ""
                }`}
              >
                {tab.label}
              </NavLink>
            ))}
          </div>

          <NavLink
            to={buildPropertyWorkspacePath(property.propertyKey, "settings")}
            className={`workspace-console-setup ${
              activeTab.id === "settings" ? "workspace-console-setup-active" : ""
            }`}
          >
            Project Setup
          </NavLink>
        </div>

        {activeTab.id !== "settings" && activeViewItems.length ? (
          <div className="workspace-console-secondary-row">
            <div className="workspace-console-secondary segmented-control">
              {activeViewItems.map((view) => (
                <NavLink
                  key={view.id}
                  to={buildPropertyWorkspaceViewPath(property.propertyKey, activeTab.id, view.id)}
                  className={`segmented-option workspace-console-subtab ${
                    view.id === activeViewId ? "segmented-option-active" : ""
                  }`}
                >
                  {view.label}
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {activeTab.id === "deal" && leadWorkspaceError && leadWorkspace ? (
        <div className="rounded-[16px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {leadWorkspaceError}
        </div>
      ) : null}

      {renderActiveTab()}

      <PropertyDetailsDrawer
        isOpen={isPropertyDetailsOpen}
        onClose={() => setIsPropertyDetailsOpen(false)}
        onSubmit={handleSave}
        formData={formData}
        onChange={handleChange}
        suggestions={suggestions}
        onSelectSuggestion={handleSelectSuggestion}
        onPreviewLookup={() => handlePreviewLookup()}
        isPreviewLoading={isPreviewLoading}
        previewMetadata={previewMetadata}
        locationProviderName={getLocationProviderName()}
        propertyTypeOptions={propertyTypeOptions}
        showsUnitCount={showsUnitCount}
        isSaving={isSaving}
        propertyKey={property.propertyKey}
      />

      <ProjectUpdateComposerModal
        isOpen={isUpdateComposerOpen}
        onClose={handleCloseProjectUpdateComposer}
        onSubmit={handleSaveProjectUpdate}
        initialUpdate={editingProjectUpdate}
        isSaving={isSavingProjectUpdate}
      />

      <TaskFormModal
        isOpen={isTaskQuickAddOpen}
        onClose={() => setIsTaskQuickAddOpen(false)}
        onSaved={() => {
          loadPropertyTasks(property.propertyKey);
          bumpWorkspaceSurfaceVersion();
        }}
        properties={[property]}
        defaults={{
          sourceType: "property",
          sourceId: property.propertyKey,
          sourceLabel: property.title || "Property",
          propertyKey: property.propertyKey,
          dueDate: new Date().toISOString().split("T")[0],
        }}
      />

      <AddBudgetItemModal
        isOpen={isBudgetItemQuickAddOpen}
        onClose={() => setIsBudgetItemQuickAddOpen(false)}
        onSuccess={() => {
          loadWorkspaceSupportData();
          bumpWorkspaceSurfaceVersion();
        }}
        investmentId={acquisitionWorkspaceId}
      />

      <AddExpenseModal
        isOpen={isExpenseQuickAddOpen}
        onClose={() => {
          setIsExpenseQuickAddOpen(false);
          setExpenseQuickAddMode("manual");
        }}
        investmentId={acquisitionWorkspaceId}
        onSuccess={() => {
          loadWorkspaceSupportData();
          bumpWorkspaceSurfaceVersion();
          setExpenseQuickAddMode("manual");
        }}
        budgetItems={budgetItems}
        vendors={vendors}
        fundingSources={fundingSources}
        drawRequests={drawRequests}
        initialMode={expenseQuickAddMode}
      />

      <AddVendorModal
        isOpen={isVendorQuickAddOpen}
        onClose={() => setIsVendorQuickAddOpen(false)}
        onSuccess={() => {
          loadWorkspaceSupportData();
          bumpWorkspaceSurfaceVersion();
          toast.success("Vendor saved.");
        }}
      />

      <WorkspaceQuickAddMenu actions={quickAddActions} />

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
