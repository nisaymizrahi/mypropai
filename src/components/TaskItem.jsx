import React from "react";
import { format } from "date-fns";
import toast from "react-hot-toast";

import { updateTask } from "../utils/api";

const statusStyles = {
  "Not Started": "border border-ink-200 bg-white text-ink-700",
  "In Progress": "border border-sand-200 bg-sand-50 text-sand-700",
  Complete: "border border-verdigris-200 bg-verdigris-50 text-verdigris-700",
  Blocked: "border border-clay-200 bg-clay-50 text-clay-700",
  "On Hold": "border border-ink-100 bg-ink-50 text-ink-500",
};

const TaskItem = ({ task, onUpdate }) => {
  const handleStatusCycle = async () => {
    const statusFlow = ["Not Started", "In Progress", "Complete"];
    const currentIndex = statusFlow.indexOf(task.status);
    const nextStatus = statusFlow[(currentIndex + 1) % statusFlow.length];

    try {
      await updateTask(task._id, { status: nextStatus });
      toast.success("Task status updated");
      onUpdate?.();
    } catch (error) {
      toast.error(error.message || "Failed to update task");
    }
  };

  return (
    <div className="rounded-[24px] border border-ink-100 bg-white/85 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-ink-900">{task.title}</h4>
          <p className="mt-2 text-sm leading-6 text-ink-500">{task.description || "No description added yet."}</p>
        </div>

        <button
          type="button"
          onClick={handleStatusCycle}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${statusStyles[task.status] || statusStyles["Not Started"]}`}
        >
          {task.status}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
        <span>Start {format(new Date(task.startDate), "MMM d")}</span>
        <span>Due {format(new Date(task.endDate), "MMM d")}</span>
        <span>{task.type === "owner" ? "Internal" : "Vendor task"}</span>
        {task.phase ? <span>Phase {task.phase}</span> : null}
        {task.assignee?.name ? <span>Lead {task.assignee.name}</span> : null}
      </div>
    </div>
  );
};

export default TaskItem;
