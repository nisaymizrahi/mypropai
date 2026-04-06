import React, { useMemo } from "react";

import MapView from "./MapView";
import {
  buildFinancialSnapshot,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatPercent,
  formatSignedCurrency,
  getMasterReportMapComps,
  getMasterReportPrimaryComps,
  getVerdictMeta,
  normalizeComparableRecord,
} from "../utils/compsReport";

const formatNumber = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString()}${suffix}`;
};

const SectionCard = ({ id, title, subtitle, children, action, className = "" }) => (
  <section id={id} className={`section-card overflow-hidden p-6 ${className}`.trim()}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400">{title}</p>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-7 text-ink-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

const MetricCard = ({ label, value, hint, tone = "default" }) => (
  <div className={`report-metric-card ${tone !== "default" ? `report-metric-card-${tone}` : ""}`}>
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400">{label}</p>
    <p className="mt-3 text-[1.9rem] font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const DetailGrid = ({ items = [] }) => (
  <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => (
      <div key={item.label} className="rounded-[20px] border border-ink-100 bg-white/80 px-4 py-4">
        <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400">{item.label}</dt>
        <dd className="mt-2 text-sm font-semibold text-ink-900">{item.value || "—"}</dd>
        {item.hint ? <p className="mt-1 text-xs leading-5 text-ink-500">{item.hint}</p> : null}
      </div>
    ))}
  </dl>
);

const InsightList = ({ title, items = [], emptyText }) => (
  <div className="rounded-[22px] border border-ink-100 bg-white/85 px-5 py-5">
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400">{title}</p>
    {items.length ? (
      <ul className="mt-3 space-y-2 text-sm text-ink-600">
        {items.map((item) => (
          <li key={item} className="rounded-[16px] bg-sand-50 px-4 py-3 leading-6">
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-3 text-sm leading-6 text-ink-500">{emptyText}</p>
    )}
  </div>
);

const ComparisonBar = ({ leftLabel, leftValue, rightLabel, rightValue }) => {
  const maxValue = Math.max(leftValue || 0, rightValue || 0, 1);
  const leftWidth = Math.max(((leftValue || 0) / maxValue) * 100, leftValue ? 12 : 0);
  const rightWidth = Math.max(((rightValue || 0) / maxValue) * 100, rightValue ? 12 : 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-ink-600">{leftLabel}</span>
          <span className="font-semibold text-ink-900">{formatCurrency(leftValue)}</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-sand-100">
          <div
            className="h-full rounded-full bg-ink-900"
            style={{ width: `${leftWidth}%` }}
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-ink-600">{rightLabel}</span>
          <span className="font-semibold text-ink-900">{formatCurrency(rightValue)}</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-verdigris-100/70">
          <div
            className="h-full rounded-full bg-verdigris-600"
            style={{ width: `${rightWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const CostStackFigure = ({ items = [] }) => {
  if (!items.length) {
    return (
      <div className="rounded-[22px] border border-dashed border-ink-200 bg-white/70 px-6 py-10 text-center text-sm text-ink-500">
        No cost stack is available for this report yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-sand-100">
        {items.map((item) => (
          <div
            key={item.key}
            style={{
              width: `${Math.max(item.share || 0, 4)}%`,
              backgroundColor: item.color,
            }}
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.key} className="rounded-[20px] border border-ink-100 bg-white/85 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-sm font-semibold text-ink-900">{item.label}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                {formatPercent(item.share, 0)}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-600">{formatCurrency(item.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Table = ({
  columns = [],
  rows = [],
  emptyText = "No rows available.",
  testId,
  rowTestId,
}) => (
  <div className="overflow-x-auto rounded-[22px] border border-ink-100" data-testid={testId}>
    <table className="min-w-full text-sm">
      <thead className="bg-sand-50 text-left text-ink-500">
        <tr>
          {columns.map((column) => (
            <th key={column.key} className="px-4 py-3 font-semibold">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-100 bg-white">
        {rows.length ? (
          rows.map((row, index) => (
            <tr
              key={row.id || `${row.address || "row"}-${index}`}
              data-testid={rowTestId}
              data-row-id={row.id || `${row.address || "row"}-${index}`}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-4 align-top text-ink-700">
                  {column.render ? column.render(row) : row[column.key] || "—"}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-500">
              {emptyText}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const buildMapMarkers = (report) =>
  getMasterReportMapComps(report).map((comp) => ({
    lat: comp.latitude,
    lng: comp.longitude,
    color:
      comp.category === "recent_sale"
        ? "#b45309"
        : comp.category === "active_market"
          ? "#0284c7"
          : "#167267",
  }));

const buildCompColumns = (showSource = false) => {
  const columns = [
    {
      key: "address",
      label: "Address",
      render: (row) => (
        <div>
          <p className="font-semibold text-ink-900">{row.address || "—"}</p>
          <p className="mt-1 text-xs text-ink-500">
            {[row.propertyType, row.status || null, row.listingType || null].filter(Boolean).join(" • ") || "Comparable"}
          </p>
        </div>
      ),
    },
    {
      key: "salePrice",
      label: "Price",
      render: (row) => (
        <div>
          <p>{formatCurrency(row.salePrice)}</p>
          <p className="mt-1 text-xs text-ink-500">{formatDate(row.saleDate || row.listedDate)}</p>
        </div>
      ),
    },
    {
      key: "size",
      label: "Beds / Baths / Sqft",
      render: (row) =>
        [
          row.bedrooms !== null && row.bedrooms !== undefined ? `${row.bedrooms} bd` : null,
          row.bathrooms !== null && row.bathrooms !== undefined ? `${row.bathrooms} ba` : null,
          row.squareFootage ? `${formatNumber(row.squareFootage)} sqft` : null,
        ]
          .filter(Boolean)
          .join(" • ") || "—",
    },
    {
      key: "distance",
      label: "Distance",
      render: (row) => formatNumber(row.distance, " mi"),
    },
    {
      key: "pricePerSqft",
      label: "$ / Sqft",
      render: (row) => formatNumber(row.pricePerSqft, " / sqft"),
    },
    {
      key: "whySelected",
      label: "Why Included",
      render: (row) => <span className="text-sm leading-6 text-ink-600">{row.whySelected || "—"}</span>,
    },
  ];

  if (showSource) {
    columns.splice(1, 0, {
      key: "sourceLabel",
      label: "Source",
      render: (row) => row.sourceLabel || "—",
    });
  }

  return columns;
};

const MasterDealReportSections = ({
  report = null,
  emptyTitle = "No deal report yet",
  emptyMessage = "Run the report to build the property, comps, value, and deal analysis.",
}) => {
  const primaryComps = useMemo(
    () => getMasterReportPrimaryComps(report).map((comp, index) => normalizeComparableRecord(comp, index)),
    [report]
  );
  const recentSales = useMemo(
    () =>
      (Array.isArray(report?.comps?.recentSales?.items) ? report.comps.recentSales.items : []).map((comp, index) =>
        normalizeComparableRecord(comp, index)
      ),
    [report]
  );
  const activeListings = useMemo(
    () =>
      (Array.isArray(report?.comps?.activeMarket?.items) ? report.comps.activeMarket.items : []).map((comp, index) =>
        normalizeComparableRecord(comp, index)
      ),
    [report]
  );
  const mapMarkers = useMemo(() => buildMapMarkers(report), [report]);

  if (!report?.generatedAt) {
    return (
      <div className="section-card px-6 py-12 text-center">
        <h3 className="text-2xl font-semibold text-ink-900">{emptyTitle}</h3>
        <p className="mt-3 text-sm leading-6 text-ink-500">{emptyMessage}</p>
      </div>
    );
  }

  const property = report.propertySnapshot || {};
  const deal = report.dealInputs || {};
  const valuation = report.valuation || {};
  const analysis = report.dealAnalysis || {};
  const ai = report.aiVerdict || {};
  const market = report.marketContext || {};
  const verdictMeta = getVerdictMeta(report);
  const financial = buildFinancialSnapshot(report);
  const primarySummary = report.comps?.primary?.summary || {};
  const recentSummary = report.comps?.recentSales?.summary || {};
  const activeSummary = report.comps?.activeMarket?.summary || {};

  const valueGapTone =
    (financial.valueGap || 0) > 0 ? "positive" : (financial.valueGap || 0) < 0 ? "negative" : "default";

  return (
    <div className="space-y-6" data-testid="master-deal-report">
      <section className="surface-panel-strong overflow-hidden px-6 py-7 sm:px-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
          <div>
            <span className="eyebrow">Master Deal Report</span>
            <h2 className="mt-4 font-display text-[2.7rem] leading-[0.94] text-ink-900">
              {report.title || report.subject?.address || "Deal report"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-600">
              {ai.executiveSummary ||
                "Property identity, comparable support, cost stack, and investor-facing conclusion in one report."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-ink-100 bg-white/80 px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Property</p>
                <p className="mt-2 text-sm font-semibold text-ink-900">
                  {[
                    property.propertyType,
                    property.squareFootage ? `${formatNumber(property.squareFootage)} sqft` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ") || "Property details pending"}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  {[
                    property.bedrooms !== null && property.bedrooms !== undefined ? `${property.bedrooms} bd` : null,
                    property.bathrooms !== null && property.bathrooms !== undefined ? `${property.bathrooms} ba` : null,
                    property.yearBuilt ? `Built ${property.yearBuilt}` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ") || "Subject profile"}
                </p>
              </div>

              <div className="rounded-[22px] border border-ink-100 bg-white/80 px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Asking / rehab</p>
                <p className="mt-2 text-sm font-semibold text-ink-900">
                  {formatCurrency(financial.askingPrice)} / {formatCurrency(financial.rehabEstimate)}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  {String(deal.strategy || "flip").toUpperCase()} • {deal.holdingPeriodMonths || "—"} month hold
                </p>
              </div>

              <div className="rounded-[22px] border border-ink-100 bg-white/80 px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Generated</p>
                <p className="mt-2 text-sm font-semibold text-ink-900">{formatDate(report.generatedAt)}</p>
                <p className="mt-1 text-xs text-ink-500">
                  {primaryComps.length} primary comps • {report.compFilters?.radius || "—"} mile radius
                </p>
              </div>
            </div>
          </div>

          <div className={`report-verdict-card report-verdict-card-large report-verdict-${verdictMeta.tone}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em]">Deal verdict</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-semibold">{verdictMeta.score}</p>
                <p className="mt-1 text-lg font-semibold">{verdictMeta.label}</p>
              </div>
              <div className="rounded-[20px] bg-white/18 px-4 py-3 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80">Confidence</p>
                <p className="mt-1 text-sm font-semibold">{verdictMeta.confidence}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/88">{verdictMeta.headline}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">
                {verdictMeta.compSupport} comp support
              </span>
              <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">
                {financial.valueLabel}: {formatCompactCurrency(financial.estimatedValue)}
              </span>
              <span className="rounded-full bg-white/14 px-3 py-1.5 font-semibold">
                {financial.spreadLabel}: {formatSignedCurrency(financial.estimatedProfit)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-panel px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400">
            Report navigation
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="#report-overview" className="report-mini-chip">Overview</a>
            <a href="#report-financials" className="report-mini-chip">Financials</a>
            <a href="#report-comps" className="report-mini-chip">Comps</a>
            <a href="#report-context" className="report-mini-chip">Context</a>
            <a href="#report-conclusion" className="report-mini-chip">Conclusion</a>
          </div>
        </div>
      </section>

      <div id="report-overview" className="grid gap-4 scroll-mt-24 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Project Cost"
          value={formatCurrency(financial.totalProjectCost)}
          hint={`${formatCurrency(financial.askingPrice)} purchase • ${formatCurrency(financial.rehabEstimate)} renovation`}
        />
        <MetricCard
          label={financial.valueLabel}
          value={formatCurrency(financial.estimatedValue)}
          hint={`${formatCurrency(valuation.blendedLow)} to ${formatCurrency(valuation.blendedHigh)}`}
        />
        <MetricCard
          label={financial.spreadLabel}
          value={formatSignedCurrency(financial.estimatedProfit)}
          hint={`${financial.marginLabel} ${formatPercent(financial.marginPercent)}`}
          tone={financial.estimatedProfit > 0 ? "positive" : financial.estimatedProfit < 0 ? "negative" : "default"}
        />
        <MetricCard
          label={financial.returnLabel}
          value={formatPercent(financial.returnPercent)}
          hint={
            financial.mode === "hold"
              ? `Loan ${formatCurrency(financial.loanAmount)}`
              : `Cash required ${formatCurrency(financial.cashRequired)}`
          }
        />
      </div>

      <div id="report-financials" className="grid gap-6 scroll-mt-24 xl:grid-cols-[1.02fr_0.98fr]">
        <SectionCard
          title="Financial Snapshot"
          subtitle="The report organizes the economics into a quick investor read before the detailed comps and notes."
          className="bg-white/80"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="deal-analysis-section">
            <MetricCard label="Purchase" value={formatCurrency(financial.askingPrice)} />
            <MetricCard label="Renovation" value={formatCurrency(financial.rehabEstimate)} />
            <MetricCard label="Soft Costs" value={formatCurrency(financial.softCosts)} />
            <MetricCard label="Carry Costs" value={formatCurrency(financial.carryCosts)} />
            <MetricCard label="Selling Costs" value={formatCurrency(financial.sellingCosts)} />
            <MetricCard
              label="Value Gap"
              value={formatSignedCurrency(financial.valueGap)}
              hint={financial.coveragePercent ? `${formatPercent(financial.coveragePercent)} of value consumed by cost` : "Value coverage pending"}
              tone={valueGapTone}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Executive Read"
          subtitle="What matters most before anyone reads the longer narrative."
        >
          <div className="rounded-[24px] bg-sand-50 px-5 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Bottom line</p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">
              {ai.headline || `${verdictMeta.label} deal with ${verdictMeta.compSupport.toLowerCase()} comp support.`}
            </p>
            <p className="mt-3 text-sm leading-7 text-ink-600">
              {ai.dealTakeaway ||
                ai.valueTakeaway ||
                "Use the pricing range, cost stack, and comp support together before committing to an offer."}
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InsightList
              title="Upside"
              items={ai.upsideFactors || []}
              emptyText="No upside factors were generated for this run."
            />
            <InsightList
              title="Risk flags"
              items={ai.riskFlags || []}
              emptyText="No risk flags were generated for this run."
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <SectionCard
          title="Value Vs Cost"
          subtitle="A quick visual of how much room exists between the all-in basis and the estimated value."
        >
          <ComparisonBar
            leftLabel="Total project cost"
            leftValue={financial.totalProjectCost}
            rightLabel={financial.valueLabel}
            rightValue={financial.estimatedValue}
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border border-ink-100 bg-white/85 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">Spread</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{formatSignedCurrency(financial.estimatedProfit)}</p>
            </div>
            <div className="rounded-[20px] border border-ink-100 bg-white/85 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">{financial.marginLabel}</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{formatPercent(financial.marginPercent)}</p>
            </div>
            <div className="rounded-[20px] border border-ink-100 bg-white/85 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">{financial.returnLabel}</p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{formatPercent(financial.returnPercent)}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Capital Stack"
          subtitle="Purchase, renovation, soft costs, carry, and selling costs shown as one stack."
        >
          <CostStackFigure items={financial.costStack} />
        </SectionCard>
      </div>

      <SectionCard
        id="report-comps"
        title="Comparable Support"
        subtitle="The report separates valuation comps, recorded sales, and active listings so the support is easier to read honestly."
      >
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-3">
            <MetricCard
              label="Primary valuation comps"
              value={formatNumber(primarySummary.count)}
              hint={`Median ${formatCurrency(primarySummary.medianPrice)}`}
            />
            <MetricCard
              label="Recent sales"
              value={formatNumber(recentSummary.count)}
              hint={`Median ${formatCurrency(recentSummary.medianPrice)}`}
            />
            <MetricCard
              label="Active listings"
              value={formatNumber(activeSummary.count)}
              hint={`Median ${formatCurrency(activeSummary.medianPrice)}`}
            />

            {report.comps?.logic?.notes?.length ? (
              <InsightList
                title="Comp notes"
                items={report.comps.logic.notes}
                emptyText="No comp notes were generated."
              />
            ) : null}
          </div>

          <div>
            {property.latitude !== null &&
            property.latitude !== undefined &&
            property.longitude !== null &&
            property.longitude !== undefined ? (
              <MapView
                latitude={property.latitude}
                longitude={property.longitude}
                markers={mapMarkers}
                radiusMiles={report.compFilters?.radius}
                zoom={13}
              />
            ) : (
              <div className="flex h-[380px] items-center justify-center rounded-[22px] border border-dashed border-ink-200 bg-sand-50 px-6 text-center text-sm text-ink-500">
                No coordinates were available for the subject property.
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Primary Valuation Comps"
        subtitle={report.comps?.primary?.honestLabel || "These are the primary comps supporting the valuation range."}
      >
        <Table
          columns={buildCompColumns()}
          rows={primaryComps}
          emptyText="No primary valuation comps were returned."
          testId="primary-comps-table"
          rowTestId="primary-comp-row"
        />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Recent Sale Comps"
          subtitle={report.comps?.recentSales?.honestLabel || "Recorded nearby sales from property records."}
        >
          <Table
            columns={buildCompColumns(true)}
            rows={recentSales}
            emptyText="No recent recorded sale comps were returned."
            testId="recent-sale-comps-table"
            rowTestId="recent-sale-comp-row"
          />
        </SectionCard>
        <SectionCard
          title="Active Market Comps"
          subtitle={report.comps?.activeMarket?.honestLabel || "Current listings used as market context."}
        >
          <Table
            columns={buildCompColumns(true)}
            rows={activeListings}
            emptyText="No active market listings were returned."
            testId="active-market-comps-table"
            rowTestId="active-market-comp-row"
          />
        </SectionCard>
      </div>

      <div id="report-context" className="grid gap-6 scroll-mt-24 xl:grid-cols-[1fr_0.98fr]">
        <SectionCard
          title="Property And Market Context"
          subtitle="Subject facts, tax history, and zip-level market signals in one place."
        >
          <DetailGrid
            items={[
              { label: "Address", value: property.address || report.subject?.address || "—" },
              {
                label: "Property",
                value:
                  [
                    property.propertyType,
                    property.squareFootage ? `${formatNumber(property.squareFootage)} sqft` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ") || "—",
              },
              {
                label: "Beds / Baths",
                value:
                  [property.bedrooms, property.bathrooms]
                    .filter((value) => value !== null && value !== undefined)
                    .join(" / ") || "—",
              },
              { label: "Lot Size", value: formatNumber(property.lotSize) },
              { label: "Year Built", value: formatNumber(property.yearBuilt) },
              { label: "Owner", value: property.owner?.name || "—", hint: property.owner?.type || null },
              { label: "Last Sale", value: formatCurrency(property.lastSalePrice), hint: formatDate(property.lastSaleDate) },
              {
                label: "Latest Tax",
                value: formatCurrency(property.latestTax?.taxAmount),
                hint: property.latestTax?.year ? `Tax year ${property.latestTax.year}` : null,
              },
              {
                label: "Zip Market",
                value: formatCurrency(market.saleData?.medianPrice),
                hint: `Median DOM ${formatNumber(market.saleData?.medianDaysOnMarket, " days")}`,
              },
            ]}
          />

          {market.notes?.length ? (
            <div className="mt-4">
              <InsightList
                title="Market notes"
                items={market.notes}
                emptyText="No market notes were returned for this zip code."
              />
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Assumptions And Notes"
          subtitle="The underwriting depends on these assumptions. Review them before sharing the report."
        >
          <DetailGrid
            items={[
              { label: "Strategy", value: deal.strategy || "—" },
              { label: "Asking Price", value: formatCurrency(deal.askingPrice) },
              { label: "Rehab Estimate", value: formatCurrency(deal.rehabEstimate) },
              { label: "Holding Period", value: formatNumber(deal.holdingPeriodMonths, " months") },
              { label: "Closing Costs", value: formatPercent(deal.acquisitionClosingCostPercent) },
              { label: "Selling Costs", value: formatPercent(deal.sellingCostPercent) },
              { label: "Interest Rate", value: formatPercent(deal.interestRatePercent) },
              { label: "Financing Points", value: formatPercent(deal.financingPointsPercent) },
              { label: "Loan To Cost", value: formatPercent(deal.loanToCostPercent) },
              { label: "Annual Taxes", value: formatCurrency(deal.annualTaxes) },
              {
                label: "Insurance / Utilities / Maintenance",
                value: `${formatCurrency(deal.monthlyInsurance)} / ${formatCurrency(
                  deal.monthlyUtilities
                )} / ${formatCurrency(deal.monthlyMaintenance)}`,
              },
              { label: "Target Margin", value: formatPercent(deal.desiredProfitMarginPercent) },
            ]}
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InsightList
              title="Key assumptions"
              items={ai.keyAssumptions || []}
              emptyText="No key assumptions were generated."
            />
            <InsightList
              title="Deal notes"
              items={deal.notes ? [deal.notes] : []}
              emptyText="No custom notes were entered for this report."
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        id="report-conclusion"
        title="AI Conclusion"
        subtitle="A clean narrative summary suitable for investor, client, or partner review."
        action={
          ai.confidence ? (
            <span className="glass-chip">{ai.confidence} confidence</span>
          ) : null
        }
        className="bg-white/82"
      >
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]" data-testid="ai-deal-verdict-section">
          <div className="rounded-[24px] bg-sand-50 px-6 py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Summary</p>
            <p className="mt-3 text-2xl font-semibold text-ink-900">
              {ai.verdict || verdictMeta.label} deal with {verdictMeta.compSupport.toLowerCase()} support.
            </p>
            <p className="mt-4 text-sm leading-7 text-ink-600">
              {ai.executiveSummary ||
                ai.dealTakeaway ||
                ai.valueTakeaway ||
                "Review the valuation range, comp quality, and cost stack together before pricing this deal."}
            </p>
          </div>

          <div className="space-y-4">
            <InsightList
              title="What supports the conclusion"
              items={[ai.valueTakeaway, ai.dealTakeaway].filter(Boolean)}
              emptyText="No supporting narrative was generated."
            />
            <InsightList
              title="Next steps"
              items={ai.nextSteps || []}
              emptyText="No next steps were generated."
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default MasterDealReportSections;
