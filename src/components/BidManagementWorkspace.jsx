import React from "react";

import BidAwardsPanel from "./BidAwardsPanel";
import BidsTab from "./BidsTab";
import QuoteRequestsPanel from "./QuoteRequestsPanel";

const getViewCopy = (activeViewId, contextLabel = "project") => {
  if (activeViewId === "requests") {
    return {
      eyebrow: "Bids / Requests",
      title: "Request pricing without losing scope context",
      description:
        `Track who was asked for pricing, when it is due, and which quote belongs to which ${contextLabel} scope item.`,
    };
  }

  if (activeViewId === "quotes") {
    return {
      eyebrow: "Bids / Quotes",
      title: "Import and organize contractor quotes",
      description:
        "Drag in contractor bids, let AI extract the vendor and pricing details, and keep every quote in one clean library.",
    };
  }

  if (activeViewId === "awards") {
    return {
      eyebrow: "Bids / Awards",
      title: "Keep winning quotes ready for execution",
      description:
        `See which contractor pricing already won work and keep the accepted scope tied back to the ${contextLabel}.`,
    };
  }

  return {
    eyebrow: "Bids / Comparison",
    title: "Compare vendors by scope item before you award",
    description:
      "Review the lowest price, quote coverage, and confidence by item so awards stay deliberate instead of rushed.",
  };
};

const BidManagementWorkspace = ({
  activeViewId = "comparison",
  leadId,
  investmentId = "",
  bids = [],
  scopeItems = [],
  budgetItems = [],
  vendors = [],
  onRefresh,
  contextLabel = "project",
}) => {
  const copy = getViewCopy(activeViewId, contextLabel);

  if (activeViewId === "requests") {
    return (
      <QuoteRequestsPanel
        leadId={leadId}
        investmentId={investmentId}
        scopeItems={scopeItems}
        bids={bids}
        vendors={vendors}
        onRequestsChanged={onRefresh}
      />
    );
  }

  if (activeViewId === "awards") {
    return <BidAwardsPanel bids={bids} />;
  }

  return (
    <BidsTab
      leadId={leadId}
      investmentId={investmentId}
      bids={bids}
      renovationItems={scopeItems}
      budgetItems={budgetItems}
      onUpdate={onRefresh}
      displayMode={activeViewId === "quotes" ? "quotes" : "comparison"}
      heading={copy.title}
      description={copy.description}
      eyebrow={copy.eyebrow}
    />
  );
};

export default BidManagementWorkspace;
