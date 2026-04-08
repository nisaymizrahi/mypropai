import React, { useEffect, useMemo, useState } from "react";
import {
  BanknotesIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  ReceiptPercentIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import {
  addBudgetAward,
  deleteBudgetAward,
  deleteVendor,
  updateBudgetAward,
} from "../utils/api";
import { formatCurrency, getInvestmentAnalysisMetrics, toNumber } from "../utils/investmentMetrics";
import { getProjectScopeLabel } from "../utils/projectScopes";
import AddBudgetItemModal from "./AddBudgetItemModal";
import AddExpenseModal from "./AddExpenseModal";
import AddTaskModal from "./AddTaskModal";
import AddVendorModal from "./AddVendorModal";
import BidsTab from "./BidsTab";
import BudgetAwardModal from "./BudgetAwardModal";
import BudgetLineItem from "./BudgetLineItem";
import DocumentsTab from "./DocumentsTab";
import EditVendorModal from "./EditVendorModal";
import ProjectCompsTab from "./ProjectCompsTab";
import TaskItem from "./TaskItem";

const sectionOptions = [
  {
    id: "overview",
    label: "Overview",
    description: "Pulse, issues, and next steps",
    icon: Squares2X2Icon,
  },
  {
    id: "scope",
    label: "Scope Budget",
    description: "Categories, commitments, and progress",
    icon: BanknotesIcon,
  },
  {
    id: "vendors",
    label: "Vendors & Bids",
    description: "Who owns what work and which quotes are live",
    icon: UserGroupIcon,
  },
  {
    id: "expenses",
    label: "Expenses & Receipts",
    description: "Actual spend and receipt inbox",
    icon: ReceiptPercentIcon,
  },
  {
    id: "schedule",
    label: "Schedule",
    description: "Tasks, deadlines, and delivery progress",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    id: "documents",
    label: "Documents",
    description: "Contracts, permits, and files",
    icon: FolderOpenIcon,
  },
  {
    id: "analysis",
    label: "Analysis",
    description: "Original thesis and report history",
    icon: DocumentMagnifyingGlassIcon,
  },
];

const scopeFilterOptions = [
  { id: "all", label: "All scope" },
  { id: "attention", label: "Needs attention" },
  { id: "active", label: "Active work" },
  { id: "needs-vendor", label: "Needs vendor" },
  { id: "no-spend", label: "No spend yet" },
];

const formatDate = (value, fallback = "No date") => {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) {
    return fallback;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getEntityId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return value?._id || "";
  }

  return String(value);
};

const normalizeComparisonKey = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const bidAssignmentMatchesBudgetItem = (assignment, item) => {
  if (!assignment || !item) {
    return false;
  }

  const budgetItemId = getEntityId(item);
  const budgetItemLabel = item?.category || "";

  if (assignment.budgetItemId && assignment.budgetItemId === budgetItemId) {
    return true;
  }

  if (assignment.renovationItemId && assignment.renovationItemId === budgetItemId) {
    return true;
  }

  if (item?.sourceRenovationItemId && assignment.renovationItemId === item.sourceRenovationItemId) {
    return true;
  }

  const assignmentName = normalizeComparisonKey(
    assignment.budgetItemLabel || assignment.renovationItemName
  );
  const itemName = normalizeComparisonKey(budgetItemLabel);

  return Boolean(
    assignmentName &&
      itemName &&
      (assignmentName === itemName ||
        assignmentName.includes(itemName) ||
        itemName.includes(assignmentName))
  );
};

const getVendorDisplayName = (vendorLike, fallback = "Vendor") => {
  if (!vendorLike) {
    return fallback;
  }

  if (typeof vendorLike === "string") {
    return vendorLike;
  }

  return vendorLike?.name || fallback;
};

const isTaskComplete = (task) => task?.status === "Complete";
const isTaskBlocked = (task) => task?.status === "Blocked";

const isTaskOverdue = (task) => {
  if (!task || isTaskComplete(task) || !task.endDate) {
    return false;
  }

  return new Date(task.endDate).valueOf() < Date.now();
};

const HubMetricCard = ({ icon: Icon, label, value, hint, tone = "text-ink-900" }) => (
  <div className="rounded-[28px] border border-ink-100 bg-white/85 p-5 shadow-soft">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdigris-50 text-verdigris-600">
      <Icon className="h-6 w-6" />
    </div>
    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className={`mt-2 text-3xl font-semibold ${tone}`}>{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const SectionButton = ({ option, isActive, onClick }) => {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-[24px] border px-4 py-4 text-left transition ${
        isActive
          ? "border-ink-900 bg-ink-900 text-white shadow-soft"
          : "border-ink-100 bg-white/85 text-ink-700 hover:border-verdigris-200 hover:bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
            isActive
              ? "bg-white/12 text-white"
              : "bg-ink-50 text-ink-500 group-hover:bg-verdigris-50 group-hover:text-verdigris-700"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">{option.label}</p>
          <p className={`mt-1 text-xs ${isActive ? "text-white/75" : "text-ink-400"}`}>
            {option.description}
          </p>
        </div>
      </div>
    </button>
  );
};

const AttentionRow = ({ label, value, tone = "text-ink-900", hint = "" }) => (
  <div className="flex items-start justify-between gap-4 rounded-[20px] border border-ink-100 bg-white/80 px-4 py-4">
    <div>
      <p className="text-sm font-semibold text-ink-900">{label}</p>
      {hint ? <p className="mt-1 text-sm text-ink-500">{hint}</p> : null}
    </div>
    <p className={`text-sm font-semibold ${tone}`}>{value}</p>
  </div>
);

const ScopeNavigatorRow = ({ summary, selected, onSelect }) => {
  const budgetFill = Math.min((summary.spent / Math.max(summary.currentBudget || 1, 1)) * 100, 100);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[24px] border p-4 text-left transition ${
        selected
          ? "border-ink-900 bg-ink-900 text-white shadow-soft"
          : "border-ink-100 bg-white/90 hover:border-verdigris-200 hover:bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{summary.item.category || "Scope item"}</p>
            {summary.item.scopeKey ? (
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  selected ? "bg-white/12 text-white/80" : "bg-ink-50 text-ink-500"
                }`}
              >
                {getProjectScopeLabel(summary.item.scopeKey, summary.item.scopeKey)}
              </span>
            ) : null}
          </div>
          <p className={`mt-1 text-sm ${selected ? "text-white/75" : "text-ink-500"}`}>
            {summary.primaryVendorName || "No vendor assigned yet"}
          </p>
        </div>
        <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${selected ? "text-white/70" : "text-ink-400"}`}>
          {summary.healthLabel}
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${selected ? "text-white/65" : "text-ink-400"}`}>
            Budget
          </p>
          <p className="mt-1 text-sm font-semibold">{formatCurrency(summary.currentBudget)}</p>
        </div>
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${selected ? "text-white/65" : "text-ink-400"}`}>
            Spent
          </p>
          <p className="mt-1 text-sm font-semibold">{formatCurrency(summary.spent)}</p>
        </div>
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${selected ? "text-white/65" : "text-ink-400"}`}>
            Linked
          </p>
          <p className="mt-1 text-sm font-semibold">
            {summary.tasks.length + summary.receipts.length + summary.relatedQuotes.length}
          </p>
        </div>
      </div>

      <div className={`mt-4 h-2 overflow-hidden rounded-full ${selected ? "bg-white/15" : "bg-ink-100"}`}>
        <div
          className={`h-full rounded-full ${summary.overBudget ? "bg-clay-400" : selected ? "bg-sand-300" : "bg-verdigris-500"}`}
          style={{ width: `${Math.max(10, budgetFill)}%` }}
        />
      </div>
    </button>
  );
};

const ProjectExecutionHub = ({
  investment,
  budgetItems = [],
  expenses = [],
  tasks = [],
  vendors = [],
  bids = [],
  projectReceipts = [],
  sourceLeadSnapshot = null,
  sourceLeadId = "",
  propertyWorkspaceId = "",
  onRefresh,
  onDeleteProject,
}) => {
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [scopeQuery, setScopeQuery] = useState("");
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [expenseModalState, setExpenseModalState] = useState({
    isOpen: false,
    budgetItemId: "",
    awardId: "",
    mode: "manual",
  });
  const [taskModalState, setTaskModalState] = useState({
    isOpen: false,
    budgetItemId: "",
  });
  const [awardModalState, setAwardModalState] = useState({
    isOpen: false,
    budgetItem: null,
    award: null,
  });

  const metrics = useMemo(
    () => getInvestmentAnalysisMetrics(investment || {}, { budgetItems, expenses }),
    [budgetItems, expenses, investment]
  );

  const expensesByBudgetItemId = useMemo(() => {
    const groups = new Map();

    expenses.forEach((expense) => {
      const key = getEntityId(expense.budgetItem);
      if (!key) {
        return;
      }
      const current = groups.get(key) || [];
      current.push(expense);
      groups.set(key, current);
    });

    return groups;
  }, [expenses]);

  const tasksByBudgetItemId = useMemo(() => {
    const groups = new Map();

    tasks.forEach((task) => {
      const key = getEntityId(task.budgetItem);
      if (!key) {
        return;
      }
      const current = groups.get(key) || [];
      current.push(task);
      groups.set(key, current);
    });

    return groups;
  }, [tasks]);

  const receiptsByBudgetItemId = useMemo(() => {
    const groups = new Map();

    projectReceipts.forEach((receipt) => {
      const key = getEntityId(receipt.budgetItem);
      if (!key) {
        return;
      }
      const current = groups.get(key) || [];
      current.push(receipt);
      groups.set(key, current);
    });

    return groups;
  }, [projectReceipts]);

  const bidsByBudgetItemId = useMemo(() => {
    const groups = new Map();

    budgetItems.forEach((item) => {
      const matches = bids.flatMap((bid) =>
        (Array.isArray(bid.renovationAssignments) ? bid.renovationAssignments : [])
          .filter((assignment) => bidAssignmentMatchesBudgetItem(assignment, item))
          .map((assignment) => ({
            ...assignment,
            bidId: bid._id,
            bid,
          }))
      );

      if (matches.length) {
        groups.set(item._id, matches);
      }
    });

    return groups;
  }, [bids, budgetItems]);

  const scopeSummaries = useMemo(
    () =>
      budgetItems.map((item) => {
        const itemExpenses = expensesByBudgetItemId.get(item._id) || [];
        const itemTasks = tasksByBudgetItemId.get(item._id) || [];
        const itemReceipts = receiptsByBudgetItemId.get(item._id) || [];
        const itemQuotes = bidsByBudgetItemId.get(item._id) || [];
        const committed = Array.isArray(item.awards)
          ? item.awards.reduce((sum, award) => sum + toNumber(award.amount, 0), 0)
          : 0;
        const spent = itemExpenses.reduce((sum, expense) => sum + toNumber(expense.amount, 0), 0);
        const currentBudget = toNumber(item.budgetedAmount ?? item.originalBudgetAmount, 0);
        const remaining = currentBudget - spent;
        const openTasks = itemTasks.filter((task) => !isTaskComplete(task));
        const overdueTaskCount = openTasks.filter(isTaskOverdue).length;
        const receiptInboxCount = itemReceipts.filter((receipt) => !receipt.expense).length;
        const primaryVendorName =
          item.awards?.[0]
            ? getVendorDisplayName(item.awards[0].vendor, item.awards[0].vendorName || "Selected vendor")
            : "";
        const overBudget = remaining < 0;
        const needsVendor = !item.awards?.length;
        const needsAttention = overBudget || needsVendor || overdueTaskCount > 0 || receiptInboxCount > 0;
        const completionPercent = itemTasks.length
          ? (itemTasks.filter(isTaskComplete).length / itemTasks.length) * 100
          : spent > 0
            ? Math.min((spent / Math.max(currentBudget || 1, 1)) * 100, 100)
            : 0;

        return {
          item,
          expenses: itemExpenses,
          tasks: itemTasks,
          receipts: itemReceipts,
          relatedQuotes: itemQuotes,
          committed,
          spent,
          currentBudget,
          remaining,
          overBudget,
          needsVendor,
          overdueTaskCount,
          receiptInboxCount,
          openTasks,
          primaryVendorName,
          needsAttention,
          completionPercent,
          healthLabel: overBudget
            ? "Over budget"
            : needsVendor
              ? "Needs vendor"
              : openTasks.length
                ? "In progress"
                : spent > 0
                  ? "Tracking"
                  : "Planned",
        };
      }),
    [bidsByBudgetItemId, budgetItems, expensesByBudgetItemId, receiptsByBudgetItemId, tasksByBudgetItemId]
  );

  const filteredScopeSummaries = useMemo(() => {
    const normalizedQuery = normalizeComparisonKey(scopeQuery);

    return scopeSummaries.filter((summary) => {
      const matchesQuery = normalizedQuery
        ? normalizeComparisonKey(
            `${summary.item.category} ${summary.item.description} ${summary.primaryVendorName}`
          ).includes(normalizedQuery)
        : true;

      if (!matchesQuery) {
        return false;
      }

      if (scopeFilter === "attention") {
        return summary.needsAttention;
      }

      if (scopeFilter === "active") {
        return summary.spent > 0 || summary.openTasks.length > 0 || summary.relatedQuotes.length > 0;
      }

      if (scopeFilter === "needs-vendor") {
        return summary.needsVendor;
      }

      if (scopeFilter === "no-spend") {
        return summary.spent === 0;
      }

      return true;
    });
  }, [scopeFilter, scopeQuery, scopeSummaries]);

  useEffect(() => {
    if (!budgetItems.length) {
      setSelectedBudgetItemId("");
      return;
    }

    const exists = budgetItems.some((item) => item._id === selectedBudgetItemId);
    if (!exists) {
      setSelectedBudgetItemId(budgetItems[0]._id);
    }
  }, [budgetItems, selectedBudgetItemId]);

  useEffect(() => {
    if (!filteredScopeSummaries.length) {
      return;
    }

    const selectedIsVisible = filteredScopeSummaries.some(
      (summary) => summary.item._id === selectedBudgetItemId
    );

    if (!selectedIsVisible) {
      setSelectedBudgetItemId(filteredScopeSummaries[0].item._id);
    }
  }, [filteredScopeSummaries, selectedBudgetItemId]);

  const selectedScope = useMemo(
    () =>
      scopeSummaries.find((summary) => summary.item._id === selectedBudgetItemId) ||
      filteredScopeSummaries[0] ||
      scopeSummaries[0] ||
      null,
    [filteredScopeSummaries, scopeSummaries, selectedBudgetItemId]
  );

  const receiptInbox = useMemo(
    () => projectReceipts.filter((receipt) => !receipt.expense),
    [projectReceipts]
  );

  const uncategorizedExpenses = useMemo(
    () => expenses.filter((expense) => !expense.budgetItem),
    [expenses]
  );

  const overdueTasks = useMemo(() => tasks.filter(isTaskOverdue), [tasks]);
  const blockedTasks = useMemo(() => tasks.filter(isTaskBlocked), [tasks]);
  const openTasks = useMemo(() => tasks.filter((task) => !isTaskComplete(task)), [tasks]);

  const dueSoonTasks = useMemo(() => {
    const threeDaysFromNow = Date.now() + 1000 * 60 * 60 * 24 * 3;

    return tasks
      .filter((task) => !isTaskComplete(task) && task.endDate)
      .filter((task) => {
        const due = new Date(task.endDate).valueOf();
        return Number.isFinite(due) && due >= Date.now() && due <= threeDaysFromNow;
      })
      .sort((left, right) => new Date(left.endDate) - new Date(right.endDate));
  }, [tasks]);

  const topScopeSummaries = useMemo(
    () => [...scopeSummaries].sort((left, right) => right.currentBudget - left.currentBudget).slice(0, 4),
    [scopeSummaries]
  );

  const spendByScope = useMemo(
    () => [...scopeSummaries].sort((left, right) => right.spent - left.spent).slice(0, 6),
    [scopeSummaries]
  );

  const monthlySpend = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 30;

    return expenses.reduce((sum, expense) => {
      const expenseDate = new Date(expense.date || expense.createdAt || 0).valueOf();
      return expenseDate >= thirtyDaysAgo ? sum + toNumber(expense.amount, 0) : sum;
    }, 0);
  }, [expenses]);

  const receiptInboxAmount = useMemo(
    () => receiptInbox.reduce((sum, receipt) => sum + toNumber(receipt.amount, 0), 0),
    [receiptInbox]
  );

  const recentExpenses = useMemo(
    () =>
      [...expenses]
        .sort(
          (left, right) =>
            new Date(right.date || right.createdAt || 0).valueOf() -
            new Date(left.date || left.createdAt || 0).valueOf()
        )
        .slice(0, 8),
    [expenses]
  );

  const vendorSummaries = useMemo(() => {
    return vendors
      .map((vendor) => {
        const vendorId = vendor?._id || "";
        const relatedAwards = budgetItems.flatMap((item) =>
          (item.awards || [])
            .filter((award) => getEntityId(award.vendor) === vendorId)
            .map((award) => ({
              ...award,
              budgetItemId: item._id,
              budgetItemLabel: item.category || "Scope item",
            }))
        );
        const relatedAwardIds = new Set(relatedAwards.map((award) => award.awardId));
        const relatedExpenseRows = expenses.filter((expense) => {
          const expenseVendorId = getEntityId(expense.vendor);
          return (
            expenseVendorId === vendorId ||
            (expense.awardId && relatedAwardIds.has(expense.awardId))
          );
        });
        const relatedTasks = tasks.filter((task) => getEntityId(task.assignee) === vendorId);
        const relatedBids = bids.filter((bid) => {
          const bidVendorId = getEntityId(bid.vendor);
          return (
            bidVendorId === vendorId ||
            (!bidVendorId &&
              [bid.vendorSnapshot?.name, bid.contractorName]
                .filter(Boolean)
                .some((name) => normalizeComparisonKey(name) === normalizeComparisonKey(vendor.name)))
          );
        });
        const scopeLabels = Array.from(
          new Set(
            [
              ...relatedAwards.map((award) => award.budgetItemLabel),
              ...relatedExpenseRows
                .map((expense) =>
                  scopeSummaries.find((summary) => summary.item._id === getEntityId(expense.budgetItem))?.item
                    ?.category
                )
                .filter(Boolean),
              ...relatedTasks
                .map((task) =>
                  scopeSummaries.find((summary) => summary.item._id === getEntityId(task.budgetItem))?.item
                    ?.category
                )
                .filter(Boolean),
            ].filter(Boolean)
          )
        );
        const committed = relatedAwards.reduce((sum, award) => sum + toNumber(award.amount, 0), 0);
        const paid = relatedExpenseRows.reduce((sum, expense) => sum + toNumber(expense.amount, 0), 0);
        const openQuotes = relatedBids.filter((bid) => bid.decisionStatus !== "awarded").length;
        const awardedQuotes = relatedBids.filter((bid) => bid.decisionStatus === "awarded").length;
        const nextTask = [...relatedTasks]
          .filter((task) => !isTaskComplete(task))
          .sort((left, right) => new Date(left.endDate || 0) - new Date(right.endDate || 0))[0];

        return {
          vendor,
          scopeLabels,
          committed,
          paid,
          openQuotes,
          awardedQuotes,
          relatedTasks,
          nextTask,
        };
      })
      .sort((left, right) => (right.committed + right.paid) - (left.committed + left.paid));
  }, [bids, budgetItems, expenses, scopeSummaries, tasks, vendors]);

  const scopeQuoteBoard = useMemo(
    () =>
      scopeSummaries
        .map((summary) => {
          const openQuotes = summary.relatedQuotes.filter(
            (quote) => quote.bid?.decisionStatus !== "awarded"
          );
          const awardedQuote = summary.relatedQuotes.find(
            (quote) => quote.bid?.decisionStatus === "awarded"
          );
          const bestQuoteAmount = openQuotes.reduce((lowest, quote) => {
            const amount = toNumber(quote.amount, 0);
            if (!lowest) {
              return amount;
            }
            return amount < lowest ? amount : lowest;
          }, 0);

          return {
            ...summary,
            openQuotes,
            awardedQuote,
            bestQuoteAmount,
          };
        })
        .filter((summary) => summary.relatedQuotes.length || summary.item.awards?.length)
        .sort((left, right) => right.relatedQuotes.length - left.relatedQuotes.length)
        .slice(0, 8),
    [scopeSummaries]
  );

  const attentionRows = useMemo(
    () => [
      {
        label: "Scope categories over budget",
        value: scopeSummaries.filter((summary) => summary.overBudget).length,
        tone:
          scopeSummaries.filter((summary) => summary.overBudget).length > 0
            ? "text-clay-700"
            : "text-verdigris-700",
        hint: "Categories where actual spend has already crossed the current budget.",
      },
      {
        label: "Receipts waiting to be linked",
        value: receiptInbox.length,
        tone: receiptInbox.length > 0 ? "text-sand-700" : "text-verdigris-700",
        hint: "AI-read receipts that still need a confirmed expense.",
      },
      {
        label: "Project-level expenses",
        value: uncategorizedExpenses.length,
        tone: uncategorizedExpenses.length > 0 ? "text-sand-700" : "text-verdigris-700",
        hint: "Payments that are not attached to a budget category yet.",
      },
      {
        label: "Overdue tasks",
        value: overdueTasks.length,
        tone: overdueTasks.length > 0 ? "text-clay-700" : "text-verdigris-700",
        hint: "Open tasks whose due dates have already passed.",
      },
    ],
    [overdueTasks.length, receiptInbox.length, scopeSummaries, uncategorizedExpenses.length]
  );

  const handleOpenExpenseModal = ({
    budgetItemId = "",
    awardId = "",
    mode = "manual",
  } = {}) => {
    setExpenseModalState({
      isOpen: true,
      budgetItemId,
      awardId,
      mode,
    });
  };

  const handleOpenTaskModal = (budgetItemId = "") => {
    setTaskModalState({
      isOpen: true,
      budgetItemId,
    });
  };

  const handleSaveAward = async (payload) => {
    if (!awardModalState.budgetItem?._id) {
      return;
    }

    if (awardModalState.award?.awardId) {
      await updateBudgetAward(
        awardModalState.budgetItem._id,
        awardModalState.award.awardId,
        payload
      );
    } else {
      await addBudgetAward(awardModalState.budgetItem._id, payload);
    }

    await onRefresh?.();
  };

  const handleDeleteAward = async (budgetItem, award) => {
    if (!window.confirm("Remove this selected vendor from the scope item?")) {
      return;
    }

    await deleteBudgetAward(budgetItem._id, award.awardId);
    await onRefresh?.();
  };

  const handleDeleteVendor = async (vendorId) => {
    const confirmed = window.confirm(
      "Delete this vendor from the directory? Historical expenses and bids will stay linked."
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteVendor(vendorId);
      toast.success("Vendor removed");
      await onRefresh?.();
    } catch (error) {
      toast.error(error.message || "Failed to delete vendor");
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <section className="relative overflow-hidden rounded-[32px] border border-ink-100 bg-[radial-gradient(circle_at_top_left,_rgba(31,111,99,0.18),_transparent_36%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(249,246,239,0.92))] p-6 shadow-soft sm:p-7">
          <div className="relative z-[1]">
            <span className="eyebrow">Execution command center</span>
            <h2 className="mt-4 text-[2.3rem] font-semibold leading-[1.02] text-ink-900">
              One place to run the job from budget plan through real spend
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
              Scope categories drive the project now, so you can see the budget, vendors,
              receipts, expenses, quotes, and tasks in the same operational view.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Live budget
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">
                  {formatCurrency(metrics.totalBudget)}
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  {scopeSummaries.length} scope {scopeSummaries.length === 1 ? "category" : "categories"}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Committed vs spent
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">
                  {formatCurrency(metrics.totalCommitted)} / {formatCurrency(metrics.totalSpent)}
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  {formatCurrency(metrics.outstandingCommitted)} still committed and unpaid
                </p>
              </div>
              <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Progress pulse
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">
                  {Math.round(Number(investment.progress || 0))}%
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  {openTasks.length} open tasks and {receiptInbox.length} receipts waiting review
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-50 text-clay-600">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="eyebrow">Needs attention</span>
              <h3 className="mt-2 text-2xl font-semibold text-ink-900">What needs a decision</h3>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {attentionRows.map((row) => (
              <AttentionRow
                key={row.label}
                label={row.label}
                value={row.value}
                tone={row.tone}
                hint={row.hint}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Top scope categories</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Where the work is concentrated</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Open the scope budget view to manage any category in detail. This surfaces the
                biggest lines first so it is obvious where the project pressure is.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection("scope")}
              className="secondary-action"
            >
              Open scope budget
            </button>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {topScopeSummaries.length ? (
              topScopeSummaries.map((summary) => (
                <div
                  key={summary.item._id}
                  className="rounded-[24px] border border-ink-100 bg-ink-50/55 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-ink-900">{summary.item.category}</p>
                      <p className="mt-1 text-sm text-ink-500">
                        {summary.primaryVendorName || "No vendor assigned yet"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        summary.overBudget
                          ? "border border-clay-200 bg-clay-50 text-clay-700"
                          : "border border-verdigris-200 bg-verdigris-50 text-verdigris-700"
                      }`}
                    >
                      {summary.healthLabel}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Budget
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink-900">
                        {formatCurrency(summary.currentBudget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Spent
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink-900">
                        {formatCurrency(summary.spent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Open tasks
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink-900">
                        {summary.openTasks.length}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-sm leading-6 text-ink-500">
                No scope categories yet. Add your first category to start building the execution plan.
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
            <span className="eyebrow">Deal continuity</span>
            <h3 className="mt-4 text-3xl font-semibold text-ink-900">Original assumptions vs live execution</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-ink-100 bg-ink-50/55 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Lead rehab estimate</p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">
                  {formatCurrency(sourceLeadSnapshot?.rehabEstimate)}
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  What the deal was expected to need before project execution started.
                </p>
              </div>
              <div className="rounded-[24px] border border-ink-100 bg-ink-50/55 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Current project budget</p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">
                  {formatCurrency(metrics.totalBudget)}
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  The live budget category plan being used to run the work.
                </p>
              </div>
              <div className="rounded-[24px] border border-ink-100 bg-ink-50/55 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Actual spend</p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">
                  {formatCurrency(metrics.totalSpent)}
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  Real money already logged through expenses and linked receipts.
                </p>
              </div>
              <div className="rounded-[24px] border border-ink-100 bg-ink-50/55 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">ARV thesis</p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">
                  {formatCurrency(sourceLeadSnapshot?.arv || investment.arv)}
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  Saved here so the original deal logic remains visible as execution changes.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
            <span className="eyebrow">Next up</span>
            <h3 className="mt-4 text-3xl font-semibold text-ink-900">Immediate execution queue</h3>
            <div className="mt-6 space-y-3">
              {dueSoonTasks.length ? (
                dueSoonTasks.slice(0, 4).map((task) => (
                  <div
                    key={task._id}
                    className="rounded-[22px] border border-ink-100 bg-ink-50/55 p-4"
                  >
                    <p className="text-sm font-semibold text-ink-900">{task.title}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      Due {formatDate(task.endDate)}{task.budgetItem?.category ? ` • ${task.budgetItem.category}` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-ink-200 bg-ink-50/40 p-5 text-sm leading-6 text-ink-500">
                  No near-term tasks are due in the next few days.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const renderScopeSection = () => (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="eyebrow">Scope budget</span>
            <h2 className="mt-4 text-[2.2rem] font-semibold leading-[1.02] text-ink-900">
              Manage the project by category instead of bouncing between tools
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
              Open a category and manage its budget, selected vendors, quotes, linked receipts,
              expenses, and tasks from the same detail view.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowAddBudgetModal(true)} className="primary-action">
              Add scope category
            </button>
            <button
              type="button"
              onClick={() => handleOpenExpenseModal()}
              className="secondary-action"
            >
              Add expense
            </button>
            <button
              type="button"
              onClick={() => handleOpenExpenseModal({ mode: "receipt" })}
              className="secondary-action"
            >
              Scan receipt
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-[32px] border border-ink-100 bg-white/90 p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-900">Category navigator</p>
                <p className="mt-1 text-sm text-ink-500">
                  Filter down to the scope items that need attention.
                </p>
              </div>
              <span className="rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-600">
                {filteredScopeSummaries.length}
              </span>
            </div>

            <div className="mt-4">
              <input
                type="text"
                value={scopeQuery}
                onChange={(event) => setScopeQuery(event.target.value)}
                placeholder="Search categories, vendors, notes"
                className="auth-input"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {scopeFilterOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setScopeFilter(option.id)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    scopeFilter === option.id
                      ? "bg-ink-900 text-white"
                      : "bg-ink-50 text-ink-600 hover:bg-ink-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {filteredScopeSummaries.length ? (
                filteredScopeSummaries.map((summary) => (
                  <ScopeNavigatorRow
                    key={summary.item._id}
                    summary={summary}
                    selected={summary.item._id === selectedScope?.item._id}
                    onSelect={() => setSelectedBudgetItemId(summary.item._id)}
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-5 text-sm leading-6 text-ink-500">
                  No scope categories match the current filter.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[32px] border border-ink-100 bg-white/90 p-5 shadow-soft">
            <p className="text-sm font-semibold text-ink-900">Project-level spend</p>
            <p className="mt-1 text-sm text-ink-500">
              Costs not tied to a category stay visible here so they do not disappear.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Uncategorized expenses
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">
                  {uncategorizedExpenses.length}
                </p>
                <p className="mt-2 text-sm text-ink-500">
                  {formatCurrency(
                    uncategorizedExpenses.reduce((sum, expense) => sum + toNumber(expense.amount, 0), 0)
                  )}
                </p>
              </div>
              <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Receipts waiting review
                </p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">{receiptInbox.length}</p>
                <p className="mt-2 text-sm text-ink-500">{formatCurrency(receiptInboxAmount)}</p>
              </div>
            </div>
          </section>
        </aside>

        <div className="space-y-6">
          {selectedScope ? (
            <>
              <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="eyebrow">Selected category</span>
                      {selectedScope.item.scopeKey ? (
                        <span className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1 text-xs font-semibold text-sand-700">
                          {getProjectScopeLabel(
                            selectedScope.item.scopeKey,
                            selectedScope.item.scopeKey
                          )}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 text-3xl font-semibold text-ink-900">
                      {selectedScope.item.category}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                      {selectedScope.item.description || "No scope description added yet."}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Budget</p>
                      <p className="mt-2 text-xl font-semibold text-ink-900">
                        {formatCurrency(selectedScope.currentBudget)}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Committed</p>
                      <p className="mt-2 text-xl font-semibold text-ink-900">
                        {formatCurrency(selectedScope.committed)}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Actual spend</p>
                      <p className="mt-2 text-xl font-semibold text-ink-900">
                        {formatCurrency(selectedScope.spent)}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-ink-100 bg-ink-50/55 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Completion</p>
                      <p className="mt-2 text-xl font-semibold text-ink-900">
                        {Math.round(selectedScope.completionPercent)}%
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <BudgetLineItem
                item={selectedScope.item}
                expenses={selectedScope.expenses}
                tasks={selectedScope.tasks}
                receipts={selectedScope.receipts}
                relatedBids={selectedScope.relatedQuotes}
                onAddExpense={() => handleOpenExpenseModal({ budgetItemId: selectedScope.item._id })}
                onScanReceipt={() =>
                  handleOpenExpenseModal({ budgetItemId: selectedScope.item._id, mode: "receipt" })
                }
                onAddTask={() => handleOpenTaskModal(selectedScope.item._id)}
                onAddAward={() =>
                  setAwardModalState({ isOpen: true, budgetItem: selectedScope.item, award: null })
                }
                onEditAward={(award) =>
                  setAwardModalState({
                    isOpen: true,
                    budgetItem: selectedScope.item,
                    award,
                  })
                }
                onDeleteAward={(award) => handleDeleteAward(selectedScope.item, award)}
              />
            </>
          ) : (
            <div className="rounded-[32px] border border-dashed border-ink-200 bg-white/80 p-8 text-center text-sm leading-6 text-ink-500">
              Add the first scope category to start running the project from a structured budget.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderVendorsSection = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HubMetricCard
          icon={UserGroupIcon}
          label="Active vendors"
          value={vendorSummaries.filter((row) => row.vendor.isActive !== false).length}
          hint={`${vendors.length} total in the directory`}
        />
        <HubMetricCard
          icon={BanknotesIcon}
          label="Committed vendor cost"
          value={formatCurrency(metrics.totalCommitted)}
          hint="Selected awards across the scope budget."
        />
        <HubMetricCard
          icon={CheckCircleIcon}
          label="Awarded quotes"
          value={bids.filter((bid) => bid.decisionStatus === "awarded").length}
          hint="Quotes already converted into project commitments."
        />
        <HubMetricCard
          icon={DocumentMagnifyingGlassIcon}
          label="Open quotes"
          value={bids.filter((bid) => bid.decisionStatus !== "awarded").length}
          hint="Quotes still available for comparison and award."
        />
      </div>

      <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="eyebrow">Vendor directory in context</span>
            <h2 className="mt-4 text-[2.2rem] font-semibold leading-[1.02] text-ink-900">
              See every subcontractor next to the scope, money, and quotes they touch
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
              This keeps the roster grounded in real project work instead of feeling like a separate
              address book.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowAddVendorModal(true)} className="primary-action">
              Add vendor
            </button>
            <button type="button" onClick={() => setActiveSection("scope")} className="secondary-action">
              Assign by category
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {vendorSummaries.length ? (
            vendorSummaries.map((summary) => (
              <div
                key={summary.vendor._id}
                className="rounded-[26px] border border-ink-100 bg-ink-50/50 p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-ink-900">{summary.vendor.name}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          summary.vendor.isActive === false
                            ? "border border-clay-200 bg-clay-50 text-clay-700"
                            : "border border-verdigris-200 bg-verdigris-50 text-verdigris-700"
                        }`}
                      >
                        {summary.vendor.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-500">
                      {summary.vendor.trade || "Trade not specified"}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-ink-500">
                      {summary.vendor.notes || "No notes saved for this vendor yet."}
                    </p>
                  </div>

                  <div className="rounded-[20px] border border-ink-100 bg-white/85 px-4 py-3 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Paid / committed
                    </p>
                    <p className="mt-2 text-lg font-semibold text-ink-900">
                      {formatCurrency(summary.paid)} / {formatCurrency(summary.committed)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[20px] border border-ink-100 bg-white/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Scope</p>
                    <p className="mt-2 text-sm font-semibold text-ink-900">
                      {summary.scopeLabels.length || 0}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-ink-100 bg-white/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Open quotes</p>
                    <p className="mt-2 text-sm font-semibold text-ink-900">{summary.openQuotes}</p>
                  </div>
                  <div className="rounded-[20px] border border-ink-100 bg-white/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Awarded quotes</p>
                    <p className="mt-2 text-sm font-semibold text-ink-900">{summary.awardedQuotes}</p>
                  </div>
                  <div className="rounded-[20px] border border-ink-100 bg-white/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Assigned tasks</p>
                    <p className="mt-2 text-sm font-semibold text-ink-900">{summary.relatedTasks.length}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[20px] border border-ink-100 bg-white/85 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Assigned categories</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {summary.scopeLabels.length ? (
                      summary.scopeLabels.map((label) => (
                        <span
                          key={`${summary.vendor._id}-${label}`}
                          className="rounded-full bg-sand-50 px-3 py-1 text-xs font-semibold text-sand-700"
                        >
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-ink-500">No categories tied to this vendor yet.</span>
                    )}
                  </div>
                  <p className="mt-4 text-sm text-ink-500">
                    {summary.nextTask
                      ? `Next task: ${summary.nextTask.title} due ${formatDate(summary.nextTask.endDate)}`
                      : "No upcoming vendor task is scheduled yet."}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingVendor(summary.vendor)}
                    className="secondary-action"
                  >
                    Edit vendor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVendor(summary.vendor._id)}
                    className="ghost-action text-clay-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[26px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-sm leading-6 text-ink-500">
              No vendors are saved yet. Add the first vendor so categories, expenses, quotes, and
              tasks can all point to a real subcontractor.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
        <span className="eyebrow">Quote board</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">Bid context by category</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
          Awarded bids show up next to the category budget, while open quotes stay visible for
          comparison before you commit.
        </p>

        <div className="mt-8 grid gap-4 xl:grid-cols-2">
          {scopeQuoteBoard.length ? (
            scopeQuoteBoard.map((row) => (
              <div
                key={row.item._id}
                className="rounded-[24px] border border-ink-100 bg-ink-50/55 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-ink-900">{row.item.category}</p>
                    <p className="mt-1 text-sm text-ink-500">
                      {row.relatedQuotes.length} related quote{row.relatedQuotes.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("scope");
                      setSelectedBudgetItemId(row.item._id);
                    }}
                    className="ghost-action"
                  >
                    Open category
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] border border-ink-100 bg-white/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Budget
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink-900">
                      {formatCurrency(row.currentBudget)}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-ink-100 bg-white/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Best open quote
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink-900">
                      {row.openQuotes.length ? formatCurrency(row.bestQuoteAmount) : "—"}
                    </p>
                  </div>
                  <div className="rounded-[20px] border border-ink-100 bg-white/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                      Awarded
                    </p>
                    <p className="mt-2 text-sm font-semibold text-ink-900">
                      {row.awardedQuote ? formatCurrency(row.awardedQuote.amount) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-sm leading-6 text-ink-500">
              No bid activity is tied to the scope budget yet.
            </div>
          )}
        </div>
      </section>

      {sourceLeadId ? (
        <BidsTab
          leadId={sourceLeadId}
          investmentId={investment._id}
          bids={bids}
          renovationItems={sourceLeadSnapshot?.renovationPlan?.items || []}
          budgetItems={budgetItems}
          onUpdate={onRefresh}
        />
      ) : (
        <div className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
          <span className="eyebrow">Bid management</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">No source lead found</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
            This project was not created from a lead, so there is no imported quote history to show here.
          </p>
        </div>
      )}
    </div>
  );

  const renderExpensesSection = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HubMetricCard
          icon={ReceiptPercentIcon}
          label="Receipt inbox"
          value={receiptInbox.length}
          hint={`${formatCurrency(receiptInboxAmount)} waiting to be confirmed`}
        />
        <HubMetricCard
          icon={BanknotesIcon}
          label="Actual spend"
          value={formatCurrency(metrics.totalSpent)}
          hint={`${formatCurrency(monthlySpend)} logged in the last 30 days`}
        />
        <HubMetricCard
          icon={ExclamationTriangleIcon}
          label="Unassigned spend"
          value={formatCurrency(metrics.unassignedSpent)}
          hint={`${uncategorizedExpenses.length} project-level expense${uncategorizedExpenses.length === 1 ? "" : "s"}`}
          tone={uncategorizedExpenses.length ? "text-sand-700" : "text-ink-900"}
        />
        <HubMetricCard
          icon={ClockIcon}
          label="Open approvals"
          value={expenses.filter((expense) => ["draft", "approved"].includes(expense.status || "paid")).length}
          hint="Expenses still in draft or approved status."
        />
      </div>

      <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="eyebrow">Expense workflow</span>
            <h2 className="mt-4 text-[2.2rem] font-semibold leading-[1.02] text-ink-900">
              Receipts, expenses, and category rollups stay in one workflow
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
              The receipt inbox makes review visible, and category spend is always one click away
              from the matching budget line.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleOpenExpenseModal()}
              className="primary-action"
            >
              Add manual expense
            </button>
            <button
              type="button"
              onClick={() => handleOpenExpenseModal({ mode: "receipt" })}
              className="secondary-action"
            >
              Upload receipt
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Receipt inbox</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Waiting for confirmation</h3>
            </div>
            <span className="rounded-full border border-verdigris-200 bg-verdigris-50 px-3 py-1 text-xs font-semibold text-verdigris-700">
              {receiptInbox.length}
            </span>
          </div>

          <div className="mt-8 space-y-3">
            {receiptInbox.length ? (
              receiptInbox.slice(0, 8).map((receipt) => (
                <div
                  key={receipt._id}
                  className="rounded-[24px] border border-ink-100 bg-ink-50/55 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-ink-900">
                        {receipt.title || receipt.payeeName || "Receipt"}
                      </p>
                      <p className="mt-1 text-sm text-ink-500">
                        {receipt.payeeName || "Unknown vendor"}
                        {receipt.suggestedBudgetItemSnapshot?.category
                          ? ` • Suggested category: ${receipt.suggestedBudgetItemSnapshot.category}`
                          : ""}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                        {formatDate(receipt.receiptDate || receipt.createdAt, "Recently uploaded")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-ink-900">
                        {receipt.amount !== null && receipt.amount !== undefined
                          ? formatCurrency(receipt.amount)
                          : "Amount pending"}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-sand-700">
                        Awaiting expense link
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-sm leading-6 text-ink-500">
                No receipts are waiting right now. New AI receipt uploads will show up here until
                they are confirmed into expenses.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Project-level expenses</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Unassigned or project-wide spend</h3>
            </div>
            <span className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1 text-xs font-semibold text-sand-700">
              {uncategorizedExpenses.length}
            </span>
          </div>

          <div className="mt-8 space-y-3">
            {uncategorizedExpenses.length ? (
              uncategorizedExpenses.slice(0, 8).map((expense) => (
                <div
                  key={expense._id}
                  className="rounded-[24px] border border-ink-100 bg-ink-50/55 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-ink-900">{expense.title}</p>
                      <p className="mt-1 text-sm text-ink-500">
                        {expense.vendor?.name || expense.payeeName || "General expense"}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                        {formatDate(expense.date || expense.createdAt)}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-ink-900">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-sm leading-6 text-ink-500">
                Every current expense is already assigned to a category.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
          <span className="eyebrow">Recent spend</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">Latest expense activity</h3>
          <div className="mt-8 space-y-3">
            {recentExpenses.length ? (
              recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="rounded-[24px] border border-ink-100 bg-ink-50/55 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-ink-900">{expense.title}</p>
                      <p className="mt-1 text-sm text-ink-500">
                        {(expense.budgetItem?.category || "Project-wide") +
                          ` • ${expense.vendor?.name || expense.payeeName || "General expense"}`}
                      </p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                        {formatDate(expense.date || expense.createdAt)}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-ink-900">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-sm leading-6 text-ink-500">
                No expenses have been logged yet.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
          <span className="eyebrow">Spend by category</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">Actual vs budget rollup</h3>
          <div className="mt-8 space-y-4">
            {spendByScope.length ? (
              spendByScope.map((summary) => {
                const percent = Math.min(
                  (summary.spent / Math.max(summary.currentBudget || 1, 1)) * 100,
                  100
                );

                return (
                  <div key={summary.item._id} className="rounded-[24px] border border-ink-100 bg-ink-50/55 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-ink-900">{summary.item.category}</p>
                      <p
                        className={`text-sm font-semibold ${
                          summary.overBudget ? "text-clay-700" : "text-ink-900"
                        }`}
                      >
                        {formatCurrency(summary.spent)} / {formatCurrency(summary.currentBudget)}
                      </p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={`h-full rounded-full ${summary.overBudget ? "bg-clay-500" : "bg-verdigris-500"}`}
                        style={{ width: `${Math.max(10, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-sm leading-6 text-ink-500">
                Category rollups will appear as soon as expenses are logged.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const renderScheduleSection = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HubMetricCard
          icon={ClipboardDocumentCheckIcon}
          label="Total tasks"
          value={tasks.length}
          hint={`${openTasks.length} still open`}
        />
        <HubMetricCard
          icon={CheckCircleIcon}
          label="Completion"
          value={`${tasks.length ? Math.round((tasks.filter(isTaskComplete).length / tasks.length) * 100) : 0}%`}
          hint={`${tasks.filter(isTaskComplete).length} complete`}
        />
        <HubMetricCard
          icon={ExclamationTriangleIcon}
          label="Blocked"
          value={blockedTasks.length}
          hint="Tasks explicitly marked blocked."
          tone={blockedTasks.length ? "text-clay-700" : "text-ink-900"}
        />
        <HubMetricCard
          icon={ClockIcon}
          label="Overdue"
          value={overdueTasks.length}
          hint="Tasks whose due dates have already passed."
          tone={overdueTasks.length ? "text-clay-700" : "text-ink-900"}
        />
      </div>

      <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="eyebrow">Execution schedule</span>
            <h2 className="mt-4 text-[2.2rem] font-semibold leading-[1.02] text-ink-900">
              Track the work by what is happening, where it belongs, and who owns it
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
              Tasks now read as part of the category workflow instead of a detached checklist.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenTaskModal()}
            className="primary-action"
          >
            Add task
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
          <span className="eyebrow">Scope progress</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">Category by category</h3>
          <div className="mt-8 space-y-4">
            {scopeSummaries.length ? (
              scopeSummaries.map((summary) => (
                <div key={summary.item._id} className="rounded-[24px] border border-ink-100 bg-ink-50/55 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-ink-900">{summary.item.category}</p>
                    <p className="text-sm font-semibold text-ink-900">
                      {summary.tasks.filter(isTaskComplete).length}/{summary.tasks.length || 0} done
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-verdigris-500"
                      style={{ width: `${Math.max(6, Math.min(summary.completionPercent, 100))}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-ink-500">
                    {summary.openTasks.length
                      ? `${summary.openTasks.length} open task${summary.openTasks.length === 1 ? "" : "s"}`
                      : "No open tasks"}
                    {summary.overdueTaskCount ? ` • ${summary.overdueTaskCount} overdue` : ""}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-sm leading-6 text-ink-500">
                No category progress yet because there are no scope-linked tasks.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
          <span className="eyebrow">Task board</span>
          <h3 className="mt-4 text-3xl font-semibold text-ink-900">Upcoming and active work</h3>
          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {tasks.length ? (
              [...tasks]
                .sort(
                  (left, right) =>
                    new Date(left.endDate || 0).valueOf() - new Date(right.endDate || 0).valueOf()
                )
                .map((task) => <TaskItem key={task._id} task={task} onUpdate={onRefresh} />)
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink-200 bg-ink-50/40 p-6 text-sm leading-6 text-ink-500 xl:col-span-2">
                No tasks yet. Add one to start turning the budget plan into an execution schedule.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const renderAnalysisSection = () => (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-ink-100 bg-white/90 p-6 shadow-soft sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="eyebrow">Deal to project continuity</span>
            <h2 className="mt-4 text-[2.2rem] font-semibold leading-[1.02] text-ink-900">
              Keep the original deal thesis visible while the project evolves
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500 sm:text-base">
              Saved reports, carried-over assumptions, and the live project numbers stay together
              so execution never loses the original context.
            </p>
          </div>
          <div className="rounded-[24px] border border-ink-100 bg-ink-50/55 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
              Project source
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              {sourceLeadId ? "Created from a lead / deal workflow" : "Standalone project"}
            </p>
          </div>
        </div>
      </section>

      <ProjectCompsTab
        investmentId={investment._id}
        sourceLeadId={sourceLeadId}
        propertyWorkspaceId={propertyWorkspaceId}
        snapshot={sourceLeadSnapshot}
      />
    </div>
  );

  return (
    <>
      <AddExpenseModal
        isOpen={expenseModalState.isOpen}
        onClose={() =>
          setExpenseModalState({ isOpen: false, budgetItemId: "", awardId: "", mode: "manual" })
        }
        investmentId={investment._id}
        defaultBudgetItemId={expenseModalState.budgetItemId}
        defaultAwardId={expenseModalState.awardId}
        initialMode={expenseModalState.mode}
        onSuccess={onRefresh}
        budgetItems={budgetItems}
        vendors={vendors}
      />
      <AddBudgetItemModal
        isOpen={showAddBudgetModal}
        onClose={() => setShowAddBudgetModal(false)}
        investmentId={investment._id}
        onSuccess={onRefresh}
      />
      <AddTaskModal
        isOpen={taskModalState.isOpen}
        onClose={() => setTaskModalState({ isOpen: false, budgetItemId: "" })}
        onSuccess={onRefresh}
        investmentId={investment._id}
        vendors={vendors}
        budgetItems={budgetItems}
        defaultBudgetItemId={taskModalState.budgetItemId}
      />
      <BudgetAwardModal
        isOpen={awardModalState.isOpen}
        onClose={() => setAwardModalState({ isOpen: false, budgetItem: null, award: null })}
        onSave={handleSaveAward}
        vendors={vendors}
        budgetItem={awardModalState.budgetItem}
        initialAward={awardModalState.award}
      />
      <AddVendorModal
        isOpen={showAddVendorModal}
        onClose={() => setShowAddVendorModal(false)}
        onSuccess={onRefresh}
        title="Add project vendor"
        eyebrow="Project team"
        description="Save a subcontractor or supplier so categories, bids, tasks, and expenses can stay connected."
        submitLabel="Save vendor"
      />
      <EditVendorModal
        isOpen={Boolean(editingVendor)}
        onClose={() => setEditingVendor(null)}
        onSuccess={onRefresh}
        vendor={editingVendor}
      />

      <div className="space-y-6">
        <section className="rounded-[32px] border border-ink-100 bg-white/75 p-4 shadow-soft sm:p-5">
          <div className="grid gap-3 xl:grid-cols-4">
            {sectionOptions.map((option) => (
              <SectionButton
                key={option.id}
                option={option}
                isActive={activeSection === option.id}
                onClick={() => setActiveSection(option.id)}
              />
            ))}
          </div>
        </section>

        {activeSection === "overview" ? renderOverview() : null}
        {activeSection === "scope" ? renderScopeSection() : null}
        {activeSection === "vendors" ? renderVendorsSection() : null}
        {activeSection === "expenses" ? renderExpensesSection() : null}
        {activeSection === "schedule" ? renderScheduleSection() : null}
        {activeSection === "documents" ? <DocumentsTab investment={investment} /> : null}
        {activeSection === "analysis" ? renderAnalysisSection() : null}

        <section className="rounded-[32px] border border-clay-100 bg-clay-50/50 p-6 shadow-soft sm:p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <span className="eyebrow">Project settings</span>
              <h3 className="mt-4 text-3xl font-semibold text-ink-900">Administrative controls</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Keep this tucked away at the bottom so the workspace stays focused on execution.
              </p>
            </div>
            <button
              type="button"
              onClick={onDeleteProject}
              className="rounded-full bg-clay-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-clay-700"
            >
              Delete project
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default ProjectExecutionHub;
