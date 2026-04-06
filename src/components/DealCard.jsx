import React from "react";
import {
  ArrowTrendingUpIcon,
  ChevronRightIcon,
  HomeModernIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import AISummaryCard from "./AISummaryCard";
import DealScoreCard from "./DealScoreCard";
import ProfitSnapshot from "./ProfitSnapshot";
import RiskIndicator from "./RiskIndicator";
import { formatDealCurrency, formatDealPercent } from "../utils/dealIntelligence";

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

const DealCard = ({
  lead,
  analysis,
  onOpen,
  onRunComps,
  onStatusChange,
  statusOptions = [],
  isUpdating = false,
}) => {
  return (
    <article className="deal-card-shell group overflow-hidden rounded-[28px] border border-ink-100 bg-white/96 shadow-[0_16px_42px_rgba(28,23,19,0.07)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(28,23,19,0.1)]">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open lead for ${analysis.address}`}
        className="block w-full cursor-pointer text-left outline-none focus-visible:ring-4 focus-visible:ring-verdigris-100"
      >
        <div className="relative overflow-hidden border-b border-ink-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.1),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,245,239,0.95))] px-5 py-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${analysis.tone.badgeClass}`}>
                  {analysis.tone.label}
                </span>
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-ink-500 ring-1 ring-ink-100">
                  {analysis.status}
                </span>
                <span className="inline-flex rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-white">
                  {analysis.score}/100
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-100">
                  Open lead
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </span>
              </div>
              <h3 className="mt-4 font-display text-[1.65rem] leading-[0.94] text-ink-900 transition group-hover:text-verdigris-700">
                {analysis.address}
              </h3>
              <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-500">
                <span className="inline-flex items-center gap-2">
                  <HomeModernIcon className="h-4 w-4" />
                  {[
                    analysis.propertyType,
                    analysis.squareFootage ? `${analysis.squareFootage.toLocaleString()} sqft` : null,
                    analysis.bedrooms ? `${analysis.bedrooms} bd` : null,
                    analysis.bathrooms ? `${analysis.bathrooms} ba` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </p>
              <p className="mt-3 text-sm font-medium text-ink-500">
                Click anywhere in this area to open the lead.
              </p>
            </div>

            <img
              src={analysis.assetPaths.verdict}
              alt={`${analysis.tone.label} deal visual`}
              className="h-24 w-24 rounded-[24px] border border-white/70 object-cover shadow-[0_16px_34px_rgba(28,23,19,0.08)]"
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Buy", value: formatDealCurrency(analysis.purchasePrice) },
              { label: "Rehab", value: formatDealCurrency(analysis.rehabEstimate) },
              { label: "Profit", value: formatDealCurrency(analysis.profit) },
              { label: "ROI", value: formatDealPercent(analysis.roi) },
            ].map((item) => (
              <div key={item.label} className="premium-inline-stat">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-ink-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <DealScoreCard
            score={analysis.score}
            verdict={analysis.verdict}
            assetPath={analysis.assetPaths.score}
            detail={`${analysis.compCount || 0} comps, ${analysis.holdingMonths} month hold model, ${analysis.confidenceLabel.toLowerCase()}.`}
            compact
          />
          <AISummaryCard
            verdict={analysis.verdict}
            headline={analysis.aiSummary.headline}
            detail={analysis.aiSummary.detail}
            recommendation={analysis.aiSummary.recommendation}
            confidenceLabel={analysis.aiSummary.confidenceLabel}
            bullets={analysis.aiSummary.bullets}
            assetPath={analysis.assetPaths.verdict}
            compact
          />
          <ProfitSnapshot
            purchasePrice={analysis.purchasePrice}
            rehabCost={analysis.rehabEstimate}
            arv={analysis.arv}
            profit={analysis.profit}
            roi={analysis.roi}
            costBreakdown={analysis.costBreakdown}
            assetPath={analysis.assetPaths.profit}
            compact
          />
          <RiskIndicator
            risk={analysis.riskLevel}
            flags={analysis.riskFlags}
            assetPath={analysis.assetPaths.risk}
            compact
          />
        </div>
      </button>

      <div className="border-t border-ink-100 bg-sand-50/60 px-5 py-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[34rem]">
            <div className="premium-inline-stat">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Offer band</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">
                {analysis.pricingRecommendationLow && analysis.pricingRecommendationHigh
                  ? `${formatDealCurrency(analysis.pricingRecommendationLow)} - ${formatDealCurrency(
                      analysis.pricingRecommendationHigh
                    )}`
                  : formatDealCurrency(analysis.targetOffer || analysis.purchasePrice)}
              </p>
            </div>
            <div className="premium-inline-stat">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Next step</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{analysis.nextAction}</p>
            </div>
            <div className="premium-inline-stat">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Follow-up</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{formatFollowUpDate(analysis.followUpDate)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
            {statusOptions.length ? (
              <select
                value={analysis.status}
                onChange={(event) => onStatusChange?.(lead._id, event.target.value)}
                disabled={isUpdating}
                onClick={(event) => event.stopPropagation()}
                className="rounded-full border border-ink-100 bg-white px-4 py-3 text-sm font-semibold text-ink-700 outline-none transition focus:border-ink-300"
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
              Analyze deal
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default DealCard;
