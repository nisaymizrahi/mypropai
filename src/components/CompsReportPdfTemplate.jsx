import React, { useMemo } from "react";

import DealMapFigure from "./DealMapFigure";
import {
  formatCurrency,
  formatDate,
  getMasterReportMapComps,
  getMasterReportPrimaryComps,
  normalizeComparableRecord,
} from "../utils/compsReport";
import { publicAssetUrl } from "../utils/env";

const logoMark = publicAssetUrl("brand/brand-mark.svg");
const logoHorizontal = publicAssetUrl("brand/brand-logo-horizontal.svg");

const formatNumber = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString()}${suffix}`;
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toFixed(1)}%`;
};

const SectionShell = ({ title, subtitle, children, className = "" }) => (
  <section
    className={`rounded-[30px] border border-[#ddd3c7] bg-white px-7 py-7 ${className}`.trim()}
    style={{ breakInside: "avoid" }}
  >
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">{title}</p>
    {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6d5e55]">{subtitle}</p> : null}
    <div className="mt-5">{children}</div>
  </section>
);

const MetricCard = ({ label, value, hint, tone = "text-[#1d1713]", shell = "bg-white/10" }) => (
  <div className={`rounded-[24px] border border-white/12 ${shell} px-5 py-5`} style={{ breakInside: "avoid" }}>
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/68">{label}</p>
    <p className={`mt-3 text-[1.9rem] font-semibold ${tone}`}>{value}</p>
    {hint ? <p className="mt-2 text-xs leading-5 text-white/72">{hint}</p> : null}
  </div>
);

const DetailGrid = ({ items = [] }) => (
  <div className="grid grid-cols-2 gap-3">
    {items.map((item) => (
      <div key={item.label} className="rounded-[20px] border border-[#e5ddd3] bg-[#faf6f1] px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c7d72]">{item.label}</p>
        <p className="mt-2 text-sm font-semibold text-[#1d1713]">{item.value || "—"}</p>
        {item.hint ? <p className="mt-2 text-xs leading-5 text-[#6d5e55]">{item.hint}</p> : null}
      </div>
    ))}
  </div>
);

const TextList = ({ label, items = [], emptyText = "No notes provided." }) => (
  <div className="rounded-[22px] border border-[#e5ddd3] bg-[#faf6f1] px-5 py-5">
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">{label}</p>
    {items.length ? (
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="rounded-[16px] bg-white px-4 py-3 text-sm leading-6 text-[#40342c]">
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-3 text-sm leading-6 text-[#6d5e55]">{emptyText}</p>
    )}
  </div>
);

const DataTable = ({ title, subtitle, columns = [], rows = [], emptyText = "No rows available." }) => (
  <SectionShell title={title} subtitle={subtitle}>
    <div className="overflow-hidden rounded-[22px] border border-[#ddd3c7]">
      <table className="min-w-full text-sm">
        <thead className="bg-[#f4eee7] text-left text-[#7b6d63]">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ebe2d7] bg-white">
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id || `${row.address || "row"}-${index}`}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 align-top text-[#40342c]">
                    {column.render ? column.render(row) : row[column.key] || "—"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-[#6d5e55]">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </SectionShell>
);

const CostTable = ({ items = [] }) => (
  <div className="overflow-hidden rounded-[22px] border border-[#ddd3c7]">
    <table className="min-w-full text-sm">
      <thead className="bg-[#f4eee7] text-left text-[#7b6d63]">
        <tr>
          <th className="px-4 py-3 font-semibold">Category</th>
          <th className="px-4 py-3 font-semibold">Group</th>
          <th className="px-4 py-3 font-semibold">Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#ebe2d7] bg-white">
        {items.map((item) => (
          <tr key={`${item.label}-${item.group}`}>
            <td className="px-4 py-4 font-medium text-[#1d1713]">{item.label}</td>
            <td className="px-4 py-4 capitalize text-[#6d5e55]">{item.group}</td>
            <td className="px-4 py-4 text-[#40342c]">{formatCurrency(item.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const buildCompColumns = () => [
  {
    key: "address",
    label: "Address",
    render: (row) => (
      <div>
        <p className="font-semibold text-[#1d1713]">{row.address || "—"}</p>
        <p className="mt-1 text-xs text-[#7b6d63]">
          {[row.propertyType, row.status || null, row.listingType || null].filter(Boolean).join(" • ") || "Comparable"}
        </p>
      </div>
    ),
  },
  {
    key: "price",
    label: "Price",
    render: (row) => (
      <div>
        <p>{formatCurrency(row.salePrice)}</p>
        <p className="mt-1 text-xs text-[#7b6d63]">{formatDate(row.saleDate || row.listedDate)}</p>
        {row.estimatedValue ? (
          <p className="mt-1 text-xs text-[#7b6d63]">AVM context {formatCurrency(row.estimatedValue)}</p>
        ) : null}
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
    key: "similarity",
    label: "Similarity",
    render: (row) => formatNumber(row.similarityScore),
  },
  {
    key: "why",
    label: "Why Included",
    render: (row) => <span className="text-sm leading-6 text-[#40342c]">{row.whySelected || "—"}</span>,
  },
];

const CompsReportPdfTemplate = ({ report = null }) => {
  const primaryComps = useMemo(
    () => getMasterReportPrimaryComps(report).map((comp, index) => normalizeComparableRecord(comp, index)).slice(0, 6),
    [report]
  );
  const recentSales = useMemo(
    () =>
      (Array.isArray(report?.comps?.recentSales?.items) ? report.comps.recentSales.items : [])
        .map((comp, index) => normalizeComparableRecord(comp, index))
        .slice(0, 6),
    [report]
  );
  const activeListings = useMemo(
    () =>
      (Array.isArray(report?.comps?.activeMarket?.items) ? report.comps.activeMarket.items : [])
        .map((comp, index) => normalizeComparableRecord(comp, index))
        .slice(0, 6),
    [report]
  );
  const mapComps = useMemo(
    () => getMasterReportMapComps(report).map((comp, index) => normalizeComparableRecord(comp, index)).slice(0, 18),
    [report]
  );

  if (!report?.generatedAt) return null;

  const property = report.propertySnapshot || {};
  const deal = report.dealInputs || {};
  const valuation = report.valuation || {};
  const analysis = report.dealAnalysis || {};
  const ai = report.aiVerdict || {};
  const market = report.marketContext || {};
  const valueBand = `${formatCurrency(valuation.blendedLow)} - ${formatCurrency(valuation.blendedHigh)}`;
  const headlineMetric =
    analysis.mode === "hold"
      ? formatPercent(analysis.metrics?.grossYieldPercent)
      : formatCurrency(analysis.metrics?.estimatedProfit);
  const headlineMetricLabel =
    analysis.mode === "hold" ? "Gross yield" : "Estimated profit";

  return (
    <div className="w-[980px] bg-[#f6f1ea] px-8 py-8 text-[#1d1713]">
      <section
        className="relative overflow-hidden rounded-[36px] bg-[#173f3b] px-9 py-9 text-white"
        style={{ breakInside: "avoid" }}
      >
        <div className="absolute inset-y-0 right-0 w-[360px] bg-gradient-to-l from-[#102c2b] to-transparent" />
        <div className="absolute -right-20 -top-16 h-56 w-56 rounded-full bg-[#dfc692]/18" />
        <div className="absolute bottom-0 right-16 h-44 w-44 rounded-full border border-white/10 bg-white/[0.04]" />
        <img
          src={logoMark}
          alt=""
          aria-hidden="true"
          className="absolute right-8 top-8 h-32 w-32 object-contain opacity-[0.08] saturate-0 brightness-200"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-4 rounded-full border border-white/12 bg-white/10 px-4 py-3">
                <div className="rounded-[16px] bg-white px-3 py-2">
                  <img src={logoHorizontal} alt="Fliprop" className="h-8 w-auto object-contain" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/68">
                    Master Deal Report
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">Investor-ready underwriting package</p>
                </div>
              </div>

              <h1 className="mt-6 max-w-3xl font-display text-[3.05rem] leading-[0.92]">
                {report.title || report.subject?.address || "Master Deal Report"}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/76">
                Property facts, valuation support, deal math, market context, and a sober AI verdict in one report designed to answer the real question: does this deal work?
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-[24px] border border-white/15 bg-white/10 px-5 py-4 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">Generated</p>
                <p className="mt-2 text-sm font-semibold">{formatDate(report.generatedAt)}</p>
              </div>
              <div className="rounded-[24px] border border-[#dfc692]/18 bg-[#dfc692]/10 px-5 py-4 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f7ebcf]">Verdict</p>
                <p className="mt-2 text-lg font-semibold text-white">{ai.verdict || "Pending review"}</p>
                <p className="mt-1 text-xs text-white/72">
                  Comp support {ai.compSupport || "—"} • Confidence {ai.confidence || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[30px] border border-white/12 bg-[#113532]/84 px-6 py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/64">Subject property</p>
            <h2 className="mt-3 font-display text-[2.15rem] leading-[0.95]">{property.address || report.subject?.address || "—"}</h2>
            <p className="mt-3 text-sm leading-6 text-white/74">
              {[
                property.propertyType,
                property.squareFootage ? `${formatNumber(property.squareFootage)} sqft` : null,
                property.bedrooms !== null && property.bedrooms !== undefined ? `${property.bedrooms} bd` : null,
                property.bathrooms !== null && property.bathrooms !== undefined ? `${property.bathrooms} ba` : null,
              ]
                .filter(Boolean)
                .join(" • ") || "Property facts are still limited for this subject."}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-4">
            <MetricCard
              label="Blended value"
              value={formatCurrency(valuation.blendedEstimate)}
              hint={valueBand}
            />
            <MetricCard
              label="Asking price"
              value={formatCurrency(deal.askingPrice)}
              hint={`Rehab ${formatCurrency(deal.rehabEstimate)}`}
            />
            <MetricCard
              label={headlineMetricLabel}
              value={headlineMetric}
              hint={
                analysis.mode === "hold"
                  ? `Stabilized basis ${formatCurrency(analysis.metrics?.stabilizedBasis)}`
                  : `Margin ${formatPercent(analysis.metrics?.marginPercent)}`
              }
            />
            <MetricCard
              label="RentCast AVM"
              value={formatCurrency(valuation.rentCastEstimate)}
              hint={`${formatCurrency(valuation.rentCastLow)} - ${formatCurrency(valuation.rentCastHigh)}`}
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-white/62">
            <p>Prepared from RentCast property, AVM, listing, and market data plus a transparent assumptions model.</p>
            <p>{deal.strategy ? `${String(deal.strategy).toUpperCase()} strategy` : "Deal underwriting"}</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-[1fr_0.96fr] gap-6">
        <SectionShell
          title="Property Snapshot"
          subtitle="Current facts, owner context, tax context, and the most recent recorded sale information."
        >
          <DetailGrid
            items={[
              { label: "Property", value: property.propertyType || "—" },
              { label: "Beds / Baths", value: [property.bedrooms, property.bathrooms].filter((value) => value !== null && value !== undefined).join(" / ") || "—" },
              { label: "Square Footage", value: formatNumber(property.squareFootage) },
              { label: "Lot Size", value: formatNumber(property.lotSize) },
              { label: "Year Built", value: formatNumber(property.yearBuilt) },
              { label: "Owner", value: property.owner?.name || "—", hint: property.owner?.occupied === null ? null : property.owner?.occupied ? "Owner occupied" : "Not owner occupied" },
              { label: "Owner Type", value: property.owner?.type || "—" },
              { label: "Last Sale", value: formatCurrency(property.lastSalePrice), hint: formatDate(property.lastSaleDate) },
              { label: "Tax Amount", value: formatCurrency(property.latestTax?.taxAmount), hint: property.latestTax?.year ? `Tax year ${property.latestTax.year}` : null },
              { label: "Assessed Value", value: formatCurrency(property.latestTax?.assessedValue) },
              { label: "HOA", value: formatCurrency(property.hoaFee) },
              { label: "Parcel / Legal", value: property.parcelId || "—", hint: property.legalDescription || null },
            ]}
          />
        </SectionShell>

        <SectionShell
          title="Deal Inputs"
          subtitle="User-entered assumptions feeding the underwriting model."
        >
          <DetailGrid
            items={[
              { label: "Strategy", value: deal.strategy || "—" },
              { label: "Asking Price", value: formatCurrency(deal.askingPrice) },
              { label: "Renovation", value: formatCurrency(deal.rehabEstimate) },
              { label: "Hold Period", value: formatNumber(deal.holdingPeriodMonths, " months") },
              { label: "Acquisition Closing", value: formatPercent(deal.acquisitionClosingCostPercent) },
              { label: "Selling Costs", value: formatPercent(deal.sellingCostPercent) },
              { label: "Interest Rate", value: formatPercent(deal.interestRatePercent) },
              { label: "Loan Points", value: formatPercent(deal.financingPointsPercent) },
              { label: "Loan To Cost", value: formatPercent(deal.loanToCostPercent) },
              { label: "Annual Taxes", value: formatCurrency(deal.annualTaxes) },
              { label: "Insurance / Utilities", value: `${formatCurrency(deal.monthlyInsurance)} / ${formatCurrency(deal.monthlyUtilities)}` },
              { label: "Target Margin", value: formatPercent(deal.desiredProfitMarginPercent) },
            ]}
          />
          <div className="mt-4 rounded-[20px] border border-[#e5ddd3] bg-[#faf6f1] px-5 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">Notes</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#40342c]">
              {deal.notes || "No custom deal notes were entered for this report."}
            </p>
          </div>
        </SectionShell>
      </div>

      <div className="mt-6 grid grid-cols-[0.98fr_1.02fr] gap-6">
        <SectionShell
          title="Value Summary"
          subtitle="The report blends AVM output with the comp sets shown below rather than pretending there is one perfect number."
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[22px] bg-[#173f3b] px-5 py-5 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">Blended estimate</p>
              <p className="mt-3 text-[2.1rem] font-semibold">{formatCurrency(valuation.blendedEstimate)}</p>
              <p className="mt-2 text-sm text-white/74">{valueBand}</p>
            </div>
            <div className="rounded-[22px] border border-[#ddd3c7] bg-[#faf6f1] px-5 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">Source medians</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-[#40342c]">
                <p>RentCast AVM: {formatCurrency(valuation.rentCastEstimate)}</p>
                <p>Primary comps: {formatCurrency(valuation.primaryCompMedian)}</p>
                <p>Recent sales: {formatCurrency(valuation.recentSaleMedian)}</p>
                <p>Active market: {formatCurrency(valuation.activeMarketMedian)}</p>
              </div>
            </div>
          </div>

          {valuation.notes?.length ? (
            <div className="mt-4">
              <TextList
                label="Pricing commentary"
                items={valuation.notes}
                emptyText="No pricing commentary was generated."
              />
            </div>
          ) : null}
        </SectionShell>

        <SectionShell
          title="Deal Analysis"
          subtitle="Headline math plus the transparent cost stack that produced it."
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[20px] bg-[#faf6f1] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b6d63]">
                {analysis.mode === "hold" ? "Stabilized Basis" : "Total Project Cost"}
              </p>
              <p className="mt-2 text-lg font-semibold text-[#1d1713]">
                {formatCurrency(analysis.mode === "hold" ? analysis.metrics?.stabilizedBasis : analysis.metrics?.totalProjectCost)}
              </p>
            </div>
            <div className="rounded-[20px] bg-[#faf6f1] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b6d63]">
                {analysis.mode === "hold" ? "Estimated Rent" : "Exit Value"}
              </p>
              <p className="mt-2 text-lg font-semibold text-[#1d1713]">
                {formatCurrency(analysis.mode === "hold" ? analysis.metrics?.estimatedMonthlyRent : analysis.metrics?.exitValue)}
              </p>
            </div>
            <div className="rounded-[20px] bg-[#faf6f1] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b6d63]">
                {analysis.mode === "hold" ? "Gross Yield" : "Estimated Profit"}
              </p>
              <p className="mt-2 text-lg font-semibold text-[#1d1713]">
                {analysis.mode === "hold" ? formatPercent(analysis.metrics?.grossYieldPercent) : formatCurrency(analysis.metrics?.estimatedProfit)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <CostTable items={Array.isArray(analysis.costBreakdown) ? analysis.costBreakdown : []} />
          </div>
        </SectionShell>
      </div>

      <div className="mt-6 grid grid-cols-[1.04fr_0.96fr] gap-6">
        <SectionShell
          title="Comp Logic And Map"
          subtitle="The visible comp set is shown honestly: AVM valuation comps, recorded recent sales, and active market listings are separate layers."
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[20px] bg-[#faf6f1] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b6d63]">AVM candidates</p>
              <p className="mt-2 text-lg font-semibold text-[#1d1713]">{formatNumber(report.comps?.logic?.rawComparableCount)}</p>
            </div>
            <div className="rounded-[20px] bg-[#faf6f1] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b6d63]">Visible primary comps</p>
              <p className="mt-2 text-lg font-semibold text-[#1d1713]">{formatNumber(report.comps?.logic?.visiblePrimaryCount)}</p>
            </div>
            <div className="rounded-[20px] bg-[#faf6f1] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b6d63]">Radius</p>
              <p className="mt-2 text-lg font-semibold text-[#1d1713]">{formatNumber(report.compFilters?.radius, " mi")}</p>
            </div>
          </div>

          <div className="mt-4">
            <DealMapFigure
              subject={property}
              comps={mapComps}
              radiusMiles={report.compFilters?.radius}
              title="Visible comp map"
              subtitle="Subject centered with the actual comp set shown in this report."
            />
          </div>

          {report.comps?.logic?.notes?.length ? (
            <div className="mt-4">
              <TextList
                label="Filtering notes"
                items={report.comps.logic.notes}
                emptyText="No comp logic notes were generated."
              />
            </div>
          ) : null}
        </SectionShell>

        <SectionShell
          title="AI Deal Verdict"
          subtitle="A sober, client-ready narrative that calls out what matters most."
        >
          <div className="rounded-[22px] bg-[#173f3b] px-6 py-6 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/68">Verdict</p>
            <p className="mt-3 text-[2rem] font-semibold">{ai.headline || ai.verdict || "No AI verdict was generated."}</p>
            {ai.executiveSummary ? <p className="mt-4 text-sm leading-7 text-white/76">{ai.executiveSummary}</p> : null}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <TextList label="Upside factors" items={ai.upsideFactors || []} emptyText="No upside factors were captured." />
            <TextList label="Risk flags" items={ai.riskFlags || []} emptyText="No risk flags were captured." />
            <TextList label="Key assumptions" items={ai.keyAssumptions || []} emptyText="No key assumptions were captured." />
          </div>
        </SectionShell>
      </div>

      <div className="mt-6 space-y-6">
        <DataTable
          title="Primary Valuation Comps"
          subtitle={report.comps?.primary?.honestLabel || "Primary comps used for valuation support."}
          columns={buildCompColumns()}
          rows={primaryComps}
          emptyText="No primary valuation comps were available for this report."
        />

        <div className="grid grid-cols-2 gap-6">
          <DataTable
            title="Recent Recorded Sales"
            subtitle={report.comps?.recentSales?.honestLabel || "Recorded nearby sales from property records."}
            columns={buildCompColumns()}
            rows={recentSales}
            emptyText="No recent recorded sale comps were available."
          />
          <DataTable
            title="Active Market Listings"
            subtitle={report.comps?.activeMarket?.honestLabel || "Current listings shown as market context, not closed sales."}
            columns={buildCompColumns()}
            rows={activeListings}
            emptyText="No active market listings were available."
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[0.98fr_1.02fr] gap-6">
        <SectionShell
          title="Market Context"
          subtitle="Zip-level sale and listing context from RentCast market data."
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] bg-[#faf6f1] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b6d63]">Median sale</p>
              <p className="mt-2 text-lg font-semibold text-[#1d1713]">{formatCurrency(market.saleData?.medianPrice)}</p>
            </div>
            <div className="rounded-[20px] bg-[#faf6f1] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b6d63]">Median $ / sqft</p>
              <p className="mt-2 text-lg font-semibold text-[#1d1713]">{formatNumber(market.saleData?.medianPricePerSquareFoot, " / sqft")}</p>
            </div>
            <div className="rounded-[20px] bg-[#faf6f1] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b6d63]">Median DOM</p>
              <p className="mt-2 text-lg font-semibold text-[#1d1713]">{formatNumber(market.saleData?.medianDaysOnMarket, " days")}</p>
            </div>
            <div className="rounded-[20px] bg-[#faf6f1] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b6d63]">New listings</p>
              <p className="mt-2 text-lg font-semibold text-[#1d1713]">{formatNumber(market.saleData?.newListings)}</p>
            </div>
          </div>
          <div className="mt-4">
            <TextList
              label="Market notes"
              items={market.notes || []}
              emptyText="No market notes were available for this zip code."
            />
          </div>
        </SectionShell>

        <SectionShell
          title="Investment Conclusion"
          subtitle="The report conclusion should be read together with the comp strength and assumption sensitivity."
          className="bg-[#fbf7f2]"
        >
          <div className="rounded-[22px] bg-white px-6 py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">Bottom line</p>
            <p className="mt-3 text-xl font-semibold text-[#1d1713]">
              {ai.verdict || "Review required"} deal with {ai.compSupport || "moderate"} comp support.
            </p>
            <p className="mt-4 text-sm leading-7 text-[#40342c]">
              {ai.dealTakeaway ||
                ai.valueTakeaway ||
                "Use the valuation range, cost stack, and comp notes above before making a pricing decision."}
            </p>
          </div>

          <div className="mt-4 rounded-[22px] border border-[#e5ddd3] bg-white px-6 py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">Next steps</p>
            <ul className="mt-3 space-y-2">
              {(ai.nextSteps || []).length ? (
                ai.nextSteps.map((step) => (
                  <li key={step} className="rounded-[16px] bg-[#faf6f1] px-4 py-3 text-sm leading-6 text-[#40342c]">
                    {step}
                  </li>
                ))
              ) : (
                <li className="rounded-[16px] bg-[#faf6f1] px-4 py-3 text-sm leading-6 text-[#40342c]">
                  Recheck the visible comp set, confirm renovation scope, and pressure-test the cost assumptions before underwriting an offer.
                </li>
              )}
            </ul>
          </div>
        </SectionShell>
      </div>
    </div>
  );
};

export default CompsReportPdfTemplate;
