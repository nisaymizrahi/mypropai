export const INVESTOR_TERMS = Object.freeze({
  deal: Object.freeze({
    singular: "Deal",
    plural: "Deals",
    lowerSingular: "deal",
    lowerPlural: "deals",
  }),
  property: Object.freeze({
    singular: "Property",
    plural: "Properties",
    lowerSingular: "property",
    lowerPlural: "properties",
  }),
  report: Object.freeze({
    singular: "Report",
    plural: "Reports",
    lowerSingular: "report",
    lowerPlural: "reports",
  }),
});

export const getInvestorContextLabel = (contextType = "") => {
  if (contextType === "project") return "Project";
  if (contextType === "lead") return INVESTOR_TERMS.deal.singular;
  if (contextType === "standalone") return "Standalone";
  return "Saved";
};
