export const IMAGE_ASSET_SLOTS = {
  marketing: {
    homepageHero: {
      route: "/",
      finalPath: "/assets/marketing/home-hero-dashboard-v2.png",
      destination: "public/assets/marketing/home-hero-dashboard-v2.png",
      notes: "Primary homepage hero image.",
    },
    homepageDecisionRail: {
      route: "/",
      finalPath: "/assets/marketing/home-decision-rail-v2.png",
      destination: "public/assets/marketing/home-decision-rail-v2.png",
      notes: "Supports the decision-preview section.",
    },
    productArchitecture: {
      route: "/product",
      finalPath: "/assets/marketing/product-architecture-v2.png",
      destination: "public/assets/marketing/product-architecture-v2.png",
      notes: "Supports product architecture storytelling.",
    },
    pricingCredits: {
      route: "/pricing",
      finalPath: "/assets/marketing/pricing-credits-explainer-v2.png",
      destination: "public/assets/marketing/pricing-credits-explainer-v2.png",
      notes: "Explains credits, trial, and top-ups.",
    },
    comparePreview: {
      route: "/compare/flipper-force",
      finalPath: "/assets/marketing/compare-workflow-preview-v2.png",
      destination: "public/assets/marketing/compare-workflow-preview-v2.png",
      notes: "Comparison support visual.",
    },
  },
  acquisition: {
    leadsHero: {
      route: "/leads",
      finalPath: "/assets/acquisition/leads-pipeline-hero-v2.png",
      destination: "public/assets/acquisition/leads-pipeline-hero-v2.png",
      notes: "Top-of-page pipeline visual.",
    },
    leadDetailCover: {
      route: "/leads/:id",
      finalPath: "/assets/acquisition/lead-detail-underwrite-v2.png",
      destination: "public/assets/acquisition/lead-detail-underwrite-v2.png",
      notes: "Single-property underwriting cover art.",
    },
    marketSearchVisual: {
      route: "/market-search",
      finalPath: "/assets/acquisition/market-search-opportunity-v2.png",
      destination: "public/assets/acquisition/market-search-opportunity-v2.png",
      notes: "Search map and listing opportunity visual.",
    },
    compsReportCover: {
      route: "/comps-report",
      finalPath: "/assets/acquisition/comps-report-cover-v2.png",
      destination: "public/assets/acquisition/comps-report-cover-v2.png",
      notes: "Investor-facing comps report cover image.",
    },
    createPropertyEntry: {
      route: "/properties/new",
      finalPath: "/assets/acquisition/create-property-entry-v2.png",
      destination: "public/assets/acquisition/create-property-entry-v2.png",
      notes: "Onboarding visual for the add-property flow.",
    },
  },
  workspace: {
    dashboardSnapshot: {
      route: "/dashboard",
      finalPath: "/assets/workspace/dashboard-executive-snapshot-v2.png",
      destination: "public/assets/workspace/dashboard-executive-snapshot-v2.png",
      notes: "Executive snapshot image for dashboard summaries.",
    },
    propertyWorkspaceHeader: {
      route: "/properties/:propertyKey",
      finalPath: "/assets/workspace/property-workspace-header-v2.png",
      destination: "public/assets/workspace/property-workspace-header-v2.png",
      notes: "Primary workspace hero visual.",
    },
    propertyOverviewState: {
      route: "/properties/:propertyKey/overview",
      finalPath: "/assets/workspace/property-overview-state-v2.png",
      destination: "public/assets/workspace/property-overview-state-v2.png",
      notes: "Overview support or empty-state visual.",
    },
    propertyFinancialsState: {
      route: "/properties/:propertyKey/financials",
      finalPath: "/assets/workspace/property-financials-state-v2.png",
      destination: "public/assets/workspace/property-financials-state-v2.png",
      notes: "Financial modeling and budget support visual.",
    },
    propertyWorkState: {
      route: "/properties/:propertyKey/work",
      finalPath: "/assets/workspace/property-work-ops-v2.png",
      destination: "public/assets/workspace/property-work-ops-v2.png",
      notes: "Execution and vendor support visual.",
    },
    propertyDocumentsState: {
      route: "/properties/:propertyKey/documents",
      finalPath: "/assets/workspace/property-documents-vault-v2.png",
      destination: "public/assets/workspace/property-documents-vault-v2.png",
      notes: "Documents and operational memory visual.",
    },
    propertyAnalysisState: {
      route: "/properties/:propertyKey/analysis",
      finalPath: "/assets/workspace/property-analysis-report-v2.png",
      destination: "public/assets/workspace/property-analysis-report-v2.png",
      notes: "Analysis and saved-report support visual.",
    },
  },
  operations: {
    propertiesOverview: {
      route: "/properties",
      finalPath: "/assets/ops/properties-overview-v2.png",
      destination: "public/assets/ops/properties-overview-v2.png",
      notes: "Portfolio visual for properties page.",
    },
    tasksQueue: {
      route: "/tasks",
      finalPath: "/assets/ops/tasks-queue-v2.png",
      destination: "public/assets/ops/tasks-queue-v2.png",
      notes: "Task orchestration visual.",
    },
    masterCalendar: {
      route: "/master-calendar",
      finalPath: "/assets/ops/master-calendar-v2.png",
      destination: "public/assets/ops/master-calendar-v2.png",
      notes: "Calendar coordination visual.",
    },
    vendorsNetwork: {
      route: "/vendors",
      finalPath: "/assets/ops/vendors-network-v2.png",
      destination: "public/assets/ops/vendors-network-v2.png",
      notes: "Vendor network visual.",
    },
  },
  account: {
    authTrust: {
      route: "/login",
      finalPath: "/assets/account/auth-trust-visual-v2.png",
      destination: "public/assets/account/auth-trust-visual-v2.png",
      notes: "Shared auth-page trust visual.",
    },
    profileSetup: {
      route: "/complete-profile",
      finalPath: "/assets/account/profile-setup-v2.png",
      destination: "public/assets/account/profile-setup-v2.png",
      notes: "Profile setup onboarding visual.",
    },
    billingCenter: {
      route: "/account",
      finalPath: "/assets/account/billing-center-v2.png",
      destination: "public/assets/account/billing-center-v2.png",
      notes: "Billing and credits visual.",
    },
    platformManager: {
      route: "/platform-manager",
      finalPath: "/assets/account/platform-manager-v2.png",
      destination: "public/assets/account/platform-manager-v2.png",
      notes: "Admin control-center visual.",
    },
  },
  states: {
    noLeads: {
      route: "/leads",
      finalPath: "/assets/states/no-leads-v2.png",
      destination: "public/assets/states/no-leads-v2.png",
      notes: "Lead empty state visual.",
    },
    noProperties: {
      route: "/properties",
      finalPath: "/assets/states/no-properties-v2.png",
      destination: "public/assets/states/no-properties-v2.png",
      notes: "Portfolio empty state visual.",
    },
    noDocuments: {
      route: "/properties/:propertyKey/documents",
      finalPath: "/assets/states/no-documents-v2.png",
      destination: "public/assets/states/no-documents-v2.png",
      notes: "Documents and reports empty state visual.",
    },
    helpSupport: {
      route: "/help",
      finalPath: "/assets/states/help-support-v2.png",
      destination: "public/assets/states/help-support-v2.png",
      notes: "Help and support visual.",
    },
  },
};

export const PHASE_ONE_IMAGE_ASSET_KEYS = [
  "marketing.homepageHero",
  "marketing.homepageDecisionRail",
  "marketing.productArchitecture",
  "marketing.pricingCredits",
  "marketing.comparePreview",
  "acquisition.leadsHero",
  "acquisition.leadDetailCover",
  "acquisition.marketSearchVisual",
  "acquisition.compsReportCover",
  "acquisition.createPropertyEntry",
];
