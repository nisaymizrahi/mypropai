import React from "react";

import { formatCurrency, formatDate } from "../utils/compsReport";

const MetricTile = ({ label, value, hint }) => (
  <div className="metric-tile p-4">
    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">{label}</p>
    <p className="mt-3 text-lg font-medium text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const SectionCard = ({ title, subtitle, children, action }) => (
  <div className="section-card p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 className="text-xl font-semibold text-ink-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-ink-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    <div className="mt-5">{children}</div>
  </div>
);

const FieldGrid = ({ items }) => (
  <dl className="grid gap-4 sm:grid-cols-2">
    {items.map((item) => (
      <div key={item.label} className="rounded-[18px] bg-sand-50 px-4 py-3">
        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
          {item.label}
        </dt>
        <dd className="mt-2 text-sm font-semibold text-ink-900">{item.value}</dd>
      </div>
    ))}
  </dl>
);

const LoadingSpinner = () => (
  <div className="section-card flex items-center justify-center px-6 py-14">
    <div className="loading-ring h-10 w-10 animate-spin rounded-full" />
  </div>
);

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toLocaleString();
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toFixed(1)}%`;
};

const formatBoolean = (value) => {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
};

const buildOverviewItems = (report) => [
  { label: "Address", value: report?.overview?.address || "—" },
  { label: "County", value: report?.overview?.county || "—" },
  { label: "Parcel Id", value: report?.overview?.parcelId || "—" },
  { label: "Legal Description", value: report?.overview?.legalDescription || "—" },
  { label: "Property Type", value: report?.overview?.propertyType || "—" },
  {
    label: "Beds / Baths",
    value: [report?.overview?.bedrooms ?? "—", report?.overview?.bathrooms ?? "—"].join(" / "),
  },
  { label: "Square Footage", value: report?.overview?.squareFootage ? `${formatNumber(report.overview.squareFootage)} sqft` : "—" },
  { label: "Lot Size", value: formatNumber(report?.overview?.lotSize) },
  { label: "Year Built", value: formatNumber(report?.overview?.yearBuilt) },
  { label: "Unit Count", value: formatNumber(report?.overview?.unitCount) },
  { label: "Last Sale Price", value: formatCurrency(report?.overview?.lastSalePrice) },
  { label: "Last Sale Date", value: formatDate(report?.overview?.lastSaleDate) },
];

const buildOwnershipItems = (report) => [
  { label: "Owner", value: report?.owner?.name || "—" },
  { label: "Owner Type", value: report?.owner?.type || "—" },
  { label: "Mailing Address", value: report?.owner?.mailingAddress || "—" },
  { label: "Owner Occupied", value: formatBoolean(report?.owner?.occupied) },
];

const buildListingItems = (listing, title) => ({
  title,
  items: [
    { label: "Status", value: listing?.status || "—" },
    { label: "Price", value: formatCurrency(listing?.price) },
    { label: "Listed Date", value: formatDate(listing?.listedDate) },
    { label: "Removed Date", value: formatDate(listing?.removedDate) },
    { label: "Days On Market", value: formatNumber(listing?.daysOnMarket) },
    { label: "Listing Type", value: listing?.listingType || "—" },
    { label: "MLS", value: listing?.mlsName || "—" },
    { label: "MLS Number", value: listing?.mlsNumber || "—" },
    { label: "Agent", value: listing?.agentName || "—" },
    { label: "Office", value: listing?.officeName || "—" },
    { label: "Builder", value: listing?.builderName || "—" },
    { label: "Hoa Fee", value: formatCurrency(listing?.hoaFee) },
  ],
});

const PropertyAnalysisWorkspace = ({
  report,
  isAnalyzing,
  onRunAnalysis,
  billingAccess,
  isBillingAccessLoading,
  onStartSubscription,
  isStartingSubscription,
  runDisabled = false,
}) => {
  const canRun = Boolean(billingAccess?.accessGranted) && !runDisabled;
  const assessmentHistory = report?.taxes?.history || [];
  const compHighlights = report?.compsSummary?.comps?.slice(0, 5) || [];
  const rentComparables = report?.rent?.comparables?.slice(0, 5) || [];
  const saleListingSection = buildListingItems(report?.saleListing, "Sale Listing");
  const rentalListingSection = buildListingItems(report?.rentalListing, "Rental Listing");

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="section-card p-6">
          <h3 className="text-xl font-semibold text-ink-900">Run full property analysis</h3>
          <p className="mt-1 text-sm text-ink-500">
            Pull the full RentCast-backed property profile, owner details, tax history, value and
            rent estimates, then wrap it with an AI investment memo.
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
                      Used {billingAccess.monthlyIncludedUsedCount} of{" "}
                      {billingAccess.monthlyIncludedLimit}
                      {billingAccess.monthlyIncludedResetsAt
                        ? `, resets on ${formatDate(billingAccess.monthlyIncludedResetsAt)}`
                        : ""}
                      .
                    </p>
                  </>
                ) : (
                  <p>Pro access is active for this account. Run the analysis whenever you're ready.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-ink-700">
                  {billingAccess?.hasActiveSubscription
                    ? `You have used all ${billingAccess.monthlyIncludedLimit || 10} included Pro comps reports for this month.`
                    : "This property analysis is a Pro workflow. Upgrade to Pro to unlock it from the menu."}
                </p>
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
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onRunAnalysis}
            disabled={isAnalyzing || isBillingAccessLoading || !canRun}
            className="primary-action mt-5 w-full justify-center disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing..." : "Run Full Property Analysis"}
          </button>
        </div>

        <SectionCard title="Report coverage" subtitle="Current scope using RentCast plus AI.">
          <div className="space-y-3 text-sm leading-6 text-ink-600">
            <p>Property facts, ownership, mailing address, listing data, rent estimate, value estimate, and tax history where available.</p>
            <p>AI memo summarizes strengths, risks, and next steps from the data already returned.</p>
            <p>Zoning, parcel overlays, and jurisdiction-specific violation checks can be layered in later.</p>
          </div>
        </SectionCard>
      </div>

      <div className="space-y-6">
        {report ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                label="Asking Price"
                value={formatCurrency(report.metrics?.askingPrice)}
                hint={report.saleListing?.status || "Current sale listing"}
              />
              <MetricTile
                label="Estimated Value"
                value={formatCurrency(report.metrics?.estimatedValue)}
                hint={
                  report.metrics?.estimatedValueLow && report.metrics?.estimatedValueHigh
                    ? `${formatCurrency(report.metrics.estimatedValueLow)} to ${formatCurrency(
                        report.metrics.estimatedValueHigh
                      )}`
                    : "Value estimate"
                }
              />
              <MetricTile
                label="Estimated Rent"
                value={formatCurrency(report.metrics?.estimatedRent)}
                hint={
                  report.metrics?.estimatedRentLow && report.metrics?.estimatedRentHigh
                    ? `${formatCurrency(report.metrics.estimatedRentLow)} to ${formatCurrency(
                        report.metrics.estimatedRentHigh
                      )}`
                    : "Monthly estimate"
                }
              />
              <MetricTile
                label="Gross Yield"
                value={formatPercent(report.metrics?.grossYieldPercent)}
                hint={`Generated ${formatDate(report.generatedAt)}`}
              />
            </div>

            <SectionCard
              title={report.ai?.headline || "AI Investment Memo"}
              subtitle="A quick investor-facing readout generated from the property data returned today."
              action={
                report.ai?.confidence ? (
                  <span className="rounded-full bg-verdigris-50 px-3 py-1 text-sm font-semibold text-verdigris-700">
                    {report.ai.confidence} confidence
                  </span>
                ) : null
              }
            >
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Executive Summary
                    </h4>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">
                      {report.ai?.executiveSummary || "No AI summary was generated for this run."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Ownership Takeaway
                    </h4>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">
                      {report.ai?.ownershipTakeaway || "Ownership insight unavailable."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Valuation Takeaway
                    </h4>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">
                      {report.ai?.valuationTakeaway || "Valuation insight unavailable."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Rental Takeaway
                    </h4>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">
                      {report.ai?.rentalTakeaway || "Rental insight unavailable."}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Strengths
                    </h4>
                    {report.ai?.strengths?.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-ink-600">
                        {report.ai.strengths.map((item) => (
                          <li key={item} className="rounded-[18px] bg-sand-50 px-4 py-3">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-ink-500">No strengths were generated.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Risks
                    </h4>
                    {report.ai?.risks?.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-ink-600">
                        {report.ai.risks.map((item) => (
                          <li key={item} className="rounded-[18px] bg-sand-50 px-4 py-3">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-ink-500">No risk notes were generated.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                      Next Steps
                    </h4>
                    {report.ai?.nextSteps?.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-ink-600">
                        {report.ai.nextSteps.map((item) => (
                          <li key={item} className="rounded-[18px] bg-sand-50 px-4 py-3">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-ink-500">No next steps were generated.</p>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Overview" subtitle="Core property facts and transaction context.">
                <FieldGrid items={buildOverviewItems(report)} />
              </SectionCard>

              <SectionCard title="Ownership" subtitle="Owner profile and mailing details.">
                <FieldGrid items={buildOwnershipItems(report)} />
              </SectionCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title={saleListingSection.title} subtitle="What the current sale-side data shows.">
                <FieldGrid items={saleListingSection.items} />
              </SectionCard>

              <SectionCard title={rentalListingSection.title} subtitle="Rental-side listing signals, where available.">
                <FieldGrid items={rentalListingSection.items} />
              </SectionCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Tax And Assessment" subtitle="Latest assessment first, with historical context when available.">
                {assessmentHistory.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-sand-50 text-left text-ink-500">
                        <tr>
                          <th className="p-3 font-semibold">Year</th>
                          <th className="p-3 font-semibold">Assessed Value</th>
                          <th className="p-3 font-semibold">Land</th>
                          <th className="p-3 font-semibold">Improvements</th>
                          <th className="p-3 font-semibold">Tax Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {assessmentHistory.map((item) => (
                          <tr key={`${item.year}-${item.assessedValue}-${item.taxAmount}`}>
                            <td className="p-3 text-ink-700">{item.year || "—"}</td>
                            <td className="p-3 text-ink-700">{formatCurrency(item.assessedValue)}</td>
                            <td className="p-3 text-ink-700">{formatCurrency(item.landValue)}</td>
                            <td className="p-3 text-ink-700">{formatCurrency(item.improvementValue)}</td>
                            <td className="p-3 text-ink-700">{formatCurrency(item.taxAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-ink-500">No tax assessment history was returned for this address.</p>
                )}
              </SectionCard>

              <SectionCard title="Property Features" subtitle="Physical features surfaced from the property record.">
                {report.features?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {report.features.map((feature) => (
                      <span
                        key={`${feature.label}-${feature.value}`}
                        className="rounded-full bg-sand-50 px-3 py-2 text-sm text-ink-700"
                      >
                        {feature.label}: {String(feature.value)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-ink-500">No feature metadata was returned for this property.</p>
                )}
              </SectionCard>
            </div>

            <SectionCard title="Transfer History" subtitle="Latest recorded activity first.">
              {report.history?.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-sand-50 text-left text-ink-500">
                      <tr>
                        <th className="p-3 font-semibold">Date</th>
                        <th className="p-3 font-semibold">Event</th>
                        <th className="p-3 font-semibold">Price</th>
                        <th className="p-3 font-semibold">Buyer</th>
                        <th className="p-3 font-semibold">Seller</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {report.history.map((item) => (
                        <tr key={`${item.date}-${item.eventType}-${item.price}`}>
                          <td className="p-3 text-ink-700">{formatDate(item.date)}</td>
                          <td className="p-3 text-ink-700">{item.eventType || "—"}</td>
                          <td className="p-3 text-ink-700">{formatCurrency(item.price)}</td>
                          <td className="p-3 text-ink-700">{item.buyerName || "—"}</td>
                          <td className="p-3 text-ink-700">{item.sellerName || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-ink-500">No transfer history was returned for this property.</p>
              )}
            </SectionCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Comp Highlights" subtitle="Top sale comparables included in the report.">
                {report.compsSummary?.noResults ? (
                  <p className="text-sm text-ink-500">
                    No sale comps matched the active filters. You can widen the radius or time window in the comps tab.
                  </p>
                ) : compHighlights.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-sand-50 text-left text-ink-500">
                        <tr>
                          <th className="p-3 font-semibold">Address</th>
                          <th className="p-3 font-semibold">Sale Price</th>
                          <th className="p-3 font-semibold">Distance</th>
                          <th className="p-3 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {compHighlights.map((comp) => (
                          <tr key={`${comp.address}-${comp.saleDate}`}>
                            <td className="p-3 text-ink-700">{comp.address}</td>
                            <td className="p-3 text-ink-700">{formatCurrency(comp.salePrice)}</td>
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
                ) : (
                  <p className="text-sm text-ink-500">No comp highlights were returned for this property.</p>
                )}
              </SectionCard>

              <SectionCard title="Rent Comparables" subtitle="Nearby rental pricing returned with the rent estimate.">
                {rentComparables.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-sand-50 text-left text-ink-500">
                        <tr>
                          <th className="p-3 font-semibold">Address</th>
                          <th className="p-3 font-semibold">Rent</th>
                          <th className="p-3 font-semibold">Distance</th>
                          <th className="p-3 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {rentComparables.map((comp) => (
                          <tr key={`${comp.address}-${comp.listedDate}-${comp.rent}`}>
                            <td className="p-3 text-ink-700">{comp.address}</td>
                            <td className="p-3 text-ink-700">{formatCurrency(comp.rent)}</td>
                            <td className="p-3 text-ink-700">
                              {comp.distance !== null && comp.distance !== undefined
                                ? `${comp.distance.toFixed(2)} mi`
                                : "—"}
                            </td>
                            <td className="p-3 text-ink-700">{formatDate(comp.listedDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-ink-500">No rent comparables were returned for this property.</p>
                )}
              </SectionCard>
            </div>

            <SectionCard title="Sources" subtitle="Which data layers were available for this report run.">
              <div className="flex flex-wrap gap-2">
                {(report.sources || []).map((source) => (
                  <span
                    key={source.label}
                    className={`rounded-full px-3 py-2 text-sm ${
                      source.available
                        ? "bg-verdigris-50 text-verdigris-700"
                        : "bg-sand-50 text-ink-500"
                    }`}
                  >
                    {source.available ? "Included" : "Unavailable"}: {source.label}
                  </span>
                ))}
              </div>
            </SectionCard>
          </>
        ) : (
          <div className="section-card px-6 py-12 text-center">
            {isAnalyzing ? (
              <LoadingSpinner />
            ) : (
              <>
                <h3 className="text-xl font-semibold text-ink-900">No property analysis yet</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Run the full analysis to pull the richer property profile and AI memo for this
                  address.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyAnalysisWorkspace;
