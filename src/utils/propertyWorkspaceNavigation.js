export const PROPERTY_WORKSPACE_DEFAULT_TAB = "home";

export const PROPERTY_WORKSPACE_TABS = [
  {
    id: "home",
    label: "Home",
    description: "Project command center, priorities, updates, and quick launches.",
  },
  {
    id: "execution",
    label: "Execution",
    description: "Tasks, schedule, vendors, procurement, and delivery work.",
  },
  {
    id: "budget",
    label: "Budget",
    description: "Profitability, capital, budget vs actuals, expenses, and draws.",
  },
  {
    id: "files",
    label: "Files",
    description: "Uploads, categories, recent files, and linked support docs.",
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

const LEGACY_TAB_ALIASES = {
  overview: "home",
  work: "execution",
  financials: "budget",
  documents: "files",
  analysis: "deal",
  settings: "settings",
};

const LEGACY_ROUTE_TO_TAB = {
  "property:close-snapshot": "home",
  "property:acquisition-summary": "deal",
  "property:original-assumptions": "deal",
  "property:market-comps": "deal",
  "property:saved-reports": "deal",
  "property:scope": "deal",
  "finance:health": "budget",
  "finance:sources-uses": "budget",
  "finance:budget-vs-actual": "budget",
  "finance:capital-stack": "budget",
  "finance:draw-operations": "budget",
  "finance:payment-schedule": "budget",
  "finance:reports": "budget",
  "costs:bids": "execution",
  "costs:budget": "budget",
  "costs:expenses": "budget",
  "costs:commitments": "execution",
  "documents:overview": "files",
  "operations:tasks": "execution",
  "operations:schedule": "execution",
  "operations:timeline": "execution",
  "operations:vendors": "execution",
  "operations:activity": "home",
  "settings:workspace": "settings",
};

const LEGACY_CATEGORY_TO_TAB = {
  property: "home",
  finance: "budget",
  costs: "budget",
  documents: "files",
  operations: "execution",
  settings: "settings",
};

export const PROPERTY_WORKSPACE_SECTIONS = {
  home: [
    { id: "today", label: "Today", anchorId: "home-today" },
    { id: "at-risk", label: "At Risk", anchorId: "home-at-risk" },
    { id: "updates", label: "Updates", anchorId: "home-updates" },
    { id: "property-details", label: "Property Details", anchorId: "home-property-details" },
  ],
  execution: [
    { id: "scope-budget", label: "Scope Budget", anchorId: "execution-scope-budget" },
    { id: "tasks", label: "Tasks", anchorId: "execution-tasks" },
    { id: "schedule", label: "Schedule", anchorId: "execution-schedule" },
    { id: "vendors", label: "Vendors", anchorId: "execution-vendors" },
    { id: "procurement", label: "Procurement", anchorId: "execution-procurement" },
    { id: "updates", label: "Updates", anchorId: "execution-updates" },
  ],
  budget: [
    { id: "snapshot", label: "Snapshot", anchorId: "budget-snapshot" },
    { id: "line-items", label: "Line Items", anchorId: "budget-line-items" },
    { id: "expenses", label: "Expenses", anchorId: "budget-expenses" },
    { id: "lender", label: "Lender", anchorId: "budget-lender" },
    { id: "draws", label: "Draws", anchorId: "budget-draws" },
    { id: "reports", label: "Reports", anchorId: "budget-reports" },
  ],
  files: [
    { id: "all-files", label: "All Files", anchorId: "files-all-files" },
    { id: "loan-draw", label: "Loan & Draw", anchorId: "files-loan-draw" },
    { id: "contracts-bids", label: "Contracts & Bids", anchorId: "files-contracts-bids" },
    { id: "receipts-invoices", label: "Receipts & Invoices", anchorId: "files-receipts-invoices" },
    { id: "photos", label: "Photos", anchorId: "files-photos" },
  ],
  deal: [
    { id: "summary", label: "Summary", anchorId: "deal-summary" },
    { id: "reports", label: "Reports", anchorId: "deal-reports" },
    { id: "renovation-scope", label: "Renovation Scope", anchorId: "deal-renovation-scope" },
    {
      id: "underwriting-vs-actuals",
      label: "Underwriting vs Actuals",
      anchorId: "deal-underwriting-vs-actuals",
    },
  ],
  settings: [],
};

export const getPropertyWorkspaceTab = (tabId) =>
  PROPERTY_WORKSPACE_TABS.find((tab) => tab.id === tabId) ||
  PROPERTY_WORKSPACE_TABS.find((tab) => tab.id === PROPERTY_WORKSPACE_DEFAULT_TAB);

export const getPropertyWorkspaceSections = (tabId) => PROPERTY_WORKSPACE_SECTIONS[tabId] || [];

export const getDefaultPropertyWorkspaceSectionId = (tabId) =>
  getPropertyWorkspaceSections(tabId)[0]?.id || "";

export const getPropertyWorkspaceSection = (tabId, sectionId) =>
  getPropertyWorkspaceSections(tabId).find((section) => section.id === sectionId) || null;

export const normalizePropertyWorkspaceSectionId = (tabId, sectionId) => {
  if (getPropertyWorkspaceSection(tabId, sectionId)) {
    return sectionId;
  }

  return getDefaultPropertyWorkspaceSectionId(tabId);
};

const resolveLegacyTabId = (categoryId, sectionId) => {
  if (categoryId && sectionId) {
    return LEGACY_ROUTE_TO_TAB[`${categoryId}:${sectionId}`] || LEGACY_CATEGORY_TO_TAB[categoryId];
  }

  if (categoryId) {
    return LEGACY_CATEGORY_TO_TAB[categoryId];
  }

  return null;
};

const resolveTabId = ({ tabId, categoryId, sectionId } = {}) => {
  if (PROPERTY_WORKSPACE_TABS.some((tab) => tab.id === tabId)) {
    return tabId;
  }

  if (LEGACY_TAB_ALIASES[tabId]) {
    return LEGACY_TAB_ALIASES[tabId];
  }

  return resolveLegacyTabId(tabId || categoryId, sectionId) || PROPERTY_WORKSPACE_DEFAULT_TAB;
};

export const buildPropertyWorkspacePath = (
  propertyKey,
  tabOrLegacyCategory = PROPERTY_WORKSPACE_DEFAULT_TAB,
  legacySectionId
) => {
  const resolvedTabId = resolveTabId({
    tabId: tabOrLegacyCategory,
    categoryId: tabOrLegacyCategory,
    sectionId: legacySectionId,
  });

  return `/properties/${encodeURIComponent(propertyKey)}/${resolvedTabId}`;
};

export const buildPropertyWorkspaceSectionPath = (propertyKey, tabId, sectionId) => {
  const normalizedTabId = getPropertyWorkspaceTab(tabId)?.id || PROPERTY_WORKSPACE_DEFAULT_TAB;
  const normalizedSectionId = normalizePropertyWorkspaceSectionId(normalizedTabId, sectionId);
  const basePath = buildPropertyWorkspacePath(propertyKey, normalizedTabId);

  return normalizedSectionId ? `${basePath}#${normalizedSectionId}` : basePath;
};

export const resolvePropertyWorkspaceRoute = ({ tabId, categoryId, sectionId } = {}) => {
  const resolvedTab = getPropertyWorkspaceTab(
    resolveTabId({ tabId, categoryId, sectionId })
  );

  return {
    tab: resolvedTab,
    isCanonical:
      tabId === resolvedTab.id &&
      (!categoryId || categoryId === resolvedTab.id) &&
      !sectionId,
  };
};
