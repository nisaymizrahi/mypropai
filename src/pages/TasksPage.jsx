import React, { useCallback, useEffect, useMemo, useState } from "react";

import { getProperties, getTaskList } from "../utils/api";
import {
  isTaskComplete,
  isTaskDueToday,
  isTaskOverdue,
  isTaskUpcoming,
  sortTasks,
  TASK_SOURCE_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_URGENCY_OPTIONS,
} from "../utils/tasks";
import TaskCard from "../components/TaskCard";
import TaskFormModal from "../components/TaskFormModal";

const mainTabs = [
  { id: "today", label: "Today" },
  { id: "overdue", label: "Overdue" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

const summaryCards = (tasks) => [
  {
    label: "Open tasks",
    value: tasks.filter((task) => !isTaskComplete(task)).length,
    hint: "Everything not completed yet.",
  },
  {
    label: "Due today",
    value: tasks.filter((task) => isTaskDueToday(task)).length,
    hint: "Tasks that need attention today.",
  },
  {
    label: "Overdue",
    value: tasks.filter((task) => isTaskOverdue(task)).length,
    hint: "Past-due items still open.",
  },
  {
    label: "Completed",
    value: tasks.filter((task) => isTaskComplete(task)).length,
    hint: "Finished items with completion timestamps.",
  },
];

const matchesTab = (task, activeTab) => {
  switch (activeTab) {
    case "today":
      return isTaskDueToday(task);
    case "overdue":
      return isTaskOverdue(task);
    case "upcoming":
      return isTaskUpcoming(task);
    case "completed":
      return isTaskComplete(task);
    case "all":
    default:
      return true;
  }
};

const MetricTile = ({ label, value, hint }) => (
  <div className="metric-tile p-5">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [filters, setFilters] = useState({
    propertyKey: "all",
    urgency: "all",
    sourceType: "all",
    status: "all",
    sortKey: "due-asc",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [taskData, propertyData] = await Promise.all([getTaskList(), getProperties()]);
      setTasks(taskData || []);
      setProperties(propertyData || []);
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabCounts = useMemo(
    () =>
      mainTabs.reduce((accumulator, tab) => {
        accumulator[tab.id] = tasks.filter((task) => matchesTab(task, tab.id)).length;
        return accumulator;
      }, {}),
    [tasks]
  );

  const visibleTasks = useMemo(() => {
    const scopedTasks = tasks.filter((task) => matchesTab(task, activeTab));

    const filteredTasks = scopedTasks.filter((task) => {
      if (filters.propertyKey !== "all" && task.propertyKey !== filters.propertyKey) {
        return false;
      }

      if (filters.urgency !== "all" && task.urgency !== filters.urgency) {
        return false;
      }

      if (filters.sourceType !== "all" && task.sourceType !== filters.sourceType) {
        return false;
      }

      if (filters.status !== "all" && task.status !== filters.status) {
        return false;
      }

      return true;
    });

    return sortTasks(filteredTasks, filters.sortKey);
  }, [activeTab, filters, tasks]);

  const propertyOptions = useMemo(
    () =>
      [...properties].sort((left, right) =>
        String(left?.sharedProfile?.address || left?.title || "").localeCompare(
          String(right?.sharedProfile?.address || right?.title || "")
        )
      ),
    [properties]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleTaskSaved = () => {
    setEditingTask(null);
    fetchData();
  };

  return (
    <>
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSaved={handleTaskSaved}
        task={editingTask}
        properties={properties}
        defaults={{ sourceType: "general", sourceLabel: "General" }}
      />

      <div className="space-y-6">
        <section className="surface-panel-strong px-6 py-7 sm:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <span className="eyebrow">Task center</span>
              <h1 className="mt-4 text-[2.5rem] font-medium tracking-tight text-ink-900">
                See every task in one place
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
                Tasks created from leads, property records, or general workspace work all roll up
                here so you can work by urgency, due date, completion time, and property.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="primary-action"
            >
              Add task
            </button>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards(tasks).map((card) => (
              <MetricTile key={card.label} label={card.label} value={card.value} hint={card.hint} />
            ))}
          </div>
        </section>

        <section className="section-card p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-ink-900 text-white"
                    : "border border-ink-100 bg-white text-ink-600 hover:bg-ink-50"
                }`}
              >
                {tab.label} ({tabCounts[tab.id] || 0})
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                <option value="">General only</option>
                {propertyOptions.map((property) => (
                  <option key={property.propertyKey} value={property.propertyKey}>
                    {property.sharedProfile?.address || property.title || property.propertyKey}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
                Urgency
              </span>
              <select
                name="urgency"
                value={filters.urgency}
                onChange={handleFilterChange}
                className="auth-input"
              >
                <option value="all">All urgency</option>
                {TASK_URGENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
                Status
              </span>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="auth-input"
              >
                <option value="all">All status</option>
                {TASK_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
                Source
              </span>
              <select
                name="sourceType"
                value={filters.sourceType}
                onChange={handleFilterChange}
                className="auth-input"
              >
                <option value="all">All sources</option>
                {TASK_SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
                Sort by
              </span>
              <select
                name="sortKey"
                value={filters.sortKey}
                onChange={handleFilterChange}
                className="auth-input"
              >
                <option value="due-asc">Due date</option>
                <option value="urgency-desc">Urgency</option>
                <option value="completed-desc">Completion time</option>
                <option value="property-asc">Property</option>
                <option value="updated-desc">Recently updated</option>
              </select>
            </label>
          </div>
        </section>

        {error ? (
          <div className="rounded-[16px] border border-clay-200 bg-clay-50 px-5 py-4 text-sm text-clay-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="section-card px-6 py-12 text-center text-sm text-ink-500">
            Loading tasks...
          </div>
        ) : visibleTasks.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={(nextTask) => {
                  setEditingTask(nextTask);
                  setIsModalOpen(true);
                }}
                onUpdated={fetchData}
                onDeleted={fetchData}
              />
            ))}
          </div>
        ) : (
          <div className="section-card px-6 py-12 text-center">
            <p className="text-lg font-medium text-ink-900">No tasks match this view.</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Try a different tab or filter, or create a new task from here.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default TasksPage;
