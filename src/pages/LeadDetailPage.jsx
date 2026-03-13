import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  analyzeLeadComps,
  createOneTimeCheckout,
  createSubscriptionCheckout,
  getBidsForLead,
  getBillingAccess,
  getLeadDetails,
  syncBillingCheckoutSession,
  updateLead,
} from '../utils/api';
import BidsTab from '../components/BidsTab';

const occupancyOptions = ['Unknown', 'Vacant', 'Owner Occupied', 'Tenant Occupied'];

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

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return '';
  return date.toISOString().slice(0, 10);
};

const buildWorkspaceForm = (lead = {}) => ({
  sellerName: lead.sellerName || '',
  sellerPhone: lead.sellerPhone || '',
  sellerEmail: lead.sellerEmail || '',
  leadSource: lead.leadSource || '',
  occupancyStatus: lead.occupancyStatus || 'Unknown',
  motivation: lead.motivation || '',
  targetOffer: lead.targetOffer ?? '',
  arv: lead.arv ?? '',
  rehabEstimate: lead.rehabEstimate ?? '',
  nextAction: lead.nextAction || '',
  followUpDate: formatDateInput(lead.followUpDate),
  notes: lead.notes || '',
});

const AnalysisStat = ({ label, value, hint }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    {hint ? <p className="mt-1 text-sm text-gray-500">{hint}</p> : null}
  </div>
);

const LeadSnapshot = ({ lead }) => {
  const exitValue = lead.arv ?? lead.compsAnalysis?.estimatedValue ?? null;
  const projectedSpread =
    exitValue !== null && lead.targetOffer !== null && lead.targetOffer !== undefined
      ? exitValue - lead.targetOffer - (lead.rehabEstimate || 0)
      : null;

  return (
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

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnalysisStat label="Asking Price" value={formatCurrency(lead.sellerAskingPrice)} />
        <AnalysisStat
          label="Target Offer"
          value={formatCurrency(lead.targetOffer)}
          hint={lead.nextAction || 'No acquisition plan saved yet'}
        />
        <AnalysisStat
          label="Exit Value"
          value={formatCurrency(exitValue)}
          hint={lead.arv ? 'Manual ARV saved' : lead.compsAnalysis?.estimatedValue ? 'Using latest AI estimate' : 'No exit value yet'}
        />
        <AnalysisStat
          label="Projected Spread"
          value={formatCurrency(projectedSpread)}
          hint={lead.rehabEstimate ? `After ${formatCurrency(lead.rehabEstimate)} rehab budget` : 'Add rehab budget for a truer spread'}
        />
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
      </div>

      {(lead.notes || lead.motivation || lead.sellerName || lead.targetOffer || lead.followUpDate) ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {(lead.notes || lead.motivation) && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Acquisition Notes</p>
              {lead.motivation ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">Seller motivation:</span> {lead.motivation}
                </p>
              ) : null}
              {lead.notes ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{lead.notes}</p>
              ) : null}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Seller Intel</p>
            <div className="mt-2 space-y-2 text-sm text-gray-700">
              <p>{lead.sellerName || 'Seller name not added yet'}</p>
              {lead.sellerPhone ? <p>{lead.sellerPhone}</p> : null}
              {lead.sellerEmail ? <p>{lead.sellerEmail}</p> : null}
              <p>{[lead.leadSource || null, lead.occupancyStatus || null].filter(Boolean).join(' • ') || 'Source and occupancy not set'}</p>
              <p>{lead.followUpDate ? `Follow up ${formatDate(lead.followUpDate)}` : 'No follow-up date scheduled'}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const LeadDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [workspaceForm, setWorkspaceForm] = useState(() => buildWorkspaceForm());
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [filters, setFilters] = useState({
    radius: '1',
    saleDateMonths: '6',
    maxComps: '8',
  });

  const [bids, setBids] = useState([]);
  const [activeTab, setActiveTab] = useState('comps');
  const [billingAccess, setBillingAccess] = useState(null);
  const [isBillingAccessLoading, setIsBillingAccessLoading] = useState(true);
  const [isStartingSubscription, setIsStartingSubscription] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

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

  useEffect(() => {
    if (lead) {
      setWorkspaceForm(buildWorkspaceForm(lead));
    }
  }, [lead]);

  const loadBillingAccess = useCallback(async () => {
    try {
      setIsBillingAccessLoading(true);
      const access = await getBillingAccess('comps_report', id);
      setBillingAccess(access);
    } catch (err) {
      setBillingAccess(null);
    } finally {
      setIsBillingAccessLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBillingAccess();
  }, [loadBillingAccess]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) {
      return;
    }

    const syncSession = async () => {
      try {
        await syncBillingCheckoutSession(sessionId);
        await refreshUser();
        await loadBillingAccess();
        toast.success('Comps report purchase confirmed.');
      } catch (err) {
        toast.error(err.message || 'We could not confirm the billing session yet.');
      }
    };

    syncSession();
  }, [loadBillingAccess, location.search, refreshUser]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleWorkspaceChange = (event) => {
    const { name, value } = event.target;
    setWorkspaceForm((previous) => ({ ...previous, [name]: value }));
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
      await loadBillingAccess();
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartSubscription = async () => {
    setIsStartingSubscription(true);
    try {
      const { url } = await createSubscriptionCheckout('pro');
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Could not start the Pro checkout.');
      setIsStartingSubscription(false);
    }
  };

  const handleBuyReport = async () => {
    setIsStartingCheckout(true);
    setError('');
    try {
      const result = await createOneTimeCheckout({ kind: 'comps_report', resourceId: id });
      if (result.alreadyUnlocked) {
        toast.success(result.msg || 'This lead already has a purchased report ready to run.');
        await loadBillingAccess();
        setIsStartingCheckout(false);
        return;
      }

      window.location.href = result.url;
    } catch (err) {
      setError(err.message || 'Could not start the report checkout.');
      setIsStartingCheckout(false);
    }
  };

  const askVsEstimateLabel = useMemo(() => {
    if (!analysis?.summary?.askingPriceDelta) return 'No ask vs estimate comparison yet';
    const delta = analysis.summary.askingPriceDelta;
    const direction = delta > 0 ? 'above' : 'below';
    return `${formatCurrency(Math.abs(delta))} ${direction} the estimated value`;
  }, [analysis]);

  const workingTargetOffer =
    workspaceForm.targetOffer === '' ? null : Number(workspaceForm.targetOffer);
  const workingRehabEstimate =
    workspaceForm.rehabEstimate === '' ? null : Number(workspaceForm.rehabEstimate);
  const workingExitValue =
    workspaceForm.arv === ''
      ? analysis?.summary?.estimatedValue ?? null
      : Number(workspaceForm.arv);
  const askingPrice = lead?.sellerAskingPrice;
  const askGap =
    askingPrice !== null && askingPrice !== undefined && workingTargetOffer !== null
      ? askingPrice - workingTargetOffer
      : null;
  const projectedSpread =
    workingExitValue !== null && workingTargetOffer !== null
      ? workingExitValue - workingTargetOffer - (workingRehabEstimate || 0)
      : null;

  const handleSaveWorkspace = async () => {
    setIsSavingWorkspace(true);
    setError('');
    try {
      const updatedLead = await updateLead(id, workspaceForm);
      setLead(updatedLead);
      setAnalysis((previous) =>
        previous
          ? {
              ...previous,
              subject: { ...previous.subject, ...updatedLead },
            }
          : previous
      );
      toast.success('Lead workspace saved.');
    } catch (err) {
      setError(err.message || 'Failed to save lead workspace.');
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleApplyAiOffer = () => {
    if (!analysis?.summary?.recommendedOfferHigh) return;
    setWorkspaceForm((previous) => ({
      ...previous,
      targetOffer: String(analysis.summary.recommendedOfferHigh),
    }));
    toast.success('AI recommended offer copied into the deal plan.');
  };

  if (loading) return <LoadingSpinner />;
  if (error && !lead) return <p className="p-4 text-center text-red-500">{error}</p>;
  if (!lead) return <p className="p-4 text-center">Lead not found.</p>;

  const propertyWorkspaceId =
    typeof lead.property === "object" ? lead.property?._id : lead.property;
  const propertyWorkspacePath = propertyWorkspaceId
    ? `/properties/${encodeURIComponent(propertyWorkspaceId)}`
    : "";

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/leads" className="text-sm text-brand-blue hover:underline">
          &larr; Back to Leads Pipeline
        </Link>
        {propertyWorkspacePath ? (
          <Link to={propertyWorkspacePath} className="secondary-action">
            Open Property Hub
          </Link>
        ) : null}
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
              <div className="mt-4 rounded-xl border border-brand-gray-200 bg-brand-gray-50 p-4 text-sm">
                {isBillingAccessLoading ? (
                  <p className="text-gray-500">Checking report access...</p>
                ) : billingAccess?.accessGranted ? (
                  <div className="space-y-2 text-brand-gray-700">
                    {billingAccess.accessSource === 'subscription_included' ? (
                      <>
                        <p>
                          Pro includes 10 comps reports per month. You have{' '}
                          <span className="font-semibold">
                            {billingAccess.monthlyIncludedRemainingCount}
                          </span>{' '}
                          included report
                          {billingAccess.monthlyIncludedRemainingCount === 1 ? '' : 's'} left this month.
                        </p>
                        <p className="text-xs text-gray-500">
                          Used {billingAccess.monthlyIncludedUsedCount} of {billingAccess.monthlyIncludedLimit}
                          {billingAccess.monthlyIncludedResetsAt
                            ? `, resets on ${formatDate(billingAccess.monthlyIncludedResetsAt)}`
                            : ''}
                          .
                        </p>
                      </>
                    ) : (
                      <p>This lead already has a paid report purchase ready to run.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-brand-gray-700">
                      {billingAccess?.hasActiveSubscription
                        ? `You have used all ${billingAccess.monthlyIncludedLimit || 10} included Pro comps reports for this month. Buy this lead's report one time to keep going.`
                        : "This report is a premium workflow. Upgrade to Pro for 10 included comps reports each month or buy this lead's report one time."}
                    </p>
                    <div className="flex flex-col gap-3">
                      {!billingAccess?.hasActiveSubscription ? (
                        <button
                          onClick={handleStartSubscription}
                          disabled={isStartingSubscription}
                          className="w-full rounded-md border border-brand-gray-300 px-4 py-2 font-semibold text-brand-gray-800 disabled:opacity-50"
                        >
                          {isStartingSubscription ? 'Redirecting...' : 'Upgrade to Pro'}
                        </button>
                      ) : null}
                      <button
                        onClick={handleBuyReport}
                        disabled={isStartingCheckout}
                        className="w-full rounded-md bg-brand-turquoise py-2 font-semibold text-white disabled:opacity-50"
                      >
                        {isStartingCheckout ? 'Redirecting...' : 'Buy One-Time Report'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
                  disabled={isAnalyzing || isBillingAccessLoading || !billingAccess?.accessGranted}
                  className="w-full rounded-md bg-brand-turquoise py-2 font-semibold text-white disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Run AI Comps Report'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">Shared Property Profile</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Address and physical specs are maintained from the property workspace.
                  </p>
                </div>
                {propertyWorkspacePath ? (
                  <Link to={propertyWorkspacePath} className="secondary-action">
                    Open Property Hub
                  </Link>
                ) : null}
              </div>
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

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">Seller &amp; Deal Plan</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Keep your contact notes, offer strategy, and follow-up plan on the lead itself.
                  </p>
                </div>
                {analysis?.summary?.recommendedOfferHigh ? (
                  <button
                    type="button"
                    onClick={handleApplyAiOffer}
                    className="rounded-md border border-brand-gray-300 px-3 py-2 text-xs font-semibold text-brand-gray-700"
                  >
                    Use AI Offer
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Target Gap</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">{formatCurrency(askGap)}</p>
                  <p className="mt-1 text-xs text-gray-500">Ask minus target offer</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Spread Preview</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">{formatCurrency(projectedSpread)}</p>
                  <p className="mt-1 text-xs text-gray-500">Exit value less target offer and rehab</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Next Follow-Up</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">{workspaceForm.followUpDate ? formatDate(workspaceForm.followUpDate) : '—'}</p>
                  <p className="mt-1 text-xs text-gray-500">{workspaceForm.nextAction || 'No next action yet'}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Seller name</label>
                  <input
                    type="text"
                    name="sellerName"
                    value={workspaceForm.sellerName}
                    onChange={handleWorkspaceChange}
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Lead source</label>
                  <input
                    type="text"
                    name="leadSource"
                    value={workspaceForm.leadSource}
                    onChange={handleWorkspaceChange}
                    placeholder="Agent, direct mail, referral..."
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Seller phone</label>
                  <input
                    type="text"
                    name="sellerPhone"
                    value={workspaceForm.sellerPhone}
                    onChange={handleWorkspaceChange}
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Seller email</label>
                  <input
                    type="email"
                    name="sellerEmail"
                    value={workspaceForm.sellerEmail}
                    onChange={handleWorkspaceChange}
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Occupancy</label>
                  <select
                    name="occupancyStatus"
                    value={workspaceForm.occupancyStatus}
                    onChange={handleWorkspaceChange}
                    className="mt-1 block w-full rounded-md border p-2"
                  >
                    {occupancyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Next action</label>
                  <input
                    type="text"
                    name="nextAction"
                    value={workspaceForm.nextAction}
                    onChange={handleWorkspaceChange}
                    placeholder="Call seller, request rehab bid..."
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Target offer</label>
                  <input
                    type="number"
                    name="targetOffer"
                    value={workspaceForm.targetOffer}
                    onChange={handleWorkspaceChange}
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Follow-up date</label>
                  <input
                    type="date"
                    name="followUpDate"
                    value={workspaceForm.followUpDate}
                    onChange={handleWorkspaceChange}
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">ARV / exit value</label>
                  <input
                    type="number"
                    name="arv"
                    value={workspaceForm.arv}
                    onChange={handleWorkspaceChange}
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Rehab estimate</label>
                  <input
                    type="number"
                    name="rehabEstimate"
                    value={workspaceForm.rehabEstimate}
                    onChange={handleWorkspaceChange}
                    className="mt-1 block w-full rounded-md border p-2"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium">Seller motivation</label>
                <textarea
                  rows="3"
                  name="motivation"
                  value={workspaceForm.motivation}
                  onChange={handleWorkspaceChange}
                  placeholder="Why is this seller likely to move, negotiate, or close quickly?"
                  className="mt-1 block w-full rounded-md border p-2"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium">Notes</label>
                <textarea
                  rows="4"
                  name="notes"
                  value={workspaceForm.notes}
                  onChange={handleWorkspaceChange}
                  placeholder="Anything else the acquisitions team should remember about this lead..."
                  className="mt-1 block w-full rounded-md border p-2"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveWorkspace}
                disabled={isSavingWorkspace}
                className="mt-5 w-full rounded-md bg-brand-gray-900 py-2 font-semibold text-white disabled:opacity-50"
              >
                {isSavingWorkspace ? 'Saving workspace...' : 'Save Lead Workspace'}
              </button>
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
                      Run the report to pull comparable properties, estimate value, and generate an AI recommendation.
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
