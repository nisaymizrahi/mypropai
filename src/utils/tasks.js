export const TASK_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "complete", label: "Complete" },
];

export const TASK_URGENCY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const TASK_SOURCE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "lead", label: "Lead" },
  { value: "property", label: "Property" },
  { value: "investment", label: "Investment" },
  { value: "management", label: "Management" },
];

const urgencyRank = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

const startOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.valueOf()) ? parsed : null;
};

export const formatTaskDate = (value, fallback = "No date") => {
  const parsed = parseDate(value);
  if (!parsed) return fallback;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const toDateInputValue = (value) => {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : "";
};

export const isTaskComplete = (task) => task?.status === "complete";

export const isTaskDueToday = (task, reference = new Date()) => {
  if (isTaskComplete(task)) return false;
  const dueDate = parseDate(task?.dueDate);
  if (!dueDate) return false;
  const today = startOfDay(reference).valueOf();
  return startOfDay(dueDate).valueOf() === today;
};

export const isTaskOverdue = (task, reference = new Date()) => {
  if (isTaskComplete(task)) return false;
  const dueDate = parseDate(task?.dueDate);
  if (!dueDate) return false;
  return startOfDay(dueDate).valueOf() < startOfDay(reference).valueOf();
};

export const isTaskUpcoming = (task, reference = new Date()) => {
  if (isTaskComplete(task)) return false;
  const dueDate = parseDate(task?.dueDate);
  if (!dueDate) return false;
  return startOfDay(dueDate).valueOf() > startOfDay(reference).valueOf();
};

export const getTaskStatusLabel = (value) =>
  TASK_STATUS_OPTIONS.find((option) => option.value === value)?.label || "Open";

export const getTaskUrgencyLabel = (value) =>
  TASK_URGENCY_OPTIONS.find((option) => option.value === value)?.label || "Medium";

export const getTaskSourceLabel = (task) =>
  task?.sourceLabel ||
  TASK_SOURCE_OPTIONS.find((option) => option.value === task?.sourceType)?.label ||
  "General";

export const getTaskUrgencyRank = (value) => urgencyRank[value] ?? urgencyRank.medium;

export const sortTasks = (tasks = [], sortKey = "due-asc") => {
  const sorted = [...tasks];

  sorted.sort((left, right) => {
    const leftDue = parseDate(left?.dueDate)?.valueOf() ?? Number.MAX_SAFE_INTEGER;
    const rightDue = parseDate(right?.dueDate)?.valueOf() ?? Number.MAX_SAFE_INTEGER;
    const leftCompleted = parseDate(left?.completedAt)?.valueOf() ?? 0;
    const rightCompleted = parseDate(right?.completedAt)?.valueOf() ?? 0;
    const leftUpdated = parseDate(left?.updatedAt)?.valueOf() ?? 0;
    const rightUpdated = parseDate(right?.updatedAt)?.valueOf() ?? 0;
    const leftProperty = String(left?.propertyAddress || "General").toLowerCase();
    const rightProperty = String(right?.propertyAddress || "General").toLowerCase();
    const leftUrgency = getTaskUrgencyRank(left?.urgency);
    const rightUrgency = getTaskUrgencyRank(right?.urgency);

    switch (sortKey) {
      case "due-desc":
        return rightDue - leftDue || rightUpdated - leftUpdated;
      case "urgency-desc":
        return rightUrgency - leftUrgency || leftDue - rightDue;
      case "completed-desc":
        return rightCompleted - leftCompleted || rightUpdated - leftUpdated;
      case "property-asc":
        return leftProperty.localeCompare(rightProperty) || leftDue - rightDue;
      case "updated-desc":
        return rightUpdated - leftUpdated || leftDue - rightDue;
      case "due-asc":
      default:
        return leftDue - rightDue || rightUpdated - leftUpdated;
    }
  });

  return sorted;
};
