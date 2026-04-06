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
    <div className="rounded-[26px] border border-ink-100 bg-white/90 p-5 shadow-[0_18px_46px_rgba(28,23,19,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ink-900 text-white">
              <SparklesIcon className="h-4 w-4" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">
              AI recommendation
            </p>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-ink-900">{headline || tone.label}</h3>
        </div>
        {assetPath ? (
          <img
            src={assetPath}
            alt={`${headline || tone.label} summary visual`}
            className={`${compact ? "h-16 w-16" : "h-20 w-20"} rounded-[20px] border border-white/70 object-cover shadow-sm`}
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
        <div className={`mt-4 rounded-[18px] px-4 py-3 text-sm font-medium ${tone.panelClass}`}>
          {recommendation}
        </div>
      ) : null}

      {bullets.length ? (
        <div className={`mt-4 grid gap-2 ${compact ? "" : "sm:grid-cols-3"}`}>
          {bullets.slice(0, compact ? 2 : 3).map((bullet) => (
            <div key={bullet} className="rounded-[18px] bg-sand-50 px-4 py-3 text-sm leading-6 text-ink-600">
              {bullet}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default AISummaryCard;
