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

export const getPropertyWorkspaceTab = (tabId) =>
  PROPERTY_WORKSPACE_TABS.find((tab) => tab.id === tabId) ||
  PROPERTY_WORKSPACE_TABS.find((tab) => tab.id === PROPERTY_WORKSPACE_DEFAULT_TAB);

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
