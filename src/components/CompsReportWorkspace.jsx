import React, { useEffect, useMemo, useState } from "react";
import { SubscriptionLegalNotice } from "./SubscriptionConsentDialog";

import {
  buildSelectionSummary,
  compsPropertyTypeOptions,
  formatCurrency,
  formatDate,
  normalizeComparableRecord,
} from "../utils/compsReport";

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

const BandCard = ({ label, low, median, high, suffix = "" }) => {
  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (suffix) return `${Number(value).toLocaleString()}${suffix}`;
    return formatCurrency(value);
  };

  return (
    <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Low</p>
          <p className="mt-1 text-sm font-semibold text-ink-900">{formatValue(low)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Median</p>
          <p className="mt-1 text-sm font-semibold text-ink-900">{formatValue(median)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">High</p>
          <p className="mt-1 text-sm font-semibold text-ink-900">{formatValue(high)}</p>
        </div>
      </div>
    </div>
  );
};

const CompsReportWorkspace = ({
  subject = null,
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
  onSaveReport,
  isSavingReport = false,
  showOneTimeCheckout = false,
  compsNotice = "",
  renderSubjectPanel,
  runDisabled = false,
  runButtonLabel = "Run AI Comps Report",
  saveButtonLabel = "Save Selected Report",
  emptyTitle = "No comps report yet",
  emptyMessage = "Run the report to pull comparable properties, estimate value, and generate an AI recommendation.",
}) => {
  const [selectedCompIds, setSelectedCompIds] = useState([]);
  const canRun = Boolean(billingAccess?.accessGranted) && !runDisabled;

  const normalizedComps = useMemo(
    () => (analysis?.comps || []).map((comp, index) => normalizeComparableRecord(comp, index)),
    [analysis?.comps]
  );

  useEffect(() => {
    setSelectedCompIds(normalizedComps.map((comp) => comp.id));
  }, [normalizedComps]);

  const selectedComps = useMemo(
    () => normalizedComps.filter((comp) => selectedCompIds.includes(comp.id)),
    [normalizedComps, selectedCompIds]
  );

  const valuationContext = useMemo(
    () =>
      analysis?.valuationContext || {
        price: analysis?.summary?.estimatedValue ?? null,
        priceRangeLow: analysis?.summary?.estimatedValueLow ?? null,
        priceRangeHigh: analysis?.summary?.estimatedValueHigh ?? null,
      },
    [analysis?.summary, analysis?.valuationContext]
  );

  const activeSummary = useMemo(() => {
    if (!analysis) return null;
    return buildSelectionSummary(subject || analysis.subject || {}, selectedComps, valuationContext);
  }, [analysis, selectedComps, subject, valuationContext]);

  const allSelected =
    normalizedComps.length > 0 && normalizedComps.every((comp) => selectedCompIds.includes(comp.id));
  const selectionChanged =
    normalizedComps.length > 0 &&
    (selectedComps.length !== normalizedComps.length || !allSelected);
  const askVsEstimateLabel = !activeSummary?.askingPriceDelta
    ? null
    : `${formatCurrency(Math.abs(activeSummary.askingPriceDelta))} ${
        activeSummary.askingPriceDelta > 0 ? "above" : "below"
      } ask`;
  const canSave =
    Boolean(onSaveReport) &&
    Boolean(analysis) &&
    selectedComps.length >= 3 &&
    !isAnalyzing &&
    !isSavingReport;
  const trialCreditsRemaining = billingAccess?.trialCreditsRemaining || 0;
  const cycleCreditsRemaining = billingAccess?.monthlyIncludedRemainingCount || 0;
  const purchasedCreditsRemaining = billingAccess?.purchasedCreditsRemaining || 0;
  const totalCreditsRemaining = billingAccess?.totalCreditsRemaining || 0;
  const canBuyCredits = Boolean(onBuyReport);
  const subscriptionOffer = billingAccess?.subscriptionOffer || null;
  const startSubscriptionLabel = billingAccess?.trialEligible ? "Start Free Trial" : "Upgrade to Pro";

  const toggleComp = (compId) => {
    setSelectedCompIds((previous) =>
      previous.includes(compId)
        ? previous.filter((id) => id !== compId)
        : [...previous, compId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCompIds(normalizedComps.map((comp) => comp.id));
  };

  const handleClearSelection = () => {
    setSelectedCompIds([]);
  };

  const handleSaveReport = async () => {
    if (!onSaveReport || !analysis) return;

    await onSaveReport({
      subject: subject || analysis.subject || {},
      filters: analysis.filters || filters || {},
      valuationContext,
      selectedComps,
      summary: activeSummary,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="section-card p-6">
          <h3 className="text-xl font-semibold text-ink-900">Run comps analysis</h3>
          <p className="mt-1 text-sm text-ink-500">
            Pull market comps around this property, select the ones you want to keep, and build a
            saved comps report from the final set.
          </p>

          <div className="mt-4 rounded-[20px] border border-ink-100 bg-sand-50/70 p-4 text-sm">
            {isBillingAccessLoading ? (
              <p className="text-ink-500">Checking report access...</p>
            ) : billingAccess?.accessGranted ? (
              <div className="space-y-2 text-ink-700">
                {trialCreditsRemaining > 0 ? (
                  <>
                    <p>
                      Your free trial includes 2 comps credits. You have{" "}
                      <span className="font-semibold">{trialCreditsRemaining}</span> trial credit
                      {trialCreditsRemaining === 1 ? "" : "s"} left.
                    </p>
                    <p className="text-xs text-ink-500">
                      {billingAccess?.trialCreditsExpiresAt
                        ? `Trial credits expire on ${formatDate(billingAccess.trialCreditsExpiresAt)}.`
                        : "Use your trial credits before the trial ends."}
                    </p>
                  </>
                ) : null}
                {cycleCreditsRemaining > 0 ? (
                  <>
                    <p>
                      Pro includes 50 credits per billing cycle. You have{" "}
                      <span className="font-semibold">{cycleCreditsRemaining}</span> cycle credit
                      {cycleCreditsRemaining === 1 ? "" : "s"} left.
                    </p>
                    <p className="text-xs text-ink-500">
                      {billingAccess?.monthlyIncludedResetsAt
                        ? `Your next 50-credit refresh is on ${formatDate(
                            billingAccess.monthlyIncludedResetsAt
                          )}.`
                        : "Your cycle credits refresh on your next billing date."}
                    </p>
                  </>
                ) : null}
                {purchasedCreditsRemaining > 0 ? (
                  <p className="text-xs text-ink-500">
                    You also have {purchasedCreditsRemaining} permanent purchased credit
                    {purchasedCreditsRemaining === 1 ? "" : "s"} available.
                  </p>
                ) : null}
                {totalCreditsRemaining > 0 && trialCreditsRemaining === 0 && cycleCreditsRemaining === 0 ? (
                  <p>Purchased account credits are active for this workspace. Run the report whenever you're ready.</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-ink-700">
                  {billingAccess?.hasActiveSubscription
                    ? "You are out of comps credits. Buy 10 more credits to keep going."
                    : "Start the 30-day Pro trial with 2 free comps credits or buy 10 permanent credits for this account."}
                </p>
                <div className="flex flex-col gap-3">
                  {!billingAccess?.hasActiveSubscription ? (
                    <button
                      type="button"
                      onClick={onStartSubscription}
                      disabled={isStartingSubscription}
                      className="secondary-action w-full justify-center disabled:opacity-50"
                    >
                      {isStartingSubscription ? "Redirecting..." : startSubscriptionLabel}
                    </button>
                  ) : null}
                  {canBuyCredits ? (
                    <button
                      type="button"
                      onClick={onBuyReport}
                      disabled={isStartingCheckout}
                      className="primary-action w-full justify-center disabled:opacity-50"
                    >
                      {isStartingCheckout ? "Redirecting..." : "Buy 10 Credits"}
                    </button>
                  ) : null}
                  {!billingAccess?.hasActiveSubscription ? (
                    <SubscriptionLegalNotice
                      trialEligible={Boolean(billingAccess?.trialEligible)}
                      trialPeriodDays={subscriptionOffer?.trialPeriodDays || 0}
                      monthlyPriceCents={subscriptionOffer?.monthlyPriceCents ?? null}
                      className="bg-white/90"
                    />
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

            <FormField label="Property type" hint="Keep the report focused on the same asset class.">
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

            <FormField label="Lot size range" hint="Use the same unit your property facts are stored in.">
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

        {analysis && activeSummary ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryStat
                label="Low Estimate"
                value={formatCurrency(activeSummary.estimatedValueLow)}
                hint={`Median ${formatCurrency(activeSummary.estimatedValue)}`}
              />
              <SummaryStat
                label="High Estimate"
                value={formatCurrency(activeSummary.estimatedValueHigh)}
                hint={`Offer high ${formatCurrency(activeSummary.recommendedOfferHigh)}`}
              />
              <SummaryStat
                label="Median Comp Price"
                value={formatCurrency(activeSummary.medianSoldPrice)}
                hint={`${activeSummary.saleCompCount || 0} selected comps`}
              />
              <SummaryStat
                label="Median Comp $ / Sqft"
                value={activeSummary.medianPricePerSqft ? `$${activeSummary.medianPricePerSqft}` : "—"}
                hint={askVsEstimateLabel}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <BandCard
                label="Sold price band"
                low={activeSummary.lowSoldPrice}
                median={activeSummary.medianSoldPrice}
                high={activeSummary.highSoldPrice}
              />
              <BandCard
                label="Price per sqft band"
                low={activeSummary.lowPricePerSqft}
                median={activeSummary.medianPricePerSqft}
                high={activeSummary.highPricePerSqft}
                suffix=" / sqft"
              />
              <BandCard
                label="Days on market"
                low={activeSummary.lowDaysOnMarket}
                median={activeSummary.medianDaysOnMarket}
                high={activeSummary.highDaysOnMarket}
                suffix=" days"
              />
            </div>

            <div className="section-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-ink-900">Comp selection</h3>
                  <p className="mt-1 text-sm text-ink-500">
                    Choose the comparables you want included in the saved report.
                  </p>
                </div>
                <div className="rounded-full border border-sand-200 bg-sand-50 px-4 py-2 text-sm font-semibold text-sand-700">
                  {selectedComps.length} of {normalizedComps.length} selected
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={handleSelectAll} className="ghost-action">
                  Select all
                </button>
                <button type="button" onClick={handleClearSelection} className="ghost-action">
                  Clear selection
                </button>
              </div>
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

              {selectionChanged ? (
                <div className="mt-5 rounded-[18px] border border-sand-200 bg-sand-50 px-4 py-3 text-sm text-sand-800">
                  The pricing stats above already reflect your selected comp set. Save the report to
                  regenerate the AI memo from those selected comps.
                </div>
              ) : null}

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
                      <th className="p-3 font-semibold">Include</th>
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
                    {normalizedComps.map((comp) => {
                      const isSelected = selectedCompIds.includes(comp.id);

                      return (
                        <tr key={comp.id} className={isSelected ? "" : "bg-ink-50/50"}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleComp(comp.id)}
                              className="h-4 w-4 rounded border-ink-300 text-verdigris-600 focus:ring-verdigris-400"
                            />
                          </td>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {onSaveReport ? (
              <div className="section-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-ink-900">Save this report</h3>
                    <p className="mt-1 text-sm text-ink-500">
                      Save the selected comps as a versioned report snapshot for later review.
                    </p>
                    {selectedComps.length < 3 ? (
                      <p className="mt-2 text-sm text-clay-700">
                        Select at least 3 comparables before saving.
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveReport}
                    disabled={!canSave}
                    className="primary-action justify-center disabled:opacity-50"
                  >
                    {isSavingReport ? "Saving..." : saveButtonLabel}
                  </button>
                </div>
              </div>
            ) : null}
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
