import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, Squares2X2Icon, TableCellsIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';

import WorkspaceDataTable from '../components/WorkspaceDataTable';
import { getLeadSummary, getLeads, updateLead } from '../utils/api';

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
  { value: 'list', label: 'List view', icon: TableCellsIcon },
  { value: 'board', label: 'Board view', icon: Squares2X2Icon },
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

const StatCard = ({ title, value }) => (
  <div className="metric-tile p-4">
    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">{title}</p>
    <p className="mt-3 text-lg font-medium text-ink-900">{value}</p>
  </div>
);

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
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('board');
  const [isUpdatingLeadId, setIsUpdatingLeadId] = useState('');

  const openUnifiedLeadCreator = () => {
    navigate('/properties/new');
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsData, summaryData] = await Promise.all([getLeads(), getLeadSummary()]);
      setSummary(summaryData);
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

  const refreshSummary = useCallback(async () => {
    try {
      const summaryData = await getLeadSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to refresh lead summary', error);
    }
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
        await refreshSummary();
        toast.success(`Lead moved to ${nextStatus}.`);
      } catch (error) {
        console.error('Failed to update lead status', error);
        setColumns(previousColumns);
        toast.error('Failed to update lead status.');
      } finally {
        setIsUpdatingLeadId('');
      }
    },
    [allLeads, columns, moveLeadInColumns, refreshSummary]
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
      await refreshSummary();
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

  const leadColumns = useMemo(
    () => [
      {
        id: 'lead',
        label: 'Lead',
        sortValue: (lead) => lead.address || '',
        render: (lead) => (
          <div>
            <button
              type="button"
              onClick={() => navigate(`/leads/${lead._id}`)}
              className="font-semibold text-ink-900 transition hover:text-verdigris-700"
            >
              {lead.address || 'Untitled lead'}
            </button>
            <p className="mt-1 text-sm text-ink-500">
              {[lead.propertyType, lead.squareFootage ? `${lead.squareFootage} sqft` : null]
                .filter(Boolean)
                .join(' • ') || 'Property details pending'}
            </p>
          </div>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        sortValue: (lead) => lead.status || '',
        render: (lead) => (
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[lead.status] || 'bg-sand-100 text-ink-700'}`}
            >
              {lead.status || 'Potential'}
            </span>
            <select
              value={lead.status || 'Potential'}
              onChange={(event) => handleLeadStatusChange(lead._id, event.target.value)}
              disabled={isUpdatingLeadId === lead._id}
              className="rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 outline-none transition focus:border-ink-300"
            >
              {columnOrder.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ),
      },
      {
        id: 'seller',
        label: 'Seller',
        sortValue: (lead) => lead.sellerName || lead.sellerEmail || lead.sellerPhone || '',
        render: (lead) => (
          <div>
            <p className="font-medium text-ink-800">{lead.sellerName || 'Seller contact pending'}</p>
            <p className="mt-1 text-sm text-ink-500">
              {[lead.sellerPhone, lead.sellerEmail].filter(Boolean).join(' • ') || 'Phone or email not added'}
            </p>
          </div>
        ),
      },
      {
        id: 'opportunity',
        label: 'Opportunity',
        sortValue: (lead) => Number(lead.sellerAskingPrice || lead.targetOffer || lead.arv || 0),
        render: (lead) => (
          <div>
            <p className="font-medium text-ink-800">Ask {formatCurrency(lead.sellerAskingPrice)}</p>
            <p className="mt-1 text-sm text-ink-500">
              {[
                lead.targetOffer ? `Target ${formatCurrency(lead.targetOffer)}` : null,
                lead.arv ? `ARV ${formatCurrency(lead.arv)}` : null,
              ]
                .filter(Boolean)
                .join(' • ') || 'Deal plan still forming'}
            </p>
          </div>
        ),
      },
      {
        id: 'followup',
        label: 'Follow-up',
        sortValue: (lead) =>
          lead.followUpDate ? new Date(lead.followUpDate).getTime() : Number.MAX_SAFE_INTEGER,
        render: (lead) => (
          <div>
            <p className="font-medium text-ink-800">{lead.nextAction || 'No next action yet'}</p>
            <p className="mt-1 text-sm text-ink-500">{formatFollowUpDate(lead.followUpDate)}</p>
          </div>
        ),
      },
      {
        id: 'actions',
        label: 'Open',
        align: 'right',
        render: (lead) => (
          <button
            type="button"
            onClick={() => navigate(`/leads/${lead._id}`)}
            className="inline-flex items-center rounded-full bg-ink-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-ink-800"
          >
            Open lead
          </button>
        ),
      },
    ],
    [handleLeadStatusChange, isUpdatingLeadId, navigate]
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <span className="eyebrow">Lead pipeline</span>
            <h2 className="mt-4 font-display text-[2.4rem] leading-[0.96] text-ink-900">
              Keep potential properties organized with less noise.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-500 sm:text-base">
              Review opportunities, drag them through the pipeline, or change stages directly from the lead without a bulky workflow getting in the way.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={openUnifiedLeadCreator} className="primary-action">
                <PlusIcon className="h-4 w-4" />
                Add property
              </button>
              <button
                type="button"
                onClick={() => setViewMode((current) => (current === 'list' ? 'board' : 'list'))}
                className="secondary-action"
              >
                {viewMode === 'list' ? 'Open drag board' : 'Open list view'}
              </button>
            </div>
          </div>

          <div className="section-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">
              Snapshot
            </p>
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between rounded-[14px] bg-white px-4 py-3 ring-1 ring-ink-100">
                <span className="text-sm font-medium text-ink-600">Total active leads</span>
                <span className="text-sm font-semibold text-ink-900">{summary?.totalLeads || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-sand-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Analyzing</span>
                <span className="text-sm font-semibold text-ink-900">{summary?.analyzingCount || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-clay-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Under contract</span>
                <span className="text-sm font-semibold text-ink-900">{summary?.underContractCount || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-[14px] bg-verdigris-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Closing ratio</span>
                <span className="text-sm font-semibold text-ink-900">
                  {summary ? `${summary.closingRatio.toFixed(1)}%` : '0.0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {summary ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Active Leads" value={summary.totalLeads} />
          <StatCard title="Analyzing" value={summary.analyzingCount} />
          <StatCard title="Under Contract" value={summary.underContractCount} />
          <StatCard title="Closing Ratio" value={`${summary.closingRatio.toFixed(1)}%`} />
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-display text-[2rem] leading-none text-ink-900">Potential properties</h3>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Board view is best for dragging deals between stages. List view also lets you change the stage directly from the status column.
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

      {viewMode === 'list' ? (
        <WorkspaceDataTable
          title="Leads"
          description="Search by address or seller, sort by status or follow-up date, and open the right deal without scanning large cards."
          columns={leadColumns}
          rows={visibleLeads}
          rowKey={(lead) => lead._id}
          defaultSort={{ columnId: 'followup', direction: 'asc' }}
          searchValue={searchValue}
          onSearchValueChange={setSearchValue}
          searchPlaceholder="Search address, seller, source, status, or next action"
          toolbarContent={
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
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

              <div className="rounded-full border border-ink-100 bg-white px-4 py-2 text-sm font-medium text-ink-600">
                Showing {visibleLeads.length} of {allLeads.length}
              </div>
            </div>
          }
          emptyTitle={allLeads.length === 0 ? 'No leads yet' : 'No leads match this view'}
          emptyDescription={
            allLeads.length === 0
              ? 'Add your first property to start building the pipeline.'
              : 'Try a different search term or status filter to surface the right opportunities.'
          }
          emptyActions={
            allLeads.length === 0 ? (
              <button type="button" onClick={openUnifiedLeadCreator} className="primary-action">
                <PlusIcon className="h-4 w-4" />
                Add first property
              </button>
            ) : null
          }
        />
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
              {allLeads.length} active lead{allLeads.length === 1 ? '' : 's'}
            </div>
          </div>

          {allLeads.length > 0 ? (
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                {columnOrder.map((columnId) => {
                  const column = columns[columnId];
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
              <p className="text-lg font-semibold text-ink-900">No leads in the pipeline yet</p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Add your first property to start tracking pricing, notes, and deal progress in one place.
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
