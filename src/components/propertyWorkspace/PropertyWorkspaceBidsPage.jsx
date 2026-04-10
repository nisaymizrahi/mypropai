import React from "react";

import BidManagementWorkspace from "../BidManagementWorkspace";
import { WorkspacePageShell } from "./WorkspacePagePrimitives";

const PropertyWorkspaceBidsPage = ({
  activeViewId,
  renderWorkspaceButtons,
  handleViewSelect,
  handleTabSelect,
  renderLeadWorkspaceState,
  hasAcquisitionWorkspace,
  acquisitionWorkspaceId,
  pipelineLeadId,
  bids,
  renovationItems,
  budgetItems,
  vendors,
  handleBidsUpdated,
}) => {
  const actions = renderWorkspaceButtons([
    {
      label: hasAcquisitionWorkspace ? "Open budget" : "Project setup",
      onClick: () =>
        hasAcquisitionWorkspace
          ? handleViewSelect("budget", "cost-plan")
          : handleTabSelect("settings"),
    },
  ]);

  return (
    <WorkspacePageShell
      eyebrow={`Bids / ${activeViewId === "requests"
        ? "Requests"
        : activeViewId === "quotes"
          ? "Quotes"
          : activeViewId === "awards"
            ? "Awards"
            : "Comparison"}`}
      title="Keep contractor pricing organized from first request through award"
      description="This workspace keeps quote outreach, imported bids, vendor matching, and scope-level decisions in one place instead of burying them inside execution."
      actions={actions}
    >
      {!hasAcquisitionWorkspace ? (
        <section className="section-card p-5">
          <p className="text-sm leading-6 text-ink-600">
            You can start collecting quotes now from the linked deal scope. Create the budget
            workspace when you want awards to flow directly into live project budget items.
          </p>
        </section>
      ) : null}

      {renderLeadWorkspaceState({
        missingLeadTitle: "Add a deal to collect contractor pricing",
        missingLeadDescription:
          "Bids begin from the linked deal so every quote stays attached to real scope items and underwriting context.",
        inactiveTitle: "Activate deal access to use bids here",
        inactiveDescription:
          "Turn on the linked deal inside this project so scope, quotes, and awards stay connected.",
        loadingLabel: "Loading bid management...",
        renderContent: () => (
          <BidManagementWorkspace
            activeViewId={activeViewId}
            leadId={pipelineLeadId}
            investmentId={hasAcquisitionWorkspace ? acquisitionWorkspaceId : ""}
            bids={bids}
            scopeItems={renovationItems}
            budgetItems={budgetItems}
            vendors={vendors}
            onRefresh={handleBidsUpdated}
            contextLabel={hasAcquisitionWorkspace ? "project" : "deal"}
          />
        ),
      })}
    </WorkspacePageShell>
  );
};

export default PropertyWorkspaceBidsPage;
