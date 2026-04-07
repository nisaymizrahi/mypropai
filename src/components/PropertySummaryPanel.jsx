import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import { getBudgetItems, getExpenses, getInvestment } from "../utils/api";
import { formatCurrency, getInvestmentAnalysisMetrics, toNumber } from "../utils/investmentMetrics";
import { buildPropertyWorkspacePath } from "../utils/propertyWorkspaceNavigation";
import { getInvestmentStrategy, getInvestmentStrategyLabel } from "../utils/propertyStrategy";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const readMeaningfulAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const formatMoney = (value, empty = "Not captured") => {
  const parsed = readMeaningfulAmount(value);
  return parsed === null ? empty : formatCurrency(parsed);
};

const formatSignedMoney = (value, empty = "Not captured") => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? formatCurrency(parsed) : empty;
};

const formatNumber = (value, empty = "Not captured") => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed.toLocaleString() : empty;
};

const formatPercent = (value, empty = "Not captured", digits = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${parsed.toFixed(digits)}%` : empty;
};

const formatDate = (value, empty = "Not captured") => {
  if (!value) return empty;

  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? empty : dateFormatter.format(parsed);
};

const formatText = (value, empty = "Not captured") =>
  typeof value === "string" && value.trim() ? value.trim() : empty;

const sumRenovationBudget = (items = []) =>
  Array.isArray(items)
    ? items.reduce((sum, item) => sum + toNumber(item?.budget, 0), 0)
    : 0;

const buildRecommendedOfferLabel = (analysis) => {
  const low = readMeaningfulAmount(analysis?.recommendedOfferLow);
  const high = readMeaningfulAmount(analysis?.recommendedOfferHigh);

  if (low !== null && high !== null) {
    return `${formatCurrency(low)} - ${formatCurrency(high)}`;
  }

  if (low !== null) {
    return `From ${formatCurrency(low)}`;
  }

  if (high !== null) {
    return `Up to ${formatCurrency(high)}`;
  }

  return "Not captured";
};

const formatDeltaLabel = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return "Not enough data";
  }

  if (Math.abs(parsed) < 1) {
    return "On plan";
  }

  const direction = parsed > 0 ? "higher" : "lower";
  return `${formatCurrency(Math.abs(parsed))} ${direction}`;
};

const getDeltaTone = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) < 1) {
    return "bg-ink-100 text-ink-700";
  }

  return parsed > 0 ? "bg-clay-100 text-clay-700" : "bg-verdigris-50 text-verdigris-700";
};

const SummaryTile = ({ icon: Icon, label, value, hint, tone = "text-ink-900" }) => (
  <div className="metric-tile p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
      <Icon className="h-5 w-5" />
    </div>
    <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const DetailRow = ({ label, value, hint }) => (
  <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-3 last:border-b-0">
    <div>
      <p className="text-sm font-medium text-ink-600">{label}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-ink-400">{hint}</p> : null}
    </div>
    <p className="max-w-[55%] text-right text-sm font-semibold text-ink-900">{value}</p>
  </div>
);

const VarianceRow = ({ label, originalLabel, originalValue, currentLabel, currentValue, delta }) => (
  <div className="rounded-[20px] border border-ink-100 bg-white/85 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold text-ink-900">{label}</p>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${getDeltaTone(delta)}`}
      >
        {formatDeltaLabel(delta)}
      </span>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-[16px] bg-sand-50/80 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
          {originalLabel}
        </p>
        <p className="mt-2 text-sm font-semibold text-ink-900">{originalValue}</p>
      </div>
      <div className="rounded-[16px] bg-verdigris-50/70 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
          {currentLabel}
        </p>
        <p className="mt-2 text-sm font-semibold text-ink-900">{currentValue}</p>
      </div>
    </div>
  </div>
);

const EmptySnapshotState = ({ pipelineLeadPath, actions = null }) => (
  <section className="surface-panel px-6 py-6 sm:px-7">
    <span className="eyebrow">Property story</span>
    <h3 className="mt-4 text-3xl font-semibold text-ink-900">Original deal details are still missing</h3>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
      This property does not have a linked deal snapshot yet, so we cannot reconstruct the
      original assumptions or the acquisition story from inside the workspace.
    </p>
    <div className="mt-6 flex flex-wrap gap-3">
      {actions}
      {pipelineLeadPath ? (
        <Link to={pipelineLeadPath} className="secondary-action">
          Open source deal
        </Link>
      ) : null}
    </div>
  </section>
);

const PropertySummaryPanel = ({
  property,
  propertyKey,
  activeContentKey,
  leadWorkspace,
  savedReports = [],
  pipelineLeadPath = "",
  embedded = false,
  embeddedActions = null,
  emptyActions = null,
}) => {
  const investmentId = property?.workspaces?.acquisitions?.id || "";
  const acquisitionsPath = property?.workspaces?.acquisitions?.path || "";

  const [investment, setInvestment] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(Boolean(investmentId));
  const [error, setError] = useState("");

  const loadAcquisitionContext = useCallback(async () => {
    if (!investmentId) {
      setInvestment(null);
      setBudgetItems([]);
      setExpenses([]);
      setLoading(false);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [investmentData, budgetData, expenseData] = await Promise.all([
        getInvestment(investmentId),
        getBudgetItems(investmentId),
        getExpenses(investmentId),
      ]);

      setInvestment(investmentData);
      setBudgetItems(Array.isArray(budgetData) ? budgetData : []);
      setExpenses(Array.isArray(expenseData) ? expenseData : []);
    } catch (loadError) {
      setError(loadError.message || "Failed to load the acquisitions context.");
    } finally {
      setLoading(false);
    }
  }, [investmentId]);

  useEffect(() => {
    loadAcquisitionContext();
  }, [loadAcquisitionContext]);

  const metrics = useMemo(
    () =>
      investment
        ? getInvestmentAnalysisMetrics(investment, {
            budgetItems,
            expenses,
          })
        : null,
    [budgetItems, expenses, investment]
  );

  const latestSavedReport = savedReports[0] || null;
  const frozenSnapshot = investment?.sourceLeadSnapshot || null;
  const sourceSnapshot = frozenSnapshot || leadWorkspace || null;
  const scopeItems = useMemo(
    () =>
      Array.isArray(sourceSnapshot?.renovationPlan?.items)
        ? [...sourceSnapshot.renovationPlan.items].sort(
            (left, right) => toNumber(right?.budget, 0) - toNumber(left?.budget, 0)
          )
        : [],
    [sourceSnapshot]
  );

  const originalScopeBudget =
    readMeaningfulAmount(sourceSnapshot?.rehabEstimate) ??
    readMeaningfulAmount(sumRenovationBudget(scopeItems));
  const currentBudget =
    readMeaningfulAmount(metrics?.totalOriginalBudget) ??
    readMeaningfulAmount(metrics?.totalBudget);
  const spentToDate = readMeaningfulAmount(metrics?.totalSpent);
  const purchasePrice = readMeaningfulAmount(investment?.purchasePrice);
  const askingPrice = readMeaningfulAmount(sourceSnapshot?.sellerAskingPrice);
  const targetOffer = readMeaningfulAmount(sourceSnapshot?.targetOffer);
  const originalArv =
    readMeaningfulAmount(sourceSnapshot?.arv) ??
    readMeaningfulAmount(sourceSnapshot?.compsAnalysis?.estimatedValue) ??
    readMeaningfulAmount(latestSavedReport?.estimatedValue);
  const currentArv =
    readMeaningfulAmount(investment?.arv) ??
    readMeaningfulAmount(metrics?.arv) ??
    originalArv;

  const strategyLabel = investment
    ? getInvestmentStrategyLabel(getInvestmentStrategy(investment))
    : "Not started";
  const marketAnalysis = latestSavedReport || sourceSnapshot?.compsAnalysis || null;
  const marketSnapshotDate = latestSavedReport?.generatedAt || sourceSnapshot?.compsAnalysis?.generatedAt;
  const estimatedValueLow = readMeaningfulAmount(marketAnalysis?.estimatedValueLow);
  const estimatedValueHigh = readMeaningfulAmount(marketAnalysis?.estimatedValueHigh);
  const snapshotContextLabel = frozenSnapshot
    ? "Frozen at the moment the Property Workspace was created."
    : leadWorkspace
      ? "Using the live linked deal until a frozen acquisition snapshot exists."
      : "Only the shared property record is available right now.";
  const financeWorkspacePath = buildPropertyWorkspacePath(propertyKey, "finance", "health");

  const acquisitionVarianceRows = [
    {
      label: "Purchase price vs seller ask",
      originalLabel: "Seller ask",
      originalValue: formatMoney(askingPrice),
      currentLabel: "Actual purchase",
      currentValue: formatMoney(purchasePrice, investment ? "Needs update" : "Not captured"),
      delta:
        purchasePrice !== null && askingPrice !== null ? purchasePrice - askingPrice : Number.NaN,
    },
    {
      label: "Purchase price vs target offer",
      originalLabel: "Target offer",
      originalValue: formatMoney(targetOffer),
      currentLabel: "Actual purchase",
      currentValue: formatMoney(purchasePrice, investment ? "Needs update" : "Not captured"),
      delta:
        purchasePrice !== null && targetOffer !== null ? purchasePrice - targetOffer : Number.NaN,
    },
    {
      label: "Expected cost vs original rehab assumption",
      originalLabel: "Original rehab",
      originalValue: formatMoney(originalScopeBudget),
      currentLabel: "Current expected cost",
      currentValue: formatMoney(currentBudget),
      delta:
        currentBudget !== null && originalScopeBudget !== null
          ? currentBudget - originalScopeBudget
          : Number.NaN,
    },
    {
      label: "Current exit value vs original ARV",
      originalLabel: "Original ARV",
      originalValue: formatMoney(originalArv),
      currentLabel: "Current exit value",
      currentValue: formatMoney(currentArv),
      delta:
        currentArv !== null && originalArv !== null ? currentArv - originalArv : Number.NaN,
    },
  ];

  if (!sourceSnapshot) {
    return <EmptySnapshotState pipelineLeadPath={pipelineLeadPath} actions={emptyActions} />;
  }

  const embeddedActionBar = embedded && embeddedActions ? (
    <section className="surface-panel px-4 py-4">
      <div className="flex flex-wrap gap-3">{embeddedActions}</div>
    </section>
  ) : null;

  const renderAcquisitionSummary = () => (
    <div className="space-y-4">
      {embeddedActionBar}
      {!embedded ? (
        <section className="surface-panel px-6 py-7 sm:px-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <span className="eyebrow">Property &gt; Acquisition Summary</span>
              <h3 className="mt-4 font-display text-[2.2rem] leading-[0.96] text-ink-900">
                From deal assumptions to the active property workspace
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
                This section tells the story of what the team thought it was buying, what actually
                made it into Property Workspace, and how the live execution numbers compare against
                the original plan.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {pipelineLeadPath ? (
                  <Link to={pipelineLeadPath} className="secondary-action">
                    Open source deal
                  </Link>
                ) : null}
                {acquisitionsPath ? (
                  <Link to={acquisitionsPath} className="secondary-action">
                    Open acquisitions workspace
                  </Link>
                ) : (
                  <Link to={financeWorkspacePath} className="primary-action">
                    Start finance workspace
                  </Link>
                )}
              </div>
            </div>

            <div className="section-card p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                Property story state
              </p>
              <h4 className="mt-4 text-xl font-semibold text-ink-900">How this summary is sourced</h4>
              <p className="mt-3 text-sm leading-6 text-ink-500">{snapshotContextLabel}</p>

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between rounded-[14px] bg-verdigris-50 px-4 py-3">
                  <span className="text-sm font-medium text-ink-600">Acquisitions workspace</span>
                  <span className="text-sm font-semibold text-ink-900">
                    {investment ? investment.status || "Active" : "Not created"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[14px] bg-white px-4 py-3 ring-1 ring-ink-100">
                  <span className="text-sm font-medium text-ink-600">Strategy</span>
                  <span className="text-sm font-semibold text-ink-900">{strategyLabel}</span>
                </div>
                <div className="flex items-center justify-between rounded-[14px] bg-sand-50 px-4 py-3">
                  <span className="text-sm font-medium text-ink-600">Latest market snapshot</span>
                  <span className="text-sm font-semibold text-ink-900">
                    {formatDate(marketSnapshotDate)}
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="mt-5 flex items-center gap-3 text-sm text-ink-500">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Loading acquisitions context...
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-[16px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryTile
              icon={BanknotesIcon}
              label="Actual purchase"
              value={formatMoney(purchasePrice, investment ? "Needs update" : "Not captured")}
              hint={
                purchasePrice !== null && targetOffer !== null
                  ? `Against target: ${formatDeltaLabel(purchasePrice - targetOffer)}`
                  : "Record the final close basis in Finance."
              }
            />
            <SummaryTile
              icon={WrenchScrewdriverIcon}
              label="Current expected cost"
              value={formatMoney(currentBudget ?? originalScopeBudget)}
              hint={
                spentToDate !== null
                  ? `${formatMoney(spentToDate)} spent so far`
                  : "Budget updates here as scope and expenses change."
              }
            />
            <SummaryTile
              icon={ArrowTrendingUpIcon}
              label="Current exit value"
              value={formatMoney(currentArv)}
              hint={
                currentArv !== null && originalArv !== null
                  ? `Against original ARV: ${formatDeltaLabel(currentArv - originalArv)}`
                  : "Use Finance to refine the current exit assumptions."
              }
            />
            <SummaryTile
              icon={ChartBarIcon}
              label="Saved market history"
              value={`${savedReports.length} report${savedReports.length === 1 ? "" : "s"}`}
              hint={
                marketSnapshotDate
                  ? `Latest snapshot ${formatDate(marketSnapshotDate)}`
                  : "Run and save comps to build a stronger market trail."
              }
            />
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Acquisition narrative</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">What came into the property</h4>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
            These are the core details that moved with the property from the deal stage into the
            acquisition and execution workflows.
          </p>

          <div className="mt-6">
            <DetailRow label="Source deal stage" value={formatText(property?.workspaces?.pipeline?.status)} />
            <DetailRow label="Deal source" value={formatText(sourceSnapshot.leadSource)} />
            <DetailRow label="Occupancy" value={formatText(sourceSnapshot.occupancyStatus)} />
            <DetailRow label="Motivation" value={formatText(sourceSnapshot.motivation)} />
            <DetailRow
              label="Scope items imported"
              value={`${scopeItems.length} item${scopeItems.length === 1 ? "" : "s"}`}
            />
            <DetailRow
              label="Original comp count"
              value={formatNumber(marketAnalysis?.saleCompCount)}
            />
            <DetailRow
              label="Acquisitions workspace created"
              value={formatDate(investment?.createdAt)}
              hint="This is the timestamp for the acquisitions workspace, not the exact closing date."
            />
          </div>
        </section>

        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Live bridge to Finance</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Execution status</h4>
          <p className="mt-3 text-sm leading-6 text-ink-500">
            As the finance workspace fills out, this property story becomes the quick variance view
            for price, budget, and exit assumptions.
          </p>

          <div className="mt-6">
            <DetailRow
              label="Property workspace active"
              value={property?.workspaces?.pipeline?.inPropertyWorkspace ? "Yes" : "No"}
            />
            <DetailRow label="Strategy" value={strategyLabel} />
            <DetailRow label="Current budget" value={formatMoney(currentBudget)} />
            <DetailRow label="Spent to date" value={formatMoney(spentToDate)} />
            <DetailRow label="Projected profit" value={formatSignedMoney(metrics?.profit)} />
            <DetailRow
              label="Projected ROI on cash"
              value={formatPercent(metrics?.roiOnCash)}
            />
          </div>
        </section>
      </div>

      <section className="surface-panel px-6 py-7 sm:px-7">
        <span className="eyebrow">Variance from original plan</span>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h4 className="text-2xl font-semibold text-ink-900">Where the deal moved</h4>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
              This is the fast read on what changed between the original deal assumptions and the
              live workspace data.
            </p>
          </div>
          <Link to={financeWorkspacePath} className="ghost-action">
            Open Finance
          </Link>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {acquisitionVarianceRows.map((row) => (
            <VarianceRow key={row.label} {...row} />
          ))}
        </div>
      </section>
    </div>
  );

  const renderOriginalAssumptions = () => (
    <div className="space-y-4">
      {embeddedActionBar}
      {!embedded ? (
        <section className="surface-panel px-6 py-7 sm:px-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <span className="eyebrow">Property &gt; Original Assumptions</span>
              <h3 className="mt-4 font-display text-[2.2rem] leading-[0.96] text-ink-900">
                The original underwriting snapshot for this property
              </h3>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
                This preserves the pricing, market, and scope assumptions that came in with the deal
                so the team always has a clean reference point before revisions, change orders, or
                updated exit assumptions.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {pipelineLeadPath ? (
                  <Link to={pipelineLeadPath} className="secondary-action">
                    Open source deal
                  </Link>
                ) : null}
                {acquisitionsPath ? (
                  <Link to={acquisitionsPath} className="secondary-action">
                    Open acquisitions workspace
                  </Link>
                ) : (
                  <Link to={financeWorkspacePath} className="ghost-action">
                    Open Finance setup
                  </Link>
                )}
              </div>
            </div>

            <div className="section-card p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
                Snapshot source
              </p>
              <h4 className="mt-4 text-xl font-semibold text-ink-900">
                {frozenSnapshot ? "Frozen acquisition snapshot" : "Live linked deal"}
              </h4>
              <p className="mt-3 text-sm leading-6 text-ink-500">{snapshotContextLabel}</p>

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between rounded-[14px] bg-verdigris-50 px-4 py-3">
                  <span className="text-sm font-medium text-ink-600">Saved reports</span>
                  <span className="text-sm font-semibold text-ink-900">
                    {savedReports.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[14px] bg-white px-4 py-3 ring-1 ring-ink-100">
                  <span className="text-sm font-medium text-ink-600">Original scope lines</span>
                  <span className="text-sm font-semibold text-ink-900">
                    {scopeItems.length}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[14px] bg-sand-50 px-4 py-3">
                  <span className="text-sm font-medium text-ink-600">Latest update</span>
                  <span className="text-sm font-semibold text-ink-900">
                    {formatDate(property?.updatedAt)}
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="mt-5 flex items-center gap-3 text-sm text-ink-500">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Loading current comparison...
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-[16px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryTile
              icon={BanknotesIcon}
              label="Seller ask"
              value={formatMoney(askingPrice)}
              hint="The original asking price captured with the deal."
            />
            <SummaryTile
              icon={BuildingOffice2Icon}
              label="Target offer"
              value={formatMoney(targetOffer)}
              hint="Your original offer target before the property moved over."
            />
            <SummaryTile
              icon={ArrowTrendingUpIcon}
              label="Original ARV"
              value={formatMoney(originalArv)}
              hint={
                estimatedValueLow !== null && estimatedValueHigh !== null
                  ? `Range ${formatCurrency(estimatedValueLow)} to ${formatCurrency(
                      estimatedValueHigh
                    )}`
                  : "Uses the deal ARV or the saved comp estimate."
              }
            />
            <SummaryTile
              icon={ClipboardDocumentListIcon}
              label="Deal rehab estimate"
              value={formatMoney(originalScopeBudget)}
              hint={
                scopeItems.length > 0
                  ? `${scopeItems.length} scope line${scopeItems.length === 1 ? "" : "s"} captured`
                  : "No detailed scope lines were saved yet."
              }
            />
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Pricing and market context</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">What the market looked like</h4>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
            These details preserve the market posture and comp guidance that came in before the
            property became an active workspace.
          </p>

          <div className="mt-6">
            <DetailRow label="Listing status" value={formatText(sourceSnapshot.listingStatus)} />
            <DetailRow label="Listed date" value={formatDate(sourceSnapshot.listedDate)} />
            <DetailRow
              label="Days on market"
              value={formatNumber(sourceSnapshot.daysOnMarket)}
            />
            <DetailRow label="Last sale price" value={formatMoney(sourceSnapshot.lastSalePrice)} />
            <DetailRow label="Last sale date" value={formatDate(sourceSnapshot.lastSaleDate)} />
            <DetailRow
              label="Comp estimate"
              value={formatMoney(marketAnalysis?.estimatedValue)}
              hint={marketSnapshotDate ? `Snapshot from ${formatDate(marketSnapshotDate)}` : undefined}
            />
            <DetailRow
              label="Recommended offer range"
              value={buildRecommendedOfferLabel(marketAnalysis)}
            />
            <DetailRow
              label="Comparable sales used"
              value={formatNumber(marketAnalysis?.saleCompCount)}
            />
          </div>
        </section>

        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Deal context</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">What the team knew then</h4>
          <p className="mt-3 text-sm leading-6 text-ink-500">
            These fields preserve the original context around the seller and the opportunity.
          </p>

          <div className="mt-6">
            <DetailRow label="Deal status" value={formatText(sourceSnapshot.status)} />
            <DetailRow label="Deal source" value={formatText(sourceSnapshot.leadSource)} />
            <DetailRow label="Occupancy" value={formatText(sourceSnapshot.occupancyStatus)} />
            <DetailRow label="Motivation" value={formatText(sourceSnapshot.motivation)} />
            <DetailRow label="Next action" value={formatText(sourceSnapshot.nextAction)} />
            <DetailRow label="Follow-up date" value={formatDate(sourceSnapshot.followUpDate)} />
          </div>

          <div className="mt-6 rounded-[20px] bg-sand-50/85 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
              Original notes
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              {formatText(sourceSnapshot.notes, "No deal notes were captured on the original record.")}
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Original scope snapshot</span>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h4 className="text-2xl font-semibold text-ink-900">Imported scope and rehab plan</h4>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
                These line items preserve the work plan that existed before actual bids, receipts,
                and change orders started to reshape the budget.
              </p>
            </div>
            <div className="rounded-[18px] bg-verdigris-50 px-4 py-3 text-sm font-semibold text-verdigris-700">
              Total original scope {formatMoney(originalScopeBudget)}
            </div>
          </div>

          {scopeItems.length > 0 ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {scopeItems.slice(0, 6).map((item, index) => (
                <div
                  key={item.itemId || `${item.name}-${index}`}
                  className="rounded-[18px] border border-ink-100 bg-white/90 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-ink-900">
                    {formatText(item.name, `Scope item ${index + 1}`)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    {formatText(item.scopeDescription, "No additional scope notes were captured.")}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="rounded-full bg-sand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                      {formatText(item.category, "Scope")}
                    </span>
                    <span className="text-sm font-semibold text-ink-900">
                      {formatMoney(item.budget)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[20px] border border-dashed border-ink-200 bg-white/80 px-5 py-6 text-sm leading-6 text-ink-500">
              No renovation line items were preserved on the original deal, so this section is
              currently relying on the top-level rehab estimate only.
            </div>
          )}
        </section>

        <section className="surface-panel px-6 py-7 sm:px-7">
          <span className="eyebrow">Today vs original</span>
          <h4 className="mt-4 text-2xl font-semibold text-ink-900">Quick comparison</h4>
          <p className="mt-3 text-sm leading-6 text-ink-500">
            This is the fast comparison between the frozen assumptions and the current live finance
            picture.
          </p>

          <div className="mt-6 space-y-3">
            <VarianceRow
              label="Exit value"
              originalLabel="Original ARV"
              originalValue={formatMoney(originalArv)}
              currentLabel="Current exit value"
              currentValue={formatMoney(currentArv)}
              delta={
                currentArv !== null && originalArv !== null ? currentArv - originalArv : Number.NaN
              }
            />
            <VarianceRow
              label="Expected cost"
              originalLabel="Original rehab"
              originalValue={formatMoney(originalScopeBudget)}
              currentLabel="Current expected cost"
              currentValue={formatMoney(currentBudget)}
              delta={
                currentBudget !== null && originalScopeBudget !== null
                  ? currentBudget - originalScopeBudget
                  : Number.NaN
              }
            />
          </div>

          <div className="mt-6 rounded-[20px] bg-ink-950 px-5 py-5 text-white">
            <div className="flex items-center gap-3">
              <HomeModernIcon className="h-5 w-5 text-verdigris-300" />
              <p className="text-sm font-semibold">Need to revise the live numbers?</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Head to Finance to update purchase basis, budget, and exit assumptions without
              losing this original reference point.
            </p>
            <Link to={financeWorkspacePath} className="secondary-action mt-5 inline-flex">
              Open Finance
            </Link>
          </div>
        </section>
      </div>
    </div>
  );

  return activeContentKey === "original-assumptions"
    ? renderOriginalAssumptions()
    : renderAcquisitionSummary();
};

export default PropertySummaryPanel;
