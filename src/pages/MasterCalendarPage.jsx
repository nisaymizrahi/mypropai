import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ClockIcon,
  FlagIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

import {
  getBudgetItems,
  getExpenses,
  getInvestments,
  getProjectDocuments,
  getProjectTasks,
  getProperties,
  getTaskList,
} from "../utils/api";
import { buildPropertyWorkspacePath } from "../utils/propertyWorkspaceNavigation";
import {
  buildProjectTimelineEvents,
  formatTimelineDate,
  timelineLaneConfig,
  toTimelineTime,
} from "../utils/propertyTimeline";
import {
  getTaskSourceLabel,
  getTaskUrgencyLabel,
  isTaskOverdue,
} from "../utils/tasks";
import { exportElementToPdf } from "../utils/pdfExport";

const MetricTile = ({ label, value, hint }) => (
  <div className="metric-tile p-5">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const urgencyClasses = {
  low: "bg-sky-50 text-sky-700 ring-sky-200",
  medium: "bg-sand-50 text-sand-700 ring-sand-200",
  high: "bg-amber-50 text-amber-700 ring-amber-200",
  critical: "bg-clay-50 text-clay-700 ring-clay-200",
};

const feedTypeClasses = {
  project: "bg-ink-50 text-ink-700 ring-ink-100",
  workspace: "bg-violet-50 text-violet-700 ring-violet-100",
};

const lowercase = (value) => String(value || "").trim().toLowerCase();

const buildEventGroups = (events = []) => {
  const groups = new Map();

  events.forEach((event) => {
    const key = event?.date ? new Date(event.date).toISOString().slice(0, 10) : "No date";
    const current = groups.get(key) || [];
    current.push(event);
    groups.set(key, current);
  });

  return [...groups.entries()]
    .sort(([left], [right]) => {
      if (left === "No date") return 1;
      if (right === "No date") return -1;
      return new Date(left).valueOf() - new Date(right).valueOf();
    })
    .map(([key, items]) => ({
      key,
      label:
        key === "No date"
          ? `No date (${items.length})`
          : `${new Date(key).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })} (${items.length})`,
      items: [...items].sort((left, right) => toTimelineTime(left.date) - toTimelineTime(right.date)),
    }));
};

const buildWorkspaceTaskEvents = (tasks = [], propertyLookup = new Map(), addressLookup = new Map()) =>
  tasks.map((task) => {
    const matchedProperty =
      propertyLookup.get(String(task.propertyKey || "")) ||
      addressLookup.get(lowercase(task.propertyAddress || "")) ||
      null;

    return {
      id: `workspace-${task._id}`,
      lane: "milestones",
      title: task.title,
      description: task.description || "Workspace task",
      date: task.dueDate || task.updatedAt || task.createdAt,
      propertyKey: matchedProperty?.propertyKey || task.propertyKey || "",
      propertyLabel:
        matchedProperty?.sharedProfile?.address ||
        task.propertyAddress ||
        task.sourceLabel ||
        "General workspace",
      feedType: "workspace",
      eventKind: "workspace-task",
      sourceLabel: getTaskSourceLabel(task),
      urgency: task.urgency || "medium",
      urgencyLabel: getTaskUrgencyLabel(task.urgency),
      isOverdue: isTaskOverdue(task),
    };
  });

const resolveEventPath = (event) => {
  if (!event?.propertyKey) {
    return "";
  }

  switch (event.eventKind) {
    case "workspace-task":
      return buildPropertyWorkspacePath(event.propertyKey, "operations", "tasks");
    case "task":
      return buildPropertyWorkspacePath(event.propertyKey, "operations", "schedule");
    case "expense":
      return buildPropertyWorkspacePath(event.propertyKey, "costs", "expenses");
    case "award":
      return buildPropertyWorkspacePath(event.propertyKey, "costs", "commitments");
    case "document":
      return buildPropertyWorkspacePath(event.propertyKey, "documents", "overview");
    default:
      return buildPropertyWorkspacePath(event.propertyKey, "operations", "timeline");
  }
};

const MasterCalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("timeline");
  const [filters, setFilters] = useState({
    propertyKey: "all",
    lane: "all",
    feedType: "all",
  });
  const exportRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [propertyData, investmentData, workspaceTaskData] = await Promise.all([
        getProperties(),
        getInvestments(),
        getTaskList(),
      ]);

      const propertiesList = Array.isArray(propertyData) ? propertyData : [];
      const investmentsList = Array.isArray(investmentData) ? investmentData : [];
      const workspaceTasks = Array.isArray(workspaceTaskData) ? workspaceTaskData : [];

      setProperties(propertiesList);

      const propertyLookup = new Map();
      const propertyAddressLookup = new Map();

      propertiesList.forEach((property) => {
        if (property?.propertyKey) {
          propertyLookup.set(String(property.propertyKey), property);
        }
        if (property?.propertyId) {
          propertyLookup.set(String(property.propertyId), property);
        }
        if (property?.sharedProfile?.address) {
          propertyAddressLookup.set(lowercase(property.sharedProfile.address), property);
        }
      });

      const investmentEventCollections = await Promise.all(
        investmentsList.map(async (investment) => {
          try {
            const propertyRef =
              typeof investment?.property === "object"
                ? investment.property?._id || ""
                : investment?.property || "";
            const matchedProperty =
              propertyLookup.get(String(propertyRef)) ||
              propertyAddressLookup.get(
                lowercase(
                  typeof investment?.property === "object"
                    ? investment.property?.address
                    : investment?.address
                )
              ) ||
              null;

            const propertyKey = matchedProperty?.propertyKey || String(propertyRef || "");
            const propertyLabel =
              matchedProperty?.sharedProfile?.address ||
              matchedProperty?.title ||
              (typeof investment?.property === "object" ? investment.property?.address : "") ||
              investment?.address ||
              "Property project";

            const [taskData, budgetData, expenseData, documentData] = await Promise.all([
              getProjectTasks(investment._id).catch((loadError) => {
                console.error("Portfolio timeline failed to load project tasks", loadError);
                return [];
              }),
              getBudgetItems(investment._id).catch((loadError) => {
                console.error("Portfolio timeline failed to load budget items", loadError);
                return [];
              }),
              getExpenses(investment._id).catch((loadError) => {
                console.error("Portfolio timeline failed to load expenses", loadError);
                return [];
              }),
              getProjectDocuments(investment._id).catch((loadError) => {
                console.error("Portfolio timeline failed to load documents", loadError);
                return [];
              }),
            ]);

            return buildProjectTimelineEvents({
              investment,
              tasks: taskData,
              budgetItems: budgetData,
              expenses: expenseData,
              documents: documentData,
              propertyKey,
              propertyLabel,
            });
          } catch (investmentError) {
            console.error("Portfolio timeline failed to load an investment bundle", investmentError);
            return [];
          }
        })
      );

      const workspaceEvents = buildWorkspaceTaskEvents(
        workspaceTasks,
        propertyLookup,
        propertyAddressLookup
      );

      const nextEvents = [...investmentEventCollections.flat(), ...workspaceEvents].sort(
        (left, right) => toTimelineTime(left.date) - toTimelineTime(right.date)
      );

      setEvents(nextEvents);
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load the master calendar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const propertyOptions = useMemo(
    () =>
      [...properties].sort((left, right) =>
        String(left?.sharedProfile?.address || left?.title || "").localeCompare(
          String(right?.sharedProfile?.address || right?.title || "")
        )
      ),
    [properties]
  );

  const visibleEvents = useMemo(
    () =>
      events.filter((event) => {
        if (filters.propertyKey !== "all" && event.propertyKey !== filters.propertyKey) {
          return false;
        }

        if (filters.lane !== "all" && event.lane !== filters.lane) {
          return false;
        }

        if (filters.feedType !== "all" && event.feedType !== filters.feedType) {
          return false;
        }

        return true;
      }),
    [events, filters]
  );

  const groupedEvents = useMemo(() => buildEventGroups(visibleEvents), [visibleEvents]);

  const summary = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      total: visibleEvents.length,
      nextSevenDays: visibleEvents.filter((event) => {
        const time = toTimelineTime(event.date);
        return time >= now.valueOf() && time <= nextWeek.valueOf();
      }).length,
      overdue: visibleEvents.filter((event) => event.isOverdue).length,
      linkedProperties: new Set(visibleEvents.map((event) => event.propertyKey).filter(Boolean)).size,
    };
  }, [visibleEvents]);

  const laneSummary = useMemo(
    () =>
      Object.entries(timelineLaneConfig).map(([laneKey, config]) => ({
        laneKey,
        label: config.label,
        count: visibleEvents.filter((event) => event.lane === laneKey).length,
        chipClass: config.chipClass,
      })),
    [visibleEvents]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleExport = async () => {
    if (!exportRef.current) {
      return;
    }

    await exportElementToPdf({
      element: exportRef.current,
      filename: "portfolio-master-calendar.pdf",
    });
  };

  return (
    <div className="space-y-6">
      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.16),transparent_62%)] lg:block" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="eyebrow">Portfolio timeline</span>
            <h1 className="mt-4 text-[2.5rem] font-medium tracking-tight text-ink-900">
              Master calendar across every property project
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
              This phase turns the master calendar into a real portfolio timeline. It now pulls in
              project schedule events, vendor commitments, expenses, document uploads, milestone
              moments, and universal workspace tasks across your properties.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewMode === "timeline"
                  ? "bg-ink-900 text-white"
                  : "border border-ink-100 bg-white text-ink-600 hover:bg-ink-50"
              }`}
            >
              Timeline view
            </button>
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                viewMode === "agenda"
                  ? "bg-ink-900 text-white"
                  : "border border-ink-100 bg-white text-ink-600 hover:bg-ink-50"
              }`}
            >
              Agenda view
            </button>
            <button type="button" onClick={handleExport} className="secondary-action">
              <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Visible events"
            value={summary.total}
            hint="Items matching the current portfolio filters."
          />
          <MetricTile
            label="Next 7 days"
            value={summary.nextSevenDays}
            hint="Upcoming events and deadlines in the near term."
          />
          <MetricTile
            label="Overdue tasks"
            value={summary.overdue}
            hint="Task-driven events that are already late."
          />
          <MetricTile
            label="Linked properties"
            value={summary.linkedProperties}
            hint="Distinct property records represented in this view."
          />
        </div>
      </section>

      <section className="section-card p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <label className="space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
              Property
            </span>
            <select
              name="propertyKey"
              value={filters.propertyKey}
              onChange={handleFilterChange}
              className="auth-input"
            >
              <option value="all">All properties</option>
              <option value="">General / no property</option>
              {propertyOptions.map((property) => (
                <option key={property.propertyKey} value={property.propertyKey}>
                  {property.sharedProfile?.address || property.title || property.propertyKey}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
              Lane
            </span>
            <select
              name="lane"
              value={filters.lane}
              onChange={handleFilterChange}
              className="auth-input"
            >
              <option value="all">All lanes</option>
              {Object.entries(timelineLaneConfig).map(([laneKey, config]) => (
                <option key={laneKey} value={laneKey}>
                  {config.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
              Feed type
            </span>
            <select
              name="feedType"
              value={filters.feedType}
              onChange={handleFilterChange}
              className="auth-input"
            >
              <option value="all">All feeds</option>
              <option value="project">Project events</option>
              <option value="workspace">Workspace tasks</option>
            </select>
          </label>

          <div className="rounded-[18px] bg-sand-50 px-4 py-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-900">
              {viewMode === "timeline" ? "Timeline" : "Agenda"}
            </p>
            <p className="mt-1">
              Cross-project events now live here, not just universal tasks.
            </p>
          </div>
        </div>
      </section>

      <section className="section-card p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {laneSummary.map((lane) => (
            <div key={lane.laneKey} className="rounded-[18px] border border-ink-100 bg-white/85 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lane.chipClass}`}>
                  {lane.label}
                </span>
                <span className="text-sm font-semibold text-ink-900">{lane.count}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-[16px] border border-clay-200 bg-clay-50 px-5 py-4 text-sm text-clay-700">
          {error}
        </div>
      ) : null}

      <div ref={exportRef}>
        {loading ? (
          <div className="section-card px-6 py-12 text-center text-sm text-ink-500">
            Loading portfolio timeline...
          </div>
        ) : groupedEvents.length > 0 ? (
          viewMode === "timeline" ? (
            <div className="space-y-4">
              {groupedEvents.map((group) => (
                <section key={group.key} className="section-card overflow-hidden p-0">
                  <div className="border-b border-ink-100 bg-sand-50/70 px-6 py-4">
                    <p className="text-sm font-semibold text-ink-900">{group.label}</p>
                  </div>

                  <div className="px-6 py-6">
                    <div className="space-y-4 border-l border-ink-100 pl-5">
                      {group.items.map((event) => {
                        const lane = timelineLaneConfig[event.lane] || timelineLaneConfig.milestones;
                        const eventPath = resolveEventPath(event);

                        return (
                          <div
                            key={event.id}
                            className="relative rounded-[22px] border border-ink-100 bg-white/90 p-5 shadow-[0_10px_24px_rgba(38,32,24,0.04)]"
                          >
                            <span
                              className={`absolute -left-[30px] top-6 h-4 w-4 rounded-full border-4 border-white shadow-soft ${lane.railClass}`}
                            />
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${lane.chipClass}`}>
                                    <CalendarDaysIcon className="mr-1.5 h-3.5 w-3.5" />
                                    {lane.label}
                                  </span>
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                                      feedTypeClasses[event.feedType] || feedTypeClasses.project
                                    }`}
                                  >
                                    {event.feedType === "workspace" ? "Workspace task" : "Project event"}
                                  </span>
                                  {event.urgency ? (
                                    <span
                                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                                        urgencyClasses[event.urgency] || urgencyClasses.medium
                                      }`}
                                    >
                                      <FlagIcon className="mr-1.5 h-3.5 w-3.5" />
                                      {event.urgencyLabel || getTaskUrgencyLabel(event.urgency)}
                                    </span>
                                  ) : null}
                                  {event.isOverdue ? (
                                    <span className="inline-flex rounded-full bg-clay-50 px-3 py-1 text-xs font-semibold text-clay-700 ring-1 ring-clay-200">
                                      Overdue
                                    </span>
                                  ) : null}
                                </div>

                                <p className="mt-4 text-lg font-semibold text-ink-900">{event.title}</p>
                                <p className="mt-2 text-sm leading-6 text-ink-500">
                                  {event.description || "No additional event detail yet."}
                                </p>
                                <p className="mt-3 text-sm text-ink-600">
                                  {event.propertyLabel || "General workspace"}
                                </p>
                                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                                  {event.sourceLabel
                                    ? `${event.sourceLabel} • `
                                    : ""}{formatTimelineDate(event.date)}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 xl:justify-end">
                                {eventPath ? (
                                  <Link to={eventPath} className="secondary-action">
                                    Open related section
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleEvents.map((event) => {
                const lane = timelineLaneConfig[event.lane] || timelineLaneConfig.milestones;
                const eventPath = resolveEventPath(event);

                return (
                  <div key={event.id} className="section-card p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${lane.chipClass}`}>
                        <ClockIcon className="mr-1.5 h-3.5 w-3.5" />
                        {lane.label}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          feedTypeClasses[event.feedType] || feedTypeClasses.project
                        }`}
                      >
                        {event.feedType === "workspace" ? "Workspace task" : "Project event"}
                      </span>
                      {event.urgency ? (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            urgencyClasses[event.urgency] || urgencyClasses.medium
                          }`}
                        >
                          {event.urgencyLabel || getTaskUrgencyLabel(event.urgency)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 text-lg font-semibold text-ink-900">{event.title}</p>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      {event.description || "No additional event detail yet."}
                    </p>
                    <p className="mt-3 text-sm text-ink-600">
                      {event.propertyLabel || "General workspace"}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      {formatTimelineDate(event.date)}
                    </p>
                    {eventPath ? (
                      <div className="mt-4">
                        <Link to={eventPath} className="secondary-action">
                          <Squares2X2Icon className="mr-2 h-4 w-4" />
                          Open related section
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="section-card px-6 py-12 text-center">
            <p className="text-lg font-medium text-ink-900">No portfolio events match this view.</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Try another filter, or keep building inside the property workspaces and this timeline
              will fill in automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterCalendarPage;
