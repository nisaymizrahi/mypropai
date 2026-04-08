import React from "react";

import MasterDealReportSections from "./MasterDealReportSections";
import { compsPropertyTypeOptions, dealStrategyOptions, formatDate } from "../utils/compsReport";

const FormField = ({ label, hint, children, className = "" }) => (
  <label className={`space-y-2 ${className}`.trim()}>
    <span className="text-sm font-medium text-ink-700">{label}</span>
    {children}
    {hint ? <span className="block text-xs leading-5 text-ink-400">{hint}</span> : null}
  </label>
);

const MasterDealReportWorkspace = ({
  report = null,
  filters,
  deal,
  onFilterChange,
  onDealChange,
  isAnalyzing,
  onRunAnalysis,
  billingAccess,
  isBillingAccessLoading,
  onStartSubscription,
  isStartingSubscription,
  onBuyReport,
  isStartingCheckout = false,
  onSaveReport,
  isSavingReport = false,
  showOneTimeCheckout = false,
  reportNotice = "",
  renderSubjectPanel,
  runDisabled = false,
  runButtonLabel = "Run Master Deal Report",
  saveButtonLabel = "Save Report",
}) => {
  const canRun = Boolean(billingAccess?.accessGranted) && !runDisabled;
  const trialCreditsRemaining = billingAccess?.trialCreditsRemaining || 0;
  const cycleCreditsRemaining = billingAccess?.monthlyIncludedRemainingCount || 0;
  const purchasedCreditsRemaining = billingAccess?.purchasedCreditsRemaining || 0;
  const startSubscriptionLabel = billingAccess?.trialEligible ? "Start Free Trial" : "Upgrade to Pro";
  const primaryCount = report?.comps?.primary?.summary?.count || 0;
  const canSave = Boolean(onSaveReport) && Boolean(report) && primaryCount >= 3 && !isAnalyzing && !isSavingReport;

  const handleSave = async () => {
    if (!onSaveReport || !report) return;
    await onSaveReport({
      subject: report.subject,
      filters: report.compFilters || report.filters || filters || {},
      deal: report.dealInputs || deal || {},
      valuationContext: report.valuationContext || null,
      selectedComps: Array.isArray(report.recentComps) ? report.recentComps : [],
      reportData: report,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="section-card p-6">
          <h3 className="text-xl font-semibold text-ink-900">Run Master Deal Report</h3>
          <p className="mt-1 text-sm text-ink-500">
            Combine property facts, comps, market context, deal math, and AI underwriting into one premium report.
          </p>

          <div
            className="mt-4 rounded-[20px] border border-ink-100 bg-sand-50/70 p-4 text-sm"
            data-testid="master-report-access-panel"
          >
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
                {trialCreditsRemaining === 0 && cycleCreditsRemaining === 0 ? (
                  <p>Premium report access is active for this account.</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-ink-700">
                  {showOneTimeCheckout
                    ? billingAccess?.hasActiveSubscription
                      ? "You are out of comps credits. Buy 10 more credits to keep going."
                      : "Start the 30-day Pro trial with 2 free comps credits or buy 10 permanent credits for this account."
                    : "This report is a Pro workflow. Start the free trial or buy credits to unlock it."}
                </p>
                <div className="flex flex-col gap-3">
                  {!billingAccess?.hasActiveSubscription ? (
                    <button
                      type="button"
                      onClick={onStartSubscription}
                      disabled={isStartingSubscription}
                      data-testid="start-subscription-checkout"
                      className="secondary-action w-full justify-center disabled:opacity-50"
                    >
                      {isStartingSubscription ? "Redirecting..." : startSubscriptionLabel}
                    </button>
                  ) : null}
                  {showOneTimeCheckout ? (
                    <button
                      type="button"
                      onClick={onBuyReport}
                      disabled={isStartingCheckout}
                      data-testid="buy-report-credits"
                      className="primary-action w-full justify-center disabled:opacity-50"
                    >
                      {isStartingCheckout ? "Redirecting..." : "Buy 10 Credits"}
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-5">
            <div className="rounded-[20px] border border-ink-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Comp filters
              </p>
              <div className="mt-4 space-y-4">
                <FormField label="Radius (miles)">
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    name="radius"
                    value={filters.radius}
                    onChange={onFilterChange}
                    data-testid="master-radius-input"
                    className="auth-input"
                  />
                </FormField>

                <FormField label="Freshness (months)">
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

                <FormField label="Property type">
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

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Min beds">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="minBedrooms"
                      value={filters.minBedrooms}
                      onChange={onFilterChange}
                      className="auth-input"
                    />
                  </FormField>
                  <FormField label="Max beds">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="maxBedrooms"
                      value={filters.maxBedrooms}
                      onChange={onFilterChange}
                      className="auth-input"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Min baths">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      name="minBathrooms"
                      value={filters.minBathrooms}
                      onChange={onFilterChange}
                      className="auth-input"
                    />
                  </FormField>
                  <FormField label="Max baths">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      name="maxBathrooms"
                      value={filters.maxBathrooms}
                      onChange={onFilterChange}
                      className="auth-input"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Min sqft">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="minSquareFootage"
                      value={filters.minSquareFootage}
                      onChange={onFilterChange}
                      className="auth-input"
                    />
                  </FormField>
                  <FormField label="Max sqft">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="maxSquareFootage"
                      value={filters.maxSquareFootage}
                      onChange={onFilterChange}
                      className="auth-input"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Min year built">
                    <input
                      type="number"
                      min="1800"
                      step="1"
                      name="minYearBuilt"
                      value={filters.minYearBuilt}
                      onChange={onFilterChange}
                      className="auth-input"
                    />
                  </FormField>
                  <FormField label="Max year built">
                    <input
                      type="number"
                      min="1800"
                      step="1"
                      name="maxYearBuilt"
                      value={filters.maxYearBuilt}
                      onChange={onFilterChange}
                      className="auth-input"
                    />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-ink-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Deal assumptions
              </p>
              <div className="mt-4 space-y-4">
                <FormField label="Strategy">
                  <select
                    name="strategy"
                    value={deal.strategy}
                    onChange={onDealChange}
                    className="auth-input"
                  >
                    {dealStrategyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Asking price">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    name="askingPrice"
                    value={deal.askingPrice}
                    onChange={onDealChange}
                    data-testid="deal-asking-price-input"
                    className="auth-input"
                  />
                </FormField>

                <FormField label="Estimated renovation cost">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    name="rehabEstimate"
                    value={deal.rehabEstimate}
                    onChange={onDealChange}
                    data-testid="deal-rehab-input"
                    className="auth-input"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Hold months">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      name="holdingPeriodMonths"
                      value={deal.holdingPeriodMonths}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                  <FormField label="Loan to cost %">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      name="loanToCostPercent"
                      value={deal.loanToCostPercent}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Closing costs %">
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      name="acquisitionClosingCostPercent"
                      value={deal.acquisitionClosingCostPercent}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                  <FormField label="Selling costs %">
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      name="sellingCostPercent"
                      value={deal.sellingCostPercent}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Interest rate %">
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      name="interestRatePercent"
                      value={deal.interestRatePercent}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                  <FormField label="Points / fees %">
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      name="financingPointsPercent"
                      value={deal.financingPointsPercent}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Annual taxes">
                    <input
                      type="number"
                      min="0"
                      step="100"
                      name="annualTaxes"
                      value={deal.annualTaxes}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                  <FormField label="Insurance / mo">
                    <input
                      type="number"
                      min="0"
                      step="25"
                      name="monthlyInsurance"
                      value={deal.monthlyInsurance}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Utilities / mo">
                    <input
                      type="number"
                      min="0"
                      step="25"
                      name="monthlyUtilities"
                      value={deal.monthlyUtilities}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                  <FormField label="Maintenance / mo">
                    <input
                      type="number"
                      min="0"
                      step="25"
                      name="monthlyMaintenance"
                      value={deal.monthlyMaintenance}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Contingency %">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      name="contingencyPercent"
                      value={deal.contingencyPercent}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                  <FormField label="Desired margin %">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      name="desiredProfitMarginPercent"
                      value={deal.desiredProfitMarginPercent}
                      onChange={onDealChange}
                      className="auth-input"
                    />
                  </FormField>
                </div>

                <FormField label="Deal / property notes">
                  <textarea
                    name="notes"
                    value={deal.notes}
                    onChange={onDealChange}
                    rows={5}
                    className="auth-input min-h-[130px]"
                    placeholder="Optional notes about condition, scope, seller situation, or deal assumptions."
                  />
                </FormField>
              </div>
            </div>

            <button
              type="button"
              onClick={onRunAnalysis}
              disabled={isAnalyzing || isBillingAccessLoading || !canRun}
              data-testid="run-master-report"
              className="primary-action w-full justify-center disabled:opacity-50"
            >
              {isAnalyzing ? "Building Report..." : runButtonLabel}
            </button>
          </div>
        </div>

        {renderSubjectPanel ? renderSubjectPanel() : null}
      </div>

      <div className="space-y-6" data-testid="master-report-results">
        {reportNotice ? (
          <div className="rounded-[16px] border border-sand-200 bg-sand-50 px-5 py-4 text-sm text-sand-800">
            {reportNotice}
          </div>
        ) : null}

        <MasterDealReportSections report={report} />

        {onSaveReport ? (
          <div className="section-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-ink-900">Save this report</h3>
                <p className="mt-1 text-sm text-ink-500">
                  Save the full Master Deal Report snapshot for future review and PDF export.
                </p>
                {primaryCount < 3 ? (
                  <p className="mt-2 text-sm text-clay-700">
                    At least 3 primary valuation comps are needed before saving.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                data-testid="save-master-report"
                className="primary-action justify-center disabled:opacity-50"
              >
                {isSavingReport ? "Saving..." : saveButtonLabel}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MasterDealReportWorkspace;
