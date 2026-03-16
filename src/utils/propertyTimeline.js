import { formatCurrency, toNumber } from "./investmentMetrics";

export const timelineLaneConfig = {
  property: {
    label: "Property",
    chipClass: "bg-sky-50 text-sky-700",
    railClass: "bg-sky-500",
    cardClass: "border-sky-100 bg-sky-50/60",
  },
  vendors: {
    label: "Vendors",
    chipClass: "bg-amber-50 text-amber-700",
    railClass: "bg-amber-400",
    cardClass: "border-amber-100 bg-amber-50/70",
  },
  costs: {
    label: "Costs",
    chipClass: "bg-verdigris-50 text-verdigris-700",
    railClass: "bg-verdigris-500",
    cardClass: "border-verdigris-100 bg-verdigris-50/60",
  },
  documents: {
    label: "Documents",
    chipClass: "bg-clay-50 text-clay-700",
    railClass: "bg-clay-400",
    cardClass: "border-clay-100 bg-clay-50/60",
  },
  milestones: {
    label: "Milestones",
    chipClass: "bg-violet-50 text-violet-700",
    railClass: "bg-violet-400",
    cardClass: "border-violet-100 bg-violet-50/60",
  },
};

export const formatTimelineDate = (value, options) => {
  if (!value) return "No date";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "No date";
  return parsed.toLocaleDateString(
    "en-US",
    options || {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
};

export const formatTimelineDateTime = (value) => {
  if (!value) return "No date";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) return "No date";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const toTimelineTime = (value) => {
  const parsed = new Date(value || 0).valueOf();
  return Number.isFinite(parsed) ? parsed : 0;
};

const isProjectTaskComplete = (task) => task?.status === "Complete";

const isProjectTaskOverdue = (task, reference = new Date()) => {
  if (isProjectTaskComplete(task) || !task?.endDate) return false;
  const dueDate = new Date(task.endDate);
  if (!Number.isFinite(dueDate.valueOf())) return false;
  return dueDate.valueOf() < reference.valueOf();
};

export const buildProjectTimelineEvents = ({
  investment,
  tasks = [],
  budgetItems = [],
  expenses = [],
  documents = [],
  propertyKey = "",
  propertyLabel = "",
}) => {
  const events = [];
  const resolvedPropertyLabel = propertyLabel || investment?.address || "Property project";

  if (investment?.createdAt) {
    events.push({
      id: `investment-${investment._id}`,
      lane: "property",
      title: "Acquisitions workspace created",
      description: investment.address || "Property project shell created",
      date: investment.createdAt,
      propertyKey,
      propertyLabel: resolvedPropertyLabel,
      investmentId: investment?._id || "",
      feedType: "project",
      eventKind: "investment",
    });
  }

  if (investment?.purchasePrice) {
    events.push({
      id: `purchase-${investment._id}`,
      lane: "property",
      title: "Purchase basis captured",
      description: `Modeled purchase price ${formatCurrency(investment.purchasePrice)}`,
      date: investment.updatedAt || investment.createdAt,
      propertyKey,
      propertyLabel: resolvedPropertyLabel,
      investmentId: investment?._id || "",
      feedType: "project",
      eventKind: "investment",
    });
  }

  tasks.forEach((task) => {
    events.push({
      id: `task-${task._id}`,
      lane: task.status === "Complete" ? "milestones" : "vendors",
      title: task.title,
      description: [task.phase || null, task.assignee?.name || null, task.status || null]
        .filter(Boolean)
        .join(" • "),
      date: task.endDate || task.startDate,
      propertyKey,
      propertyLabel: resolvedPropertyLabel,
      investmentId: investment?._id || "",
      feedType: "project",
      eventKind: "task",
      status: task.status || "",
      isOverdue: isProjectTaskOverdue(task),
    });
  });

  budgetItems.forEach((item) => {
    (item.awards || []).forEach((award) => {
      events.push({
        id: `award-${award.awardId}`,
        lane: "vendors",
        title:
          (typeof award.vendor === "object" ? award.vendor?.name : "") ||
          award.vendorName ||
          "Vendor committed",
        description: `${item.category || "Scope item"} • ${formatCurrency(award.amount)}`,
        date: award.createdAt || item.updatedAt || item.createdAt,
        propertyKey,
        propertyLabel: resolvedPropertyLabel,
        investmentId: investment?._id || "",
        feedType: "project",
        eventKind: "award",
      });
    });
  });

  expenses.forEach((expense) => {
    events.push({
      id: `expense-${expense._id}`,
      lane: "costs",
      title: expense.title || "Expense recorded",
      description: [
        expense.vendor?.name || expense.payeeName || null,
        formatCurrency(expense.amount),
        expense.entryMethod === "receipt_ai" ? "AI receipt" : "Manual entry",
      ]
        .filter(Boolean)
        .join(" • "),
      date: expense.date || expense.updatedAt || expense.createdAt,
      propertyKey,
      propertyLabel: resolvedPropertyLabel,
      investmentId: investment?._id || "",
      feedType: "project",
      eventKind: "expense",
      amount: toNumber(expense.amount, 0),
    });
  });

  documents.forEach((document) => {
    events.push({
      id: `document-${document._id}`,
      lane: "documents",
      title: document.displayName || "Document uploaded",
      description: document.category || "General",
      date: document.updatedAt || document.createdAt,
      propertyKey,
      propertyLabel: resolvedPropertyLabel,
      investmentId: investment?._id || "",
      feedType: "project",
      eventKind: "document",
    });
  });

  return events.sort((left, right) => toTimelineTime(left.date) - toTimelineTime(right.date));
};
