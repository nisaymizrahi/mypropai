import React from "react";
import {
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  ClockIcon,
  HomeModernIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import { formatDealCurrency, formatDealPercent } from "../utils/dealIntelligence";
import { INVESTOR_TERMS } from "../utils/investorTerminology";

const formatFollowUpDate = (value) => {
  if (!value) return "No follow-up set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No follow-up set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getVerdictAccent = (verdict = "") => {
  if (verdict === "good") {
    return {
      bar: "bg-gradient-to-r from-verdigris-600 via-verdigris-500 to-steel-500",
      soft: "bg-verdigris-50 text-verdigris-700",
      halo: "bg-[radial-gradient(circle,rgba(22,114,103,0.16),transparent_68%)]",
    };
  }

  if (verdict === "medium") {
    return {
      bar: "bg-gradient-to-r from-amber-500 via-clay-400 to-steel-500",
      soft: "bg-amber-50 text-amber-700",
      halo: "bg-[radial-gradient(circle,rgba(180,125,56,0.16),transparent_68%)]",
    };
  }

  if (verdict === "bad") {
    return {
      bar: "bg-gradient-to-r from-clay-600 via-clay-500 to-steel-500",
      soft: "bg-clay-50 text-clay-700",
      halo: "bg-[radial-gradient(circle,rgba(155,79,55,0.16),transparent_68%)]",
    };
  }

  return {
    bar: "bg-gradient-to-r from-steel-700 via-steel-600 to-mist-400",
    soft: "bg-mist-50 text-steel-700",
    halo: "bg-[radial-gradient(circle,rgba(63,83,98,0.16),transparent_68%)]",
  };
};

const buildOfferBand = (analysis) => {
  if (analysis.pricingRecommendationLow && analysis.pricingRecommendationHigh) {
    return `${formatDealCurrency(analysis.pricingRecommendationLow)} - ${formatDealCurrency(
      analysis.pricingRecommendationHigh
    )}`;
  }

  return formatDealCurrency(analysis.targetOffer || analysis.purchasePrice);
};

const buildPropertyFacts = (analysis) =>
  [
    analysis.propertyType,
    analysis.squareFootage ? `${analysis.squareFootage.toLocaleString()} sqft` : null,
    analysis.bedrooms ? `${analysis.bedrooms} bd` : null,
    analysis.bathrooms ? `${analysis.bathrooms} ba` : null,
  ].filter(Boolean);

const SummaryBlock = ({ label, value, helper = "" }) => (
  <div className="premium-inline-stat min-h-[90px]">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-sm font-semibold text-ink-900">{value}</p>
    {helper ? <p className="mt-2 text-xs leading-5 text-ink-500">{helper}</p> : null}
  </div>
);

const DealCard = ({
  lead,
  analysis,
  onOpen,
  onRunComps,
  onStatusChange,
  statusOptions = [],
  isUpdating = false,
}) => {
  const dealLabel = INVESTOR_TERMS.deal.lowerSingular;
  const verdictAccent = getVerdictAccent(analysis.verdict);
  const propertyFacts = buildPropertyFacts(analysis);
  const aiBullets = (analysis.aiSummary?.bullets || []).filter(Boolean).slice(0, 2);
  const riskFlags = (analysis.riskFlags || []).filter(Boolean).slice(0, 2);

  return (
    <article className="deal-card-shell group overflow-hidden rounded-[30px] border border-ink-100 bg-white/96 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-luxe">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${dealLabel} for ${analysis.address}`}
        className="block w-full cursor-pointer text-left outline-none focus-visible:ring-4 focus-visible:ring-verdigris-100"
      >
        <div className="relative overflow-hidden border-b border-ink-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,253,0.94))] px-5 py-5">
          <div className={`absolute inset-x-0 top-0 h-1.5 ${verdictAccent.bar}`} />
          <div
            className={`pointer-events-none absolute right-[-10%] top-[-12%] h-40 w-40 rounded-full blur-xl ${verdictAccent.halo}`}
          />

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${analysis.tone.badgeClass}`}>
                  {analysis.tone.label}
                </span>
                <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink-500 ring-1 ring-ink-100">
                  {analysis.status}
                </span>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${verdictAccent.soft}`}>
                  {analysis.confidenceLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-100">
                  Open deal
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </span>
              </div>

              <h3 className="mt-4 font-display text-[1.75rem] leading-[0.94] text-ink-900 transition group-hover:text-steel-700">
                {analysis.address}
              </h3>

              {propertyFacts.length ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/82 px-3 py-1.5 ring-1 ring-ink-100">
                    <HomeModernIcon className="h-4 w-4" />
                    {propertyFacts.join(" • ")}
                  </span>
                </div>
              ) : null}

              <div className="mt-4 rounded-[20px] border border-ink-100 bg-white/92 px-4 py-4 shadow-[0_10px_24px_rgba(18,32,45,0.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  AI takeaway
                </p>
                <p className="mt-2 text-base font-semibold text-ink-900">
                  {analysis.aiSummary.headline}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-600">{analysis.aiSummary.detail}</p>
              </div>
            </div>

            <div className="flex min-w-[112px] flex-col items-end gap-3">
              <div className="rounded-[24px] border border-ink-100 bg-white/94 px-4 py-4 text-right shadow-[0_14px_28px_rgba(18,32,45,0.06)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Deal score
                </p>
                <p className="mt-2 text-[1.9rem] font-semibold leading-none text-ink-900">
                  {analysis.score}
                </p>
                <p className="mt-2 text-xs font-medium text-ink-500">/100 modeled fit</p>
              </div>

              <img
                src={analysis.assetPaths.verdict}
                alt={`${analysis.tone.label} deal visual`}
                className="h-20 w-20 rounded-[22px] border border-white/70 object-cover shadow-[0_14px_28px_rgba(18,32,45,0.08)]"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Buy target",
                value: formatDealCurrency(analysis.purchasePrice),
                helper: analysis.compCount ? `${analysis.compCount} comps screened` : "",
              },
              {
                label: "Offer band",
                value: buildOfferBand(analysis),
                helper: analysis.targetOffer ? `Target ${formatDealCurrency(analysis.targetOffer)}` : "",
              },
              {
                label: "Modeled profit",
                value: formatDealCurrency(analysis.profit),
                helper: analysis.arv ? `ARV ${formatDealCurrency(analysis.arv)}` : "",
              },
              {
                label: "Modeled ROI",
                value: formatDealPercent(analysis.roi),
                helper: analysis.holdingMonths ? `${analysis.holdingMonths} month hold` : "",
              },
            ].map((item) => (
              <SummaryBlock key={item.label} label={item.label} value={item.value} helper={item.helper} />
            ))}
          </div>
        </div>

        <div className="grid gap-4 bg-mist-50/50 px-5 py-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[24px] border border-ink-100 bg-white/94 px-4 py-4 shadow-[0_12px_24px_rgba(18,32,45,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Investor recommendation
                </p>
                <p className="mt-2 text-base font-semibold text-ink-900">
                  {analysis.aiSummary.recommendation || "Open the deal and confirm the next move."}
                </p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${verdictAccent.soft}`}>
                {analysis.riskLevel || "Risk review pending"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(aiBullets.length ? aiBullets : riskFlags).map((item) => (
                <span
                  key={item}
                  className="inline-flex rounded-full bg-mist-50 px-3 py-1.5 text-xs font-semibold text-steel-700 ring-1 ring-mist-100"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <SummaryBlock label="Next step" value={analysis.nextAction || "Review deal assumptions"} />
            <SummaryBlock
              label="Follow-up"
              value={formatFollowUpDate(analysis.followUpDate)}
              helper={analysis.followUpDate ? "Calendar this touchpoint" : "No follow-up set yet"}
            />
            <div className="premium-inline-stat min-h-[90px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Risk flags
              </p>
              <div className="mt-2 space-y-2">
                {(riskFlags.length ? riskFlags : ["No major red flags surfaced in the first pass."]).map(
                  (flag) => (
                    <div key={flag} className="flex items-start gap-2 text-sm text-ink-700">
                      <ClockIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-400" />
                      <span>{flag}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </button>

      <div className="border-t border-ink-100 bg-white/92 px-5 py-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex flex-wrap gap-2 xl:min-w-[34rem]">
            <span className="inline-flex rounded-full bg-mist-50 px-3 py-1.5 text-xs font-semibold text-steel-700 ring-1 ring-mist-100">
              {analysis.compCount || 0} comps modeled
            </span>
            <span className="inline-flex rounded-full bg-mist-50 px-3 py-1.5 text-xs font-semibold text-steel-700 ring-1 ring-mist-100">
              {analysis.confidenceLabel}
            </span>
            {analysis.holdingMonths ? (
              <span className="inline-flex rounded-full bg-mist-50 px-3 py-1.5 text-xs font-semibold text-steel-700 ring-1 ring-mist-100">
                {analysis.holdingMonths} month hold
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
            {statusOptions.length ? (
              <select
                value={analysis.status}
                onChange={(event) => onStatusChange?.(lead._id, event.target.value)}
                disabled={isUpdating}
                onClick={(event) => event.stopPropagation()}
                className="auth-input min-h-0 rounded-full py-3 text-sm font-semibold"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              onClick={onRunComps}
              onClickCapture={(event) => event.stopPropagation()}
              className="secondary-action whitespace-nowrap"
            >
              <ArrowTrendingUpIcon className="mr-2 h-4 w-4" />
              Run comps
            </button>
            <button
              type="button"
              onClick={onOpen}
              onClickCapture={(event) => event.stopPropagation()}
              className="primary-action whitespace-nowrap justify-center"
            >
              <SparklesIcon className="mr-2 h-4 w-4" />
              Open analysis
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default DealCard;
