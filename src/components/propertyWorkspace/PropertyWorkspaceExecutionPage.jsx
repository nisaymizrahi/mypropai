import React from "react";

import BidsTab from "../BidsTab";
import PropertyCostsPanel from "../PropertyCostsPanel";
import PropertyOperationsPanel from "../PropertyOperationsPanel";
import TasksPanel from "../TasksPanel";
import { WorkspacePageShell } from "./WorkspacePagePrimitives";

const PropertyWorkspaceExecutionPage = ({
  activeViewId,
  hasAcquisitionWorkspace,
  renderAcquisitionSetup,
  property,
  propertyKey,
  syncPropertyState,
  workspaceSurfaceVersion,
  renderLeadWorkspaceState,
  pipelineLeadId,
  bids,
  renovationItems,
  handleBidsUpdated,
  loadPropertyTasks,
}) => {
  if (activeViewId === "schedule") {
    return (
      <WorkspacePageShell
        eyebrow="Execution / Schedule"
        title="Keep milestones, timing, and delivery sequence visible"
        description="Stay close to the operating calendar and timeline without mixing it with the rest of the workspace."
      >
        {hasAcquisitionWorkspace ? (
          <div className="space-y-5">
            <PropertyOperationsPanel
              key={`execution-schedule-${workspaceSurfaceVersion}`}
              property={property}
              propertyKey={propertyKey}
              activeContentKey="operations-schedule"
              onPropertyUpdated={syncPropertyState}
              embedded
            />
            <PropertyOperationsPanel
              key={`execution-timeline-${workspaceSurfaceVersion}`}
              property={property}
              propertyKey={propertyKey}
              activeContentKey="operations-timeline"
              onPropertyUpdated={syncPropertyState}
              embedded
            />
          </div>
        ) : (
          renderAcquisitionSetup({
            title: "Set up budget workspace to unlock schedule tools",
            description:
              "Schedules, milestones, and the delivery timeline begin after the budget workspace is active.",
            buttonLabel: "Create budget workspace",
          })
        )}
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "vendors") {
    return (
      <WorkspacePageShell
        eyebrow="Execution / Vendors"
        title="Keep the subcontractor roster clean and current"
        description="Manage vendor records, assigned relationships, and supporting context in one dedicated page."
      >
        {hasAcquisitionWorkspace ? (
          <PropertyOperationsPanel
            key={`execution-vendors-${workspaceSurfaceVersion}`}
            property={property}
            propertyKey={propertyKey}
            activeContentKey="operations-vendors"
            onPropertyUpdated={syncPropertyState}
            embedded
          />
        ) : (
          renderAcquisitionSetup({
            title: "Set up budget workspace to unlock vendor management",
            description:
              "Vendor records, assignments, and project support begin after the budget workspace is active.",
            buttonLabel: "Create budget workspace",
          })
        )}
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "procurement") {
    return (
      <WorkspacePageShell
        eyebrow="Execution / Procurement"
        title="Stay on top of awarded work, bids, and packet readiness"
        description="Use procurement for commitments, bid comparison, and making sure scope has real vendor coverage."
      >
        <div className="space-y-5">
          {hasAcquisitionWorkspace ? (
            <PropertyCostsPanel
              key={`execution-procurement-${workspaceSurfaceVersion}`}
              property={property}
              propertyKey={propertyKey}
              activeContentKey="costs-commitments"
              onPropertyUpdated={syncPropertyState}
              embedded
            />
          ) : (
            <div className="rounded-[18px] border border-ink-100 bg-sand-50/70 px-5 py-4 text-sm leading-6 text-ink-600">
              Commitments and awarded work will appear here once the budget workspace is created.
            </div>
          )}

          {renderLeadWorkspaceState({
            missingLeadTitle: "Add a deal to manage bids",
            missingLeadDescription:
              "Bids start on the linked deal and carry into the project scope once the budget workspace is created.",
            inactiveTitle: "Activate deal access to manage bids here",
            inactiveDescription:
              "Turn on the linked deal inside this project to use bid tools here.",
            loadingLabel: "Loading bid management...",
            renderContent: () => (
              <BidsTab
                leadId={pipelineLeadId}
                investmentId={property?.workspaces?.acquisitions?.id || ""}
                bids={bids}
                renovationItems={renovationItems}
                onUpdate={handleBidsUpdated}
              />
            ),
          })}
        </div>
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "scope") {
    return (
      <WorkspacePageShell
        eyebrow="Execution / Scope"
        title="Run the job from scope categories and vendor coverage"
        description="This is the execution-facing scope page for commitments, related tasks, receipts, bids, and budget visibility."
      >
        {hasAcquisitionWorkspace ? (
          <PropertyCostsPanel
            key={`execution-scope-${workspaceSurfaceVersion}`}
            property={property}
            propertyKey={propertyKey}
            activeContentKey="costs-cost-plan"
            onPropertyUpdated={syncPropertyState}
            embedded
          />
        ) : (
          renderAcquisitionSetup({
            title: "Set up budget workspace to unlock scope execution",
            description:
              "Scope categories, commitments, and working budget controls begin after the budget workspace is created.",
            buttonLabel: "Create budget workspace",
          })
        )}
      </WorkspacePageShell>
    );
  }

  return (
    <WorkspacePageShell
      eyebrow="Execution / Tasks"
      title="Keep the daily work queue easy to run"
      description="Track follow-ups, field work, and next actions for this specific project without mixing them into the broader task center."
    >
      <TasksPanel
        key={`execution-tasks-${workspaceSurfaceVersion}`}
        title="Project tasks"
        description="Track follow-ups, next steps, and operating work for this project."
        query={{
          propertyKey: property.propertyKey,
        }}
        defaults={{
          sourceType: "property",
          sourceId: property.propertyKey,
          sourceLabel: property.title || "Property",
          propertyKey: property.propertyKey,
        }}
        emptyTitle="No tasks yet"
        emptyDescription="Add the first task and it will also show up in the main task center."
        embedded
        onTasksChanged={() => loadPropertyTasks(property.propertyKey)}
      />
    </WorkspacePageShell>
  );
};

export default PropertyWorkspaceExecutionPage;
