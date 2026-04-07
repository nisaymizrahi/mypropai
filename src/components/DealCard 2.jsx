import React from "react";
import {
  ArrowTrendingUpIcon,
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
    <article className="deal-card-shell group overflow-hidden rounded-[32px] border border-ink-100 bg-white/92 shadow-[0_24px_64px_rgba(28,23,19,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(28,23,19,0.12)]">
      <div className="relative overflow-hidden border-b border-ink-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.12),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,242,236,0.94))] px-5 py-5">
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
            </div>
            <button
              type="button"
              onClick={onOpen}
              className="mt-4 text-left font-display text-[1.9rem] leading-none text-ink-900 transition hover:text-verdigris-700"
            >
              {analysis.address}
            </button>
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
            <div key={item.label} className="rounded-[18px] bg-white/82 px-4 py-3 ring-1 ring-white/90">
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

      <div className="border-t border-ink-100 bg-sand-50/60 px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[34rem]">
            <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Offer band</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">
                {analysis.pricingRecommendationLow && analysis.pricingRecommendationHigh
                  ? `${formatDealCurrency(analysis.pricingRecommendationLow)} - ${formatDealCurrency(
                      analysis.pricingRecommendationHigh
                    )}`
                  : formatDealCurrency(analysis.targetOffer || analysis.purchasePrice)}
              </p>
            </div>
            <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Next step</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{analysis.nextAction}</p>
            </div>
            <div className="rounded-[18px] bg-white px-4 py-3 ring-1 ring-ink-100">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Follow-up</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{formatFollowUpDate(analysis.followUpDate)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {statusOptions.length ? (
              <select
                value={analysis.status}
                onChange={(event) => onStatusChange?.(lead._id, event.target.value)}
                disabled={isUpdating}
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
              className="inline-flex items-center justify-center rounded-full border border-ink-100 bg-white px-4 py-3 text-sm font-semibold text-ink-700 transition hover:bg-white"
            >
              <ArrowTrendingUpIcon className="mr-2 h-4 w-4" />
              Run comps
            </button>
            <button type="button" onClick={onOpen} className="primary-action justify-center">
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
