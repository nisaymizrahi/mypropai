export const PROPERTY_WORKSPACE_DEFAULT_TAB = "home";

export const PROPERTY_WORKSPACE_TABS = [
  {
    id: "home",
    label: "Home",
    description: "Project signals, priorities, updates, and property details.",
  },
  {
    id: "execution",
    label: "Execution",
    description: "Tasks, schedule, vendors, procurement, and scope delivery.",
  },
  {
    id: "budget",
    label: "Budget",
    description: "Payments, cost plan, capital, draws, and reporting.",
  },
  {
    id: "files",
    label: "Files",
    description: "Documents, draw support, contracts, invoices, and photos.",
  },
  {
    id: "deal",
    label: "Deal",
    description: "Deal summary, reports, scope, and underwriting context.",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Project setup, linked records, and property-level controls.",
  },
];

export const PROPERTY_WORKSPACE_VIEWS = {
  home: [
    { id: "today", label: "Today" },
    { id: "at-risk", label: "At Risk" },
    { id: "updates", label: "Updates" },
    { id: "property-details", label: "Property Details" },
  ],
  execution: [
    { id: "tasks", label: "Tasks" },
    { id: "schedule", label: "Schedule" },
    { id: "vendors", label: "Vendors" },
    { id: "procurement", label: "Procurement" },
    { id: "scope", label: "Scope" },
  ],
  budget: [
    { id: "payments", label: "Payments" },
    { id: "cost-plan", label: "Cost Plan" },
    { id: "snapshot", label: "Snapshot" },
    { id: "capital", label: "Capital" },
    { id: "draws", label: "Draws" },
    { id: "reports", label: "Reports" },
  ],
  files: [
    { id: "all-files", label: "All Files" },
    { id: "loan-draw", label: "Loan & Draw" },
    { id: "contracts-bids", label: "Contracts & Bids" },
    { id: "receipts-invoices", label: "Receipts & Invoices" },
    { id: "photos", label: "Photos" },
  ],
  deal: [
    { id: "summary", label: "Summary" },
    { id: "reports", label: "Reports" },
    { id: "renovation-scope", label: "Renovation Scope" },
    { id: "underwriting-vs-actuals", label: "Underwriting vs Actuals" },
  ],
  settings: [],
};

export const PROPERTY_WORKSPACE_SECTIONS = PROPERTY_WORKSPACE_VIEWS;

export const PROPERTY_WORKSPACE_DEFAULT_VIEW_BY_TAB = {
  home: "today",
  execution: "tasks",
  budget: "payments",
  files: "all-files",
  deal: "summary",
  settings: "",
};

const LEGACY_TAB_ALIASES = {
  overview: "home",
  work: "execution",
  financials: "budget",
  documents: "files",
  analysis: "deal",
  settings: "settings",
};

const LEGACY_CATEGORY_TO_TAB = {
  property: "home",
  finance: "budget",
  costs: "budget",
  documents: "files",
  operations: "execution",
  settings: "settings",
};

const LEGACY_ROUTE_TO_DESTINATION = {
  "property:close-snapshot": { tabId: "home", viewId: "today" },
  "property:acquisition-summary": { tabId: "deal", viewId: "summary" },
  "property:original-assumptions": { tabId: "deal", viewId: "underwriting-vs-actuals" },
  "property:market-comps": { tabId: "deal", viewId: "reports" },
  "property:saved-reports": { tabId: "deal", viewId: "reports" },
  "property:scope": { tabId: "deal", viewId: "renovation-scope" },
  "finance:health": { tabId: "budget", viewId: "snapshot" },
  "finance:sources-uses": { tabId: "budget", viewId: "capital" },
  "finance:budget-vs-actual": { tabId: "budget", viewId: "cost-plan" },
  "finance:capital-stack": { tabId: "budget", viewId: "capital" },
  "finance:draw-operations": { tabId: "budget", viewId: "draws" },
  "finance:payment-schedule": { tabId: "budget", viewId: "capital" },
  "finance:reports": { tabId: "budget", viewId: "reports" },
  "costs:bids": { tabId: "execution", viewId: "procurement" },
  "costs:budget": { tabId: "budget", viewId: "cost-plan" },
  "costs:expenses": { tabId: "budget", viewId: "payments" },
  "costs:commitments": { tabId: "execution", viewId: "procurement" },
  "documents:overview": { tabId: "files", viewId: "all-files" },
  "operations:tasks": { tabId: "execution", viewId: "tasks" },
  "operations:schedule": { tabId: "execution", viewId: "schedule" },
  "operations:timeline": { tabId: "execution", viewId: "schedule" },
  "operations:vendors": { tabId: "execution", viewId: "vendors" },
  "operations:activity": { tabId: "home", viewId: "updates" },
  "settings:workspace": { tabId: "settings", viewId: "" },
};

const LEGACY_VIEW_ALIASES = {
  home: {
    today: "today",
    "at-risk": "at-risk",
    updates: "updates",
    "property-details": "property-details",
  },
  execution: {
    tasks: "tasks",
    schedule: "schedule",
    vendors: "vendors",
    procurement: "procurement",
    scope: "scope",
    "scope-budget": "scope",
    updates: "tasks",
  },
  budget: {
    payments: "payments",
    expenses: "payments",
    "cost-plan": "cost-plan",
    "line-items": "cost-plan",
    snapshot: "snapshot",
    capital: "capital",
    lender: "capital",
    draws: "draws",
    reports: "reports",
  },
  files: {
    "all-files": "all-files",
    "loan-draw": "loan-draw",
    "contracts-bids": "contracts-bids",
    "receipts-invoices": "receipts-invoices",
    photos: "photos",
    overview: "all-files",
  },
  deal: {
    summary: "summary",
    reports: "reports",
    "renovation-scope": "renovation-scope",
    scope: "renovation-scope",
    "underwriting-vs-actuals": "underwriting-vs-actuals",
  },
  settings: {},
};

const tabExists = (tabId) => PROPERTY_WORKSPACE_TABS.some((tab) => tab.id === tabId);

export const getPropertyWorkspaceTab = (tabId) =>
  PROPERTY_WORKSPACE_TABS.find((tab) => tab.id === tabId) ||
  PROPERTY_WORKSPACE_TABS.find((tab) => tab.id === PROPERTY_WORKSPACE_DEFAULT_TAB);

export const getPropertyWorkspaceViews = (tabId) => PROPERTY_WORKSPACE_VIEWS[tabId] || [];

export const getPropertyWorkspaceSections = getPropertyWorkspaceViews;

export const getDefaultPropertyWorkspaceViewId = (tabId) =>
  PROPERTY_WORKSPACE_DEFAULT_VIEW_BY_TAB[tabId] || getPropertyWorkspaceViews(tabId)[0]?.id || "";

export const getDefaultPropertyWorkspaceSectionId = getDefaultPropertyWorkspaceViewId;

export const getPropertyWorkspaceView = (tabId, viewId) =>
  getPropertyWorkspaceViews(tabId).find((view) => view.id === viewId) || null;

export const getPropertyWorkspaceSection = getPropertyWorkspaceView;

export const normalizePropertyWorkspaceViewId = (tabId, viewId) => {
  if (tabId === "settings") {
    return "";
  }

  if (getPropertyWorkspaceView(tabId, viewId)) {
    return viewId;
  }

  const aliasedViewId = LEGACY_VIEW_ALIASES[tabId]?.[viewId];
  if (aliasedViewId && getPropertyWorkspaceView(tabId, aliasedViewId)) {
    return aliasedViewId;
  }

  return getDefaultPropertyWorkspaceViewId(tabId);
};

export const normalizePropertyWorkspaceSectionId = normalizePropertyWorkspaceViewId;

const resolveLegacyDestination = (categoryId, sectionId) => {
  if (categoryId && sectionId) {
    return (
      LEGACY_ROUTE_TO_DESTINATION[`${categoryId}:${sectionId}`] || {
        tabId: LEGACY_CATEGORY_TO_TAB[categoryId] || PROPERTY_WORKSPACE_DEFAULT_TAB,
        viewId: sectionId,
      }
    );
  }

  if (categoryId) {
    return {
      tabId: LEGACY_CATEGORY_TO_TAB[categoryId] || PROPERTY_WORKSPACE_DEFAULT_TAB,
      viewId: "",
    };
  }

  return null;
};

const resolveTabId = ({ tabId, categoryId, sectionId } = {}) => {
  if (tabExists(tabId)) {
    return tabId;
  }

  if (LEGACY_TAB_ALIASES[tabId]) {
    return LEGACY_TAB_ALIASES[tabId];
  }

  return (
    resolveLegacyDestination(tabId || categoryId, sectionId)?.tabId || PROPERTY_WORKSPACE_DEFAULT_TAB
  );
};

export const resolvePropertyWorkspaceRoute = ({
  tabId,
  viewId,
  categoryId,
  sectionId,
  hashSectionId,
} = {}) => {
  const legacyDestination = resolveLegacyDestination(categoryId, sectionId);
  const resolvedTab = getPropertyWorkspaceTab(
    resolveTabId({ tabId, categoryId, sectionId })
  );

  const rawViewId =
    legacyDestination?.viewId ||
    (categoryId ? "" : viewId || hashSectionId || sectionId || "");
  const normalizedViewId = normalizePropertyWorkspaceViewId(resolvedTab.id, rawViewId);
  const resolvedView = normalizedViewId
    ? getPropertyWorkspaceView(resolvedTab.id, normalizedViewId)
    : null;

  const isCanonical =
    !categoryId &&
    !sectionId &&
    !hashSectionId &&
    ((resolvedTab.id === "settings" && tabId === "settings" && !viewId) ||
      (tabId === resolvedTab.id && viewId === normalizedViewId));

  return {
    tab: resolvedTab,
    view: resolvedView,
    isCanonical,
  };
};

export const buildPropertyWorkspaceViewPath = (
  propertyKey,
  tabOrLegacyCategory = PROPERTY_WORKSPACE_DEFAULT_TAB,
  viewOrLegacySectionId = ""
) => {
  const resolvedRoute = resolvePropertyWorkspaceRoute({
    tabId: tabOrLegacyCategory,
    viewId: viewOrLegacySectionId,
    categoryId: tabOrLegacyCategory,
    sectionId: viewOrLegacySectionId,
  });

  const encodedPropertyKey = encodeURIComponent(propertyKey);

  if (resolvedRoute.tab.id === "settings") {
    return `/properties/${encodedPropertyKey}/settings`;
  }

  return `/properties/${encodedPropertyKey}/${resolvedRoute.tab.id}/${resolvedRoute.view?.id || getDefaultPropertyWorkspaceViewId(resolvedRoute.tab.id)}`;
};

export const buildPropertyWorkspacePath = (
  propertyKey,
  tabOrLegacyCategory = PROPERTY_WORKSPACE_DEFAULT_TAB,
  legacySectionOrViewId = ""
) => buildPropertyWorkspaceViewPath(propertyKey, tabOrLegacyCategory, legacySectionOrViewId);

export const buildPropertyWorkspaceSectionPath = (
  propertyKey,
  tabId,
  sectionId
) => buildPropertyWorkspaceViewPath(propertyKey, tabId, sectionId);
