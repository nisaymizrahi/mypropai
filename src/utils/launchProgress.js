import { INVESTOR_TERMS } from "./investorTerminology";

export const getLeadPropertyKey = (lead) =>
  typeof lead?.property === "object" ? lead.property?._id : lead?.property;

export const buildLaunchProgress = (leads = []) => {
  const dealTerms = INVESTOR_TERMS.deal;
  const firstLead = leads[0] || null;
  const analyzedLead = leads.find((lead) => Boolean(lead?.compsAnalysis)) || null;
  const workspaceLead =
    leads.find((lead) => Boolean(getLeadPropertyKey(lead) && lead?.inPropertyWorkspace)) || null;
  const leadCount = leads.length;

  const steps = [
    {
      key: "lead",
      label: `Add the ${dealTerms.lowerSingular}`,
      complete: leadCount > 0,
      detail:
        leadCount > 0
          ? `${leadCount} ${dealTerms.lowerSingular}${leadCount === 1 ? "" : "s"} already in the workspace.`
          : "Capture the first opportunity and keep the seller context attached.",
    },
    {
      key: "analysis",
      label: "Run deal analysis",
      complete: Boolean(analyzedLead),
      detail: analyzedLead?.address
        ? `Analysis is available for ${analyzedLead.address}.`
        : `Open a ${dealTerms.lowerSingular} and run comps before spending more time on the deal.`,
    },
    {
      key: "project",
      label: "Open Property Workspace",
      complete: Boolean(workspaceLead),
      detail: workspaceLead?.address
        ? `${workspaceLead.address} is already in Property Workspace.`
        : `Move the winning ${dealTerms.lowerSingular} into Property Workspace when it is ready.`,
    },
  ];

  const completedCount = steps.filter((step) => step.complete).length;

  if (!firstLead) {
    return {
      steps,
      completedCount,
      nextAction: {
        label: `Add first ${dealTerms.lowerSingular}`,
        to: "/properties/new?workspace=pipeline",
      },
    };
  }

  if (!analyzedLead) {
    return {
      steps,
      completedCount,
      nextAction: {
        label: "Run first analysis",
        to: `/leads/${firstLead._id}`,
      },
    };
  }

  if (!workspaceLead) {
    return {
      steps,
      completedCount,
      nextAction: {
        label: "Open winning deal",
        to: `/leads/${analyzedLead._id}`,
      },
    };
  }

  return {
    steps,
    completedCount,
    nextAction: {
      label: "Review deals",
      to: "/leads",
    },
  };
};
