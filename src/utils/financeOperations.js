import {
  getDrawRequestLabel,
  getFundingCurrentBalance,
  getFundingPaymentDraft,
  getFundingSourceById,
  getFundingSourceLabel,
} from "./capitalStack";
import { toNumber } from "./investmentMetrics";

const normalizeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }
  return parsed;
};

const startOfDay = (value = new Date()) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getDateKey = (value) => {
  const parsed = normalizeDate(value);
  if (!parsed) {
    return "";
  }

  return startOfDay(parsed).toISOString().slice(0, 10);
};

export const addDaysToDate = (value, days) => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

export const addMonthsToDate = (value, months) => {
  const next = new Date(value);
  next.setMonth(next.getMonth() + months);
  return next;
};

const setDayOfMonth = (value, day = 1) => {
  const next = new Date(value);
  const safeDay = Math.max(1, Math.min(31, toNumber(day, 1)));
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(safeDay, lastDay));
  return next;
};

const getEventTitle = (source = {}) => {
  if (source.paymentFrequency === "at_sale") {
    return "Balloon / payoff";
  }

  if (source.paymentType === "interest_only") {
    return "Interest payment";
  }

  if (source.paymentType === "amortizing") {
    return "Loan payment";
  }

  if (source.paymentType === "revolving") {
    return "Card / revolving payment";
  }

  return "Scheduled payment";
};

export const buildFundingPaymentSchedule = (
  fundingSources = [],
  {
    holdingMonths = 6,
    anchorDate = new Date(),
  } = {}
) => {
  const safeAnchor = startOfDay(anchorDate);
  const events = [];

  fundingSources.forEach((source, index) => {
    const sourceLabel = getFundingSourceLabel(source, index);
    const paymentDraft = toNumber(getFundingPaymentDraft(source), 0);
    const amount = toNumber(source.amount, 0);
    const startDate = startOfDay(normalizeDate(source.paymentStartDate) || safeAnchor);
    const modeledHoldingMonths = Math.max(toNumber(holdingMonths, 0), 6);
    const modeledTermMonths =
      toNumber(source.termMonths, 0) > 0
        ? Math.min(toNumber(source.termMonths, 0), modeledHoldingMonths)
        : modeledHoldingMonths;

    if (source.paymentFrequency === "at_draw") {
      events.push({
        scheduleId: `${source.sourceId || `source-${index}`}-event-draw`,
        sourceId: source.sourceId || "",
        sourceLabel,
        dueDate: startDate,
        amount: paymentDraft,
        title: "Due with draw release",
        paymentType: source.paymentType || "",
        paymentFrequency: source.paymentFrequency || "",
        eventBased: true,
      });
      return;
    }

    if (source.paymentFrequency === "at_sale") {
      const dueDate =
        normalizeDate(source.maturityDate) || addMonthsToDate(startDate, modeledTermMonths);
      events.push({
        scheduleId: `${source.sourceId || `source-${index}`}-event-sale`,
        sourceId: source.sourceId || "",
        sourceLabel,
        dueDate,
        amount: Math.max(amount, paymentDraft),
        title: getEventTitle(source),
        paymentType: source.paymentType || "",
        paymentFrequency: source.paymentFrequency || "",
        eventBased: false,
      });
      return;
    }

    if (paymentDraft <= 0) {
      return;
    }

    const intervalMonths = source.paymentFrequency === "quarterly" ? 3 : 1;
    const paymentCount = Math.max(1, Math.ceil(modeledTermMonths / intervalMonths));

    Array.from({ length: paymentCount }).forEach((_, paymentIndex) => {
      const dueDate = setDayOfMonth(
        addMonthsToDate(startDate, paymentIndex * intervalMonths),
        source.paymentDay
      );

      events.push({
        scheduleId: `${source.sourceId || `source-${index}`}-payment-${paymentIndex + 1}`,
        sourceId: source.sourceId || "",
        sourceLabel,
        dueDate,
        amount: paymentDraft,
        title: getEventTitle(source),
        paymentType: source.paymentType || "",
        paymentFrequency: source.paymentFrequency || "",
        eventBased: false,
      });
    });
  });

  return events.sort((left, right) => {
    const leftTime = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const rightTime = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return leftTime - rightTime;
  });
};

export const buildDrawOperationsSummary = ({
  drawRequests = [],
  fundingSources = [],
  expenses = [],
  documents = [],
}) =>
  drawRequests.map((request, index) => {
    const linkedSource = getFundingSourceById(fundingSources, request.sourceId);
    const linkedExpenses = expenses.filter((expense) => expense.drawRequestId === request.drawId);
    const linkedDocuments = documents.filter(
      (document) => document.drawRequestId === request.drawId
    );
    const linkedExpenseAmount = linkedExpenses.reduce(
      (sum, expense) => sum + toNumber(expense.amount, 0),
      0
    );
    const amountRequested = toNumber(request.amountRequested, 0);
    const amountFunded = toNumber(request.amountFunded, 0);
    const outstandingAmount = Math.max(amountRequested - amountFunded, 0);
    const packetChecks = [
      { label: "Source linked", complete: Boolean(request.sourceId) },
      { label: "Request amount set", complete: amountRequested > 0 },
      { label: "Packet docs attached", complete: linkedDocuments.length > 0 },
      { label: "Expenses linked", complete: linkedExpenses.length > 0 },
    ];
    const packetScore = packetChecks.filter((item) => item.complete).length;

    return {
      ...request,
      label: request.label || getDrawRequestLabel(request, index),
      sourceLabel: linkedSource
        ? getFundingSourceLabel(
            linkedSource,
            Math.max(
              fundingSources.findIndex((source) => source.sourceId === linkedSource.sourceId),
              0
            )
          )
        : request.sourceId
          ? "Archived funding source"
          : "No funding source",
      linkedExpenses,
      linkedDocuments,
      linkedExpenseAmount,
      amountRequested,
      amountFunded,
      outstandingAmount,
      packetChecks,
      packetScore,
      packetReady: packetScore === packetChecks.length,
      supportGap: Math.max(amountRequested - linkedExpenseAmount, 0),
      documentCategories: [...new Set(linkedDocuments.map((document) => document.category || "General"))],
    };
  });

export const buildServicingSchedule = ({
  fundingSources = [],
  paymentSchedule = [],
  paymentRecords = [],
  anchorDate = new Date(),
}) => {
  const today = startOfDay(anchorDate);
  const paymentRecordMap = new Map(
    paymentRecords.map((record) => [`${record.sourceId || ""}:${getDateKey(record.dueDate)}`, record])
  );

  const scheduledEvents = paymentSchedule.map((event) => {
    const dueDate = normalizeDate(event.dueDate);
    const record = paymentRecordMap.get(`${event.sourceId || ""}:${getDateKey(dueDate)}`) || null;
    const scheduledAmount = toNumber(record?.scheduledAmount, toNumber(event.amount, 0));
    const paidAmount = toNumber(record?.paidAmount, 0);

    let status = record?.status || "scheduled";
    if (!record) {
      if (!event.eventBased && dueDate && dueDate < today) {
        status = "overdue";
      } else {
        status = "scheduled";
      }
    } else if (record.status === "scheduled") {
      if (paidAmount > 0 && paidAmount < scheduledAmount) {
        status = "partial";
      } else if (paidAmount >= scheduledAmount && scheduledAmount > 0) {
        status = "paid";
      } else if (!event.eventBased && dueDate && dueDate < today) {
        status = "overdue";
      }
    }

    return {
      ...event,
      paymentId: record?.paymentId || "",
      dueDate,
      scheduledAmount,
      paidAmount,
      remainingAmount: Math.max(scheduledAmount - paidAmount, 0),
      paidDate: record?.paidDate || null,
      paymentMethod: record?.paymentMethod || "other",
      notes: record?.notes || "",
      status,
      matchedRecord: record,
      manual: false,
    };
  });

  const manualRecords = paymentRecords
    .filter((record) => {
      const key = `${record.sourceId || ""}:${getDateKey(record.dueDate)}`;
      return !paymentRecordMap.has(key) || !paymentSchedule.some((event) => {
        return (
          `${event.sourceId || ""}:${getDateKey(event.dueDate)}` === key
        );
      });
    })
    .map((record) => ({
      scheduleId: record.paymentId,
      sourceId: record.sourceId,
      sourceLabel:
        getFundingSourceLabel(
          getFundingSourceById(fundingSources, record.sourceId),
          Math.max(
            fundingSources.findIndex((source) => source.sourceId === record.sourceId),
            0
          )
        ) || "Funding source",
      dueDate: normalizeDate(record.dueDate),
      amount: toNumber(record.scheduledAmount, 0),
      title: "Manual payment record",
      eventBased: false,
      paymentId: record.paymentId,
      scheduledAmount: toNumber(record.scheduledAmount, 0),
      paidAmount: toNumber(record.paidAmount, 0),
      remainingAmount: Math.max(
        toNumber(record.scheduledAmount, 0) - toNumber(record.paidAmount, 0),
        0
      ),
      paidDate: record.paidDate || null,
      paymentMethod: record.paymentMethod || "other",
      notes: record.notes || "",
      status: record.status || "scheduled",
      matchedRecord: record,
      manual: true,
    }));

  return [...scheduledEvents, ...manualRecords].sort((left, right) => {
    const leftTime = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const rightTime = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return leftTime - rightTime;
  });
};

export const buildCashManagementSummary = ({
  financeForm = {},
  fundingSources = [],
  paymentEvents = [],
  expenses = [],
  drawSummary = {},
  anchorDate = new Date(),
}) => {
  const today = startOfDay(anchorDate);
  const nextThirtyDays = addDaysToDate(today, 30);
  const nextSixtyDays = addDaysToDate(today, 60);
  const operatingReserve = toNumber(financeForm.operatingCashReserve, 0);
  const contingencyReserve = toNumber(financeForm.contingencyReserve, 0);
  const minimumCashBuffer = toNumber(financeForm.minimumCashBuffer, 0);
  const monthlyCarry =
    toNumber(financeForm.taxes, 0) +
    toNumber(financeForm.insurance, 0) +
    toNumber(financeForm.utilities, 0) +
    toNumber(financeForm.otherMonthly, 0);
  const monthlyDebtDraft = fundingSources.reduce(
    (sum, source) =>
      ["at_draw", "at_sale"].includes(source?.paymentFrequency)
        ? sum
        : sum + getFundingPaymentDraft(source),
    0
  );
  const recurringActuals = expenses
    .filter((expense) => expense.recurringCategory)
    .reduce((sum, expense) => sum + toNumber(expense.amount, 0), 0);
  const approvedUnpaidExpenses = expenses
    .filter((expense) => ["approved", "draft"].includes(expense.status || "paid"))
    .reduce((sum, expense) => sum + toNumber(expense.amount, 0), 0);
  const nextThirtyDebt = paymentEvents
    .filter((event) => {
      if (!event.dueDate || event.eventBased || ["paid", "deferred"].includes(event.status)) {
        return false;
      }
      const due = startOfDay(event.dueDate);
      return due >= today && due <= nextThirtyDays;
    })
    .reduce((sum, event) => sum + toNumber(event.remainingAmount || event.scheduledAmount, 0), 0);
  const nextSixtyDebt = paymentEvents
    .filter((event) => {
      if (!event.dueDate || event.eventBased || ["paid", "deferred"].includes(event.status)) {
        return false;
      }
      const due = startOfDay(event.dueDate);
      return due >= today && due <= nextSixtyDays;
    })
    .reduce((sum, event) => sum + toNumber(event.remainingAmount || event.scheduledAmount, 0), 0);
  const overdueAmount = paymentEvents
    .filter((event) => event.status === "overdue")
    .reduce((sum, event) => sum + toNumber(event.remainingAmount || event.scheduledAmount, 0), 0);
  const totalReserve = operatingReserve + contingencyReserve;
  const monthlyCashNeed = monthlyCarry + monthlyDebtDraft;
  const reserveRunwayMonths =
    monthlyCashNeed > 0 ? Math.max((totalReserve - minimumCashBuffer) / monthlyCashNeed, 0) : 0;

  return {
    operatingReserve,
    contingencyReserve,
    minimumCashBuffer,
    totalReserve,
    monthlyCarry,
    monthlyDebtDraft,
    monthlyCashNeed,
    reserveRunwayMonths,
    approvedUnpaidExpenses,
    recurringActuals,
    nextThirtyDebt,
    nextSixtyDebt,
    overdueAmount,
    liquidCushionAfterBuffer: Math.max(totalReserve - minimumCashBuffer, 0),
    drawRemaining: toNumber(drawSummary.remaining, 0),
    combinedCoverageMonths:
      monthlyCashNeed > 0
        ? Math.max((totalReserve + toNumber(drawSummary.remaining, 0) - minimumCashBuffer) / monthlyCashNeed, 0)
        : 0,
    totalOutstandingBalance: fundingSources.reduce(
      (sum, source) => sum + getFundingCurrentBalance(source),
      0
    ),
  };
};
