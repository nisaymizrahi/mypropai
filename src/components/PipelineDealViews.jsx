import React from "react";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import { formatDealCompactCurrency } from "../utils/dealIntelligence";
import { getLeadPropertyKey } from "../utils/launchProgress";

const statusChipClasses = {
  Potential: "bg-stone-100 text-stone-700 border-stone-200",
  Analyzing: "bg-sky-50 text-sky-700 border-sky-200",
  "Offer Made": "bg-amber-50 text-amber-700 border-amber-200",
  "Under Contract": "bg-slate-100 text-slate-700 border-slate-200",
  "Closed - Won": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Closed - Lost": "bg-rose-50 text-rose-700 border-rose-200",
};

const verdictChipClasses = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  bad: "bg-rose-50 text-rose-700 border-rose-200",
};

const formatMetricCurrency = (value) =>
  Number.isFinite(Number(value)) && Number(value) > 0 ? formatDealCompactCurrency(value) : "—";

const formatFollowUpDate = (value) => {
  if (!value) {
    return "No follow-up";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No follow-up";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

const buildPropertyFacts = (lead) =>
  [
    lead.propertyType,
    lead.squareFootage ? `${Number(lead.squareFootage).toLocaleString()} sqft` : null,
    lead.bedrooms ? `${lead.bedrooms} bd` : null,
    lead.bathrooms ? `${lead.bathrooms} ba` : null,
  ]
    .filter(Boolean)
    .join(" • ");

const buildSecondaryFacts = (lead) =>
  [
    lead.leadSource ? `Source: ${lead.leadSource}` : null,
    lead.listingStatus ? `Listing: ${lead.listingStatus}` : null,
    lead.sellerName ? `Seller: ${lead.sellerName}` : null,
  ].filter(Boolean);

const StatusSelectChip = ({ lead, onStatusChange, isUpdating, statusOptions }) => (
  <div className="relative">
    <select
      value={lead.status || "Potential"}
      onChange={(event) => onStatusChange(lead._id, event.target.value)}
      disabled={isUpdating}
      className={`appearance-none rounded-full border px-3 py-2 pr-8 text-xs font-semibold shadow-sm transition ${statusChipClasses[lead.status] || statusChipClasses.Potential} ${
        isUpdating ? "cursor-wait opacity-70" : "hover:border-ink-300"
      }`}
      aria-label={`Move ${lead.address || "deal"} to a different stage`}
    >
      {statusOptions.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
  </div>
);

const SelectionCheckbox = ({ checked, onChange, label }) => (
  <label className="inline-flex flex-shrink-0 items-center">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-ink-300 text-ink-900 focus:ring-2 focus:ring-ink-200"
      aria-label={label}
    />
  </label>
);

const QuickActionButton = ({ icon: Icon, label, onClick, quiet = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
      quiet
        ? "border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50"
        : "border-ink-900 bg-ink-900 text-white hover:bg-ink-800"
    }`}
  >
    <Icon className="h-3.5 w-3.5" />
    {label}
  </button>
);

export const PipelineDealListItem = ({
  lead,
  analysis,
  selected,
  onSelect,
  onOpen,
  onRunComps,
  onStatusChange,
  isUpdating,
  statusOptions,
}) => {
  const propertyFacts = buildPropertyFacts(lead);
  const secondaryFacts = buildSecondaryFacts(lead);
  const inWorkspace = Boolean(getLeadPropertyKey(lead) && lead.inPropertyWorkspace);

  return (
    <article
      className={`rounded-[22px] border bg-white/94 p-4 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.38)] transition ${
        selected
          ? "border-ink-300 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.45)]"
          : "border-ink-100 hover:border-ink-200"
      }`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 gap-3">
          <SelectionCheckbox
            checked={selected}
            onChange={onSelect}
            label={`Select ${lead.address || "deal"} for compare`}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[1.05rem] font-semibold tracking-tight text-ink-900">
                {lead.address || "Address pending"}
              </h3>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  statusChipClasses[lead.status] || statusChipClasses.Potential
                }`}
              >
                {lead.status || "Potential"}
              </span>
              {inWorkspace ? (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  In workspace
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-ink-500">
              {propertyFacts || "Property details pending"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <StatusSelectChip
            lead={lead}
            onStatusChange={onStatusChange}
            isUpdating={isUpdating}
            statusOptions={statusOptions}
          />
          <QuickActionButton icon={ArrowTopRightOnSquareIcon} label="Open" onClick={onOpen} quiet />
          <QuickActionButton icon={SparklesIcon} label="Run comps" onClick={onRunComps} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] border border-ink-100 bg-slate-50/90 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Ask / Target</p>
          <p className="mt-2 text-sm font-semibold text-ink-900">
            {formatMetricCurrency(analysis.askingPrice)} / {formatMetricCurrency(analysis.targetOffer)}
          </p>
        </div>

        <div className="rounded-[18px] border border-ink-100 bg-slate-50/90 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Next step</p>
          <p className="mt-2 text-sm font-medium text-ink-800">
            {lead.nextAction || "Add the next move"}
          </p>
        </div>

        <div className="rounded-[18px] border border-ink-100 bg-slate-50/90 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Follow-up</p>
          <p className="mt-2 text-sm font-medium text-ink-800">
            {formatFollowUpDate(lead.followUpDate)}
          </p>
        </div>

        <div className="rounded-[18px] border border-ink-100 bg-slate-50/90 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Decision</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                verdictChipClasses[analysis.verdict] || verdictChipClasses.medium
              }`}
            >
              {analysis.score}/100
            </span>
            <span className="text-sm font-medium text-ink-800">{analysis.tone.label}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {secondaryFacts.length ? (
          secondaryFacts.map((fact) => (
            <span
              key={fact}
              className="inline-flex items-center rounded-full border border-ink-100 bg-white px-2.5 py-1 text-[11px] font-medium text-ink-500"
            >
              {fact}
            </span>
          ))
        ) : (
          <span className="text-xs font-medium text-ink-500">Seller context still needs detail.</span>
        )}
      </div>
    </article>
  );
};

export const PipelineBoardCard = ({
  lead,
  analysis,
  selected,
  onSelect,
  onOpen,
  onRunComps,
  dragHandleProps,
}) => {
  const inWorkspace = Boolean(getLeadPropertyKey(lead) && lead.inPropertyWorkspace);

  return (
    <article
      className={`cursor-grab rounded-[20px] border bg-white/96 p-4 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.45)] transition active:cursor-grabbing ${
        selected ? "border-ink-300" : "border-ink-100 hover:border-ink-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <SelectionCheckbox
          checked={selected}
          onChange={onSelect}
          label={`Select ${lead.address || "deal"} for compare`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-ink-900">
              {lead.address || "Address pending"}
            </h3>
            {inWorkspace ? (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Workspace
              </span>
            ) : null}
            <span
              {...dragHandleProps}
              className="inline-flex cursor-grab items-center rounded-full border border-ink-100 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400 active:cursor-grabbing"
            >
              Move
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500">{buildPropertyFacts(lead) || "Property details pending"}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-[16px] border border-ink-100 bg-slate-50/90 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Ask</p>
          <p className="mt-1 text-sm font-semibold text-ink-900">
            {formatMetricCurrency(analysis.askingPrice)}
          </p>
        </div>
        <div className="rounded-[16px] border border-ink-100 bg-slate-50/90 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Target</p>
          <p className="mt-1 text-sm font-semibold text-ink-900">
            {formatMetricCurrency(analysis.targetOffer)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            verdictChipClasses[analysis.verdict] || verdictChipClasses.medium
          }`}
        >
          {analysis.score}/100
        </span>
        <span className="text-xs font-medium text-ink-600">{analysis.tone.label}</span>
      </div>

      <p className="mt-3 text-xs leading-5 text-ink-600">
        {lead.nextAction || "Add the next step for this deal."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <QuickActionButton icon={ArrowTopRightOnSquareIcon} label="Open" onClick={onOpen} quiet />
        <QuickActionButton icon={SparklesIcon} label="Run comps" onClick={onRunComps} quiet />
      </div>
    </article>
  );
};
