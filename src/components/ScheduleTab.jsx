import React, { useMemo, useState } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

import AddTaskModal from "./AddTaskModal";
import TaskItem from "./TaskItem";

const viewOptions = [
  { label: "Day", value: ViewMode.Day },
  { label: "Week", value: ViewMode.Week },
  { label: "Month", value: ViewMode.Month },
];

const progressByStatus = {
  "Not Started": 0,
  "In Progress": 60,
  Complete: 100,
  Blocked: 15,
  "On Hold": 10,
};

const formatTasksForGantt = (tasks = []) =>
  tasks.map((task) => ({
    start: new Date(task.startDate),
    end: new Date(task.endDate),
    name: task.title,
    id: task._id,
    type: "task",
    progress: progressByStatus[task.status] ?? 0,
    isDisabled: false,
  }));

const MetricTile = ({ label, value, hint }) => (
  <div className="metric-tile p-5">
    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const ScheduleTab = ({ investment, tasks = [], vendors = [], budgetItems = [], onUpdate }) => {
  const [view, setView] = useState(ViewMode.Week);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const ganttTasks = useMemo(() => formatTasksForGantt(tasks), [tasks]);
  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === "Complete").length,
    [tasks]
  );
  const inProgressCount = useMemo(
    () => tasks.filter((task) => task.status === "In Progress").length,
    [tasks]
  );
  const completionPercent = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const nextTask = useMemo(
    () =>
      [...tasks]
        .filter((task) => task.status !== "Complete")
        .sort((left, right) => new Date(left.endDate) - new Date(right.endDate))[0],
    [tasks]
  );
  const activePhases = useMemo(
    () => new Set(tasks.map((task) => task.phase).filter(Boolean)).size,
    [tasks]
  );

  return (
    <>
      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={onUpdate}
        investmentId={investment._id}
        vendors={vendors}
        budgetItems={budgetItems}
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Total tasks" value={tasks.length} />
          <MetricTile label="In progress" value={inProgressCount} />
          <MetricTile
            label="Completion"
            value={`${Math.round(completionPercent)}%`}
            hint={`${completedCount} complete`}
          />
          <MetricTile
            label="Next milestone"
            value={nextTask ? new Date(nextTask.endDate).toLocaleDateString() : "No due dates"}
            hint={nextTask ? nextTask.title : "Add the first scheduled task"}
          />
        </div>

        <section className="section-card p-6 sm:p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <span className="eyebrow">Schedule overview</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Timeline and delivery</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Keep the project sequence visible, monitor phase activity, and add new work items
                without leaving the hub.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2 rounded-full border border-ink-100 bg-white/85 p-1.5">
                {viewOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setView(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      view === option.value
                        ? "bg-ink-900 text-white"
                        : "text-ink-500 hover:bg-ink-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsTaskModalOpen(true)}
                className="primary-action"
              >
                Add task
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-ink-100 bg-white/90 p-4">
            {ganttTasks.length > 0 ? (
              <div className="overflow-x-auto">
                <Gantt
                  tasks={ganttTasks}
                  viewMode={view}
                  listCellWidth="160px"
                  columnWidth={view === ViewMode.Month ? 260 : 130}
                  barProgressColor="#1f6f63"
                  barProgressSelectedColor="#164f47"
                  barBackgroundColor="#e8dcc1"
                  barBackgroundSelectedColor="#dbc79d"
                  arrowColor="#51657f"
                />
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
                No tasks scheduled yet. Add the first milestone to start building the execution
                timeline.
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[22px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Active phases
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink-900">{activePhases}</p>
            </div>
            <div className="rounded-[22px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Vendors available
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink-900">{vendors.length}</p>
            </div>
            <div className="rounded-[22px] border border-ink-100 bg-white/85 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Project progress
              </p>
              <p className="mt-3 text-3xl font-semibold text-ink-900">
                {Math.round(Number(investment.progress || 0))}%
              </p>
            </div>
          </div>
        </section>

        <section className="section-card p-6 sm:p-7">
          <span className="eyebrow">Task list</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">Execution detail</h3>

          {tasks.length > 0 ? (
            <div className="mt-8 grid gap-4 xl:grid-cols-2">
              {tasks.map((task) => (
                <TaskItem key={task._id} task={task} onUpdate={onUpdate} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-center text-sm leading-6 text-ink-500">
              No task cards yet. Add a task to start assigning work and tracking delivery.
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default ScheduleTab;
