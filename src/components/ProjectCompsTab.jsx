import React, { useMemo } from "react";

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatNumber = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString()}${suffix}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "—";
  return parsed.toLocaleDateString();
};

const MetricTile = ({ label, value, hint }) => (
  <div className="metric-tile p-5">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const ProjectCompsTab = ({ snapshot = null }) => {
  const compsAnalysis = snapshot?.compsAnalysis || null;
  const recentComps = useMemo(
    () => (Array.isArray(compsAnalysis?.recentComps) ? compsAnalysis.recentComps : []),
    [compsAnalysis]
  );

  if (!compsAnalysis?.generatedAt) {
    return (
      <div className="section-card p-6 sm:p-7">
        <span className="eyebrow">Saved comps</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">No comps snapshot was saved</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
          This project did not have a saved lead comps analysis at the time it moved into project
          management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Estimated value"
          value={formatCurrency(compsAnalysis.estimatedValue)}
          hint={`Generated ${formatDate(compsAnalysis.generatedAt)}`}
        />
        <MetricTile
          label="Offer range"
          value={`${formatCurrency(compsAnalysis.recommendedOfferLow)} - ${formatCurrency(
            compsAnalysis.recommendedOfferHigh
          )}`}
          hint="Saved from the lead comps report"
        />
        <MetricTile
          label="Average sold"
          value={formatCurrency(compsAnalysis.averageSoldPrice)}
          hint={`${compsAnalysis.saleCompCount || 0} comparable sale${
            compsAnalysis.saleCompCount === 1 ? "" : "s"
          }`}
        />
        <MetricTile
          label="Median $ / sqft"
          value={formatNumber(compsAnalysis.medianPricePerSqft, " / sqft")}
          hint="Saved market pricing context"
        />
      </section>

      {compsAnalysis.report ? (
        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">AI summary</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">
            {compsAnalysis.report.headline || "Saved comps recommendation"}
          </h3>
          <p className="mt-4 text-sm leading-7 text-ink-600">
            {compsAnalysis.report.executiveSummary || "No written summary was saved."}
          </p>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Pricing recommendation
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-700">
                {compsAnalysis.report.pricingRecommendation || "—"}
              </p>
            </div>
            <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Offer strategy
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-700">
                {compsAnalysis.report.offerStrategy || "—"}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">Saved comp set</span>
            <h3 className="mt-4 text-3xl font-semibold text-ink-900">Comparable properties</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
              This is the comps snapshot that was carried over from the potential property before it
              moved into project management.
            </p>
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
                  <tr key={`${comp.address || "comp"}-${index}`}>
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
                    No saved comparable sales were stored in the lead snapshot.
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

export default ProjectCompsTab;
