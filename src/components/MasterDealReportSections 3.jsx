import React, { useMemo } from "react";

import MapView from "./MapView";
import {
  formatCurrency,
  formatDate,
  getMasterReportMapComps,
  getMasterReportPrimaryComps,
  normalizeComparableRecord,
} from "../utils/compsReport";

const formatNumber = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString()}${suffix}`;
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toFixed(1)}%`;
};

const SectionCard = ({ title, subtitle, children, action }) => (
  <section className="section-card p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 className="text-2xl font-semibold text-ink-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-ink-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

const KeyValueGrid = ({ items = [] }) => (
  <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => (
      <div key={item.label} className="rounded-[18px] bg-sand-50 px-4 py-3">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          {item.label}
        </dt>
        <dd className="mt-2 text-sm font-semibold text-ink-900">{item.value || "—"}</dd>
        {item.hint ? <p className="mt-1 text-xs text-ink-500">{item.hint}</p> : null}
      </div>
    ))}
  </dl>
);

const MetricTile = ({ label, value, hint, tone = "text-ink-900" }) => (
  <div className="metric-tile p-5">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const Table = ({
  columns = [],
  rows = [],
  emptyText = "No rows available.",
  testId,
  rowTestId,
}) => (
  <div className="overflow-x-auto rounded-[20px] border border-ink-100" data-testid={testId}>
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

const DealBreakdownTable = ({ items = [] }) => (
  <div className="overflow-hidden rounded-[20px] border border-ink-100 bg-white">
    <table className="min-w-full text-sm">
      <thead className="bg-sand-50 text-left text-ink-500">
        <tr>
          <th className="px-4 py-3 font-semibold">Category</th>
          <th className="px-4 py-3 font-semibold">Group</th>
          <th className="px-4 py-3 font-semibold">Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-100">
        {items.map((item) => (
          <tr key={`${item.label}-${item.group}`}>
            <td className="px-4 py-4 font-medium text-ink-900">{item.label}</td>
            <td className="px-4 py-4 capitalize text-ink-600">{item.group}</td>
            <td className="px-4 py-4 text-ink-700">{formatCurrency(item.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Legend = () => (
  <div className="flex flex-wrap gap-3 text-xs text-ink-500">
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-verdigris-600" />
      Subject
    </span>
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
      AVM valuation comps
    </span>
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-clay-500" />
      Recent sales
    </span>
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
      Active market listings
    </span>
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
          : "#d97706",
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
            {[row.propertyType, row.status || null, row.listingType || null]
              .filter(Boolean)
              .join(" • ") || "Comparable"}
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
      label: "Beds/Baths/Sqft",
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
      key: "daysOnMarket",
      label: "DOM",
      render: (row) => formatNumber(row.daysOnMarket),
    },
    {
      key: "similarityScore",
      label: "Similarity",
      render: (row) => formatNumber(row.similarityScore),
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

const MasterDealReportSections = ({ report = null, emptyTitle = "No deal report yet", emptyMessage = "Run the report to build the property, comps, value, and deal analysis." }) => {
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

  return (
    <div className="space-y-6" data-testid="master-deal-report">
      <section className="surface-panel-strong overflow-hidden px-6 py-7 sm:px-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_340px]">
          <div>
            <span className="eyebrow">Master Deal Report</span>
            <h2 className="mt-4 font-display text-[2.7rem] leading-[0.95] text-ink-900">
              {report.title || report.subject?.address || "Deal report"}
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-ink-600">
              {ai.executiveSummary ||
                "Property intelligence, comps, market context, and deal math combined into one investor-ready report."}
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-[24px] bg-white/85 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Deal verdict
              </p>
              <p className="mt-2 text-2xl font-semibold text-ink-900">{ai.verdict || "Pending"}</p>
              <p className="mt-2 text-sm text-ink-500">
                Comp support {ai.compSupport || "—"} • Confidence {ai.confidence || "—"}
              </p>
            </div>
            <div className="rounded-[24px] bg-white/85 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Generated
              </p>
              <p className="mt-2 text-sm font-semibold text-ink-900">{formatDate(report.generatedAt)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Blended Value"
          value={formatCurrency(valuation.blendedEstimate)}
          hint={`${formatCurrency(valuation.blendedLow)} to ${formatCurrency(valuation.blendedHigh)}`}
        />
        <MetricTile
          label="RentCast AVM"
          value={formatCurrency(valuation.rentCastEstimate)}
          hint={`${formatCurrency(valuation.rentCastLow)} to ${formatCurrency(valuation.rentCastHigh)}`}
        />
        <MetricTile
          label="Asking Price"
          value={formatCurrency(deal.askingPrice)}
          hint={`Rehab ${formatCurrency(deal.rehabEstimate)}`}
        />
        <MetricTile
          label={analysis.mode === "hold" ? "Stabilized Basis" : "Estimated Profit"}
          value={
            analysis.mode === "hold"
              ? formatCurrency(analysis.metrics?.stabilizedBasis)
              : formatCurrency(analysis.metrics?.estimatedProfit)
          }
          hint={
            analysis.mode === "hold"
              ? `Gross yield ${formatPercent(analysis.metrics?.grossYieldPercent)}`
              : `Margin ${formatPercent(analysis.metrics?.marginPercent)}`
          }
          tone={
            analysis.mode === "hold"
              ? "text-ink-900"
              : (analysis.metrics?.estimatedProfit || 0) >= 0
                ? "text-verdigris-700"
                : "text-clay-700"
          }
        />
      </div>

      <SectionCard
        title="Property Snapshot"
        subtitle="RentCast property, listing, owner, and tax data combined into the current subject profile."
      >
        <KeyValueGrid
          items={[
            { label: "Address", value: property.address || report.subject?.address || "—" },
            { label: "Property", value: [property.propertyType, property.squareFootage ? `${formatNumber(property.squareFootage)} sqft` : null].filter(Boolean).join(" • ") || "—" },
            { label: "Beds / Baths", value: [property.bedrooms, property.bathrooms].filter((value) => value !== null && value !== undefined).join(" / ") || "—" },
            { label: "Lot Size", value: formatNumber(property.lotSize) },
            { label: "Year Built", value: formatNumber(property.yearBuilt) },
            { label: "Owner", value: property.owner?.name || "—", hint: property.owner?.occupied === null ? null : property.owner?.occupied ? "Owner occupied" : "Not owner occupied" },
            { label: "Owner Type", value: property.owner?.type || "—" },
            { label: "Last Sale", value: formatCurrency(property.lastSalePrice), hint: formatDate(property.lastSaleDate) },
            { label: "Latest Tax", value: formatCurrency(property.latestTax?.taxAmount), hint: property.latestTax?.year ? `Tax year ${property.latestTax.year}` : null },
            { label: "Assessed Value", value: formatCurrency(property.latestTax?.assessedValue) },
            { label: "HOA", value: formatCurrency(property.hoaFee) },
            { label: "Parcel / Legal", value: property.parcelId || "—", hint: property.legalDescription || null },
          ]}
        />
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Deal Input Summary" subtitle="User-provided assumptions feeding the deal model.">
          <KeyValueGrid
            items={[
              { label: "Strategy", value: deal.strategy || "—" },
              { label: "Asking Price", value: formatCurrency(deal.askingPrice) },
              { label: "Rehab Estimate", value: formatCurrency(deal.rehabEstimate) },
              { label: "Holding Period", value: formatNumber(deal.holdingPeriodMonths, " months") },
              { label: "Acquisition Closing", value: formatPercent(deal.acquisitionClosingCostPercent) },
              { label: "Selling Costs", value: formatPercent(deal.sellingCostPercent) },
              { label: "Interest Rate", value: formatPercent(deal.interestRatePercent) },
              { label: "Financing Points", value: formatPercent(deal.financingPointsPercent) },
              { label: "Loan To Cost", value: formatPercent(deal.loanToCostPercent) },
              { label: "Annual Taxes", value: formatCurrency(deal.annualTaxes) },
              { label: "Insurance / Utilities", value: `${formatCurrency(deal.monthlyInsurance)} / ${formatCurrency(deal.monthlyUtilities)}` },
              { label: "Desired Margin", value: formatPercent(deal.desiredProfitMarginPercent) },
            ]}
          />
          {deal.notes ? (
            <div className="mt-5 rounded-[20px] border border-ink-100 bg-white px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Notes</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">{deal.notes}</p>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="Value Section" subtitle="Transparent pricing inputs rather than a single magic number.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[20px] bg-sand-50 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Blended indication
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink-900">
                {formatCurrency(valuation.blendedEstimate)}
              </p>
              <p className="mt-2 text-sm text-ink-500">
                {formatCurrency(valuation.blendedLow)} to {formatCurrency(valuation.blendedHigh)}
              </p>
            </div>
            <div className="rounded-[20px] bg-white px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Comp-supported medians
              </p>
              <p className="mt-3 text-sm leading-7 text-ink-600">
                AVM comps {formatCurrency(valuation.primaryCompMedian)}
                <br />
                Recent sales {formatCurrency(valuation.recentSaleMedian)}
                <br />
                Active market {formatCurrency(valuation.activeMarketMedian)}
              </p>
            </div>
          </div>
          {valuation.notes?.length ? (
            <ul className="mt-5 space-y-2 text-sm text-ink-600">
              {valuation.notes.map((note) => (
                <li key={note} className="rounded-[16px] bg-white px-4 py-3">
                  {note}
                </li>
              ))}
            </ul>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard
        title="Comps Logic"
        subtitle="How the current comp set was built and where each layer comes from."
      >
        <KeyValueGrid
          items={[
            { label: "AVM raw candidates", value: formatNumber(report.comps?.logic?.rawComparableCount) },
            { label: "AVM local candidates", value: formatNumber(report.comps?.logic?.candidateComparableCount) },
            { label: "Primary valuation comps", value: formatNumber(report.comps?.logic?.visiblePrimaryCount) },
            { label: "Recent sale comps", value: formatNumber(report.comps?.logic?.visibleRecentSaleCount) },
            { label: "Active market comps", value: formatNumber(report.comps?.logic?.visibleActiveMarketCount) },
            { label: "Radius", value: formatNumber(report.compFilters?.radius, " mi") },
          ]}
        />
        {report.comps?.logic?.notes?.length ? (
          <ul className="mt-5 space-y-2 text-sm text-ink-600">
            {report.comps.logic.notes.map((note) => (
              <li key={note} className="rounded-[16px] bg-white px-4 py-3">
                {note}
              </li>
            ))}
          </ul>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Map Section"
        subtitle="Subject and the actual visible comp set, plotted together with the current radius."
        action={<Legend />}
      >
        {property.latitude !== null && property.latitude !== undefined && property.longitude !== null && property.longitude !== undefined ? (
          <MapView
            latitude={property.latitude}
            longitude={property.longitude}
            markers={mapMarkers}
            radiusMiles={report.compFilters?.radius}
            zoom={13}
          />
        ) : (
          <div className="flex h-[380px] items-center justify-center rounded-[20px] border border-dashed border-ink-200 bg-sand-50 px-6 text-center text-sm text-ink-500">
            No coordinates were available for the subject property.
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Primary Valuation Comps"
        subtitle={report.comps?.primary?.honestLabel || "Primary comps used for valuation support."}
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
          subtitle={report.comps?.activeMarket?.honestLabel || "Current market listings for pricing context."}
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

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <SectionCard
          title="Deal Analysis"
          subtitle="Cost stack and headline investment math using transparent assumptions."
        >
          <div data-testid="deal-analysis-section">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricTile label="Total Project Cost" value={formatCurrency(analysis.metrics?.totalProjectCost || analysis.metrics?.stabilizedBasis)} />
            <MetricTile label={analysis.mode === "hold" ? "Estimated Rent" : "Exit Value"} value={formatCurrency(analysis.mode === "hold" ? analysis.metrics?.estimatedMonthlyRent : analysis.metrics?.exitValue)} />
            <MetricTile label={analysis.mode === "hold" ? "Gross Yield" : "Estimated Profit"} value={analysis.mode === "hold" ? formatPercent(analysis.metrics?.grossYieldPercent) : formatCurrency(analysis.metrics?.estimatedProfit)} />
            <MetricTile label={analysis.mode === "hold" ? "1% Rule" : "Margin"} value={analysis.mode === "hold" ? formatPercent(analysis.metrics?.onePercentRule) : formatPercent(analysis.metrics?.marginPercent)} />
            <MetricTile label="Loan Amount" value={formatCurrency(analysis.metrics?.loanAmount)} />
            <MetricTile label={analysis.mode === "hold" ? "Equity Spread" : "Cash On Cash"} value={analysis.mode === "hold" ? formatCurrency(analysis.metrics?.equitySpread) : formatPercent(analysis.metrics?.cashOnCashPercent)} />
          </div>
          <div className="mt-6">
            <DealBreakdownTable items={Array.isArray(analysis.costBreakdown) ? analysis.costBreakdown : []} />
          </div>
          </div>
        </SectionCard>

        <SectionCard
          title="AI Deal Verdict"
          subtitle="Decision-oriented summary, with assumptions and comp quality called out explicitly."
          action={
            ai.confidence ? (
              <span className="rounded-full bg-white/80 px-3 py-2 text-sm font-semibold text-ink-700">
                {ai.confidence} confidence
              </span>
            ) : null
          }
        >
          <div className="space-y-5" data-testid="ai-deal-verdict-section">
            <div className="rounded-[20px] bg-sand-50 px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                Verdict
              </p>
              <p className="mt-3 text-2xl font-semibold text-ink-900">
                {ai.headline || ai.verdict || "No AI verdict was generated."}
              </p>
              {ai.valueTakeaway ? <p className="mt-3 text-sm leading-7 text-ink-600">{ai.valueTakeaway}</p> : null}
            </div>

            {ai.dealTakeaway ? (
              <div className="rounded-[20px] border border-ink-100 bg-white px-5 py-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Deal Takeaway
                </p>
                <p className="mt-3 text-sm leading-7 text-ink-600">{ai.dealTakeaway}</p>
              </div>
            ) : null}

            {ai.upsideFactors?.length ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Upside Factors
                </p>
                <ul className="mt-3 space-y-2 text-sm text-ink-600">
                  {ai.upsideFactors.map((item) => (
                    <li key={item} className="rounded-[16px] bg-white px-4 py-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {ai.riskFlags?.length ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                  Risk Flags
                </p>
                <ul className="mt-3 space-y-2 text-sm text-ink-600">
                  {ai.riskFlags.map((item) => (
                    <li key={item} className="rounded-[16px] bg-white px-4 py-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Market Context"
        subtitle="Zip-level sale and listing context from RentCast market data."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Median Sale" value={formatCurrency(market.saleData?.medianPrice)} />
          <MetricTile label="Median $ / Sqft" value={formatNumber(market.saleData?.medianPricePerSquareFoot, " / sqft")} />
          <MetricTile label="Median DOM" value={formatNumber(market.saleData?.medianDaysOnMarket, " days")} />
          <MetricTile label="New Listings" value={formatNumber(market.saleData?.newListings)} hint={`Total ${formatNumber(market.saleData?.totalListings)}`} />
        </div>
        {market.notes?.length ? (
          <ul className="mt-5 space-y-2 text-sm text-ink-600">
            {market.notes.map((note) => (
              <li key={note} className="rounded-[16px] bg-white px-4 py-3">
                {note}
              </li>
            ))}
          </ul>
        ) : null}
      </SectionCard>
    </div>
  );
};

export default MasterDealReportSections;
