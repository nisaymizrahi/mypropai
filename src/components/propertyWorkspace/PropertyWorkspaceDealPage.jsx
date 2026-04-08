import React from "react";
import { Link } from "react-router-dom";

import LeadRenovationTab from "../LeadRenovationTab";
import MasterDealReportWorkspace from "../MasterDealReportWorkspace";
import PropertySummaryPanel from "../PropertySummaryPanel";
import SavedCompsReportsTab from "../SavedCompsReportsTab";
import { WorkspacePageShell } from "./WorkspacePagePrimitives";

const PropertyWorkspaceDealPage = ({
  activeViewId,
  buildDealSectionAction,
  renderWorkspaceButtons,
  handleOpenPropertyDetails,
  hasAcquisitionWorkspace,
  handleViewSelect,
  handleTabSelect,
  renderLeadWorkspaceState,
  pipelineLeadId,
  property,
  leadWorkspace,
  handleLeadUpdated,
  analysis,
  filters,
  dealForm,
  handleLeadFilterChange,
  handleLeadDealChange,
  isAnalyzing,
  handleRunLeadAnalysis,
  billingAccess,
  isBillingAccessLoading,
  handleStartSubscription,
  isStartingSubscription,
  handleBuyCredits,
  isStartingCheckout,
  handleSaveLeadReport,
  isSavingReport,
  acquisitionWorkspaceId,
  compsNotice,
  pipelineLeadPath,
  leadPricingSummary,
  savedReports,
  savedReportsLoading,
  formatCurrency,
}) => {
  const reportAction = buildDealSectionAction("Run Deal Report", "reports");
  const scopeAction = buildDealSectionAction("Edit scope", "renovation-scope");
  const summaryActions = [
    {
      label: "Property details",
      onClick: handleOpenPropertyDetails,
    },
    {
      label: "Open budget",
      onClick: () =>
        hasAcquisitionWorkspace
          ? handleViewSelect("budget", "cost-plan")
          : handleTabSelect("settings"),
    },
    scopeAction,
  ];
  const reportActions = [
    reportAction,
    {
      label: "Open deal summary",
      onClick: () => handleViewSelect("deal", "summary"),
    },
  ];

  if (activeViewId === "reports") {
    return (
      <WorkspacePageShell
        eyebrow="Deal / Reports"
        title="Run comps and keep Deal Report history attached to execution"
        description="This page keeps the latest analysis, saved reports, and underwriting history tied back to the live project."
        actions={renderWorkspaceButtons(reportActions)}
      >
        {renderLeadWorkspaceState({
          missingLeadTitle: "Add a deal to run the Deal Report",
          missingLeadDescription:
            "Comps start on the linked deal, then saved reports carry into the project once the budget workspace exists.",
          inactiveTitle: "Activate deal access to run reports here",
          inactiveDescription:
            "Turn on the linked deal inside this project to use the Deal tab here.",
          loadingLabel: "Loading Deal Report...",
          renderContent: () => (
            <div className="space-y-5">
              <MasterDealReportWorkspace
                subject={leadWorkspace}
                report={analysis}
                filters={filters}
                deal={dealForm}
                onFilterChange={handleLeadFilterChange}
                onDealChange={handleLeadDealChange}
                isAnalyzing={isAnalyzing}
                onRunAnalysis={handleRunLeadAnalysis}
                billingAccess={billingAccess}
                isBillingAccessLoading={isBillingAccessLoading}
                onStartSubscription={handleStartSubscription}
                isStartingSubscription={isStartingSubscription}
                onBuyReport={handleBuyCredits}
                isStartingCheckout={isStartingCheckout}
                onSaveReport={handleSaveLeadReport}
                isSavingReport={isSavingReport}
                saveButtonLabel={
                  acquisitionWorkspaceId ? "Save to project history" : "Save Deal Report"
                }
                runButtonLabel="Run Deal Report"
                showOneTimeCheckout
                reportNotice={compsNotice}
                renderSubjectPanel={() => (
                  <div className="section-card p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-ink-900">Deal snapshot</h3>
                        <p className="mt-1 text-sm text-ink-500">
                          Subject facts and pricing come from the linked deal.
                        </p>
                      </div>
                      {pipelineLeadPath ? (
                        <Link to={pipelineLeadPath} className="ghost-action">
                          Open deal
                        </Link>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Property
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink-900">
                          {[
                            leadWorkspace.propertyType,
                            leadWorkspace.squareFootage
                              ? `${Number(leadWorkspace.squareFootage).toLocaleString()} sqft`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" • ") || "No property facts saved yet"}
                        </p>
                      </div>
                      <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Pricing
                        </p>
                        <p className="mt-2 text-sm font-semibold text-ink-900">
                          Ask {formatCurrency(leadPricingSummary.askingPrice)}
                        </p>
                        <p className="mt-1 text-xs text-ink-500">
                          Target {formatCurrency(leadPricingSummary.targetOffer)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              />

              <SavedCompsReportsTab
                reports={savedReports}
                isLoading={savedReportsLoading}
                title={
                  acquisitionWorkspaceId
                    ? "Saved project and deal reports"
                    : "Saved deal reports"
                }
                description={
                  acquisitionWorkspaceId
                    ? "Deal-era analysis and project-era report updates live together here so execution never loses the underwriting thread."
                    : "Every saved Deal Report for this property lives here."
                }
                emptyTitle="No reports saved yet"
                emptyMessage={
                  acquisitionWorkspaceId
                    ? "Run the Deal Report and save it. New reports will attach to the project while older deal analysis stays visible here."
                    : "Run the Deal Report, save it, and it will appear here."
                }
                actions={renderWorkspaceButtons(reportActions)}
              />
            </div>
          ),
        })}
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "renovation-scope") {
    return (
      <WorkspacePageShell
        eyebrow="Deal / Renovation Scope"
        title="Keep renovation assumptions tied to the live project"
        description="This page keeps the deal-era renovation plan close to current project execution."
        actions={renderWorkspaceButtons([
          {
            label: "Property details",
            onClick: handleOpenPropertyDetails,
          },
          {
            label: "Open budget",
            onClick: () =>
              hasAcquisitionWorkspace
                ? handleViewSelect("budget", "cost-plan")
                : handleTabSelect("settings"),
          },
        ])}
      >
        {renderLeadWorkspaceState({
          missingLeadTitle: "Add a deal to manage scope",
          missingLeadDescription: "Renovation scope starts on the linked deal.",
          inactiveTitle: "Activate deal access to edit scope here",
          inactiveDescription:
            "Turn on the linked deal inside this project to edit scope here.",
          loadingLabel: "Loading renovation plan...",
          renderContent: () => (
            <LeadRenovationTab
              lead={leadWorkspace}
              leadId={pipelineLeadId}
              onLeadUpdated={handleLeadUpdated}
            />
          ),
        })}
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "underwriting-vs-actuals") {
    return (
      <WorkspacePageShell
        eyebrow="Deal / Underwriting vs Actuals"
        title="Compare the original thesis against what the project is telling you now"
        description="Keep the acquisition logic honest by comparing live project reality against saved underwriting assumptions."
        actions={renderWorkspaceButtons(summaryActions)}
      >
        <PropertySummaryPanel
          property={property}
          propertyKey={property.propertyKey}
          activeContentKey="original-assumptions"
          leadWorkspace={leadWorkspace}
          savedReports={savedReports}
          pipelineLeadPath={pipelineLeadPath}
          embedded
          embeddedActions={renderWorkspaceButtons(summaryActions)}
          emptyActions={renderWorkspaceButtons([
            reportAction,
            {
              label: "Property details",
              onClick: handleOpenPropertyDetails,
            },
          ])}
        />
      </WorkspacePageShell>
    );
  }

  return (
    <WorkspacePageShell
      eyebrow="Deal / Summary"
      title="Keep the acquisition story visible inside the project"
      description="This page keeps the deal summary, pricing context, and latest underwriting signal close to the live project."
      actions={renderWorkspaceButtons(summaryActions)}
    >
      <PropertySummaryPanel
        property={property}
        propertyKey={property.propertyKey}
        activeContentKey="acquisition-summary"
        leadWorkspace={leadWorkspace}
        savedReports={savedReports}
        pipelineLeadPath={pipelineLeadPath}
        embedded
        embeddedActions={renderWorkspaceButtons(summaryActions)}
        emptyActions={renderWorkspaceButtons([
          reportAction,
          {
            label: "Property details",
            onClick: handleOpenPropertyDetails,
          },
        ])}
      />
    </WorkspacePageShell>
  );
};

export default PropertyWorkspaceDealPage;
