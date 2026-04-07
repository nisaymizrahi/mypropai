import React from "react";

import { RISK_LEVELS } from "../utils/dealIntelligence";

const LEVEL_ORDER = ["low", "medium", "high"];

const RiskIndicator = ({ risk = "medium", flags = [], assetPath, compact = false }) => {
  const level = RISK_LEVELS[risk] || RISK_LEVELS.medium;

  return (
    <div className="rounded-[24px] border border-ink-100 bg-white/94 p-5 shadow-[0_12px_32px_rgba(28,23,19,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">Risk indicator</p>
          <h3 className={`mt-3 text-lg font-semibold ${level.accentClass}`}>{level.label}</h3>
        </div>
        {assetPath ? (
          <img
            src={assetPath}
            alt="Risk indicator visual"
            className={`${compact ? "h-14 w-14" : "h-16 w-16"} rounded-[18px] border border-white/70 object-cover shadow-sm`}
          />
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {LEVEL_ORDER.map((levelKey) => {
          const isActive = levelKey === risk;
          const palette = RISK_LEVELS[levelKey];

          return (
            <div
              key={levelKey}
              className={`rounded-[16px] px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] ${
                isActive ? `${palette.bgClass} ${palette.accentClass}` : "bg-sand-50 text-ink-400"
              }`}
            >
              {palette.label.replace(" risk", "")}
            </div>
          );
        })}
      </div>

      {flags.length ? (
        <div className="mt-4 space-y-2.5">
          {flags.slice(0, compact ? 2 : 3).map((flag) => (
            <div
              key={flag}
              className="flex gap-3 rounded-[16px] border border-ink-100 bg-sand-50/70 px-4 py-3 text-sm leading-6 text-ink-600"
            >
              <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${level.barClass}`} />
              <span>{flag}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default RiskIndicator;
