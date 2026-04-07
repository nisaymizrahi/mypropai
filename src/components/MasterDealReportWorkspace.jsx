import React, { useMemo } from "react";
import {
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import MasterDealReportSections from "./MasterDealReportSections";
import { SubscriptionLegalNotice } from "./SubscriptionConsentDialog";
import {
  buildDraftFinancialSnapshot,
  compsPropertyTypeOptions,
  dealStrategyOptions,
  formatCurrency,
  formatDate,
  getVerdictMeta,
} from "../utils/compsReport";

const FormField = ({ label, hint, children, className = "" }) => (
  <label className={`space-y-2 ${className}`.trim()}>
    <span className="text-sm font-medium text-ink-700">{label}</span>
    {children}
    {hint ? <span className="block text-xs leading-5 text-ink-400">{hint}</span> : null}
  </label>
);

const ControlCard = ({ icon: Icon, eyebrow, title, description, children, className = "" }) => (
  <section className={`report-control-card ${className}`.trim()}>
    <div className="flex items-start gap-3">
      {Icon ? (
        <span className="report-step-icon report-step-icon-active">
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="mt-1 text-lg font-semibold text-ink-900">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-6 text-ink-500">{description}</p> : null}
      </div>
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

const CollapsiblePanel = ({
  title,
  description,
  badge = "Optional",
  defaultOpen = false,
  children,
}) => (
  <details className="report-collapsible" {...(defaultOpen ? { open: true } : {})}>
    <summary className="report-collapsible-summary">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-ink-500">{description}</p>
      </div>
      <span className="glass-chip shrink-0">{badge}</span>
    </summary>
    <div className="mt-4">{children}</div>
  </details>
);

const PulseMetric = ({ label, value, hint, tone = "default" }) => (
  <div className={`report-pulse-card ${tone !== "default" ? `report-pulse-card-${tone}` : ""}`}>
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400">{label}</p>
    <p className="mt-2 text-lg font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
  </div>
);

const CostPreviewBars = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs text-ink-500">
            <span>{item.label}</span>
            <span className="font-semibold text-ink-700">{formatCurrency(item.amount)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(item.share || 0, 4)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const toneClasses = {
  strong: "report-verdict-strong",
  moderate: "report-verdict-moderate",
  risky: "report-verdict-risky",
};

const EmptyResultsState = ({ isAnalyzing }) => (
  <section className="surface-panel-strong overflow-hidden px-6 py-7 sm:px-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <span className="eyebrow">Report Preview</span>
        <h3 className="mt-4 font-display text-[2.1rem] leading-[0.96] text-ink-900">
          {isAnalyzing ? "Building the report..." : "Run once, review instantly"}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">
          The finished report will drop below with the verdict, financials, comps, assumptions,
          and AI write-up laid out in one investor-facing format.
        </p>
      </div>
      <div className="rounded-[22px] border border-ink-100 bg-white/80 px-4 py-4 text-sm text-ink-600">
        {isAnalyzing ? "Pulling comps, valuation, and deal math now." : "No report has been generated yet."}
      </div>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <PulseMetric
        label="Top controls"
        value="Address + filters first"
        hint="The key inputs stay at the top instead of getting buried."
      />
      <PulseMetric
        label="Financial snapshot"
        value="Value vs Cost"
        hint="Headline economics organized for a quick first read."
      />
      <PulseMetric
        label="Comp support"
        value="Primary, recent, active"
        hint="A cleaner hierarchy than a raw block of rows."
      />
      <PulseMetric
        label="PDF ready"
        value="Presentation layout"
        hint="Designed export rather than a plain browser print."
      />
    </div>
  </section>
);

const MasterDealReportWorkspace = ({
  subject = null,
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
  const subscriptionOffer = billingAccess?.subscriptionOffer || null;
  const startSubscriptionLabel = billingAccess?.trialEligible ? "Start Free Trial" : "Upgrade to Pro";
  const primaryCount = report?.comps?.primary?.summary?.count || 0;
  const canSave = Boolean(onSaveReport) && Boolean(report) && primaryCount >= 3 && !isAnalyzing && !isSavingReport;
  const liveSnapshot = useMemo(
    () => buildDraftFinancialSnapshot({ subject, deal, filters, report }),
    [deal, filters, report, subject]
  );
  const verdictMeta = useMemo(() => getVerdictMeta(report), [report]);
  const hasLiveFinancialPreview =
    liveSnapshot.totalProjectCost !== null ||
    liveSnapshot.estimatedValue !== null ||
    liveSnapshot.estimatedProfit !== null;
  const verdictDisplay = report
    ? verdictMeta
    : {
        tone: "pending",
        label: "Awaiting analysis",
        score: "—",
        compSupport: "Pending",
        confidence: "Pending",
      };

  const triggerFilterChange = (name, value) => {
    onFilterChange?.({
      target: {
        name,
        value: String(value),
      },
    });
  };

  const applyCompPreset = (preset) => {
    const presets = {
      tight: {
        radius: 0.5,
        saleDateMonths: 3,
        maxComps: 6,
      },
      balanced: {
        radius: 1,
        saleDateMonths: 6,
        maxComps: 8,
      },
      broad: {
        radius: 2,
        saleDateMonths: 12,
        maxComps: 10,
      },
    };

    const selectedPreset = presets[preset];
    if (!selectedPreset) return;

    Object.entries(selectedPreset).forEach(([name, value]) => {
      triggerFilterChange(name, value);
    });
  };

  const propertySummary = subject?.address
    ? [
        subject.propertyType || null,
        subject.squareFootage ? `${Number(subject.squareFootage).toLocaleString()} sqft` : null,
        subject.bedrooms !== null && subject.bedrooms !== undefined ? `${subject.bedrooms} bd` : null,
        subject.bathrooms !== null && subject.bathrooms !== undefined ? `${subject.bathrooms} ba` : null,
      ]
        .filter(Boolean)
        .join(" • ")
    : "Start with the property address.";

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
    <div className="space-y-6">
      <section className="surface-panel-strong overflow-hidden px-5 py-5 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="eyebrow">Comps + AI Report</span>
                <h2 className="mt-4 font-display text-[2rem] leading-[0.96] text-ink-900 sm:text-[2.2rem]">
                  Everything you need to run the report is right here
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-600">
                  Start with the address, add the few numbers you know, tighten the search, and run
                  the investor-ready report without digging through the page.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="report-mini-chip">Address first</span>
                <span className="report-mini-chip">Filters up top</span>
                <span className="report-mini-chip">AI report below</span>
              </div>
            </div>

            {renderSubjectPanel ? renderSubjectPanel() : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <ControlCard
                icon={BanknotesIcon}
                eyebrow="Deal Inputs"
                title="Core economics"
                description="These are the main numbers most deals need to get started."
              >
                <div className="grid gap-4 sm:grid-cols-2">
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

                  <FormField label="Hold period" hint="Used for carry assumptions.">
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

                  <FormField label="Renovation estimate">
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

                  <FormField label="Closing costs %" hint="Acquisition-side soft costs.">
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

                  <FormField label="Selling costs %" hint="Only matters for exit assumptions.">
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
              </ControlCard>

              <ControlCard
                icon={AdjustmentsHorizontalIcon}
                eyebrow="Comp Filters"
                title="Search settings"
                description="The main filters stay visible so you can adjust them without scrolling around."
              >
                <div className="rounded-[18px] border border-ink-100 bg-sand-50/75 px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400">
                    Quick presets
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyCompPreset("tight")}
                      className="report-mini-chip"
                    >
                      Tight search
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCompPreset("balanced")}
                      className="report-mini-chip"
                    >
                      Balanced
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCompPreset("broad")}
                      className="report-mini-chip"
                    >
                      Wider net
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

                  <FormField label="Max comps">
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
                </div>
              </ControlCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <CollapsiblePanel
                title="More comp filters"
                description="Optional bounds if you want a tighter or more specific comp set."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Square footage range">
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

                  <FormField label="Lot size range">
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

                  <FormField label="Beds range">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        name="minBedrooms"
                        value={filters.minBedrooms}
                        onChange={onFilterChange}
                        className="auth-input"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        name="maxBedrooms"
                        value={filters.maxBedrooms}
                        onChange={onFilterChange}
                        className="auth-input"
                        placeholder="Max"
                      />
                    </div>
                  </FormField>

                  <FormField label="Baths range">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        name="minBathrooms"
                        value={filters.minBathrooms}
                        onChange={onFilterChange}
                        className="auth-input"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        name="maxBathrooms"
                        value={filters.maxBathrooms}
                        onChange={onFilterChange}
                        className="auth-input"
                        placeholder="Max"
                      />
                    </div>
                  </FormField>

                  <FormField label="Year built range" className="sm:col-span-2">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        name="minYearBuilt"
                        value={filters.minYearBuilt}
                        onChange={onFilterChange}
                        className="auth-input"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        name="maxYearBuilt"
                        value={filters.maxYearBuilt}
                        onChange={onFilterChange}
                        className="auth-input"
                        placeholder="Max"
                      />
                    </div>
                  </FormField>
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel
                title="Advanced assumptions"
                description="Carry, financing, and underwriting details that sharpen the deal math."
              >
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
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

                    <FormField label="Target margin %">
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

                    <FormField label="Maintenance / mo" className="sm:col-span-2">
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

                  <FormField label="Notes" hint="Optional assumptions, scope notes, or risk reminders.">
                    <textarea
                      name="notes"
                      value={deal.notes}
                      onChange={onDealChange}
                      rows={5}
                      className="auth-input min-h-[140px]"
                      placeholder="Optional notes about condition, scope, seller situation, or special underwriting assumptions."
                    />
                  </FormField>
                </div>
              </CollapsiblePanel>
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 self-start">
            <div className={`report-verdict-card report-verdict-card-large ${toneClasses[verdictDisplay.tone] || "report-verdict-pending"}`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]">Deal score</p>
              <p className="mt-2 text-3xl font-semibold">{verdictDisplay.score}</p>
              <p className="mt-1 text-sm font-semibold">{verdictDisplay.label}</p>
              <p className="mt-2 text-xs opacity-80">
                {verdictDisplay.compSupport} comp support • {verdictDisplay.confidence} confidence
              </p>
            </div>

            <div className="report-pulse-shell">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                    Live deal pulse
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-ink-900">
                    {liveSnapshot.address || "No property selected yet"}
                  </h3>
                  <p className="mt-1 text-sm text-ink-500">{propertySummary}</p>
                </div>
                <div className="rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-ink-700">
                  {String(liveSnapshot.strategy || "flip").toUpperCase()} strategy
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <PulseMetric
                  label="Total cost preview"
                  value={formatCurrency(liveSnapshot.totalProjectCost)}
                  hint={
                    hasLiveFinancialPreview
                      ? `${formatCurrency(liveSnapshot.askingPrice)} purchase • ${formatCurrency(
                          liveSnapshot.rehabEstimate
                        )} renovation`
                      : "Add asking price and rehab to unlock a live preview"
                  }
                />
                <PulseMetric
                  label="Value / exit assumption"
                  value={formatCurrency(liveSnapshot.estimatedValue)}
                  hint={
                    liveSnapshot.estimatedValue
                      ? `${formatCurrency(liveSnapshot.estimatedProfit)} projected spread`
                      : "Run the report or add ARV to unlock a spread preview"
                  }
                  tone={
                    liveSnapshot.estimatedProfit > 0
                      ? "positive"
                      : liveSnapshot.estimatedProfit < 0
                        ? "negative"
                        : "default"
                  }
                />
                <PulseMetric
                  label="Comp search"
                  value={`${liveSnapshot.radius || "—"} mi`}
                  hint={`${liveSnapshot.saleDateMonths || "—"} months • ${
                    liveSnapshot.maxComps || "—"
                  } comps`}
                />
                <PulseMetric
                  label="Hold period"
                  value={
                    liveSnapshot.holdingPeriodMonths
                      ? `${liveSnapshot.holdingPeriodMonths} months`
                      : "—"
                  }
                  hint={
                    hasLiveFinancialPreview
                      ? "Carry assumptions update as you type"
                      : "Hold timing will matter once the deal basics are in"
                  }
                />
              </div>

              {liveSnapshot.costStack.length ? (
                <div className="mt-4">
                  <CostPreviewBars items={liveSnapshot.costStack} />
                </div>
              ) : null}
            </div>

            <div
              className="rounded-[24px] border border-ink-100 bg-sand-50/80 p-4 text-sm"
              data-testid="master-report-access-panel"
            >
              <div className="flex items-start gap-3">
                <span className="rounded-[16px] bg-white px-3 py-3 text-ink-700 shadow-soft">
                  <SparklesIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                    Report access
                  </p>
                  {isBillingAccessLoading ? (
                    <p className="mt-2 text-ink-500">Checking report access...</p>
                  ) : billingAccess?.accessGranted ? (
                    <div className="mt-2 space-y-1.5 text-ink-700">
                      {trialCreditsRemaining > 0 ? (
                        <p>
                          <span className="font-semibold">{trialCreditsRemaining}</span> trial credit
                          {trialCreditsRemaining === 1 ? "" : "s"} left.
                        </p>
                      ) : null}
                      {cycleCreditsRemaining > 0 ? (
                        <p>
                          <span className="font-semibold">{cycleCreditsRemaining}</span> cycle credit
                          {cycleCreditsRemaining === 1 ? "" : "s"} remaining.
                        </p>
                      ) : null}
                      {purchasedCreditsRemaining > 0 ? (
                        <p>
                          <span className="font-semibold">{purchasedCreditsRemaining}</span> purchased credit
                          {purchasedCreditsRemaining === 1 ? "" : "s"} available.
                        </p>
                      ) : null}
                      {billingAccess?.monthlyIncludedResetsAt ? (
                        <p className="text-xs text-ink-500">
                          Next refresh: {formatDate(billingAccess.monthlyIncludedResetsAt)}
                        </p>
                      ) : null}
                      {trialCreditsRemaining === 0 && cycleCreditsRemaining === 0 && purchasedCreditsRemaining === 0 ? (
                        <p>Premium report access is active.</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-2 space-y-3">
                      <p className="text-ink-700">
                        {showOneTimeCheckout
                          ? billingAccess?.hasActiveSubscription
                            ? "You’re out of report credits. Top up to keep underwriting."
                            : "Start the Pro trial or buy credits to unlock the full report."
                          : "This report flow is part of the Pro workspace."}
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
              </div>
            </div>

            <ControlCard
              eyebrow="Generate"
              title="Run the investor-facing output"
              description="The current inputs, comp filters, and assumptions will be packaged into the AI report below."
            >
              <button
                type="button"
                onClick={onRunAnalysis}
                disabled={isAnalyzing || isBillingAccessLoading || !canRun}
                data-testid="run-master-report"
                className="primary-action w-full justify-center disabled:opacity-50"
              >
                {isAnalyzing ? "Building Report..." : runButtonLabel}
              </button>
            </ControlCard>
          </aside>
        </div>
      </section>

      <div className="space-y-6" data-testid="master-report-results">
        {reportNotice ? (
          <div className="rounded-[16px] border border-sand-200 bg-sand-50 px-5 py-4 text-sm text-sand-800">
            {reportNotice}
          </div>
        ) : null}

        {report ? <MasterDealReportSections report={report} /> : <EmptyResultsState isAnalyzing={isAnalyzing} />}

        {onSaveReport && report ? (
          <section className="surface-panel px-6 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                  Save snapshot
                </p>
                <h3 className="mt-2 text-xl font-semibold text-ink-900">Keep this report in your library</h3>
                <p className="mt-1 text-sm text-ink-500">
                  Save the full report package for future review, reopening, and PDF export.
                </p>
                {primaryCount < 3 ? (
                  <p className="mt-2 text-sm text-clay-700">
                    At least 3 primary valuation comps are required before saving.
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
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default MasterDealReportWorkspace;
