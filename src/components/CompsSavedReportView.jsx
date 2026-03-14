import React, { useMemo } from "react";

import { formatCurrency, formatDate } from "../utils/compsReport";

const formatNumber = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString()}${suffix}`;
};

const MetricTile = ({ label, value, hint }) => (
  <div className="metric-tile p-5">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const BandCard = ({ label, low, median, high, suffix = "" }) => (
  <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Low</p>
        <p className="mt-1 text-sm font-semibold text-ink-900">
          {suffix ? formatNumber(low, suffix) : formatCurrency(low)}
        </p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Median</p>
        <p className="mt-1 text-sm font-semibold text-ink-900">
          {suffix ? formatNumber(median, suffix) : formatCurrency(median)}
        </p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">High</p>
        <p className="mt-1 text-sm font-semibold text-ink-900">
          {suffix ? formatNumber(high, suffix) : formatCurrency(high)}
        </p>
      </div>
    </div>
  </div>
);

const CompsSavedReportView = ({
  report = null,
  emptyEyebrow = "Saved comps",
  emptyTitle = "No comps snapshot was saved",
  emptyMessage = "No saved comparable sales are available for this property yet.",
  tableIntro = "This saved report captures the comparable properties selected for this address.",
}) => {
  const recentComps = useMemo(
    () => (Array.isArray(report?.recentComps) ? report.recentComps : []),
    [report]
  );

  if (!report?.generatedAt) {
    return (
      <div className="section-card p-6 sm:p-7">
        <span className="eyebrow">{emptyEyebrow}</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">{emptyTitle}</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Estimated value"
          value={formatCurrency(report.estimatedValue)}
          hint={`Generated ${formatDate(report.generatedAt)}`}
        />
        <MetricTile
          label="Offer range"
          value={`${formatCurrency(report.recommendedOfferLow)} - ${formatCurrency(
            report.recommendedOfferHigh
          )}`}
          hint={`${report.saleCompCount || 0} selected comparable sale${
            report.saleCompCount === 1 ? "" : "s"
          }`}
        />
        <MetricTile
          label="Median sold"
          value={formatCurrency(report.medianSoldPrice)}
          hint={`Average ${formatCurrency(report.averageSoldPrice)}`}
        />
        <MetricTile
          label="Median $ / sqft"
          value={formatNumber(report.medianPricePerSqft, " / sqft")}
          hint={
            report.averageDaysOnMarket !== null && report.averageDaysOnMarket !== undefined
              ? `Average DOM ${formatNumber(report.averageDaysOnMarket)}`
              : "Saved market pricing context"
          }
        />
      </section>

      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Pricing bands</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">Low, median, and high snapshots</h3>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <BandCard
            label="Sold price band"
            low={report.lowSoldPrice}
            median={report.medianSoldPrice}
            high={report.highSoldPrice}
          />
          <BandCard
            label="Price per sqft band"
            low={report.lowPricePerSqft}
            median={report.medianPricePerSqft}
            high={report.highPricePerSqft}
            suffix=" / sqft"
          />
          <BandCard
            label="Days on market"
            low={report.lowDaysOnMarket}
            median={report.medianDaysOnMarket}
            high={report.highDaysOnMarket}
            suffix=" days"
          />
        </div>
      </section>

      {report.report ? (
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">AI summary</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">
            {report.report.headline || "Saved comps recommendation"}
          </h3>
          <p className="mt-4 text-sm leading-7 text-ink-600">
            {report.report.executiveSummary || "No written summary was saved."}
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Pricing recommendation
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-700">
                {report.report.pricingRecommendation || "—"}
              </p>
            </div>
            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Offer strategy
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-700">
                {report.report.offerStrategy || "—"}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Saved comp set</span>
            <h3 className="mt-4 text-3xl font-semibold text-ink-900">
              {report.title || "Comparable properties"}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{tableIntro}</p>
          </div>
          <div className="rounded-full border border-sand-200 bg-sand-50 px-4 py-2 text-sm font-semibold text-sand-700">
            {recentComps.length} saved comp{recentComps.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                <th className="px-3 py-3">Address</th>
                <th className="px-3 py-3">Sale price</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Distance</th>
                <th className="px-3 py-3">Beds / baths</th>
                <th className="px-3 py-3">Sqft</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {recentComps.length > 0 ? (
                recentComps.map((comp, index) => (
                  <tr key={comp.id || `${comp.address || "comp"}-${index}`}>
                    <td className="px-3 py-4 font-semibold text-ink-900">{comp.address || "—"}</td>
                    <td className="px-3 py-4 text-ink-600">{formatCurrency(comp.salePrice)}</td>
                    <td className="px-3 py-4 text-ink-600">{formatDate(comp.saleDate)}</td>
                    <td className="px-3 py-4 text-ink-600">{formatNumber(comp.distance, " mi")}</td>
                    <td className="px-3 py-4 text-ink-600">
                      {[comp.bedrooms ? `${comp.bedrooms} bd` : null, comp.bathrooms ? `${comp.bathrooms} ba` : null]
                        .filter(Boolean)
                        .join(" • ") || "—"}
                    </td>
                    <td className="px-3 py-4 text-ink-600">{formatNumber(comp.squareFootage)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-3 py-10 text-center text-ink-500">
                    No saved comparable sales were stored in this report.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CompsSavedReportView;
