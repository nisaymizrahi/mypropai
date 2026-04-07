import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  QueueListIcon,
  SparklesIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';

import AISummaryCard from '../components/AISummaryCard';
import DashboardStatCard from '../components/DashboardStatCard';
import DealCard from '../components/DealCard';
import DealScoreCard from '../components/DealScoreCard';
import { getLeads, updateLead } from '../utils/api';
import {
  formatDealCompactCurrency,
  formatDealPercent,
  summarizeLeadPortfolio,
} from '../utils/dealIntelligence';
import { buildLaunchProgress, getLeadPropertyKey } from '../utils/launchProgress';

const columnOrder = ['Potential', 'Analyzing', 'Offer Made', 'Under Contract', 'Closed - Won', 'Closed - Lost'];

const statusStyles = {
  Potential: 'bg-sand-100 text-ink-700',
  Analyzing: 'bg-verdigris-50 text-verdigris-700',
  'Offer Made': 'bg-clay-50 text-clay-700',
  'Under Contract': 'bg-ink-100 text-ink-700',
  'Closed - Won': 'bg-verdigris-100 text-verdigris-800',
  'Closed - Lost': 'bg-clay-100 text-clay-800',
};

const leadViewModes = [
  { value: 'grid', label: 'Deal grid', icon: Squares2X2Icon },
  { value: 'board', label: 'Pipeline board', icon: QueueListIcon },
];

const buildLeadColumns = (leadsData = []) => {
  const initialColumns = columnOrder.reduce((accumulator, column) => {
    accumulator[column] = { id: column, title: column, leads: [] };
    return accumulator;
  }, {});

  leadsData.forEach((lead) => {
    if (initialColumns[lead.status]) {
      initialColumns[lead.status].leads.push(lead);
    } else {
      initialColumns.Potential.leads.push({ ...lead, status: 'Potential' });
    }
  });

  return initialColumns;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatFollowUpDate = (value) => {
  if (!value) return 'No follow-up date';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No follow-up date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const buildLeadSearchText = (lead) =>
  [
    lead.address,
    lead.propertyType,
    lead.listingStatus,
    lead.sellerName,
    lead.sellerPhone,
    lead.sellerEmail,
    lead.leadSource,
    lead.occupancyStatus,
    lead.nextAction,
    lead.notes,
    lead.status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const LeadCard = ({ lead, onClick, dragHandleProps }) => {
  const propertyFacts = [
    lead.propertyType,
    lead.squareFootage ? `${Number(lead.squareFootage).toLocaleString()} sqft` : null,
    lead.bedrooms ? `${lead.bedrooms} bd` : null,
    lead.bathrooms ? `${lead.bathrooms} ba` : null,
  ].filter(Boolean);

  const secondaryFacts = [
    lead.leadSource ? `Source: ${lead.leadSource}` : null,
    lead.occupancyStatus && lead.occupancyStatus !== 'Unknown'
      ? `Occupancy: ${lead.occupancyStatus}`
      : null,
  ].filter(Boolean);

  return (
    <div
      {...dragHandleProps}
      role="button"
      tabIndex={0}
      className="w-full cursor-grab rounded-[24px] border border-white/80 bg-white/95 p-4 text-left shadow-[0_20px_45px_-32px_rgba(15,23,42,0.45)] transition duration-200 hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-soft active:cursor-grabbing"
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[lead.status] || 'bg-sand-100 text-ink-700'}`}
            >
              {lead.status || 'Potential'}
            </span>
            {lead.listingStatus ? (
              <span className="rounded-full bg-mist-100 px-3 py-1 text-[11px] font-medium text-ink-600">
                {lead.listingStatus}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-[15px] font-semibold leading-6 text-ink-900">
            {lead.address || 'Address pending'}
          </p>
          <p className="mt-2 text-sm text-ink-500">
            {propertyFacts.join(' • ') || 'Property details pending'}
          </p>
        </div>
        <div className="rounded-[18px] bg-mist-50 px-3 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Ask</p>
          <p className="mt-2 text-sm font-semibold text-ink-900">
            {lead.sellerAskingPrice ? formatCurrency(lead.sellerAskingPrice) : 'TBD'}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-mist-200 bg-mist-50/90 px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
          Next move
        </p>
        <p className="mt-2 text-sm font-medium text-ink-800">
          {lead.nextAction || 'No next action set yet'}
        </p>
        <p className="mt-2 text-xs text-ink-500">{formatFollowUpDate(lead.followUpDate)}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap gap-2">
          {secondaryFacts.length ? (
            secondaryFacts.map((fact) => (
              <span
                key={fact}
                className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-ink-500 ring-1 ring-ink-100"
              >
                {fact}
              </span>
            ))
          ) : (
            <span className="text-xs font-medium text-ink-500">
              {lead.sellerName || lead.sellerPhone || 'Seller contact pending'}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-verdigris-700">
          {getLeadPropertyKey(lead) && lead.inPropertyWorkspace ? 'In workspace' : 'Pipeline'}
        </span>
      </div>
    </div>
  );
};

const LeadsPage = () => {
  const navigate = useNavigate();
  const [columns, setColumns] = useState(() => buildLeadColumns());
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isUpdatingLeadId, setIsUpdatingLeadId] = useState('');

  const openUnifiedLeadCreator = () => {
    navigate('/properties/new?workspace=pipeline');
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const leadsData = await getLeads();
      setColumns(buildLeadColumns(leadsData));
    } catch (error) {
      console.error('Failed to fetch leads data', error);
      toast.error('Failed to load deals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const moveLeadInColumns = useCallback((currentColumns, leadId, nextStatus) => {
    const normalizedStatus = columnOrder.includes(nextStatus) ? nextStatus : 'Potential';
    const nextColumns = columnOrder.reduce((accumulator, columnId) => {
      accumulator[columnId] = {
        ...currentColumns[columnId],
        leads: [...(currentColumns[columnId]?.leads || [])],
      };
      return accumulator;
    }, {});

    let movedLead = null;

    columnOrder.forEach((columnId) => {
      nextColumns[columnId].leads = nextColumns[columnId].leads.filter((lead) => {
        if (lead._id === leadId) {
          movedLead = lead;
          return false;
        }
        return true;
      });
    });

    if (!movedLead) {
      return currentColumns;
    }

    nextColumns[normalizedStatus].leads.unshift({ ...movedLead, status: normalizedStatus });
    return nextColumns;
  }, []);

  const allLeads = useMemo(
    () => columnOrder.flatMap((columnId) => columns[columnId]?.leads || []),
    [columns]
  );

  const handleLeadStatusChange = useCallback(
    async (leadId, nextStatus) => {
      const previousColumns = columns;
      const currentLead = allLeads.find((lead) => lead._id === leadId);

      if (!currentLead || currentLead.status === nextStatus) {
        return;
      }

      setColumns((current) => moveLeadInColumns(current, leadId, nextStatus));
      setIsUpdatingLeadId(leadId);

      try {
        await updateLead(leadId, { status: nextStatus });
        toast.success(`Deal moved to ${nextStatus}.`);
      } catch (error) {
        console.error('Failed to update lead status', error);
        setColumns(previousColumns);
        toast.error('Failed to update deal status.');
      } finally {
        setIsUpdatingLeadId('');
      }
    },
    [allLeads, columns, moveLeadInColumns]
  );

  const handleOnDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const sourceLeads = [...sourceColumn.leads];
    const [movedLead] = sourceLeads.splice(source.index, 1);

    const nextColumns = { ...columns };
    nextColumns[source.droppableId] = { ...sourceColumn, leads: sourceLeads };

    if (source.droppableId === destination.droppableId) {
      nextColumns[source.droppableId].leads.splice(destination.index, 0, movedLead);
    } else {
      const destLeads = [...destColumn.leads];
      destLeads.splice(destination.index, 0, { ...movedLead, status: destination.droppableId });
      nextColumns[destination.droppableId] = { ...destColumn, leads: destLeads };
    }

    setColumns(nextColumns);

    try {
      if (source.droppableId !== destination.droppableId) {
        setIsUpdatingLeadId(draggableId);
        await updateLead(draggableId, { status: destination.droppableId });
        toast.success(`Deal moved to ${destination.droppableId}.`);
      }
    } catch (error) {
      console.error('Failed to update lead status', error);
      toast.error('Failed to update deal status.');
      fetchData();
    } finally {
      setIsUpdatingLeadId('');
    }
  };

  const visibleLeads = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    return allLeads.filter((lead) => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return buildLeadSearchText(lead).includes(normalizedQuery);
    });
  }, [allLeads, searchValue, statusFilter]);

  const statusFilters = useMemo(
    () => [
      { value: 'all', label: 'All deals', count: allLeads.length },
      ...columnOrder.map((status) => ({
        value: status,
        label: status,
        count: columns[status]?.leads.length || 0,
      })),
    ],
    [allLeads.length, columns]
  );

  const portfolioSummary = useMemo(() => summarizeLeadPortfolio(allLeads), [allLeads]);
  const launchProgress = useMemo(() => buildLaunchProgress(allLeads), [allLeads]);
  const projectWorkspaceCount = useMemo(
    () =>
      allLeads.filter((lead) => Boolean(getLeadPropertyKey(lead) && lead.inPropertyWorkspace)).length,
    [allLeads]
  );
  const showLaunchProgress = launchProgress.completedCount < launchProgress.steps.length;

  const visibleAnalyses = useMemo(
    () =>
      visibleLeads
        .map((lead) => {
          const analysis = portfolioSummary.analyses.find((item) => item.id === lead._id);
          return { lead, analysis };
        })
        .filter((entry) => entry.analysis)
        .sort((left, right) => right.analysis.score - left.analysis.score),
    [portfolioSummary.analyses, visibleLeads]
  );

  const featuredAnalysis = visibleAnalyses[0]?.analysis || portfolioSummary.featured;
  const portfolioSize = Math.max(portfolioSummary.count || 0, 1);

  const visibleLeadIdSet = useMemo(
    () => new Set(visibleLeads.map((lead) => lead._id)),
    [visibleLeads]
  );

  const filteredBoardColumns = useMemo(
    () =>
      columnOrder.reduce((accumulator, columnId) => {
        accumulator[columnId] = {
          ...columns[columnId],
          leads: (columns[columnId]?.leads || []).filter((lead) => visibleLeadIdSet.has(lead._id)),
        };
        return accumulator;
      }, {}),
    [columns, visibleLeadIdSet]
  );

  if (loading) {
        return (
          <div className="section-card px-6 py-10 text-center text-ink-500">
        Loading deals...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="surface-panel-strong overflow-hidden px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <span className="eyebrow">Deal -&gt; analysis -&gt; Property Workspace</span>
            <h2 className="mt-4 font-display text-[2.4rem] leading-[0.96] text-ink-900">
              Keep the acquisition path obvious.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-500 sm:text-base">
              Start with the deal, pressure-test the numbers fast, and move the winner into
              Property Workspace without rebuilding the record in spreadsheets, docs, and task apps.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={openUnifiedLeadCreator} className="primary-action">
                <PlusIcon className="h-4 w-4" />
                Add deal
              </button>
              <button
                type="button"
                onClick={() => navigate(allLeads[0]?._id ? `/leads/${allLeads[0]._id}` : '/comps-report')}
                className="secondary-action"
              >
                <SparklesIcon className="mr-2 h-4 w-4" />
                Run comps report
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-ink-500">
              Market Search is still available when you want more inventory.{' '}
              <button
                type="button"
                onClick={() => navigate('/market-search')}
                className="font-semibold text-ink-700 underline underline-offset-4"
              >
                Open Market Search
              </button>
            </p>
          </div>

          <div className="grid gap-4">
            {showLaunchProgress ? (
              <div className="section-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
                      Pipeline setup
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink-900">
                      {launchProgress.completedCount}/{launchProgress.steps.length} steps completed
                    </h3>
                  </div>
                  <div className="rounded-full bg-sand-50 px-3 py-1 text-xs font-semibold text-ink-600 ring-1 ring-ink-100">
                    Launch
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {launchProgress.steps.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-[16px] border border-ink-100 bg-white px-4 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            item.complete ? 'bg-verdigris-600' : 'bg-ink-200'
                          }`}
                        />
                        <p className="text-sm font-medium text-ink-900">{item.label}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink-500">{item.detail}</p>
                    </div>
                  ))}
                </div>

                {launchProgress.nextAction ? (
                  <button
                    type="button"
                    onClick={() => navigate(launchProgress.nextAction.to)}
                    className="secondary-action mt-4 w-full justify-center"
                  >
                    {launchProgress.nextAction.label}
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="section-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
                Proof
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink-900">
                {featuredAnalysis
                  ? `${featuredAnalysis.address} is already decision-ready.`
                  : 'Your first report becomes the proof asset for the whole workflow.'}
              </h3>
              <p className="mt-4 text-sm leading-6 text-ink-600">
                {featuredAnalysis
                  ? `${featuredAnalysis.score}/100 score, ${formatDealPercent(
                      featuredAnalysis.roi
                    )} ROI, and ${formatDealCompactCurrency(
                      featuredAnalysis.profit
                    )} modeled upside stay attached to the deal and property record.`
                  : 'Once you run analysis, Fliprop keeps the verdict, ROI, and next recommendation attached to the same deal and property record.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100">
                  {allLeads.length} deal{allLeads.length === 1 ? '' : 's'}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100">
                  {portfolioSummary.analyses.length} scored deals
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-600 ring-1 ring-ink-100">
                  {projectWorkspaceCount} property workspace{projectWorkspaceCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {featuredAnalysis ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <DealScoreCard
            score={featuredAnalysis.score}
            verdict={featuredAnalysis.verdict}
            title="Featured decision signal"
            label={featuredAnalysis.address}
            detail={`${featuredAnalysis.tone.label} with ${formatDealPercent(
              featuredAnalysis.roi
            )} ROI and ${formatDealCompactCurrency(featuredAnalysis.profit)} upside.`}
            assetPath={featuredAnalysis.assetPaths.score}
            compact
          />
          <AISummaryCard
            verdict={featuredAnalysis.verdict}
            headline={featuredAnalysis.aiSummary.headline}
            detail={featuredAnalysis.aiSummary.detail}
            recommendation={featuredAnalysis.aiSummary.recommendation}
            confidenceLabel={featuredAnalysis.aiSummary.confidenceLabel}
            bullets={featuredAnalysis.aiSummary.bullets}
            assetPath={featuredAnalysis.assetPaths.verdict}
            compact
          />
        </section>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Move now"
          value={portfolioSummary.verdictCounts.good || 0}
          detail="Deals with the cleanest spread, strongest score, and lower modeled risk."
          eyebrow="Good deals"
          icon={SparklesIcon}
          tone="success"
          progress={(portfolioSummary.verdictCounts.good / portfolioSize) * 100}
        />
        <DashboardStatCard
          title="Watch closely"
          value={portfolioSummary.verdictCounts.medium || 0}
          detail="Opportunities that need a tighter buy price, cleaner scope, or firmer comps."
          eyebrow="Watch list"
          icon={ArrowTrendingUpIcon}
          tone="warning"
          progress={(portfolioSummary.verdictCounts.medium / portfolioSize) * 100}
        />
        <DashboardStatCard
          title="Reprice or pass"
          value={portfolioSummary.verdictCounts.bad || 0}
          detail="Deals that currently miss the return threshold under today’s assumptions."
          eyebrow="At risk"
          icon={ExclamationTriangleIcon}
          tone={portfolioSummary.verdictCounts.bad ? 'danger' : 'neutral'}
          progress={(portfolioSummary.verdictCounts.bad / portfolioSize) * 100}
        />
        <DashboardStatCard
          title="Modeled upside"
          value={formatDealCompactCurrency(portfolioSummary.profitPool || 0)}
          detail="Total modeled profit across the live pipeline before deeper diligence."
          eyebrow="Profit pool"
          icon={BanknotesIcon}
          tone="neutral"
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-display text-[2rem] leading-none text-ink-900">Deals</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Deal grid is tuned for fast go or no-go review. Pipeline board is still available when
            you need stage management.
          </p>
        </div>

        <div className="segmented-control">
          {leadViewModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.value;

            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setViewMode(mode.value)}
                className={`segmented-option ${isActive ? 'segmented-option-active' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      <section className="section-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="w-full xl:max-w-md">
            <div className="workspace-search-shell">
              <MagnifyingGlassIcon className="h-4 w-4 text-ink-400" />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search address, seller, source, status, or next action"
                className="workspace-search-input"
              />
            </div>
          </div>
          <div className="workspace-counter-pill">
            Showing {visibleLeads.length} of {allLeads.length} deals
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusFilters.map((filterOption) => (
            <button
              key={filterOption.value}
              type="button"
              onClick={() => setStatusFilter(filterOption.value)}
              className={`toolbar-chip ${statusFilter === filterOption.value ? 'toolbar-chip-active' : ''}`}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>
      </section>

      {viewMode === 'grid' ? (
        visibleAnalyses.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {visibleAnalyses.map(({ lead, analysis }) => (
              <DealCard
                key={lead._id}
                lead={lead}
                analysis={analysis}
                onOpen={() => navigate(`/leads/${lead._id}`)}
                onRunComps={() => navigate(`/leads/${lead._id}`)}
                onStatusChange={handleLeadStatusChange}
                statusOptions={columnOrder}
                isUpdating={isUpdatingLeadId === lead._id}
              />
            ))}
          </div>
        ) : (
          <div className="section-card px-6 py-12 text-center">
            <p className="text-lg font-semibold text-ink-900">
              {allLeads.length === 0 ? 'No deals in the pipeline yet' : 'No deals match this view'}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {allLeads.length === 0
                ? 'Add your first deal to unlock scoring, AI guidance, and the path into Property Workspace.'
                : 'Try a different search or stage filter to bring the right opportunities back into view.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={openUnifiedLeadCreator} className="primary-action">
                <PlusIcon className="h-4 w-4" />
                Add first deal
              </button>
              <button type="button" onClick={() => navigate('/market-search')} className="secondary-action">
                <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                Browse market map
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="surface-panel-strong overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h4 className="font-display text-[1.8rem] leading-none text-ink-900">Pipeline board</h4>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Drag deals from one stage to the next and keep the acquisition team aligned on the real pipeline.
              </p>
            </div>
            <div className="workspace-counter-pill">
              {visibleLeads.length} visible deal{visibleLeads.length === 1 ? '' : 's'}
            </div>
          </div>

          {visibleLeads.length > 0 ? (
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                {columnOrder.map((columnId) => {
                  const column = filteredBoardColumns[columnId];
                  return (
                    <Droppable key={column.id} droppableId={column.id}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="w-[19rem] flex-shrink-0 rounded-[24px] border border-ink-100 bg-mist-50/80 p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]"
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-ink-100 pb-3">
                            <h5 className="text-sm font-semibold text-ink-700">{column.title}</h5>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-500 ring-1 ring-ink-100">
                              {column.leads.length}
                            </span>
                          </div>
                          <div className="mt-4 min-h-[120px] space-y-3">
                            {column.leads.map((lead, index) => (
                              <Draggable key={lead._id} draggableId={lead._id} index={index}>
                                {(dragProvided) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    className="space-y-2"
                                  >
                                    <LeadCard
                                      lead={lead}
                                      dragHandleProps={dragProvided.dragHandleProps}
                                      onClick={() => navigate(`/leads/${lead._id}`)}
                                    />
                                    <div className="rounded-[18px] border border-ink-100 bg-white/95 px-3 py-3 shadow-[0_14px_35px_-32px_rgba(15,23,42,0.45)]">
                                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
                                        Move stage
                                      </p>
                                      <div className="mt-2 flex items-center gap-2">
                                        <select
                                          value={lead.status || 'Potential'}
                                          onClick={(event) => event.stopPropagation()}
                                          onChange={(event) => handleLeadStatusChange(lead._id, event.target.value)}
                                          disabled={isUpdatingLeadId === lead._id}
                                          className="auth-input py-2 text-sm"
                                        >
                                          {columnOrder.map((option) => (
                                            <option key={option} value={option}>
                                              {option}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </DragDropContext>
          ) : (
            <div className="mt-6 rounded-[16px] border border-dashed border-ink-200 bg-sand-50 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-ink-900">
                {allLeads.length === 0 ? 'No deals in the pipeline yet' : 'No deals match this board view'}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                {allLeads.length === 0
                  ? 'Add your first deal to start tracking pricing, notes, and deal progress in one place.'
                  : 'Try a different search term or stage filter to bring deals back into the board.'}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={openUnifiedLeadCreator} className="primary-action">
                  <PlusIcon className="h-4 w-4" />
                  Add first deal
                </button>
                <button type="button" onClick={() => navigate('/market-search')} className="secondary-action">
                  <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                  Browse market map
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
