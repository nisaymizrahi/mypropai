import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  PlusIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import { getLeads } from "../utils/api";
import {
  buildLeadIntelligence,
  formatDealCompactCurrency,
  formatDealCurrency,
  formatDealPercent,
} from "../utils/dealIntelligence";
import { getLeadPropertyKey } from "../utils/launchProgress";

const parseLeadIds = (search) => {
  const params = new URLSearchParams(search);
  const ids = (params.get("ids") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(ids)].slice(0, 4);
};

const formatFollowUpDate = (value) => {
  if (!value) {
    return "No follow-up set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No follow-up set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const compareVerdictClasses = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  bad: "bg-rose-50 text-rose-700 border-rose-200",
};

const metricCardClassName =
  "rounded-[18px] border border-ink-100 bg-slate-50/90 px-4 py-3";

const LeadsComparePage = ({ setDashboardHeaderConfig }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allLeads, setAllLeads] = useState([]);

  const selectedIds = useMemo(() => parseLeadIds(location.search), [location.search]);

  const openUnifiedLeadCreator = useCallback(() => {
    navigate("/properties/new?workspace=pipeline");
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadLeads = async () => {
      try {
        setLoading(true);
        const leads = await getLeads();
        if (isMounted) {
          setAllLeads(Array.isArray(leads) ? leads : []);
        }
      } catch (error) {
        console.error("Failed to load compare leads", error);
        toast.error("Failed to load deals for comparison.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLeads();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedAnalyses = useMemo(() => {
    const leadsById = allLeads.reduce((accumulator, lead) => {
      accumulator[lead._id] = lead;
      return accumulator;
    }, {});

    return selectedIds
      .map((leadId) => leadsById[leadId])
      .filter(Boolean)
      .map((lead) => buildLeadIntelligence(lead));
  }, [allLeads, selectedIds]);

  const removeFromCompare = useCallback(
    (leadId) => {
      const nextIds = selectedIds.filter((id) => id !== leadId);
      if (!nextIds.length) {
        navigate("/leads", { replace: true });
        return;
      }

      navigate(`/leads/compare?ids=${nextIds.join(",")}`, { replace: true });
    },
    [navigate, selectedIds]
  );

  useEffect(() => {
    if (!setDashboardHeaderConfig) {
      return undefined;
    }

    setDashboardHeaderConfig({
      floatingActions: (
        <>
          <button type="button" onClick={openUnifiedLeadCreator} className="secondary-action">
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Add Property</span>
          </button>
          <button
            type="button"
            disabled
            className="primary-action cursor-default"
            aria-label={`Comparing ${selectedIds.length} deals`}
          >
            <ArrowsRightLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Compare</span>
            <span className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-white/16 px-1.5 py-0.5 text-[11px] font-semibold">
              {selectedIds.length}
            </span>
          </button>
        </>
      ),
    });

    return () => setDashboardHeaderConfig(null);
  }, [openUnifiedLeadCreator, selectedIds.length, setDashboardHeaderConfig]);

  if (loading) {
    return (
      <div className="pt-16 md:pt-20">
        <div className="section-card px-6 py-10 text-center text-ink-500">
          Loading comparison...
        </div>
      </div>
    );
  }

  if (selectedAnalyses.length < 2) {
    return (
      <div className="space-y-5 pt-16 md:pt-20">
        <div className="surface-panel-strong px-6 py-12 text-center">
          <p className="text-lg font-semibold text-ink-900">Select at least two deals to compare</p>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Go back to the pipeline, choose two to four opportunities, then open compare again.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/leads" className="primary-action">
              <ArrowLeftIcon className="h-4 w-4" />
              Back to pipeline
            </Link>
            <button
              type="button"
              onClick={openUnifiedLeadCreator}
              className="secondary-action"
            >
              <PlusIcon className="h-4 w-4" />
              Add Property
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-16 md:pt-20">
      <section className="surface-panel-strong overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              to="/leads"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition hover:text-ink-900"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to pipeline
            </Link>
            <h1 className="mt-3 text-[1.85rem] font-semibold tracking-tight text-ink-900">
              Compare opportunities
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              Review pricing, exit assumptions, and the next move side by side without the extra
              dashboard noise.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedAnalyses.map((analysis) => (
              <button
                key={analysis.id}
                type="button"
                onClick={() => removeFromCompare(analysis.id)}
                className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-2 text-xs font-semibold text-ink-600 transition hover:border-ink-200 hover:text-ink-900"
              >
                <span className="max-w-[10rem] truncate">{analysis.address}</span>
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="overflow-x-auto pb-2">
        <div
          className="grid min-w-max gap-4"
          style={{
            gridTemplateColumns: `repeat(${selectedAnalyses.length}, minmax(20rem, 1fr))`,
          }}
        >
          {selectedAnalyses.map((analysis) => {
            const inWorkspace = Boolean(
              getLeadPropertyKey(analysis.lead) && analysis.lead.inPropertyWorkspace
            );

            return (
              <article
                key={analysis.id}
                className="surface-panel w-[20rem] overflow-hidden px-4 py-4 sm:w-auto sm:px-5 sm:py-5"
              >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                    compareVerdictClasses[analysis.verdict] || compareVerdictClasses.medium
                  }`}
                >
                  {analysis.score}/100
                </span>
                <span className="inline-flex items-center rounded-full border border-ink-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-500">
                  {analysis.status}
                </span>
                {inWorkspace ? (
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    In workspace
                  </span>
                ) : null}
              </div>

              <h2 className="mt-4 text-lg font-semibold tracking-tight text-ink-900">
                {analysis.address}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {[analysis.propertyType, analysis.bedrooms ? `${analysis.bedrooms} bd` : null, analysis.bathrooms ? `${analysis.bathrooms} ba` : null, analysis.squareFootage ? `${analysis.squareFootage.toLocaleString()} sqft` : null]
                  .filter(Boolean)
                  .join(" • ") || "Property details pending"}
              </p>

              <div className="mt-5 space-y-4">
                <section className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Snapshot
                  </h3>
                  <div className="space-y-2">
                    <div className={metricCardClassName}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Listing
                      </p>
                      <p className="mt-2 text-sm font-medium text-ink-800">
                        {analysis.listingStatus || "Off-market lead"}
                      </p>
                    </div>
                    <div className={metricCardClassName}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                        Seller
                      </p>
                      <p className="mt-2 text-sm font-medium text-ink-800">
                        {analysis.sellerName || "Seller info pending"}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Pricing
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className={metricCardClassName}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Ask</p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatDealCurrency(analysis.askingPrice)}
                      </p>
                    </div>
                    <div className={metricCardClassName}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Target</p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatDealCurrency(analysis.targetOffer)}
                      </p>
                    </div>
                    <div className={metricCardClassName}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">ARV</p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatDealCurrency(analysis.arv)}
                      </p>
                    </div>
                    <div className={metricCardClassName}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Rehab</p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatDealCurrency(analysis.rehabEstimate)}
                      </p>
                    </div>
                    <div className={metricCardClassName}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Profit</p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatDealCompactCurrency(analysis.profit)}
                      </p>
                    </div>
                    <div className={metricCardClassName}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">ROI</p>
                      <p className="mt-2 text-sm font-semibold text-ink-900">
                        {formatDealPercent(analysis.roi)}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Decision
                  </h3>
                  <div className={metricCardClassName}>
                    <p className="text-sm font-semibold text-ink-900">{analysis.tone.label}</p>
                    <p className="mt-2 text-sm leading-6 text-ink-600">
                      {analysis.aiSummary.detail}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-ink-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-500">
                        {analysis.confidenceLabel}
                      </span>
                      {analysis.riskFlags.slice(0, 2).map((flag) => (
                        <span
                          key={flag}
                          className="inline-flex items-center rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                    Next move
                  </h3>
                  <div className={metricCardClassName}>
                    <p className="text-sm font-medium text-ink-800">
                      {analysis.nextAction || "Set the next move"}
                    </p>
                    <p className="mt-2 text-xs text-ink-500">
                      Follow-up: {formatFollowUpDate(analysis.followUpDate)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/leads/${analysis.id}`)}
                        className="secondary-action"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        Open deal
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/leads/${analysis.id}`)}
                        className="primary-action"
                      >
                        <SparklesIcon className="h-4 w-4" />
                        Run comps
                      </button>
                    </div>
                  </div>
                </section>
              </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="rounded-[20px] border border-dashed border-ink-200 bg-white/72 px-4 py-4 text-sm text-ink-500">
        V1 compare stays frontend-only and uses the current pipeline data plus the same modeled
        deal intelligence already attached to each lead.
      </div>
    </div>
  );
};

export default LeadsComparePage;
