import React from "react";

import ProjectUpdatesPanel from "../ProjectUpdatesPanel";
import {
  ActionQueueCard,
  StatCard,
  WorkspaceLaunchCard,
  WorkspacePageShell,
} from "./WorkspacePagePrimitives";

const PropertyWorkspaceHomePage = ({
  activeViewId,
  handleOpenProjectUpdateComposer,
  handleTabSelect,
  handleViewSelect,
  handleDeleteProjectUpdate,
  handleOpenPropertyDetails,
  hasAcquisitionWorkspace,
  nextStepCard,
  dealHealthCard,
  budgetHealthCard,
  executionHealthCard,
  procurementHealthCard,
  homeActionQueue,
  procurementSummary,
  fundingLinkedPaymentCount,
  drawLinkedPaymentCount,
  fundingSupportGapCount,
  drawSupportGapCount,
  recentActivity,
  formatDateTime,
  propertyTasksError,
  propertyTasksLoading,
  nextPropertyTasks,
  formatCompactDate,
  isTaskOverdue,
  sortedProjectUpdates,
  projectUpdatesLoading,
  projectUpdatesError,
  detailLine,
  listingSummary,
  property,
  workspaceCount,
  contractFileCount,
  receiptFileCount,
  photoFileCount,
  paymentSupportGapCount,
  renderWorkspaceButtons,
}) => {
  if (activeViewId === "at-risk") {
    return (
      <WorkspacePageShell
        eyebrow="Home / At Risk"
        title="Watch the pressure points before they become misses"
        description="Pull budget pressure, procurement gaps, schedule risk, and lender readiness into one review page."
        actions={renderWorkspaceButtons([
          {
            label: "Open procurement",
            onClick: () => handleViewSelect("execution", "procurement"),
          },
          {
            label: hasAcquisitionWorkspace ? "Open capital" : "Project setup",
            onClick: () =>
              hasAcquisitionWorkspace
                ? handleViewSelect("budget", "capital")
                : handleTabSelect("settings"),
          },
        ])}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Next step"
            value={nextStepCard.value}
            helper={nextStepCard.helper}
            tone={nextStepCard.tone}
          />
          <StatCard
            label="Deal health"
            value={dealHealthCard.value}
            helper={dealHealthCard.helper}
            tone={dealHealthCard.tone}
          />
          <StatCard
            label="Budget health"
            value={budgetHealthCard.value}
            helper={budgetHealthCard.helper}
            tone={budgetHealthCard.tone}
          />
          <StatCard
            label="Procurement"
            value={procurementHealthCard.value}
            helper={procurementHealthCard.helper}
            tone={procurementHealthCard.tone}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_380px]">
          <section className="section-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Priority queue
                </p>
                <h3 className="mt-2 text-lg font-semibold text-ink-900">What needs review first</h3>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {homeActionQueue.map((action) => (
                <ActionQueueCard
                  key={action.id}
                  title={action.title}
                  detail={action.detail}
                  label={action.label}
                  onClick={action.onClick}
                  disabled={action.disabled}
                />
              ))}
            </div>
          </section>

          <div className="space-y-4">
            <div className="section-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Procurement
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-ink-900">Coverage and packet signal</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleViewSelect("execution", "procurement")}
                  className="ghost-action"
                >
                  Open procurement
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink-500">{procurementSummary}</p>
            </div>

            <div className="section-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Capital
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-ink-900">Funding and draw linkage</h3>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    hasAcquisitionWorkspace
                      ? handleViewSelect("budget", "capital")
                      : handleTabSelect("settings")
                  }
                  className="ghost-action"
                >
                  {hasAcquisitionWorkspace ? "Open capital" : "Open setup"}
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink-500">
                {hasAcquisitionWorkspace
                  ? `${fundingLinkedPaymentCount} payment${fundingLinkedPaymentCount === 1 ? "" : "s"} are linked to funding sources, ${drawLinkedPaymentCount} payment${drawLinkedPaymentCount === 1 ? "" : "s"} are tied to draw records, ${fundingSupportGapCount} funding source${fundingSupportGapCount === 1 ? "" : "s"} still need support files, and ${drawSupportGapCount} draw request${drawSupportGapCount === 1 ? "" : "s"} still need file support.`
                  : "Set up the budget workspace to unlock capital planning, lender notes, and draw readiness."}
              </p>
            </div>
          </div>
        </div>
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "updates") {
    return (
      <WorkspacePageShell
        eyebrow="Home / Updates"
        title="Keep the internal project narrative tight"
        description="Use updates for site notes, vendor follow-ups, lender notes, and issues that the rest of the workspace should react to."
        actions={renderWorkspaceButtons([
          {
            label: "Add update",
            onClick: () => handleOpenProjectUpdateComposer(),
          },
        ])}
      >
        <ProjectUpdatesPanel
          updates={sortedProjectUpdates}
          isLoading={projectUpdatesLoading}
          error={projectUpdatesError}
          onAdd={() => handleOpenProjectUpdateComposer()}
          onEdit={handleOpenProjectUpdateComposer}
          onDelete={handleDeleteProjectUpdate}
        />
      </WorkspacePageShell>
    );
  }

  if (activeViewId === "property-details") {
    return (
      <WorkspacePageShell
        eyebrow="Home / Property Details"
        title="Keep the asset profile easy to reference"
        description="Asset facts, listing context, and linked record count stay visible here without turning Home into a long edit form."
        actions={renderWorkspaceButtons([
          {
            label: "Edit property details",
            onClick: handleOpenPropertyDetails,
          },
          {
            label: "Project setup",
            onClick: () => handleTabSelect("settings"),
          },
        ])}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Asset profile</p>
            <p className="mt-2 text-sm font-semibold text-ink-900">{detailLine}</p>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Listing</p>
            <p className="mt-2 text-sm font-semibold text-ink-900">{listingSummary?.label || "Not listed"}</p>
            <p className="mt-1 text-xs text-ink-500">{listingSummary?.price || "No asking price saved."}</p>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Property key</p>
            <p className="mt-2 break-all text-sm font-semibold text-ink-900">{property.propertyKey}</p>
          </div>
          <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Linked records</p>
            <p className="mt-2 text-sm font-semibold text-ink-900">{workspaceCount}</p>
            <p className="mt-1 text-xs text-ink-500">Deal, budget, and management records</p>
          </div>
        </div>
      </WorkspacePageShell>
    );
  }

  return (
    <WorkspacePageShell
      eyebrow="Home / Today"
      title="Run the next move from one calm operating page"
      description="Keep next actions, upcoming work, recent signal, and fast launch points in one tight project command center."
      actions={renderWorkspaceButtons([
        {
          label: "Add update",
          onClick: () => handleOpenProjectUpdateComposer(),
        },
        {
          label: "Project setup",
          onClick: () => handleTabSelect("settings"),
        },
      ])}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Next step"
          value={nextStepCard.value}
          helper={nextStepCard.helper}
          tone={nextStepCard.tone}
        />
        <StatCard
          label="Execution"
          value={executionHealthCard.value}
          helper={executionHealthCard.helper}
          tone={executionHealthCard.tone}
        />
        <StatCard
          label="Budget"
          value={budgetHealthCard.value}
          helper={budgetHealthCard.helper}
          tone={budgetHealthCard.tone}
        />
        <StatCard
          label="Procurement"
          value={procurementHealthCard.value}
          helper={procurementHealthCard.helper}
          tone={procurementHealthCard.tone}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_390px]">
        <div className="space-y-5">
          <section className="section-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Action queue
                </p>
                <h3 className="mt-2 text-lg font-semibold text-ink-900">What to do next</h3>
              </div>
              <div className="workspace-counter-pill">
                {homeActionQueue.length} priority action{homeActionQueue.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {homeActionQueue.map((action) => (
                <ActionQueueCard
                  key={action.id}
                  title={action.title}
                  detail={action.detail}
                  label={action.label}
                  onClick={action.onClick}
                  disabled={action.disabled}
                />
              ))}
            </div>
          </section>

          <section className="section-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Cross-workspace movement
                </p>
                <h3 className="mt-2 text-lg font-semibold text-ink-900">What changed across the project</h3>
              </div>
              <button
                type="button"
                onClick={() => handleViewSelect("home", "updates")}
                className="ghost-action"
              >
                Open updates
              </button>
            </div>

            {recentActivity.length > 0 ? (
              <div className="mt-5 space-y-3">
                {recentActivity.map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                        <p className="mt-1 text-sm text-ink-500">{item.detail}</p>
                      </div>
                      <span className="text-xs font-medium text-ink-400">
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-ink-500">No recent cross-workspace movement yet.</p>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-[22px] border border-ink-100 bg-white/92 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Upcoming work
                </p>
                <h3 className="mt-2 text-lg font-semibold text-ink-900">What needs attention next</h3>
              </div>
              <button
                type="button"
                onClick={() => handleViewSelect("execution", "tasks")}
                className="ghost-action"
              >
                Open tasks
              </button>
            </div>

            {propertyTasksError ? (
              <p className="mt-4 text-sm text-clay-700">{propertyTasksError}</p>
            ) : propertyTasksLoading ? (
              <p className="mt-4 text-sm text-ink-500">Loading tasks...</p>
            ) : nextPropertyTasks.length > 0 ? (
              <div className="mt-4 space-y-3">
                {nextPropertyTasks.map((task) => (
                  <div
                    key={task._id}
                    className="rounded-[18px] border border-ink-100 bg-ink-50/40 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900">
                          {task.title || "Untitled task"}
                        </p>
                        <p className="mt-1 text-sm text-ink-500">
                          {task.dueDate || task.endDate
                            ? `Due ${formatCompactDate(task.dueDate || task.endDate)}`
                            : "No due date"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          isTaskOverdue(task)
                            ? "bg-clay-50 text-clay-700"
                            : "bg-sand-50 text-ink-700"
                        }`}
                      >
                        {task.status || "Open"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink-500">No upcoming tasks yet.</p>
            )}
          </div>

          <ProjectUpdatesPanel
            compact
            updates={sortedProjectUpdates}
            isLoading={projectUpdatesLoading}
            error={projectUpdatesError}
            onAdd={() => handleOpenProjectUpdateComposer()}
            onEdit={handleOpenProjectUpdateComposer}
            onDelete={handleDeleteProjectUpdate}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <WorkspaceLaunchCard
          eyebrow="Execution"
          title="Tasks"
          detail="Open the live work queue and keep field execution moving."
          label="Open tasks"
          onClick={() => handleViewSelect("execution", "tasks")}
        />
        <WorkspaceLaunchCard
          eyebrow="Budget"
          title="Payments"
          detail="Open the payment ledger and see exactly where money went."
          label={hasAcquisitionWorkspace ? "Open payments" : "Set up budget"}
          onClick={() =>
            hasAcquisitionWorkspace
              ? handleViewSelect("budget", "payments")
              : handleTabSelect("settings")
          }
          tone="bg-mist-50/90"
        />
        <WorkspaceLaunchCard
          eyebrow="Files"
          title={
            drawSupportGapCount > 0
              ? "Loan & draw support"
              : paymentSupportGapCount > 0
                ? "Receipts & invoices"
                : "Project file library"
          }
          detail={
            drawSupportGapCount > 0
              ? `${drawSupportGapCount} draw request${drawSupportGapCount === 1 ? "" : "s"} still need supporting files.`
              : paymentSupportGapCount > 0
                ? `${paymentSupportGapCount} payment${paymentSupportGapCount === 1 ? "" : "s"} still need receipt or invoice support.`
                : `${contractFileCount} contract file${contractFileCount === 1 ? "" : "s"}, ${receiptFileCount} receipt file${receiptFileCount === 1 ? "" : "s"}, and ${photoFileCount} photo${photoFileCount === 1 ? "" : "s"} are already organized.`
          }
          label={
            hasAcquisitionWorkspace
              ? drawSupportGapCount > 0
                ? "Open Loan & Draw"
                : paymentSupportGapCount > 0
                  ? "Open receipts"
                  : "Open files"
              : "Set up files"
          }
          onClick={() =>
            hasAcquisitionWorkspace
              ? handleViewSelect(
                  "files",
                  drawSupportGapCount > 0
                    ? "loan-draw"
                    : paymentSupportGapCount > 0
                      ? "receipts-invoices"
                      : "all-files"
                )
              : handleTabSelect("settings")
          }
        />
        <WorkspaceLaunchCard
          eyebrow="Deal"
          title="Underwriting"
          detail="Keep the original acquisition thesis close to current execution."
          label="Open deal"
          onClick={() => handleViewSelect("deal", "summary")}
          tone="bg-sand-50/80"
        />
      </div>
    </WorkspacePageShell>
  );
};

export default PropertyWorkspaceHomePage;
