import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { analyzeLeadComps, getBidsForLead, getLeadDetails } from '../utils/api';
import BidsTab from '../components/BidsTab';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-16">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-turquoise" />
  </div>
);

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return '—';
  return date.toLocaleDateString();
};

const AnalysisStat = ({ label, value, hint }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    {hint ? <p className="mt-1 text-sm text-gray-500">{hint}</p> : null}
  </div>
);

const LeadSnapshot = ({ lead }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-brand-gray-900">Lead Workspace</h1>
        <p className="mt-1 text-lg text-brand-gray-500">{lead.address}</p>
      </div>
      <span className="rounded-full bg-brand-turquoise/10 px-3 py-1 text-sm font-semibold text-brand-turquoise">
        {lead.status}
      </span>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AnalysisStat label="Asking Price" value={formatCurrency(lead.sellerAskingPrice)} />
      <AnalysisStat
        label="Property Facts"
        value={[lead.propertyType, lead.squareFootage ? `${lead.squareFootage} sqft` : null].filter(Boolean).join(' • ') || '—'}
        hint={[lead.bedrooms ? `${lead.bedrooms} bd` : null, lead.bathrooms ? `${lead.bathrooms} ba` : null, lead.yearBuilt ? `Built ${lead.yearBuilt}` : null].filter(Boolean).join(' • ')}
      />
      <AnalysisStat
        label="Listing Status"
        value={lead.listingStatus || 'Not listed'}
        hint={lead.daysOnMarket ? `${lead.daysOnMarket} days on market` : 'No active listing found'}
      />
      <AnalysisStat
        label="Last Sale"
        value={formatCurrency(lead.lastSalePrice)}
        hint={formatDate(lead.lastSaleDate)}
      />
    </div>

    {lead.notes ? (
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{lead.notes}</p>
      </div>
    ) : null}
  </div>
);

const LeadDetailPage = () => {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filters, setFilters] = useState({
    radius: '1',
    saleDateMonths: '6',
    maxComps: '8',
  });

  const [bids, setBids] = useState([]);
  const [activeTab, setActiveTab] = useState('comps');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadData, bidsData] = await Promise.all([getLeadDetails(id), getBidsForLead(id)]);
      setLead(leadData);
      setBids(bidsData);

      if (leadData.compsAnalysis?.generatedAt) {
        setAnalysis({
          subject: leadData,
          summary: {
            saleCompCount: leadData.compsAnalysis.saleCompCount,
            estimatedValue: leadData.compsAnalysis.estimatedValue,
            estimatedValueLow: leadData.compsAnalysis.estimatedValueLow,
            estimatedValueHigh: leadData.compsAnalysis.estimatedValueHigh,
            averageSoldPrice: leadData.compsAnalysis.averageSoldPrice,
            medianSoldPrice: leadData.compsAnalysis.medianSoldPrice,
            averagePricePerSqft: leadData.compsAnalysis.averagePricePerSqft,
            medianPricePerSqft: leadData.compsAnalysis.medianPricePerSqft,
            askingPrice: leadData.sellerAskingPrice,
            askingPriceDelta: leadData.compsAnalysis.askingPriceDelta,
            recommendedOfferLow: leadData.compsAnalysis.recommendedOfferLow,
            recommendedOfferHigh: leadData.compsAnalysis.recommendedOfferHigh,
          },
          comps: leadData.compsAnalysis.recentComps || [],
          ai: leadData.compsAnalysis.report || null,
          generatedAt: leadData.compsAnalysis.generatedAt,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load lead data.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setError('');
    try {
      const result = await analyzeLeadComps(id, filters);
      setAnalysis(result);
      setLead((previous) => ({
        ...previous,
        ...result.subject,
      }));
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const askVsEstimateLabel = useMemo(() => {
    if (!analysis?.summary?.askingPriceDelta) return 'No ask vs estimate comparison yet';
    const delta = analysis.summary.askingPriceDelta;
    const direction = delta > 0 ? 'above' : 'below';
    return `${formatCurrency(Math.abs(delta))} ${direction} the estimated value`;
  }, [analysis]);

  if (loading) return <LoadingSpinner />;
  if (error && !lead) return <p className="p-4 text-center text-red-500">{error}</p>;
  if (!lead) return <p className="p-4 text-center">Lead not found.</p>;

  const TabButton = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`rounded-md px-3 py-2 text-sm font-semibold ${
        activeTab === tabName
          ? 'bg-brand-turquoise text-white'
          : 'text-brand-gray-600 hover:bg-brand-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Link to="/leads" className="text-sm text-brand-blue hover:underline">
          &larr; Back to Leads Pipeline
        </Link>
      </div>

      <LeadSnapshot lead={lead} />

      <div className="flex items-center space-x-2 rounded-lg border border-brand-gray-200 bg-white p-2 shadow-sm">
        <TabButton tabName="comps" label="AI Comps Analysis" />
        <TabButton tabName="bids" label="Bid Management" />
      </div>

      {activeTab === 'comps' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Run Comps Analysis</h3>
              <p className="mt-1 text-sm text-gray-500">
                Pull market comps around this property, generate pricing guidance, and summarize it with AI.
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium">Radius (miles)</label>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    name="radius"
                    value={filters.radius}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Comp freshness (months)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="saleDateMonths"
                    value={filters.saleDateMonths}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Max comps in report</label>
                  <input
                    type="number"
                    min="5"
                    max="12"
                    step="1"
                    name="maxComps"
                    value={filters.maxComps}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="w-full rounded-md bg-brand-turquoise py-2 font-semibold text-white disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Run AI Comps Report'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Property Context</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Address</dt>
                  <dd className="text-right font-medium text-gray-900">{lead.address}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Type</dt>
                  <dd className="text-right font-medium text-gray-900">{lead.propertyType || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Beds / Baths</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {lead.bedrooms || '—'} / {lead.bathrooms || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Sqft</dt>
                  <dd className="text-right font-medium text-gray-900">{lead.squareFootage || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Ask</dt>
                  <dd className="text-right font-medium text-gray-900">{formatCurrency(lead.sellerAskingPrice)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="space-y-6">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            ) : null}

            {analysis ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <AnalysisStat
                    label="Estimated Value"
                    value={formatCurrency(analysis.summary.estimatedValue)}
                    hint={
                      analysis.summary.estimatedValueLow && analysis.summary.estimatedValueHigh
                        ? `${formatCurrency(analysis.summary.estimatedValueLow)} to ${formatCurrency(analysis.summary.estimatedValueHigh)}`
                        : null
                    }
                  />
                  <AnalysisStat
                    label="Recommended Offer"
                    value={formatCurrency(analysis.summary.recommendedOfferHigh)}
                    hint={
                      analysis.summary.recommendedOfferLow
                        ? `${formatCurrency(analysis.summary.recommendedOfferLow)} to ${formatCurrency(analysis.summary.recommendedOfferHigh)}`
                        : null
                    }
                  />
                  <AnalysisStat
                    label="Median Comp Price"
                    value={formatCurrency(analysis.summary.medianSoldPrice)}
                    hint={`${analysis.summary.saleCompCount || 0} comps used`}
                  />
                  <AnalysisStat
                    label="Median Comp $ / Sqft"
                    value={analysis.summary.medianPricePerSqft ? `$${analysis.summary.medianPricePerSqft}` : '—'}
                    hint={askVsEstimateLabel}
                  />
                </div>

                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900">
                        {analysis.ai?.headline || 'AI Market Readout'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Generated {formatDate(analysis.generatedAt)}
                      </p>
                    </div>
                    {analysis.ai?.confidence ? (
                      <span className="rounded-full bg-brand-turquoise/10 px-3 py-1 text-sm font-semibold text-brand-turquoise">
                        {analysis.ai.confidence} confidence
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-5">
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Executive Summary</h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {analysis.ai?.executiveSummary || 'No AI summary was generated for this run.'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Pricing Recommendation</h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {analysis.ai?.pricingRecommendation || 'Pricing recommendation unavailable.'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Offer Strategy</h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {analysis.ai?.offerStrategy || 'Offer strategy unavailable.'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Risk Flags</h4>
                        {analysis.ai?.riskFlags?.length ? (
                          <ul className="mt-2 space-y-2 text-sm text-gray-700">
                            {analysis.ai.riskFlags.map((flag) => (
                              <li key={flag} className="rounded-lg bg-gray-50 px-3 py-2">
                                {flag}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-gray-500">No risk flags captured.</p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Next Steps</h4>
                        {analysis.ai?.nextSteps?.length ? (
                          <ul className="mt-2 space-y-2 text-sm text-gray-700">
                            {analysis.ai.nextSteps.map((step) => (
                              <li key={step} className="rounded-lg bg-gray-50 px-3 py-2">
                                {step}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-gray-500">No next steps captured.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900">Comparable Properties</h3>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-left text-gray-500">
                        <tr>
                          <th className="p-3 font-semibold">Address</th>
                          <th className="p-3 font-semibold">Comp Price</th>
                          <th className="p-3 font-semibold">$ / Sqft</th>
                          <th className="p-3 font-semibold">Sqft</th>
                          <th className="p-3 font-semibold">Beds/Baths</th>
                          <th className="p-3 font-semibold">Distance</th>
                          <th className="p-3 font-semibold">Comp Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {analysis.comps.map((comp) => (
                          <tr key={`${comp.address}-${comp.saleDate}`}>
                            <td className="p-3 font-medium text-gray-900">{comp.address}</td>
                            <td className="p-3 text-gray-700">{formatCurrency(comp.salePrice)}</td>
                            <td className="p-3 text-gray-700">
                              {comp.pricePerSqft ? `$${Math.round(comp.pricePerSqft)}` : '—'}
                            </td>
                            <td className="p-3 text-gray-700">{comp.squareFootage || '—'}</td>
                            <td className="p-3 text-gray-700">
                              {[comp.bedrooms ?? '—', comp.bathrooms ?? '—'].join(' / ')}
                            </td>
                            <td className="p-3 text-gray-700">
                              {comp.distance ? `${comp.distance.toFixed(2)} mi` : '—'}
                            </td>
                            <td className="p-3 text-gray-700">{formatDate(comp.saleDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
                {isAnalyzing ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-900">No comps report yet</h3>
                    <p className="mt-2 text-gray-500">
                      Run the report to pull sold comps, estimate value, and generate an AI recommendation.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bids' && <BidsTab leadId={id} bids={bids} onUpdate={fetchData} />}
    </div>
  );
};

export default LeadDetailPage;
