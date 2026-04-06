export const PROPERTY_WORKSPACE_DEFAULT_TAB = "overview";

export const PROPERTY_WORKSPACE_TABS = [
  {
    id: "overview",
    label: "Overview",
    description: "Property identity, status, KPIs, activity, and quick actions.",
  },
  {
    id: "financials",
    label: "Financials",
    description: "Budget, expenses, capital, lenders, draws, and profitability.",
  },
  {
    id: "work",
    label: "Work",
    description: "Tasks, schedule, vendors, bids, commitments, and execution.",
  },
  {
    id: "documents",
    label: "Documents",
    description: "Uploads, categories, recent files, and linked support docs.",
  },
  {
    id: "analysis",
    label: "Analysis",
    description: "Comps, reports, assumptions, scope, and deal analysis.",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Workspace status, linked records, and property-level controls.",
  },
];

const LEGACY_ROUTE_TO_TAB = {
  "property:close-snapshot": "overview",
  "property:acquisition-summary": "analysis",
  "property:original-assumptions": "analysis",
  "property:market-comps": "analysis",
  "property:saved-reports": "analysis",
  "property:scope": "analysis",
  "finance:health": "financials",
  "finance:sources-uses": "financials",
  "finance:budget-vs-actual": "financials",
  "finance:capital-stack": "financials",
  "finance:draw-operations": "financials",
  "finance:payment-schedule": "financials",
  "finance:reports": "financials",
  "costs:bids": "work",
  "costs:budget": "financials",
  "costs:expenses": "financials",
  "costs:commitments": "work",
  "documents:overview": "documents",
  "operations:tasks": "work",
  "operations:schedule": "work",
  "operations:timeline": "work",
  "operations:vendors": "work",
  "operations:activity": "overview",
  "settings:workspace": "settings",
};

const LEGACY_CATEGORY_TO_TAB = {
  property: "overview",
  finance: "financials",
  costs: "financials",
  documents: "documents",
  operations: "work",
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
