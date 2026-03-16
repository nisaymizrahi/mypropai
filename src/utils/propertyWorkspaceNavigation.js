export const PROPERTY_WORKSPACE_DEFAULT_CATEGORY = "property";
export const PROPERTY_WORKSPACE_DEFAULT_SECTION = "close-snapshot";

export const PROPERTY_WORKSPACE_NAVIGATION = [
  {
    id: "property",
    label: "Property",
    sections: [
      {
        id: "close-snapshot",
        label: "Close Snapshot",
        description: "Shared profile, listing snapshot, and the core record behind this property.",
        contentKey: "details",
      },
      {
        id: "acquisition-summary",
        label: "Acquisition Summary",
        description: "A structured summary of what changed from lead assumptions to the closed deal.",
        contentKey: "acquisition-summary",
      },
      {
        id: "original-assumptions",
        label: "Original Assumptions",
        description: "Original underwriting, pricing, timing, and scope expectations kept in one place.",
        contentKey: "original-assumptions",
      },
      {
        id: "market-comps",
        label: "Market & Comps",
        description: "Lead-linked comps analysis and saved market snapshots for this property.",
        contentKey: "comps",
      },
      {
        id: "saved-reports",
        label: "Saved Reports",
        description: "Saved report snapshots so this property keeps a comps history over time.",
        contentKey: "saved-reports",
      },
      {
        id: "scope",
        label: "Scope",
        description: "Renovation planning, scope structure, and the working assumptions behind the project.",
        contentKey: "renovation",
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    sections: [
      {
        id: "health",
        label: "Financial Health",
        description: "Budget health, all-in basis, projected returns, and variance from underwriting.",
        contentKey: "finance-health",
      },
      {
        id: "sources-uses",
        label: "Sources & Uses",
        description: "Where capital came from and where it is being deployed across the property.",
        contentKey: "finance-sources-uses",
      },
      {
        id: "budget-vs-actual",
        label: "Budget vs Actual",
        description: "Expected cost, actual cost, committed cost, and forecast-to-complete in one view.",
        contentKey: "finance-budget-vs-actual",
      },
      {
        id: "capital-stack",
        label: "Capital Stack",
        description: "Multiple loans, cards, equity sources, and funding structure for the property.",
        contentKey: "finance-capital-stack",
      },
      {
        id: "reports",
        label: "Reports",
        description: "Printable finance reporting and lender or investor-ready exports.",
        contentKey: "finance-reports",
      },
    ],
  },
  {
    id: "costs",
    label: "Costs",
    sections: [
      {
        id: "bids",
        label: "Bids",
        description: "Contractor bids, comparisons, and award decisions tied to the property scope.",
        contentKey: "bids",
      },
      {
        id: "budget",
        label: "Budget",
        description: "Line-item scope budgets, expected cost tracking, and variance controls.",
        contentKey: "costs-budget",
      },
      {
        id: "expenses",
        label: "Expenses",
        description: "Receipt-driven expense capture, categorization, and budget matching.",
        contentKey: "costs-expenses",
      },
      {
        id: "commitments",
        label: "Commitments",
        description: "Vendor awards, unpaid approved costs, and committed spend across the job.",
        contentKey: "costs-commitments",
      },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    sections: [
      {
        id: "overview",
        label: "Overview",
        description: "Closing files, lender docs, invoices, contracts, and reports organized by type.",
        contentKey: "documents-overview",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    sections: [
      {
        id: "tasks",
        label: "Tasks",
        description: "Property-wide tasks and follow-ups tied directly to this record.",
        contentKey: "tasks",
      },
      {
        id: "schedule",
        label: "Schedule",
        description: "A visual execution schedule for vendors, milestones, and upcoming dates.",
        contentKey: "operations-schedule",
      },
      {
        id: "timeline",
        label: "Timeline",
        description: "A colorful, event-based timeline across vendors, lender events, and milestones.",
        contentKey: "operations-timeline",
      },
      {
        id: "vendors",
        label: "Vendors",
        description: "A future property-level vendor view connected to bids, compliance, and payments.",
        contentKey: "operations-vendors",
      },
      {
        id: "activity",
        label: "Activity",
        description: "A consolidated activity stream across this property workspace.",
        contentKey: "operations-activity",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    sections: [
      {
        id: "workspace",
        label: "Workspace",
        description: "Control where this property lives and how the workspace is enrolled.",
        contentKey: "settings",
      },
    ],
  },
];

export const getPropertyWorkspaceCategory = (categoryId) =>
  PROPERTY_WORKSPACE_NAVIGATION.find((category) => category.id === categoryId) ||
  PROPERTY_WORKSPACE_NAVIGATION.find(
    (category) => category.id === PROPERTY_WORKSPACE_DEFAULT_CATEGORY
  );

export const getPropertyWorkspaceSection = (categoryId, sectionId) => {
  const category = getPropertyWorkspaceCategory(categoryId);
  if (!category) return null;

  return (
    category.sections.find((section) => section.id === sectionId) ||
    category.sections[0] ||
    null
  );
};

export const buildPropertyWorkspacePath = (
  propertyKey,
  categoryId = PROPERTY_WORKSPACE_DEFAULT_CATEGORY,
  sectionId = PROPERTY_WORKSPACE_DEFAULT_SECTION
) =>
  `/properties/${encodeURIComponent(propertyKey)}/${categoryId}/${sectionId}`;

export const resolvePropertyWorkspaceRoute = (categoryId, sectionId) => {
  const category = getPropertyWorkspaceCategory(categoryId);
  const section = getPropertyWorkspaceSection(category?.id, sectionId);

  return {
    category,
    section,
    isCanonical:
      category?.id === (categoryId || PROPERTY_WORKSPACE_DEFAULT_CATEGORY) &&
      section?.id ===
        (sectionId ||
          getPropertyWorkspaceSection(
            category?.id || PROPERTY_WORKSPACE_DEFAULT_CATEGORY,
            sectionId
          )?.id),
  };
};
