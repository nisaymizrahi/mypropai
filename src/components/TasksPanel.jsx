import React, { useCallback, useEffect, useMemo, useState } from "react";

import { getProperties, getTaskList } from "../utils/api";
import { isTaskComplete, isTaskOverdue, sortTasks } from "../utils/tasks";
import TaskCard from "./TaskCard";
import TaskFormModal from "./TaskFormModal";

const StatTile = ({ label, value, hint }) => (
  <div className="metric-tile p-5">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm text-ink-500">{hint}</p> : null}
  </div>
);

const TasksPanel = ({
  eyebrow = "Tasks",
  title = "Task list",
  description = "Track action items here and keep them visible in the main task center too.",
  query = {},
  defaults = {},
  emptyTitle = "No tasks yet",
  emptyDescription = "Add the first task for this record and it will also appear in the central task view.",
}) => {
  const [tasks, setTasks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const querySignature = JSON.stringify(query);
  const normalizedQuery = useMemo(() => JSON.parse(querySignature || "{}"), [querySignature]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [taskData, propertyData] = await Promise.all([
        getTaskList(normalizedQuery),
        getProperties(),
      ]);
      setTasks(taskData || []);
      setProperties(propertyData || []);
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [normalizedQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sortedTasks = useMemo(() => sortTasks(tasks, "due-asc"), [tasks]);
  const openCount = useMemo(
    () => tasks.filter((task) => !isTaskComplete(task)).length,
    [tasks]
  );
  const completedCount = useMemo(
    () => tasks.filter((task) => isTaskComplete(task)).length,
    [tasks]
  );
  const overdueCount = useMemo(
    () => tasks.filter((task) => isTaskOverdue(task)).length,
    [tasks]
  );

  const handleTaskSaved = () => {
    setEditingTask(null);
    fetchData();
  };

  const handleTaskUpdated = () => {
    fetchData();
  };

  const handleTaskDeleted = () => {
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
        defaults={defaults}
      />

      <div className="space-y-6">
        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <span className="eyebrow">{eyebrow}</span>
              <h2 className="mt-4 text-[2rem] font-medium tracking-tight text-ink-900">{title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">{description}</p>
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

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <StatTile label="Open" value={openCount} />
            <StatTile label="Overdue" value={overdueCount} />
            <StatTile label="Completed" value={completedCount} />
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
        ) : sortedTasks.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {sortedTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={(nextTask) => {
                  setEditingTask(nextTask);
                  setIsModalOpen(true);
                }}
                onUpdated={handleTaskUpdated}
                onDeleted={handleTaskDeleted}
              />
            ))}
          </div>
        ) : (
          <div className="section-card px-6 py-12 text-center">
            <p className="text-lg font-medium text-ink-900">{emptyTitle}</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">{emptyDescription}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default TasksPanel;
