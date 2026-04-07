import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  QueueListIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import toast from "react-hot-toast";

import {
  PipelineBoardCard,
  PipelineDealListItem,
} from "../components/PipelineDealViews";
import { getLeads, updateLead } from "../utils/api";
import { buildLeadIntelligence } from "../utils/dealIntelligence";
import { getLeadPropertyKey } from "../utils/launchProgress";

const columnOrder = [
  "Potential",
  "Analyzing",
  "Offer Made",
  "Under Contract",
  "Closed - Won",
  "Closed - Lost",
];

const CLOSED_STATUSES = new Set(["Closed - Won", "Closed - Lost"]);
const OFFER_AND_CONTRACT_STATUSES = new Set(["Offer Made", "Under Contract"]);
const ANALYZING_STATUSES = new Set(["Potential", "Analyzing"]);

const viewModes = [
  { value: "list", label: "List", icon: QueueListIcon },
  { value: "board", label: "Board", icon: Squares2X2Icon },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "follow-up", label: "Follow-up soonest" },
  { value: "score", label: "Highest score" },
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
      initialColumns.Potential.leads.push({ ...lead, status: "Potential" });
    }
  });

  return initialColumns;
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
    .join(" ")
    .toLowerCase();

const getLeadTimestamp = (lead) =>
  new Date(lead.updatedAt || lead.createdAt || 0).getTime();

const isDueTodayOrEarlier = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return true;
  }

  const normalizedLeadDate = new Date(date);
  normalizedLeadDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return normalizedLeadDate.getTime() <= today.getTime();
};

const needsAction = (lead) =>
  !CLOSED_STATUSES.has(lead.status) &&
  (!lead.nextAction?.trim() || !lead.followUpDate || isDueTodayOrEarlier(lead.followUpDate));

const matchesSmartTab = (lead, tabValue) => {
  switch (tabValue) {
    case "needs-action":
      return needsAction(lead);
    case "analyzing":
      return ANALYZING_STATUSES.has(lead.status) && !needsAction(lead);
    case "offer-contract":
      return OFFER_AND_CONTRACT_STATUSES.has(lead.status);
    case "closed":
      return CLOSED_STATUSES.has(lead.status);
    case "all":
    default:
      return true;
  }
};

const smartTabDefinitions = [
  { value: "all", label: "All" },
  { value: "needs-action", label: "Needs Action" },
  { value: "analyzing", label: "Analyzing" },
  { value: "offer-contract", label: "Offer & Contract" },
  { value: "closed", label: "Closed" },
];

const LeadsPage = ({ setDashboardHeaderConfig }) => {
  const navigate = useNavigate();
  const [columns, setColumns] = useState(() => buildLeadColumns());
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [sortValue, setSortValue] = useState("newest");
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [isUpdatingLeadId, setIsUpdatingLeadId] = useState("");
  const [secondaryFilters, setSecondaryFilters] = useState({
    leadSource: "all",
    listingStatus: "all",
    workspaceState: "all",
  });

  const openUnifiedLeadCreator = useCallback(() => {
    navigate("/properties/new?workspace=pipeline");
  }, [navigate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const leadsData = await getLeads();
      setColumns(buildLeadColumns(leadsData));
    } catch (error) {
      console.error("Failed to fetch leads data", error);
      toast.error("Failed to load the pipeline.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allLeads = useMemo(
    () => columnOrder.flatMap((columnId) => columns[columnId]?.leads || []),
    [columns]
  );

  const analysisById = useMemo(
    () =>
      allLeads.reduce((accumulator, lead) => {
        accumulator[lead._id] = buildLeadIntelligence(lead);
        return accumulator;
      }, {}),
    [allLeads]
  );

  useEffect(() => {
    setSelectedLeadIds((current) =>
      current.filter((leadId) => allLeads.some((lead) => lead._id === leadId))
    );
  }, [allLeads]);

  const moveLeadInColumns = useCallback((currentColumns, leadId, nextStatus) => {
    const normalizedStatus = columnOrder.includes(nextStatus) ? nextStatus : "Potential";
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
        console.error("Failed to update lead status", error);
        setColumns(previousColumns);
        toast.error("Failed to update deal status.");
      } finally {
        setIsUpdatingLeadId("");
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
      console.error("Failed to update lead status", error);
      toast.error("Failed to update deal status.");
      fetchData();
    } finally {
      setIsUpdatingLeadId("");
    }
  };

  const smartTabs = useMemo(
    () =>
      smartTabDefinitions.map((tab) => ({
        ...tab,
        count: allLeads.filter((lead) => matchesSmartTab(lead, tab.value)).length,
      })),
    [allLeads]
  );

  const leadSourceOptions = useMemo(
    () =>
      [...new Set(allLeads.map((lead) => lead.leadSource).filter(Boolean))].sort((left, right) =>
        left.localeCompare(right)
      ),
    [allLeads]
  );

  const listingStatusOptions = useMemo(
    () =>
      [...new Set(allLeads.map((lead) => lead.listingStatus).filter(Boolean))].sort((left, right) =>
        left.localeCompare(right)
      ),
    [allLeads]
  );

  const visibleLeads = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    return allLeads.filter((lead) => {
      if (!matchesSmartTab(lead, activeTab)) {
        return false;
      }

      if (
        secondaryFilters.leadSource !== "all" &&
        (lead.leadSource || "") !== secondaryFilters.leadSource
      ) {
        return false;
      }

      if (
        secondaryFilters.listingStatus !== "all" &&
        (lead.listingStatus || "") !== secondaryFilters.listingStatus
      ) {
        return false;
      }

      if (secondaryFilters.workspaceState === "linked") {
        if (!(getLeadPropertyKey(lead) && lead.inPropertyWorkspace)) {
          return false;
        }
      }

      if (secondaryFilters.workspaceState === "pipeline-only") {
        if (getLeadPropertyKey(lead) && lead.inPropertyWorkspace) {
          return false;
        }
      }

      if (!normalizedQuery) {
        return true;
      }

      return buildLeadSearchText(lead).includes(normalizedQuery);
    });
  }, [activeTab, allLeads, searchValue, secondaryFilters]);

  const sortedLeads = useMemo(() => {
    const nextLeads = [...visibleLeads];

    if (sortValue === "follow-up") {
      nextLeads.sort((left, right) => {
        const leftTime = left.followUpDate ? new Date(left.followUpDate).getTime() : Number.POSITIVE_INFINITY;
        const rightTime = right.followUpDate ? new Date(right.followUpDate).getTime() : Number.POSITIVE_INFINITY;
        return leftTime - rightTime;
      });
      return nextLeads;
    }

    if (sortValue === "score") {
      nextLeads.sort(
        (left, right) =>
          (analysisById[right._id]?.score || 0) - (analysisById[left._id]?.score || 0)
      );
      return nextLeads;
    }

    nextLeads.sort((left, right) => getLeadTimestamp(right) - getLeadTimestamp(left));
    return nextLeads;
  }, [analysisById, sortValue, visibleLeads]);

  const visibleLeadIdSet = useMemo(
    () => new Set(sortedLeads.map((lead) => lead._id)),
    [sortedLeads]
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

  const selectedLeadCount = selectedLeadIds.length;
  const hasSecondaryFilters =
    secondaryFilters.leadSource !== "all" ||
    secondaryFilters.listingStatus !== "all" ||
    secondaryFilters.workspaceState !== "all";

  const handleToggleSelection = useCallback((leadId) => {
    setSelectedLeadIds((current) => {
      if (current.includes(leadId)) {
        return current.filter((id) => id !== leadId);
      }

      if (current.length >= 4) {
        toast.error("Compare up to 4 deals at once.");
        return current;
      }

      return [...current, leadId];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedLeadIds([]);
  }, []);

  const handleCompare = useCallback(() => {
    if (selectedLeadIds.length < 2) {
      toast.error("Select at least 2 deals to compare.");
      return;
    }

    navigate(`/leads/compare?ids=${selectedLeadIds.join(",")}`);
  }, [navigate, selectedLeadIds]);

  const handleRunComps = useCallback(
    (leadId) => {
      navigate(`/leads/${leadId}`);
    },
    [navigate]
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
            onClick={handleCompare}
            disabled={selectedLeadCount < 2}
            className={
              selectedLeadCount >= 2
                ? "primary-action"
                : "secondary-action cursor-not-allowed opacity-70"
            }
          >
            <ArrowsRightLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Compare</span>
            <span className="inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-white/16 px-1.5 py-0.5 text-[11px] font-semibold sm:bg-ink-900/10 sm:text-current">
              {selectedLeadCount}
            </span>
          </button>
        </>
      ),
    });

    return () => setDashboardHeaderConfig(null);
  }, [
    handleCompare,
    openUnifiedLeadCreator,
    selectedLeadCount,
    setDashboardHeaderConfig,
  ]);

  if (loading) {
    return (
      <div className="pt-16 md:pt-20">
        <div className="section-card px-6 py-10 text-center text-ink-500">
          Loading pipeline...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-16 md:space-y-6 md:pt-20">
      <section className="surface-panel-strong overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-ink-100/80 pb-3">
            {smartTabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-ink-900 bg-ink-900 text-white"
                      : "border-transparent bg-white/70 text-ink-500 hover:border-ink-100 hover:bg-white hover:text-ink-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex min-w-[1.45rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                      isActive ? "bg-white/16 text-white" : "bg-slate-100 text-ink-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">
              <div className="workspace-search-shell min-w-0 flex-1">
                <MagnifyingGlassIcon className="h-4 w-4 text-ink-400" />
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search address, seller, source, or next step"
                  className="workspace-search-input"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white/88 px-3 py-2 text-sm font-medium text-ink-600">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Sort
                  </span>
                  <select
                    value={sortValue}
                    onChange={(event) => setSortValue(event.target.value)}
                    className="bg-transparent text-sm font-semibold text-ink-700 outline-none"
                    aria-label="Sort pipeline"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <details className="relative">
                  <summary className="secondary-action list-none cursor-pointer">
                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                    Filters
                    {hasSecondaryFilters ? (
                      <span className="inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-ink-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                        {
                          [
                            secondaryFilters.leadSource !== "all",
                            secondaryFilters.listingStatus !== "all",
                            secondaryFilters.workspaceState !== "all",
                          ].filter(Boolean).length
                        }
                      </span>
                    ) : null}
                  </summary>
                  <div className="absolute right-0 top-[calc(100%+0.55rem)] z-20 w-[18rem] rounded-[22px] border border-ink-100 bg-white/96 p-4 shadow-[0_26px_54px_-34px_rgba(15,23,42,0.38)] backdrop-blur-xl">
                    <div className="space-y-3">
                      <label className="block">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Source
                        </span>
                        <select
                          value={secondaryFilters.leadSource}
                          onChange={(event) =>
                            setSecondaryFilters((current) => ({
                              ...current,
                              leadSource: event.target.value,
                            }))
                          }
                          className="auth-input mt-2 py-2.5 text-sm"
                        >
                          <option value="all">All sources</option>
                          {leadSourceOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Listing status
                        </span>
                        <select
                          value={secondaryFilters.listingStatus}
                          onChange={(event) =>
                            setSecondaryFilters((current) => ({
                              ...current,
                              listingStatus: event.target.value,
                            }))
                          }
                          className="auth-input mt-2 py-2.5 text-sm"
                        >
                          <option value="all">All listing states</option>
                          {listingStatusOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                          Workspace state
                        </span>
                        <select
                          value={secondaryFilters.workspaceState}
                          onChange={(event) =>
                            setSecondaryFilters((current) => ({
                              ...current,
                              workspaceState: event.target.value,
                            }))
                          }
                          className="auth-input mt-2 py-2.5 text-sm"
                        >
                          <option value="all">All deals</option>
                          <option value="linked">In workspace</option>
                          <option value="pipeline-only">Pipeline only</option>
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSecondaryFilters({
                            leadSource: "all",
                            listingStatus: "all",
                            workspaceState: "all",
                          })
                        }
                        className="text-sm font-semibold text-ink-500 transition hover:text-ink-800"
                      >
                        Clear filters
                      </button>
                      <span className="text-xs text-ink-400">Filters only affect this view.</span>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="segmented-control">
                {viewModes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = viewMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setViewMode(mode.value)}
                      className={`segmented-option ${isActive ? "segmented-option-active" : ""}`}
                    >
                      <Icon className="h-4 w-4" />
                      {mode.label}
                    </button>
                  );
                })}
              </div>

              <div className="workspace-counter-pill">
                {sortedLeads.length} of {allLeads.length}
              </div>
            </div>
          </div>

          {selectedLeadCount ? (
            <div className="flex flex-wrap items-center gap-2 rounded-[18px] border border-ink-100 bg-slate-50/90 px-3 py-3">
              <span className="text-sm font-semibold text-ink-800">
                {selectedLeadCount} selected for compare
              </span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="inline-flex items-center gap-1 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-semibold text-ink-500 transition hover:border-ink-200 hover:text-ink-800"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {sortedLeads.length === 0 ? (
        <div className="surface-panel-strong px-6 py-12 text-center">
          <p className="text-lg font-semibold text-ink-900">
            {allLeads.length === 0 ? "No properties in the pipeline yet" : "No deals match this view"}
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            {allLeads.length === 0
              ? "Start with one address and keep the pipeline calm. You can always bring in more inventory from Market Search."
              : "Try another search, smart tab, or filter combination to bring the right opportunities back into view."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={openUnifiedLeadCreator} className="primary-action">
              <PlusIcon className="h-4 w-4" />
              Add Property
            </button>
            <button
              type="button"
              onClick={() => navigate("/market-search")}
              className="secondary-action"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              Open Market Search
            </button>
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {sortedLeads.map((lead) => (
            <PipelineDealListItem
              key={lead._id}
              lead={lead}
              analysis={analysisById[lead._id]}
              selected={selectedLeadIds.includes(lead._id)}
              onSelect={() => handleToggleSelection(lead._id)}
              onOpen={() => navigate(`/leads/${lead._id}`)}
              onRunComps={() => handleRunComps(lead._id)}
              onStatusChange={handleLeadStatusChange}
              isUpdating={isUpdatingLeadId === lead._id}
              statusOptions={columnOrder}
            />
          ))}
        </div>
      ) : (
        <div className="surface-panel-strong overflow-hidden p-4 sm:p-5">
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {columnOrder.map((columnId) => {
                const column = filteredBoardColumns[columnId];
                return (
                  <Droppable key={column.id} droppableId={column.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="w-[19.5rem] flex-shrink-0 rounded-[24px] border border-ink-100 bg-slate-50/90 p-4"
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-ink-100 pb-3">
                          <h3 className="text-sm font-semibold text-ink-700">{column.title}</h3>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-500 ring-1 ring-ink-100">
                            {column.leads.length}
                          </span>
                        </div>

                        <div className="mt-4 min-h-[140px] space-y-3">
                          {column.leads.map((lead, index) => (
                            <Draggable key={lead._id} draggableId={lead._id} index={index}>
                              {(dragProvided) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                >
                                  <PipelineBoardCard
                                    lead={lead}
                                    analysis={analysisById[lead._id]}
                                    selected={selectedLeadIds.includes(lead._id)}
                                    onSelect={() => handleToggleSelection(lead._id)}
                                    onOpen={() => navigate(`/leads/${lead._id}`)}
                                    onRunComps={() => handleRunComps(lead._id)}
                                    dragHandleProps={dragProvided.dragHandleProps}
                                  />
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
        </div>
      )}

      <div className="rounded-[22px] border border-dashed border-ink-200 bg-white/70 px-4 py-4 text-sm text-ink-500">
        Rich AI breakdowns stay inside the deal page. The pipeline only keeps the score, verdict,
        next step, and the information needed to move fast.
      </div>
    </div>
  );
};

export default LeadsPage;
