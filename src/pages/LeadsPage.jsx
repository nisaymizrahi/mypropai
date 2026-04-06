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

const LeadCard = ({ lead, onClick, dragHandleProps }) => (
  <div
    {...dragHandleProps}
    role="button"
    tabIndex={0}
    className="w-full cursor-grab rounded-[16px] border border-ink-100 bg-white p-4 text-left transition hover:border-ink-200 active:cursor-grabbing"
    onClick={onClick}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
    }}
  >
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-semibold text-ink-900">{lead.address}</p>
      <span
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[lead.status] || 'bg-sand-100 text-ink-700'}`}
      >
        {lead.listingStatus || 'Lead'}
      </span>
    </div>
    <p className="mt-3 text-sm text-ink-500">
      {[lead.propertyType, lead.squareFootage ? `${lead.squareFootage} sqft` : null].filter(Boolean).join(' • ') || 'Property details pending'}
    </p>
    <p className="mt-1 text-sm text-ink-500">
      {[lead.bedrooms ? `${lead.bedrooms} bd` : null, lead.bathrooms ? `${lead.bathrooms} ba` : null].filter(Boolean).join(' • ')}
    </p>
    <div className="mt-4 rounded-[14px] bg-sand-50 px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">Next step</p>
      <p className="mt-2 text-sm font-medium text-ink-700">{lead.nextAction || 'No next action yet'}</p>
      <p className="mt-1 text-xs text-ink-500">{formatFollowUpDate(lead.followUpDate)}</p>
    </div>
    <div className="mt-4 flex items-center justify-between gap-3 text-xs">
      <span className="font-medium text-ink-500">
        {lead.sellerName || lead.sellerPhone || 'Seller contact pending'}
      </span>
      <span className="font-semibold text-verdigris-700">
        {lead.sellerAskingPrice ? formatCurrency(lead.sellerAskingPrice) : 'Ask TBD'}
      </span>
    </div>
  </div>
);

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
      toast.error('Failed to load the leads dashboard.');
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
        toast.success(`Lead moved to ${nextStatus}.`);
      } catch (error) {
        console.error('Failed to update lead status', error);
        setColumns(previousColumns);
        toast.error('Failed to update lead status.');
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
        toast.success(`Lead moved to ${destination.droppableId}.`);
      }
    } catch (error) {
      console.error('Failed to update lead status', error);
      toast.error('Failed to update lead status.');
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
      { value: 'all', label: 'All leads', count: allLeads.length },
      ...columnOrder.map((status) => ({
        value: status,
        label: status,
        count: columns[status]?.leads.length || 0,
      })),
    ],
    [allLeads.length, columns]
  );

  const portfolioSummary = useMemo(() => summarizeLeadPortfolio(allLeads), [allLeads]);

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
        Loading leads...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="surface-panel px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <span className="eyebrow">Lead pipeline</span>
            <h2 className="mt-4 font-display text-[2.4rem] leading-[0.96] text-ink-900">
              Turn every lead into an instant go or no-go decision.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-500 sm:text-base">
              Fliprop now surfaces profit, ROI, risk, and AI judgment at a glance so your team can
              scan the pipeline like a premium acquisitions desk instead of a spreadsheet backlog.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={openUnifiedLeadCreator} className="primary-action">
                <PlusIcon className="h-4 w-4" />
                Add property
              </button>
              <button
                type="button"
                onClick={() => navigate('/market-search')}
                className="secondary-action"
              >
                <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                Browse market
              </button>
            </div>
          </div>

          {featuredAnalysis ? (
            <div className="grid gap-4">
              <DealScoreCard
                score={featuredAnalysis.score}
                verdict={featuredAnalysis.verdict}
                title="Best live signal"
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
            </div>
          ) : (
            <div className="section-card p-5">
              <p className="text-sm text-ink-500">Add a few deals to unlock the live AI summary view.</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Average deal score"
          value={`${Math.round(portfolioSummary.averageScore || 0)}/100`}
          detail="A blended signal across spread, comp support, and underwriting risk."
          eyebrow="Signal"
          icon={SparklesIcon}
          tone="success"
          progress={portfolioSummary.averageScore || 0}
        />
        <DashboardStatCard
          title="Modeled ROI"
          value={formatDealPercent(portfolioSummary.averageROI || 0)}
          detail="Average projected return across the active lead set."
          eyebrow="Returns"
          icon={ArrowTrendingUpIcon}
          tone="neutral"
          progress={Math.min(Math.max(portfolioSummary.averageROI || 0, 0), 100)}
        />
        <DashboardStatCard
          title="Profit pool"
          value={formatDealCompactCurrency(portfolioSummary.profitPool || 0)}
          detail="Total modeled upside across the pipeline under current assumptions."
          eyebrow="Upside"
          icon={BanknotesIcon}
          tone="success"
        />
        <DashboardStatCard
          title="Deals at risk"
          value={portfolioSummary.riskCounts.high || 0}
          detail="High-risk opportunities that need repricing, scope cuts, or a pause."
          eyebrow="Risk"
          icon={ExclamationTriangleIcon}
          tone={portfolioSummary.riskCounts.high ? 'danger' : 'neutral'}
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-display text-[2rem] leading-none text-ink-900">Potential properties</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Deal grid is tuned for scan speed. Pipeline board is still available when the team needs
            drag-and-drop stage management.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-ink-100 bg-white p-1">
          {leadViewModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.value;

            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setViewMode(mode.value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-ink-900 text-white shadow-sm' : 'text-ink-600 hover:bg-white'
                }`}
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
          <div className="relative w-full xl:max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search address, seller, source, status, or next action"
              className="w-full rounded-full border border-ink-100 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 outline-none transition focus:border-verdigris-300 focus:ring-4 focus:ring-verdigris-100/60"
            />
          </div>
          <div className="rounded-full border border-ink-100 bg-white px-4 py-2 text-sm font-medium text-ink-600">
            Showing {visibleAnalyses.length} of {allLeads.length}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusFilters.map((filterOption) => (
            <button
              key={filterOption.value}
              type="button"
              onClick={() => setStatusFilter(filterOption.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                statusFilter === filterOption.value
                  ? 'bg-ink-900 text-white'
                  : 'bg-white text-ink-600 hover:bg-sand-50'
              }`}
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
              {allLeads.length === 0 ? 'No leads in the pipeline yet' : 'No leads match this view'}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              {allLeads.length === 0
                ? 'Add your first property to unlock AI deal scoring, risk flags, and premium scanning cards.'
                : 'Try a different search or stage filter to bring the right opportunities back into view.'}
            </p>
            <div className="mt-5 flex justify-center">
              <button type="button" onClick={openUnifiedLeadCreator} className="primary-action">
                <PlusIcon className="h-4 w-4" />
                Add first property
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="section-card p-5 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h4 className="font-display text-[1.8rem] leading-none text-ink-900">Pipeline board</h4>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Drag deals from one stage to the next and keep the acquisition team aligned on the real pipeline.
              </p>
            </div>
            <div className="rounded-full border border-ink-100 bg-white px-4 py-2 text-sm font-medium text-ink-600">
              {visibleLeads.length} visible lead{visibleLeads.length === 1 ? '' : 's'}
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
                          className="w-[19rem] flex-shrink-0 rounded-[16px] border border-ink-100 bg-sand-50/70 p-4"
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
                                    <div className="rounded-[14px] border border-ink-100 bg-white px-3 py-3">
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
                {allLeads.length === 0 ? 'No leads in the pipeline yet' : 'No leads match this board view'}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                {allLeads.length === 0
                  ? 'Add your first property to start tracking pricing, notes, and deal progress in one place.'
                  : 'Try a different search term or stage filter to bring deals back into the board.'}
              </p>
              <div className="mt-5 flex justify-center">
                <button type="button" onClick={openUnifiedLeadCreator} className="primary-action">
                  <PlusIcon className="h-4 w-4" />
                  Add first property
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
