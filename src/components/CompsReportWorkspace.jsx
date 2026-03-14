import React from "react";

import { compsPropertyTypeOptions, formatCurrency, formatDate } from "../utils/compsReport";

const SummaryStat = ({ label, value, hint }) => (
  <div className="metric-tile p-4">
    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">{label}</p>
    <p className="mt-3 text-lg font-medium text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const FormField = ({ label, hint, children, className = "" }) => (
  <label className={`space-y-2 ${className}`.trim()}>
    <span className="text-sm font-medium text-ink-700">{label}</span>
    {children}
    {hint ? <span className="block text-xs leading-5 text-ink-400">{hint}</span> : null}
  </label>
);

const LoadingSpinner = () => (
  <div className="section-card flex items-center justify-center px-6 py-14">
    <div className="loading-ring h-10 w-10 animate-spin rounded-full" />
  </div>
);

const CompsReportWorkspace = ({
  analysis,
  filters,
  onFilterChange,
  isAnalyzing,
  onRunAnalysis,
  billingAccess,
  isBillingAccessLoading,
  onStartSubscription,
  isStartingSubscription,
  onBuyReport,
  isStartingCheckout,
  showOneTimeCheckout = false,
  compsNotice = "",
  renderSubjectPanel,
  runDisabled = false,
  runButtonLabel = "Run AI Comps Report",
  emptyTitle = "No comps report yet",
  emptyMessage = "Run the report to pull comparable properties, estimate value, and generate an AI recommendation.",
}) => {
  const askVsEstimateLabel = !analysis?.summary?.askingPriceDelta
    ? null
    : `${formatCurrency(Math.abs(analysis.summary.askingPriceDelta))} ${
        analysis.summary.askingPriceDelta > 0 ? "above" : "below"
      } ask`;
  const canRun = Boolean(billingAccess?.accessGranted) && !runDisabled;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="section-card p-6">
          <h3 className="text-xl font-semibold text-ink-900">Run comps analysis</h3>
          <p className="mt-1 text-sm text-ink-500">
            Pull market comps around this property, generate pricing guidance, and summarize it
            with AI.
          </p>

          <div className="mt-4 rounded-[20px] border border-ink-100 bg-sand-50/70 p-4 text-sm">
            {isBillingAccessLoading ? (
              <p className="text-ink-500">Checking report access...</p>
            ) : billingAccess?.accessGranted ? (
              <div className="space-y-2 text-ink-700">
                {billingAccess.accessSource === "subscription_included" ? (
                  <>
                    <p>
                      Pro includes 10 comps reports per month. You have{" "}
                      <span className="font-semibold">
                        {billingAccess.monthlyIncludedRemainingCount}
                      </span>{" "}
                      included report
                      {billingAccess.monthlyIncludedRemainingCount === 1 ? "" : "s"} left this
                      month.
                    </p>
                    <p className="text-xs text-ink-500">
                      Used {billingAccess.monthlyIncludedUsedCount} of {billingAccess.monthlyIncludedLimit}
                      {billingAccess.monthlyIncludedResetsAt
                        ? `, resets on ${formatDate(billingAccess.monthlyIncludedResetsAt)}`
                        : ""}
                      .
                    </p>
                  </>
                ) : (
                  <p>
                    {showOneTimeCheckout
                      ? "This lead already has a paid report purchase ready to run."
                      : "Pro access is active for this account. Run the report whenever you're ready."}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-ink-700">
                  {showOneTimeCheckout
                    ? billingAccess?.hasActiveSubscription
                      ? `You have used all ${billingAccess.monthlyIncludedLimit || 10} included Pro comps reports for this month. Buy this lead's report one time to keep going.`
                      : "This report is a premium workflow. Upgrade to Pro for 10 included comps reports each month or buy this lead's report one time."
                    : billingAccess?.hasActiveSubscription
                      ? `You have used all ${billingAccess.monthlyIncludedLimit || 10} included Pro comps reports for this month. It will unlock again when the billing month resets.`
                      : "This report is a Pro workflow. Upgrade to Pro to run comps reports from the menu without creating a lead first."}
                </p>
                <div className="flex flex-col gap-3">
                  {!billingAccess?.hasActiveSubscription ? (
                    <button
                      type="button"
                      onClick={onStartSubscription}
                      disabled={isStartingSubscription}
                      className="secondary-action w-full justify-center disabled:opacity-50"
                    >
                      {isStartingSubscription ? "Redirecting..." : "Upgrade to Pro"}
                    </button>
                  ) : null}
                  {showOneTimeCheckout ? (
                    <button
                      type="button"
                      onClick={onBuyReport}
                      disabled={isStartingCheckout}
                      className="primary-action w-full justify-center disabled:opacity-50"
                    >
                      {isStartingCheckout ? "Redirecting..." : "Buy One-Time Report"}
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <FormField label="Radius (miles)">
              <input
                type="number"
                min="0.25"
                step="0.25"
                name="radius"
                value={filters.radius}
                onChange={onFilterChange}
                className="auth-input"
              />
            </FormField>

            <FormField label="Comp freshness (months)">
              <input
                type="number"
                min="1"
                step="1"
                name="saleDateMonths"
                value={filters.saleDateMonths}
                onChange={onFilterChange}
                className="auth-input"
              />
            </FormField>

            <FormField
              label="Property type"
              hint="Keep the report focused on the same asset class."
            >
              <select
                name="propertyType"
                value={filters.propertyType}
                onChange={onFilterChange}
                className="auth-input"
              >
                {compsPropertyTypeOptions.map((option) => (
                  <option key={option.value || "any"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Building size range (sqft)"
              hint="Filter comparable properties by improvement area."
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="minSquareFootage"
                  value={filters.minSquareFootage}
                  onChange={onFilterChange}
                  className="auth-input"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="maxSquareFootage"
                  value={filters.maxSquareFootage}
                  onChange={onFilterChange}
                  className="auth-input"
                  placeholder="Max"
                />
              </div>
            </FormField>

            <FormField
              label="Lot size range"
              hint="Use the same unit your property facts are stored in."
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="minLotSize"
                  value={filters.minLotSize}
                  onChange={onFilterChange}
                  className="auth-input"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="maxLotSize"
                  value={filters.maxLotSize}
                  onChange={onFilterChange}
                  className="auth-input"
                  placeholder="Max"
                />
              </div>
            </FormField>

            <FormField label="Max comps in report">
              <input
                type="number"
                min="5"
                max="12"
                step="1"
                name="maxComps"
                value={filters.maxComps}
                onChange={onFilterChange}
                className="auth-input"
              />
            </FormField>

            <button
              type="button"
              onClick={onRunAnalysis}
              disabled={isAnalyzing || isBillingAccessLoading || !canRun}
              className="primary-action w-full justify-center disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing..." : runButtonLabel}
            </button>
          </div>
        </div>

        {renderSubjectPanel ? renderSubjectPanel() : null}
      </div>

      <div className="space-y-6">
        {compsNotice ? (
          <div className="rounded-[16px] border border-sand-200 bg-sand-50 px-5 py-4 text-sm text-sand-800">
            {compsNotice}
          </div>
        ) : null}

        {analysis ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryStat
                label="Estimated Value"
                value={formatCurrency(analysis.summary.estimatedValue)}
                hint={
                  analysis.summary.estimatedValueLow && analysis.summary.estimatedValueHigh
                    ? `${formatCurrency(analysis.summary.estimatedValueLow)} to ${formatCurrency(
                        analysis.summary.estimatedValueHigh
                      )}`
                    : null
                }
              />
              <SummaryStat
                label="Recommended Offer"
                value={formatCurrency(analysis.summary.recommendedOfferHigh)}
                hint={
                  analysis.summary.recommendedOfferLow
                    ? `${formatCurrency(analysis.summary.recommendedOfferLow)} to ${formatCurrency(
                        analysis.summary.recommendedOfferHigh
                      )}`
                    : null
                }
              />
              <SummaryStat
                label="Median Comp Price"
                value={formatCurrency(analysis.summary.medianSoldPrice)}
                hint={`${analysis.summary.saleCompCount || 0} comps used`}
              />
              <SummaryStat
                label="Median Comp $ / Sqft"
                value={
                  analysis.summary.medianPricePerSqft ? `$${analysis.summary.medianPricePerSqft}` : "—"
                }
                hint={askVsEstimateLabel}
              />
            </div>

            <div className="section-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-ink-900">
                    {analysis.ai?.headline || "AI Market Readout"}
                  </h3>
                  <p className="mt-1 text-sm text-ink-500">
                    Generated {formatDate(analysis.generatedAt)}
                  </p>
                </div>
                {analysis.ai?.confidence ? (
                  <span className="rounded-full bg-verdigris-50 px-3 py-1 text-sm font-semibold text-verdigris-700">
                    {analysis.ai.confidence} confidence
                  </span>
                ) : null}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Executive Summary
                    </h4>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">
                      {analysis.ai?.executiveSummary || "No AI summary was generated for this run."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Pricing Recommendation
                    </h4>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">
                      {analysis.ai?.pricingRecommendation || "Pricing recommendation unavailable."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Offer Strategy
                    </h4>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">
                      {analysis.ai?.offerStrategy || "Offer strategy unavailable."}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Risk Flags
                    </h4>
                    {analysis.ai?.riskFlags?.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-ink-600">
                        {analysis.ai.riskFlags.map((flag) => (
                          <li key={flag} className="rounded-[18px] bg-sand-50 px-4 py-3">
                            {flag}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-ink-500">No risk flags captured.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Next Steps
                    </h4>
                    {analysis.ai?.nextSteps?.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-ink-600">
                        {analysis.ai.nextSteps.map((step) => (
                          <li key={step} className="rounded-[18px] bg-sand-50 px-4 py-3">
                            {step}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-ink-500">No next steps captured.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="section-card p-6">
              <h3 className="text-xl font-semibold text-ink-900">Comparable properties</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-sand-50 text-left text-ink-500">
                    <tr>
                      <th className="p-3 font-semibold">Address</th>
                      <th className="p-3 font-semibold">Comp Price</th>
                      <th className="p-3 font-semibold">$ / Sqft</th>
                      <th className="p-3 font-semibold">Sqft / Lot</th>
                      <th className="p-3 font-semibold">Beds/Baths</th>
                      <th className="p-3 font-semibold">Distance</th>
                      <th className="p-3 font-semibold">Comp Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {analysis.comps.map((comp) => (
                      <tr key={`${comp.address}-${comp.saleDate}`}>
                        <td className="p-3 font-medium text-ink-900">
                          <div>
                            <p>{comp.address}</p>
                            <p className="mt-1 text-xs font-normal text-ink-500">
                              {[comp.propertyType, comp.unitCount ? `${comp.unitCount} units` : null]
                                .filter(Boolean)
                                .join(" • ") || "Comparable property"}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 text-ink-700">{formatCurrency(comp.salePrice)}</td>
                        <td className="p-3 text-ink-700">
                          {comp.pricePerSqft ? `$${Math.round(comp.pricePerSqft)}` : "—"}
                        </td>
                        <td className="p-3 text-ink-700">
                          <div>
                            <p>{comp.squareFootage || "—"}</p>
                            <p className="mt-1 text-xs text-ink-500">
                              Lot {comp.lotSize ? Number(comp.lotSize).toLocaleString() : "—"}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 text-ink-700">
                          {[comp.bedrooms ?? "—", comp.bathrooms ?? "—"].join(" / ")}
                        </td>
                        <td className="p-3 text-ink-700">
                          {comp.distance !== null && comp.distance !== undefined
                            ? `${comp.distance.toFixed(2)} mi`
                            : "—"}
                        </td>
                        <td className="p-3 text-ink-700">{formatDate(comp.saleDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="section-card px-6 py-12 text-center">
            {isAnalyzing ? (
              <LoadingSpinner />
            ) : (
              <>
                <h3 className="text-xl font-semibold text-ink-900">{emptyTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{emptyMessage}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompsReportWorkspace;
