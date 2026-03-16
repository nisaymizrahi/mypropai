import { toNumber } from "./investmentMetrics";

export const EXPENSE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "reimbursed", label: "Reimbursed" },
];

export const EXPENSE_PAYMENT_METHOD_OPTIONS = [
  { value: "other", label: "Other" },
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit card" },
  { value: "debit_card", label: "Debit card" },
];

export const EXPENSE_RECURRING_CATEGORY_OPTIONS = [
  { value: "", label: "No recurring carry tag" },
  { value: "taxes", label: "Taxes" },
  { value: "insurance", label: "Insurance" },
  { value: "utilities", label: "Utilities" },
  { value: "other_monthly", label: "Other monthly carry" },
];

export const getExpenseStatusLabel = (value = "") =>
  EXPENSE_STATUS_OPTIONS.find((option) => option.value === value)?.label || "Paid";

export const getExpensePaymentMethodLabel = (value = "") =>
  EXPENSE_PAYMENT_METHOD_OPTIONS.find((option) => option.value === value)?.label || "Other";

export const getExpenseRecurringCategoryLabel = (value = "") =>
  EXPENSE_RECURRING_CATEGORY_OPTIONS.find((option) => option.value === value)?.label || "";

export const getExpenseStatusClasses = (value = "") => {
  if (value === "draft") {
    return "bg-sand-50 text-sand-700";
  }

  if (value === "approved") {
    return "bg-sky-50 text-sky-700";
  }

  if (value === "reimbursed") {
    return "bg-clay-50 text-clay-700";
  }

  return "bg-verdigris-50 text-verdigris-700";
};

const normalizeKey = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) {
    return null;
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const getDuplicateGroupKey = (expense = {}) => {
  const amount = Math.round(toNumber(expense.amount, 0) * 100);
  const payee = normalizeKey(expense.vendor?.name || expense.payeeName || "");
  const title = normalizeKey(expense.title || "");
  const descriptor = payee || title;

  if (!descriptor || amount <= 0) {
    return "";
  }

  return `${descriptor}::${amount}`;
};

export const buildExpenseDuplicateGroups = (expenses = [], windowDays = 10) => {
  const grouped = new Map();

  expenses.forEach((expense) => {
    const key = getDuplicateGroupKey(expense);
    if (!key) {
      return;
    }

    const current = grouped.get(key) || [];
    current.push(expense);
    grouped.set(key, current);
  });

  return [...grouped.values()]
    .map((items) => {
      const sorted = [...items].sort(
        (left, right) => new Date(left.date || 0).getTime() - new Date(right.date || 0).getTime()
      );

      const baseDate = normalizeDateValue(sorted[0]?.date);
      const lastDate = normalizeDateValue(sorted[sorted.length - 1]?.date);
      const withinWindow =
        baseDate && lastDate
          ? Math.abs(lastDate.getTime() - baseDate.getTime()) <= windowDays * 24 * 60 * 60 * 1000
          : false;

      return {
        key: getDuplicateGroupKey(sorted[0]),
        expenses: sorted,
        withinWindow,
        totalAmount: sorted.reduce((sum, expense) => sum + toNumber(expense.amount, 0), 0),
      };
    })
    .filter((group) => group.expenses.length > 1 && group.withinWindow)
    .sort(
      (left, right) =>
        right.expenses.length - left.expenses.length || right.totalAmount - left.totalAmount
    );
};

export const buildRecurringCarryTemplates = (investment = {}) =>
  [
    {
      id: "taxes",
      label: "Taxes",
      amount: toNumber(investment?.taxes, 0),
      title: "Monthly property taxes",
      description: "Recurring carry expense from finance assumptions.",
      recurringCategory: "taxes",
    },
    {
      id: "insurance",
      label: "Insurance",
      amount: toNumber(investment?.insurance, 0),
      title: "Monthly insurance",
      description: "Recurring carry expense from finance assumptions.",
      recurringCategory: "insurance",
    },
    {
      id: "utilities",
      label: "Utilities",
      amount: toNumber(investment?.utilities, 0),
      title: "Monthly utilities",
      description: "Recurring carry expense from finance assumptions.",
      recurringCategory: "utilities",
    },
    {
      id: "other_monthly",
      label: "Other monthly carry",
      amount: toNumber(investment?.otherMonthly, 0),
      title: "Other monthly carry",
      description: "Recurring carry expense from finance assumptions.",
      recurringCategory: "other_monthly",
    },
  ].filter((item) => item.amount > 0);
