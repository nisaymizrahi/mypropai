import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowPathIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
  HomeModernIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import { PROPERTY_STRATEGIES } from "../utils/propertyStrategy";
import { INVESTOR_TERMS } from "../utils/investorTerminology";

const managementStrategies = PROPERTY_STRATEGIES.filter((strategy) =>
  ["fix_and_rent", "rental"].includes(strategy.value)
);

const LinkedWorkspaceCard = ({
  eyebrow,
  title,
  status,
  helper,
  action,
  footer,
  tone = "bg-white",
  icon: Icon = HomeModernIcon,
}) => (
  <div className={`rounded-[24px] border border-ink-100 p-5 ${tone}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          {eyebrow}
        </p>
        <h3 className="mt-3 text-lg font-semibold text-ink-900">{title}</h3>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-ink-100 text-ink-700">
        <Icon className="h-5 w-5" />
      </div>
    </div>

    <div className="mt-5 rounded-[18px] bg-white/90 px-4 py-4 ring-1 ring-ink-100">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">Status</p>
      <p className="mt-2 text-sm font-semibold text-ink-900">{status}</p>
      {helper ? <p className="mt-2 text-sm leading-6 text-ink-500">{helper}</p> : null}
    </div>

    {footer ? <div className="mt-4">{footer}</div> : null}
    {action ? <div className="mt-5 flex flex-wrap gap-3">{action}</div> : null}
  </div>
);

const StrategyControl = ({ label, value, options, onChange }) => (
  <label className="block space-y-2">
    <span className="text-sm font-medium text-ink-700">{label}</span>
    <select value={value} onChange={onChange} className="auth-input appearance-none">
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const PropertyWorkspaceSettingsPanel = ({
  property,
  propertyWorkspaceActive,
  pipelineLeadPath,
  pipelineLeadStatus,
  onActivateWorkspace,
  onDeactivateWorkspace,
  isUpdatingWorkspaceStatus,
  onCreatePipelineWorkspace,
  onCreateAcquisitionWorkspace,
  onCreateManagementWorkspace,
  isCreatingPipelineWorkspace,
  isCreatingAcquisitionWorkspace,
  isCreatingManagementWorkspace,
  acquisitionStrategy,
  managementStrategy,
  onAcquisitionStrategyChange,
  onManagementStrategyChange,
}) => {
  const hasPipelineWorkspace = Boolean(property?.workspaces?.pipeline);
  const hasAcquisitionsWorkspace = Boolean(property?.workspaces?.acquisitions);
  const hasManagementWorkspace = Boolean(property?.workspaces?.management);

  return (
    <div className="space-y-4">
      <section className="surface-panel px-6 py-6 sm:px-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <span className="eyebrow">Project setup</span>
            <h2 className="mt-4 text-[2rem] font-semibold tracking-tight text-ink-900">
              Keep this project connected
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              Add or open the records behind deal context, budget, execution, and management.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                Deal access
              </p>
              <p className="mt-2 text-sm font-semibold text-ink-900">
                {propertyWorkspaceActive ? "Active" : hasPipelineWorkspace ? "Ready to activate" : "No deal yet"}
              </p>
            </div>
            <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                Linked records
              </p>
              <p className="mt-2 text-sm font-semibold text-ink-900">
                {[
                  property?.workspaces?.pipeline,
                  property?.workspaces?.acquisitions,
                  property?.workspaces?.management,
                ].filter(Boolean).length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <PropertyWorkspaceStatusCard
        propertyWorkspaceActive={propertyWorkspaceActive}
        pipelineLeadStatus={pipelineLeadStatus}
        hasPipelineWorkspace={hasPipelineWorkspace}
        onActivateWorkspace={onActivateWorkspace}
        onDeactivateWorkspace={onDeactivateWorkspace}
        isUpdatingWorkspaceStatus={isUpdatingWorkspaceStatus}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <LinkedWorkspaceCard
          eyebrow="Deal link"
          title="Deal record"
          icon={HomeModernIcon}
          tone="bg-sand-50/70"
          status={hasPipelineWorkspace ? "Linked" : "Missing"}
          helper={
            hasPipelineWorkspace
              ? `Deal stage: ${pipelineLeadStatus || "Unknown"}`
              : "Create a deal for comps, reports, renovation, and bids."
          }
          action={
            hasPipelineWorkspace ? (
              pipelineLeadPath ? (
                <Link to={pipelineLeadPath} className="secondary-action">
                  Open deal
                </Link>
              ) : null
            ) : (
              <button
                type="button"
                onClick={onCreatePipelineWorkspace}
                disabled={isCreatingPipelineWorkspace}
                className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreatingPipelineWorkspace ? "Creating..." : "Create deal record"}
              </button>
            )
          }
        />

        <LinkedWorkspaceCard
          eyebrow="Acquisitions"
          title="Financials + execution"
          icon={BanknotesIcon}
          tone="bg-sky-50/60"
          status={hasAcquisitionsWorkspace ? "Linked" : "Missing"}
          helper={
            hasAcquisitionsWorkspace
              ? `${property.workspaces.acquisitions.strategyLabel || "Acquisitions"} workspace ready.`
              : "Create financials, schedule, vendors, and documents."
          }
          footer={
            !hasAcquisitionsWorkspace ? (
              <StrategyControl
                label="Primary strategy"
                value={acquisitionStrategy}
                options={PROPERTY_STRATEGIES}
                onChange={onAcquisitionStrategyChange}
              />
            ) : null
          }
          action={
            hasAcquisitionsWorkspace ? (
              <Link
                to={property.workspaces.acquisitions.path}
                className="secondary-action"
              >
                Open acquisitions
              </Link>
            ) : (
              <button
                type="button"
                onClick={onCreateAcquisitionWorkspace}
                disabled={isCreatingAcquisitionWorkspace}
                className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreatingAcquisitionWorkspace ? "Creating..." : "Create acquisitions"}
              </button>
            )
          }
        />

        <LinkedWorkspaceCard
          eyebrow="Management"
          title="Operations after stabilization"
          icon={WrenchScrewdriverIcon}
          tone="bg-verdigris-50/60"
          status={hasManagementWorkspace ? "Linked" : "Optional"}
          helper={
            hasManagementWorkspace
              ? "Units, leases, and long-term operations are linked."
              : "Add this when the property moves into rentals."
          }
          footer={
            !hasManagementWorkspace ? (
              <StrategyControl
                label="Management strategy"
                value={managementStrategy}
                options={managementStrategies}
                onChange={onManagementStrategyChange}
              />
            ) : null
          }
          action={
            hasManagementWorkspace ? (
              <Link
                to={property.workspaces.management.path}
                className="secondary-action"
              >
                Open management
              </Link>
            ) : (
              <button
                type="button"
                onClick={onCreateManagementWorkspace}
                disabled={isCreatingManagementWorkspace}
                className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreatingManagementWorkspace ? "Creating..." : "Create management"}
              </button>
            )
          }
        />
      </div>

      <section className="surface-panel px-6 py-6 sm:px-7">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-ink-100 text-ink-700">
            <Cog6ToothIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              Property record
            </p>
            <h3 className="mt-3 text-lg font-semibold text-ink-900">Property details</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Property key
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-ink-900">
                  {property?.propertyKey || "Unknown"}
                </p>
              </div>
              <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Placement
                </p>
                <p className="mt-2 text-sm font-semibold text-ink-900">
                  {property?.placement || "Unassigned"}
                </p>
              </div>
              <div className="rounded-[18px] bg-white px-4 py-4 ring-1 ring-ink-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Title
                </p>
                <p className="mt-2 text-sm font-semibold text-ink-900">
                  {property?.title || "Untitled property"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const PropertyWorkspaceStatusCard = ({
  propertyWorkspaceActive,
  pipelineLeadStatus,
  hasPipelineWorkspace,
  onActivateWorkspace,
  onDeactivateWorkspace,
  isUpdatingWorkspaceStatus,
}) => (
  <section className="surface-panel px-6 py-6 sm:px-7">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-ink-100 text-ink-700">
          <BuildingOffice2Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
            Deal activation
          </p>
          <h3 className="mt-3 text-lg font-semibold text-ink-900">Project Workspace deal access</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
            {hasPipelineWorkspace
              ? propertyWorkspaceActive
                ? "Deal tools are active inside this project."
                : "The linked deal is ready. Activate it here when you want deal context inside this workspace."
              : "Add a deal first if you want comps, saved reports, scope, and bids here."}
          </p>
          {pipelineLeadStatus ? (
            <p className="mt-2 text-sm font-medium text-ink-700">
              {INVESTOR_TERMS.deal.singular} stage: {pipelineLeadStatus}
            </p>
          ) : null}
        </div>
      </div>

      {hasPipelineWorkspace ? (
        <div className="flex flex-wrap gap-3">
          {propertyWorkspaceActive ? (
            <button
              type="button"
              onClick={onDeactivateWorkspace}
              disabled={isUpdatingWorkspaceStatus}
              className="secondary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUpdatingWorkspaceStatus ? (
                <>
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Deactivate deal access"
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onActivateWorkspace}
              disabled={isUpdatingWorkspaceStatus}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUpdatingWorkspaceStatus ? (
                <>
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Activate deal access"
              )}
            </button>
          )}
        </div>
      ) : null}
    </div>
  </section>
);

export default PropertyWorkspaceSettingsPanel;
