import React from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";

import { DEAL_TONE } from "../utils/dealIntelligence";

const AISummaryCard = ({
  verdict = "medium",
  headline,
  detail,
  recommendation,
  confidenceLabel,
  bullets = [],
  assetPath,
  compact = false,
}) => {
  const tone = DEAL_TONE[verdict] || DEAL_TONE.medium;

  return (
    <div className="rounded-[24px] border border-ink-100 bg-white/94 p-5 shadow-[0_12px_32px_rgba(28,23,19,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-ink-900 text-white">
              <SparklesIcon className="h-4 w-4" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">
              AI recommendation
            </p>
          </div>
          <h3 className={`mt-4 font-semibold text-ink-900 ${compact ? "text-lg" : "text-xl"}`}>
            {headline || tone.label}
          </h3>
        </div>
        {assetPath ? (
          <img
            src={assetPath}
            alt={`${headline || tone.label} summary visual`}
            className={`${compact ? "h-14 w-14" : "h-16 w-16"} rounded-[18px] border border-white/70 object-cover shadow-sm`}
          />
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone.badgeClass}`}>
          {tone.label}
        </span>
        {confidenceLabel ? (
          <span className="inline-flex rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-500 ring-1 ring-ink-100">
            {confidenceLabel}
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm leading-6 text-ink-600">{detail}</p>
      {recommendation ? (
        <div
          className={`mt-4 rounded-[16px] border border-white/80 px-4 py-3 text-sm font-medium ${tone.panelClass}`}
        >
          {recommendation}
        </div>
      ) : null}

      {bullets.length ? (
        <div className="mt-4 space-y-2.5">
          {bullets.slice(0, compact ? 2 : 3).map((bullet) => (
            <div
              key={bullet}
              className="flex gap-3 rounded-[16px] border border-ink-100 bg-sand-50/70 px-4 py-3 text-sm leading-6 text-ink-600"
            >
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tone.accent }} />
              <span>{bullet}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default AISummaryCard;
