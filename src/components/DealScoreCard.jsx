import React from "react";

import { DEAL_TONE } from "../utils/dealIntelligence";

const DealScoreCard = ({
  score = 0,
  verdict = "medium",
  title = "Deal score",
  label,
  detail,
  assetPath,
  compact = false,
}) => {
  const tone = DEAL_TONE[verdict] || DEAL_TONE.medium;
  const diameter = compact ? 84 : 116;
  const innerDiameter = compact ? 60 : 84;
  const scoreStyle = {
    background: `conic-gradient(${tone.accent} ${score * 3.6}deg, rgba(28, 23, 19, 0.1) ${score * 3.6}deg 360deg)`,
    width: `${diameter}px`,
    height: `${diameter}px`,
  };

  return (
    <div className="premium-score-card overflow-hidden rounded-[26px] border border-ink-100 bg-white/90 p-5 shadow-[0_18px_46px_rgba(28,23,19,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">{title}</p>
          <p className="mt-3 text-lg font-semibold text-ink-900">{label || tone.label}</p>
        </div>
        {assetPath ? (
          <img
            src={assetPath}
            alt={`${tone.label} visual`}
            className={`${compact ? "h-16 w-16" : "h-20 w-20"} rounded-[20px] border border-white/70 object-cover shadow-sm`}
          />
        ) : null}
      </div>

      <div className={`${compact ? "mt-4 flex items-center gap-4" : "mt-6 flex items-center gap-5"}`}>
        <div className="relative flex items-center justify-center rounded-full" style={scoreStyle}>
          <div
            className="absolute rounded-full border border-white/90 bg-white shadow-[inset_0_1px_4px_rgba(28,23,19,0.05)]"
            style={{ width: `${innerDiameter}px`, height: `${innerDiameter}px` }}
          />
          <div className="relative text-center">
            <p className={`${compact ? "text-2xl" : "text-[2.35rem]"} font-display leading-none text-ink-900`}>
              {Math.round(score)}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
              /100
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone.badgeClass}`}>
            {tone.scoreLabel}
          </span>
          <p className="mt-3 text-sm leading-6 text-ink-600">
            {detail || "A blended signal across spread, ROI, comp support, and underwriting risk."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DealScoreCard;
