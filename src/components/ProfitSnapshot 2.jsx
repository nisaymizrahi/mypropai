import React from "react";

import { formatDealCompactCurrency, formatDealCurrency, formatDealPercent } from "../utils/dealIntelligence";

const ProfitSnapshot = ({
  purchasePrice = 0,
  rehabCost = 0,
  arv = 0,
  profit = 0,
  roi = 0,
  costBreakdown = [],
  assetPath,
  compact = false,
}) => {
  const totalCosts = costBreakdown.reduce((sum, item) => sum + (item.amount || 0), 0);
  const maxCost = Math.max(totalCosts, arv, 1);

  return (
    <div className="rounded-[24px] border border-ink-100 bg-white/94 p-5 shadow-[0_12px_32px_rgba(28,23,19,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">Profit snapshot</p>
          <h3 className="mt-3 text-lg font-semibold text-ink-900">Capital in, exit out, margin clear</h3>
        </div>
        {assetPath ? (
          <img
            src={assetPath}
            alt="Profit meter visual"
            className={`${compact ? "h-14 w-14" : "h-16 w-16"} rounded-[18px] border border-white/70 object-cover shadow-sm`}
          />
        ) : null}
      </div>

      <div className={`mt-5 grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-4"}`}>
        {[
          { label: "Buy", value: formatDealCurrency(purchasePrice) },
          { label: "Rehab", value: formatDealCurrency(rehabCost) },
          { label: "ARV", value: formatDealCurrency(arv) },
          { label: "Profit", value: formatDealCurrency(profit) },
        ].map((item) => (
          <div key={item.label} className="premium-inline-stat">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{item.label}</p>
            <p className="mt-2 text-sm font-semibold text-ink-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[18px] border border-ink-100 bg-sand-50/60 px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-ink-600">Modeled ROI</p>
          <p className={`text-sm font-semibold ${profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {formatDealPercent(roi)}
          </p>
        </div>
        <div className="mt-4 space-y-3">
          {costBreakdown.slice(0, compact ? 3 : 4).map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-3 text-xs font-medium text-ink-500">
                <span>{item.label}</span>
                <span>{formatDealCompactCurrency(item.amount)}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand-100">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${Math.max(8, (item.amount / maxCost) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfitSnapshot;
