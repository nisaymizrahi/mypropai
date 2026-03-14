import React, { useMemo } from "react";
import { formatCurrency, formatDate } from "../utils/compsReport";

const logo = `${process.env.PUBLIC_URL}/logo.png`;

const formatNumber = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toLocaleString()}${suffix}`;
};

const buildFilterRows = (filters = {}) => {
  const entries = [
    ["Radius", filters.radius ? `${filters.radius} mi` : null],
    ["Freshness", filters.saleDateMonths ? `${filters.saleDateMonths} months` : null],
    ["Property type", filters.propertyType || null],
    [
      "Sqft range",
      filters.minSquareFootage || filters.maxSquareFootage
        ? `${filters.minSquareFootage || "Any"} - ${filters.maxSquareFootage || "Any"}`
        : null,
    ],
    [
      "Lot range",
      filters.minLotSize || filters.maxLotSize
        ? `${filters.minLotSize || "Any"} - ${filters.maxLotSize || "Any"}`
        : null,
    ],
    ["Max comps", filters.maxComps || null],
  ];

  return entries.filter(([, value]) => value);
};

const SubjectDetail = ({ label, value }) => (
  <div className="rounded-[18px] border border-[#d9d0c5] bg-white/82 px-4 py-4">
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">{label}</p>
    <p className="mt-2 text-sm font-semibold text-[#1d1713]">{value || "—"}</p>
  </div>
);

const MetricPill = ({ label, value, hint }) => (
  <div
    className="rounded-[20px] border border-white/15 bg-white/10 px-4 py-4 text-white"
    style={{ breakInside: "avoid" }}
  >
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">{label}</p>
    <p className="mt-2 text-2xl font-semibold">{value}</p>
    {hint ? <p className="mt-2 text-xs leading-5 text-white/70">{hint}</p> : null}
  </div>
);

const BandCard = ({ label, low, median, high, suffix = "" }) => (
  <div
    className="rounded-[24px] border border-[#ddd4c9] bg-white px-5 py-5"
    style={{ breakInside: "avoid" }}
  >
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">{label}</p>
    <div className="mt-4 grid grid-cols-3 gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#99897d]">Low</p>
        <p className="mt-1 text-sm font-semibold text-[#1d1713]">
          {suffix ? formatNumber(low, suffix) : formatCurrency(low)}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#99897d]">Median</p>
        <p className="mt-1 text-sm font-semibold text-[#1d1713]">
          {suffix ? formatNumber(median, suffix) : formatCurrency(median)}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#99897d]">High</p>
        <p className="mt-1 text-sm font-semibold text-[#1d1713]">
          {suffix ? formatNumber(high, suffix) : formatCurrency(high)}
        </p>
      </div>
    </div>
  </div>
);

const InsightBlock = ({ label, value }) => (
  <div
    className="rounded-[20px] border border-[#ddd4c9] bg-white px-5 py-5"
    style={{ breakInside: "avoid" }}
  >
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">{label}</p>
    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#40342c]">{value || "—"}</p>
  </div>
);

const ListBlock = ({ label, values = [], emptyText }) => (
  <div
    className="rounded-[20px] border border-[#ddd4c9] bg-white px-5 py-5"
    style={{ breakInside: "avoid" }}
  >
    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">{label}</p>
    {values.length ? (
      <ul className="mt-3 space-y-2">
        {values.map((value) => (
          <li key={value} className="rounded-[16px] bg-[#f4efe8] px-4 py-3 text-sm leading-6 text-[#40342c]">
            {value}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-3 text-sm leading-6 text-[#6d5e55]">{emptyText}</p>
    )}
  </div>
);

const CompsReportPdfTemplate = ({ report = null }) => {
  const subject = report?.subjectSnapshot || {};
  const recentComps = useMemo(
    () => (Array.isArray(report?.recentComps) ? report.recentComps : []),
    [report]
  );
  const filterRows = useMemo(() => buildFilterRows(report?.filters), [report?.filters]);

  if (!report?.generatedAt) return null;

  const propertySummary = [
    subject.propertyType,
    subject.squareFootage ? `${Number(subject.squareFootage).toLocaleString()} sqft` : null,
    subject.yearBuilt ? `Built ${subject.yearBuilt}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  const bedroomBathSummary = [
    subject.bedrooms ? `${subject.bedrooms} bd` : null,
    subject.bathrooms ? `${subject.bathrooms} ba` : null,
    subject.unitCount ? `${subject.unitCount} units` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="w-[980px] bg-[#f6f1ea] px-8 py-8 text-[#1d1713]">
      <section
        className="relative overflow-hidden rounded-[34px] bg-[#1f4f49] px-9 py-9 text-white"
        style={{ breakInside: "avoid" }}
      >
        <div className="absolute inset-y-0 right-0 w-[320px] bg-gradient-to-l from-[#173f3b]/95 to-transparent" />
        <div className="absolute -right-16 -top-12 h-48 w-48 rounded-full bg-[#e0c796]/18" />
        <div className="absolute right-20 top-24 h-28 w-28 rounded-full bg-white/8" />
        <div className="absolute -bottom-12 right-8 h-56 w-56 rounded-full border border-white/10 bg-white/[0.03]" />
        <img
          src={logo}
          alt="Fliprop"
          className="absolute right-8 top-8 h-32 w-32 object-contain opacity-[0.07] saturate-0 brightness-200"
        />
        <div className="relative">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-4 rounded-full border border-white/12 bg-white/10 px-4 py-3">
                <div className="rounded-[16px] bg-white px-3 py-2">
                  <img src={logo} alt="Fliprop logo" className="h-8 w-auto object-contain" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/65">
                    Fliprop
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">AI comps report</p>
                </div>
              </div>
              <h1 className="mt-5 max-w-3xl font-display text-[3rem] leading-[0.92]">
                {report.title || "Comparable sales report"}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/78">
                Selected comparable sales, pricing bands, and an AI-written market memo prepared
                for quick underwriting and seller conversations.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-[24px] border border-white/15 bg-white/10 px-5 py-4 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/70">
                  Generated
                </p>
                <p className="mt-2 text-sm font-semibold">{formatDate(report.generatedAt)}</p>
              </div>
              <div className="rounded-[24px] border border-[#e0c796]/20 bg-[#e0c796]/10 px-5 py-4 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f5e7c8]">
                  Report type
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Comparable sales valuation</p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-[#173f3b]/85 px-6 py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">
              Subject property
            </p>
            <h2 className="mt-3 font-display text-[2.2rem] leading-[0.95]">{report.address || "—"}</h2>
            <p className="mt-3 text-sm leading-6 text-white/74">
              {propertySummary || "Property details unavailable"}
              {propertySummary && bedroomBathSummary ? " • " : ""}
              {bedroomBathSummary || ""}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-4">
            <MetricPill
              label="Estimated value"
              value={formatCurrency(report.estimatedValue)}
              hint={`${report.saleCompCount || 0} selected comps`}
            />
            <MetricPill
              label="Offer range"
              value={`${formatCurrency(report.recommendedOfferLow)} - ${formatCurrency(
                report.recommendedOfferHigh
              )}`}
              hint="From the selected comp set"
            />
            <MetricPill
              label="Median sold"
              value={formatCurrency(report.medianSoldPrice)}
              hint={`Average ${formatCurrency(report.averageSoldPrice)}`}
            />
            <MetricPill
              label="Median $ / sqft"
              value={formatNumber(report.medianPricePerSqft, " / sqft")}
              hint={
                report.averageDaysOnMarket !== null && report.averageDaysOnMarket !== undefined
                  ? `Average DOM ${formatNumber(report.averageDaysOnMarket)}`
                  : "Market timing unavailable"
              }
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs text-white/62">
            <p>Prepared in Fliprop using the selected saved comp set and AI market summary.</p>
            <p>{report.address || "Property report"}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-[1.05fr_0.95fr] gap-6">
        <div
          className="rounded-[28px] border border-[#ddd4c9] bg-[#fbf8f4] px-6 py-6"
          style={{ breakInside: "avoid" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">
            Subject snapshot
          </p>
          <h3 className="mt-4 font-display text-[2rem] leading-[0.98] text-[#1d1713]">
            Property and pricing context
          </h3>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <SubjectDetail label="Asking price" value={formatCurrency(subject.sellerAskingPrice)} />
            <SubjectDetail label="Target offer" value={formatCurrency(subject.targetOffer)} />
            <SubjectDetail label="ARV / future value" value={formatCurrency(subject.arv)} />
            <SubjectDetail label="Listing status" value={subject.listingStatus || "Off market"} />
            <SubjectDetail label="Lot size" value={formatNumber(subject.lotSize)} />
            <SubjectDetail label="Last sale" value={formatDate(subject.lastSaleDate)} />
          </div>
        </div>

        <div
          className="rounded-[28px] border border-[#ddd4c9] bg-white px-6 py-6"
          style={{ breakInside: "avoid" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">
            Value band
          </p>
          <h3 className="mt-4 font-display text-[2rem] leading-[0.98] text-[#1d1713]">
            Low, median, and high value markers
          </h3>

          <div className="mt-7 rounded-[22px] bg-[#f3eee7] px-5 py-5">
            <div className="flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b6d63]">
              <span>{formatCurrency(report.estimatedValueLow)}</span>
              <span>{formatCurrency(report.estimatedValue)}</span>
              <span>{formatCurrency(report.estimatedValueHigh)}</span>
            </div>
            <div className="mt-4 h-4 rounded-full bg-gradient-to-r from-[#c78461] via-[#d8c28f] to-[#2c6a64]" />
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-[#5a4e45]">
              <div>
                <p className="font-semibold text-[#1d1713]">Low</p>
                <p className="mt-1 leading-6">Conservative edge of the selected comp range.</p>
              </div>
              <div>
                <p className="font-semibold text-[#1d1713]">Median</p>
                <p className="mt-1 leading-6">Balanced center point for pricing conversations.</p>
              </div>
              <div>
                <p className="font-semibold text-[#1d1713]">High</p>
                <p className="mt-1 leading-6">Optimistic ceiling supported by top-end comp signals.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-[#ddd4c9] bg-[#fbf8f4] px-5 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b6d63]">
              Confidence note
            </p>
            <p className="mt-3 text-sm leading-7 text-[#40342c]">
              {report.report?.confidence
                ? `AI confidence: ${report.report.confidence}.`
                : "Confidence was not saved with this report."}{" "}
              Use the selected comp count, distance, timing, and condition knowledge from your team
              to finalize the pricing call.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="grid grid-cols-3 gap-5">
          <BandCard
            label="Sold price band"
            low={report.lowSoldPrice}
            median={report.medianSoldPrice}
            high={report.highSoldPrice}
          />
          <BandCard
            label="Price per sqft band"
            low={report.lowPricePerSqft}
            median={report.medianPricePerSqft}
            high={report.highPricePerSqft}
            suffix=" / sqft"
          />
          <BandCard
            label="Days on market"
            low={report.lowDaysOnMarket}
            median={report.medianDaysOnMarket}
            high={report.highDaysOnMarket}
            suffix=" days"
          />
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-6">
        <InsightBlock
          label="Executive summary"
          value={report.report?.executiveSummary || "No AI executive summary was saved."}
        />
        <InsightBlock
          label="Pricing recommendation"
          value={report.report?.pricingRecommendation || "No pricing recommendation was saved."}
        />
        <InsightBlock
          label="Offer strategy"
          value={report.report?.offerStrategy || "No offer strategy was saved."}
        />
        <ListBlock
          label="Risk flags"
          values={Array.isArray(report.report?.riskFlags) ? report.report.riskFlags : []}
          emptyText="No explicit risk flags were saved with this comps report."
        />
      </section>

      <section className="mt-6 grid grid-cols-[1.25fr_0.75fr] gap-6">
        <div
          className="rounded-[28px] border border-[#ddd4c9] bg-white px-6 py-6"
          style={{ breakInside: "avoid" }}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">
                Selected comparables
              </p>
              <h3 className="mt-4 font-display text-[2rem] leading-[0.98] text-[#1d1713]">
                Final comp set
              </h3>
            </div>
            <div className="rounded-full bg-[#f4efe8] px-4 py-2 text-sm font-semibold text-[#5b4e45]">
              {recentComps.length} saved comp{recentComps.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[20px] border border-[#e2d8cd]">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-[#f4efe8] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b6d63]">
                <tr>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Sale</th>
                  <th className="px-4 py-3">$ / sqft</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Beds / baths</th>
                  <th className="px-4 py-3">Sqft</th>
                </tr>
              </thead>
              <tbody>
                {recentComps.map((comp, index) => (
                  <tr key={comp.id || `${comp.address || "comp"}-${index}`} className="border-t border-[#ece3d8]">
                    <td className="px-4 py-4 font-semibold text-[#1d1713]">{comp.address || "—"}</td>
                    <td className="px-4 py-4 text-[#4d4038]">
                      <div>{formatCurrency(comp.salePrice)}</div>
                      <div className="mt-1 text-xs text-[#7b6d63]">{formatDate(comp.saleDate)}</div>
                    </td>
                    <td className="px-4 py-4 text-[#4d4038]">{formatNumber(comp.pricePerSqft, " / sqft")}</td>
                    <td className="px-4 py-4 text-[#4d4038]">{formatNumber(comp.distance, " mi")}</td>
                    <td className="px-4 py-4 text-[#4d4038]">
                      {[comp.bedrooms ? `${comp.bedrooms} bd` : null, comp.bathrooms ? `${comp.bathrooms} ba` : null]
                        .filter(Boolean)
                        .join(" • ") || "—"}
                    </td>
                    <td className="px-4 py-4 text-[#4d4038]">{formatNumber(comp.squareFootage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div
            className="rounded-[28px] border border-[#ddd4c9] bg-white px-6 py-6"
            style={{ breakInside: "avoid" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">
              Filters used
            </p>
            <h3 className="mt-4 font-display text-[1.8rem] leading-[0.98] text-[#1d1713]">
              Search guardrails
            </h3>
            {filterRows.length ? (
              <div className="mt-5 space-y-3">
                {filterRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 border-b border-[#efe6dc] pb-3 text-sm last:border-b-0 last:pb-0"
                  >
                    <span className="text-[#7b6d63]">{label}</span>
                    <span className="font-semibold text-[#1d1713]">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-[#6d5e55]">
                No saved filters were stored with this report snapshot.
              </p>
            )}
          </div>

          <ListBlock
            label="Next steps"
            values={Array.isArray(report.report?.nextSteps) ? report.report.nextSteps : []}
            emptyText="No follow-up actions were saved with this report."
          />

          <div
            className="rounded-[28px] border border-[#ddd4c9] bg-[#fbf8f4] px-6 py-6"
            style={{ breakInside: "avoid" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7b6d63]">
              Report note
            </p>
            <p className="mt-4 text-sm leading-7 text-[#40342c]">
              This document summarizes the selected comparable sales saved in Fliprop. It is an
              underwriting tool and should be paired with field condition review, title and permit
              verification, and strategy-specific diligence before acquisition.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-6 flex items-center justify-between rounded-[24px] border border-[#ddd4c9] bg-white/72 px-6 py-4 text-xs text-[#6d5e55]">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Fliprop logo" className="h-7 w-auto object-contain opacity-90" />
          <span>Fliprop AI comps report</span>
        </div>
        <span>Generated {formatDate(report.generatedAt)}</span>
      </footer>
    </div>
  );
};

export default CompsReportPdfTemplate;
