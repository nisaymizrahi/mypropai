import React, { useMemo } from "react";

import DealMapFigure from "./DealMapFigure";
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
import { publicAssetUrl } from "../utils/env";

const logoHorizontal = publicAssetUrl("brand/brand-logo-horizontal.svg");

const formatNumber = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString()}${suffix}`;
};

const SectionShell = ({ title, subtitle, children, className = "" }) => (
  <section
    className={`rounded-[28px] border border-[#ddd3c7] bg-white px-7 py-7 ${className}`.trim()}
    style={{ breakInside: "avoid" }}
  >
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">{title}</p>
    {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6d5e55]">{subtitle}</p> : null}
    <div className="mt-5">{children}</div>
  </section>
);

const MetricCard = ({ label, value, hint, shell = "bg-[#faf6f1]" }) => (
  <div className={`rounded-[22px] border border-[#e5ddd3] ${shell} px-5 py-5`} style={{ breakInside: "avoid" }}>
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8c7d72]">{label}</p>
    <p className="mt-3 text-[1.8rem] font-semibold text-[#1d1713]">{value}</p>
    {hint ? <p className="mt-2 text-xs leading-5 text-[#6d5e55]">{hint}</p> : null}
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

const ComparisonBar = ({ leftLabel, leftValue, rightLabel, rightValue }) => {
  const maxValue = Math.max(leftValue || 0, rightValue || 0, 1);
  const leftWidth = Math.max(((leftValue || 0) / maxValue) * 100, leftValue ? 12 : 0);
  const rightWidth = Math.max(((rightValue || 0) / maxValue) * 100, rightValue ? 12 : 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm text-[#40342c]">
          <span>{leftLabel}</span>
          <span className="font-semibold">{formatCurrency(leftValue)}</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-[#eadfd4]">
          <div className="h-full rounded-full bg-[#1d1713]" style={{ width: `${leftWidth}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm text-[#40342c]">
          <span>{rightLabel}</span>
          <span className="font-semibold">{formatCurrency(rightValue)}</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-[#d6e8e2]">
          <div className="h-full rounded-full bg-[#1f6c63]" style={{ width: `${rightWidth}%` }} />
        </div>
      </div>
    </div>
  );
};

const CostStackFigure = ({ items = [] }) => {
  if (!items.length) {
    return (
      <div className="rounded-[22px] border border-dashed border-[#ddd3c7] bg-[#faf6f1] px-6 py-10 text-center text-sm text-[#6d5e55]">
        No cost stack is available for this report yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-[#eadfd4]">
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

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.key} className="rounded-[20px] border border-[#e5ddd3] bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-sm font-semibold text-[#1d1713]">{item.label}</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c7d72]">
                {formatPercent(item.share, 0)}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#40342c]">{formatCurrency(item.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const ai = report.aiVerdict || {};
  const market = report.marketContext || {};
  const financial = buildFinancialSnapshot(report);
  const verdictMeta = getVerdictMeta(report);
  const primarySummary = report.comps?.primary?.summary || {};
  const recentSummary = report.comps?.recentSales?.summary || {};
  const activeSummary = report.comps?.activeMarket?.summary || {};

  return (
    <div className="w-[980px] bg-[#f6f1ea] px-8 py-8 text-[#1d1713]">
      <section
        className="relative overflow-hidden rounded-[36px] bg-[#173f3b] px-9 py-9 text-white"
        style={{ breakInside: "avoid" }}
      >
        <div className="absolute inset-y-0 right-0 w-[360px] bg-gradient-to-l from-[#102c2b] to-transparent" />
        <div className="absolute -right-20 -top-16 h-56 w-56 rounded-full bg-[#dfc692]/18" />
        <div className="absolute bottom-0 right-16 h-44 w-44 rounded-full border border-white/10 bg-white/[0.04]" />

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
                  <p className="mt-1 text-sm font-semibold text-white">Investor presentation package</p>
                </div>
              </div>

              <h1 className="mt-6 max-w-3xl font-display text-[3rem] leading-[0.92]">
                {property.address || report.subject?.address || report.title || "Master Deal Report"}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/76">
                This report combines property facts, comparable support, value-versus-cost analysis, and an AI underwriting conclusion into one client-ready package.
              </p>
            </div>

            <div className="w-[240px] rounded-[26px] border border-white/14 bg-white/10 px-5 py-5 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">Deal score</p>
              <p className="mt-3 text-[3rem] font-semibold">{verdictMeta.score}</p>
              <p className="mt-1 text-lg font-semibold">{verdictMeta.label}</p>
              <p className="mt-3 text-xs text-white/72">
                {verdictMeta.compSupport} comp support • {verdictMeta.confidence} confidence
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-4 gap-4">
            <MetricCard
              label="Estimated value"
              value={formatCurrency(financial.estimatedValue)}
              hint={`${formatCurrency(valuation.blendedLow)} - ${formatCurrency(valuation.blendedHigh)}`}
              shell="bg-white/10 border-white/12"
            />
            <MetricCard
              label="Total cost"
              value={formatCurrency(financial.totalProjectCost)}
              hint={`${formatCompactCurrency(financial.askingPrice)} purchase • ${formatCompactCurrency(financial.rehabEstimate)} rehab`}
              shell="bg-white/10 border-white/12"
            />
            <MetricCard
              label={financial.spreadLabel}
              value={formatSignedCurrency(financial.estimatedProfit)}
              hint={`${financial.marginLabel} ${formatPercent(financial.marginPercent)}`}
              shell="bg-white/10 border-white/12"
            />
            <MetricCard
              label={financial.returnLabel}
              value={formatPercent(financial.returnPercent)}
              hint={`Generated ${formatDate(report.generatedAt)}`}
              shell="bg-white/10 border-white/12"
            />
          </div>

          <div className="mt-6 rounded-[28px] border border-white/12 bg-[#113532]/84 px-6 py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/64">Executive summary</p>
            <p className="mt-3 text-sm leading-7 text-white/78">
              {ai.executiveSummary ||
                ai.dealTakeaway ||
                ai.valueTakeaway ||
                "Review the comp support, cost stack, and value range together before making a pricing decision."}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-[1.02fr_0.98fr] gap-6">
        <SectionShell
          title="Financial Snapshot"
          subtitle="The headline numbers are organized so the economics can be reviewed in seconds."
        >
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Purchase" value={formatCurrency(financial.askingPrice)} />
            <MetricCard label="Renovation" value={formatCurrency(financial.rehabEstimate)} />
            <MetricCard label="Soft Costs" value={formatCurrency(financial.softCosts)} />
            <MetricCard label="Carry Costs" value={formatCurrency(financial.carryCosts)} />
            <MetricCard label="Selling Costs" value={formatCurrency(financial.sellingCosts)} />
            <MetricCard label="Value Gap" value={formatSignedCurrency(financial.valueGap)} />
          </div>
        </SectionShell>

        <SectionShell
          title="Value Vs Cost"
          subtitle="A quick visual of the all-in basis against the report value conclusion."
        >
          <ComparisonBar
            leftLabel="Total project cost"
            leftValue={financial.totalProjectCost}
            rightLabel={financial.valueLabel}
            rightValue={financial.estimatedValue}
          />

          <div className="mt-4 grid grid-cols-3 gap-3">
            <MetricCard label={financial.marginLabel} value={formatPercent(financial.marginPercent)} />
            <MetricCard label={financial.returnLabel} value={formatPercent(financial.returnPercent)} />
            <MetricCard label="Cash Required" value={formatCurrency(financial.cashRequired)} />
          </div>
        </SectionShell>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_0.95fr] gap-6">
        <SectionShell
          title="Capital Stack"
          subtitle="Purchase, renovation, soft costs, carry, and selling costs shown as one stack."
        >
          <CostStackFigure items={financial.costStack} />
        </SectionShell>

        <SectionShell
          title="Comparable Support"
          subtitle="Primary valuation comps, recorded recent sales, and active listings are separated clearly."
        >
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Primary comps" value={formatNumber(primarySummary.count)} hint={`Median ${formatCurrency(primarySummary.medianPrice)}`} />
            <MetricCard label="Recent sales" value={formatNumber(recentSummary.count)} hint={`Median ${formatCurrency(recentSummary.medianPrice)}`} />
            <MetricCard label="Active listings" value={formatNumber(activeSummary.count)} hint={`Median ${formatCurrency(activeSummary.medianPrice)}`} />
          </div>

          <div className="mt-4">
            <DealMapFigure
              subject={property}
              comps={mapComps}
              radiusMiles={report.compFilters?.radius}
              title="Visible comp map"
              subtitle="Subject centered with the comp set shown in this report."
            />
          </div>
        </SectionShell>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_0.98fr] gap-6">
        <SectionShell
          title="AI Conclusion"
          subtitle="A clean narrative summary suitable for clients, investors, and partners."
        >
          <div className="rounded-[22px] bg-[#173f3b] px-6 py-6 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/68">Bottom line</p>
            <p className="mt-3 text-[2rem] font-semibold">
              {ai.verdict || verdictMeta.label} deal with {verdictMeta.compSupport.toLowerCase()} support.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/78">
              {ai.executiveSummary ||
                ai.dealTakeaway ||
                ai.valueTakeaway ||
                "Use the comp support, value range, and cost stack together before pricing this opportunity."}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <TextList label="Upside factors" items={ai.upsideFactors || []} emptyText="No upside factors were captured." />
            <TextList label="Risk flags" items={ai.riskFlags || []} emptyText="No risk flags were captured." />
          </div>
        </SectionShell>

        <SectionShell
          title="Assumptions"
          subtitle="The underwriting is only as good as the assumptions behind it."
        >
          <DetailGrid
            items={[
              { label: "Strategy", value: deal.strategy || "—" },
              { label: "Asking Price", value: formatCurrency(deal.askingPrice) },
              { label: "Renovation", value: formatCurrency(deal.rehabEstimate) },
              { label: "Hold Period", value: formatNumber(deal.holdingPeriodMonths, " months") },
              { label: "Closing Costs", value: formatPercent(deal.acquisitionClosingCostPercent) },
              { label: "Selling Costs", value: formatPercent(deal.sellingCostPercent) },
              { label: "Interest Rate", value: formatPercent(deal.interestRatePercent) },
              { label: "Loan To Cost", value: formatPercent(deal.loanToCostPercent) },
              { label: "Annual Taxes", value: formatCurrency(deal.annualTaxes) },
              { label: "Insurance / Utilities", value: `${formatCurrency(deal.monthlyInsurance)} / ${formatCurrency(deal.monthlyUtilities)}` },
            ]}
          />

          <div className="mt-4">
            <TextList label="Deal notes" items={deal.notes ? [deal.notes] : []} emptyText="No custom notes were entered for this report." />
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
            subtitle={report.comps?.activeMarket?.honestLabel || "Current listings shown as market context."}
            columns={buildCompColumns()}
            rows={activeListings}
            emptyText="No active market listings were available."
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1.02fr_0.98fr] gap-6">
        <SectionShell
          title="Property Context"
          subtitle="Current subject facts, owner context, and the most recent recorded sale information."
        >
          <DetailGrid
            items={[
              { label: "Property", value: property.propertyType || "—" },
              { label: "Beds / Baths", value: [property.bedrooms, property.bathrooms].filter((value) => value !== null && value !== undefined).join(" / ") || "—" },
              { label: "Square Footage", value: formatNumber(property.squareFootage) },
              { label: "Lot Size", value: formatNumber(property.lotSize) },
              { label: "Year Built", value: formatNumber(property.yearBuilt) },
              { label: "Owner", value: property.owner?.name || "—", hint: property.owner?.type || null },
              { label: "Last Sale", value: formatCurrency(property.lastSalePrice), hint: formatDate(property.lastSaleDate) },
              { label: "Tax Amount", value: formatCurrency(property.latestTax?.taxAmount), hint: property.latestTax?.year ? `Tax year ${property.latestTax.year}` : null },
            ]}
          />
        </SectionShell>

        <SectionShell
          title="Market Context"
          subtitle="Zip-level sale and listing context from RentCast market data."
        >
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Median sale" value={formatCurrency(market.saleData?.medianPrice)} />
            <MetricCard label="Median $ / sqft" value={formatNumber(market.saleData?.medianPricePerSquareFoot, " / sqft")} />
            <MetricCard label="Median DOM" value={formatNumber(market.saleData?.medianDaysOnMarket, " days")} />
            <MetricCard label="New listings" value={formatNumber(market.saleData?.newListings)} />
          </div>

          <div className="mt-4">
            <TextList
              label="Market notes"
              items={market.notes || []}
              emptyText="No market notes were available for this zip code."
            />
          </div>
        </SectionShell>
      </div>
    </div>
  );
};

export default CompsReportPdfTemplate;
