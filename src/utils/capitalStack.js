const hasValue = (value) => value !== undefined && value !== null && value !== "";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildId = (prefix) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export const LEGACY_PRIMARY_FUNDING_SOURCE_ID = "legacy-primary-funding-source";

const normalizeDateInput = (value) => {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

export const FUNDING_SOURCE_TYPE_OPTIONS = [
  { value: "", label: "Select source type" },
  { value: "business_loan", label: "Business loan" },
  { value: "personal_loan", label: "Personal loan" },
  { value: "credit_card", label: "Credit card" },
  { value: "hard_money", label: "Hard money" },
  { value: "construction", label: "Construction loan" },
  { value: "heloc", label: "HELOC" },
  { value: "private_lender", label: "Private lender" },
  { value: "seller_finance", label: "Seller finance" },
  { value: "other", label: "Other" },
];

export const PAYMENT_TYPE_OPTIONS = [
  { value: "interest_only", label: "Interest only" },
  { value: "amortizing", label: "Amortizing" },
  { value: "revolving", label: "Revolving / minimum" },
  { value: "custom", label: "Custom payment" },
];

export const PAYMENT_FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "at_draw", label: "At draw" },
  { value: "at_sale", label: "At sale / balloon" },
];

export const PAYMENT_RECORD_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "overdue", label: "Overdue" },
  { value: "deferred", label: "Deferred" },
];

export const FUNDING_PAYMENT_METHOD_OPTIONS = [
  { value: "other", label: "Other" },
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit card" },
];

export const DRAW_STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "funded", label: "Funded" },
  { value: "holdback", label: "Holdback" },
];

export const buildFundingSource = (overrides = {}) => ({
  sourceId: overrides.sourceId || buildId("source"),
  name: overrides.name || overrides.lenderName || "",
  type: overrides.type || overrides.loanType || "",
  amount: hasValue(overrides.amount) ? overrides.amount : overrides.loanAmount ?? "",
  currentBalance: hasValue(overrides.currentBalance)
    ? overrides.currentBalance
    : overrides.loanAmount ?? "",
  interestRate: hasValue(overrides.interestRate) ? overrides.interestRate : "",
  termMonths: hasValue(overrides.termMonths) ? overrides.termMonths : overrides.loanTerm ?? "",
  points: hasValue(overrides.points) ? overrides.points : overrides.loanPoints ?? "",
  paymentType: overrides.paymentType || "interest_only",
  paymentFrequency: overrides.paymentFrequency || "monthly",
  paymentAmount: hasValue(overrides.paymentAmount) ? overrides.paymentAmount : "",
  paymentDay: hasValue(overrides.paymentDay) ? overrides.paymentDay : 1,
  paymentStartDate: normalizeDateInput(overrides.paymentStartDate),
  originationDate: normalizeDateInput(overrides.originationDate),
  maturityDate: normalizeDateInput(overrides.maturityDate),
  drawLimit: hasValue(overrides.drawLimit) ? overrides.drawLimit : "",
  drawnAmount: hasValue(overrides.drawnAmount) ? overrides.drawnAmount : "",
  notes: overrides.notes || overrides.loanNotes || "",
});

export const buildDrawRequest = (overrides = {}) => ({
  drawId: overrides.drawId || buildId("draw"),
  label: overrides.label || "",
  sourceId: overrides.sourceId || "",
  status: overrides.status || "planned",
  requestDate: normalizeDateInput(overrides.requestDate),
  expectedFundingDate: normalizeDateInput(overrides.expectedFundingDate),
  fundedDate: normalizeDateInput(overrides.fundedDate),
  amountRequested: hasValue(overrides.amountRequested) ? overrides.amountRequested : "",
  amountFunded: hasValue(overrides.amountFunded) ? overrides.amountFunded : "",
  notes: overrides.notes || "",
});

export const buildPaymentRecord = (overrides = {}) => ({
  paymentId: overrides.paymentId || buildId("payment"),
  sourceId: overrides.sourceId || "",
  dueDate: normalizeDateInput(overrides.dueDate),
  scheduledAmount: hasValue(overrides.scheduledAmount) ? overrides.scheduledAmount : "",
  paidAmount: hasValue(overrides.paidAmount) ? overrides.paidAmount : "",
  status: overrides.status || "scheduled",
  paidDate: normalizeDateInput(overrides.paidDate),
  paymentMethod: overrides.paymentMethod || "other",
  notes: overrides.notes || "",
});

export const getFundingSourceTypeLabel = (value = "") =>
  FUNDING_SOURCE_TYPE_OPTIONS.find((option) => option.value === value)?.label || "Funding source";

export const getFundingSources = (investment = {}) => {
  if (Array.isArray(investment?.fundingSources) && investment.fundingSources.length > 0) {
    return investment.fundingSources.map((source) => buildFundingSource(source));
  }

  if (
    toNumber(investment?.loanAmount, 0) > 0 ||
    hasValue(investment?.loanType) ||
    hasValue(investment?.lenderName)
  ) {
    return [
      buildFundingSource({
        sourceId: LEGACY_PRIMARY_FUNDING_SOURCE_ID,
        name: investment.lenderName,
        type: investment.loanType,
        amount: investment.loanAmount,
        interestRate: investment.interestRate,
        termMonths: investment.loanTerm,
        points: investment.loanPoints,
        notes: investment.loanNotes,
      }),
    ];
  }

  return [];
};

export const getPrimaryFundingSource = (sources = []) =>
  Array.isArray(sources) && sources.length > 0 ? sources[0] : null;

export const getDrawRequests = (investment = {}) =>
  Array.isArray(investment?.drawRequests)
    ? investment.drawRequests.map((request) => buildDrawRequest(request))
    : [];

export const getPaymentRecords = (investment = {}) =>
  Array.isArray(investment?.paymentRecords)
    ? investment.paymentRecords.map((record) => buildPaymentRecord(record))
    : [];

export const getFundingSourceLabel = (source, index = 0) =>
  source?.name?.trim() || getFundingSourceTypeLabel(source?.type) || `Funding source ${index + 1}`;

export const getFundingSourceById = (sources = [], sourceId = "") =>
  sources.find((source) => String(source?.sourceId || "") === String(sourceId || "")) || null;

export const isDrawAwareSource = (source = {}) =>
  ["hard_money", "construction"].includes(source?.type) ||
  toNumber(source?.drawLimit, 0) > 0 ||
  toNumber(source?.drawnAmount, 0) > 0;

export const getDrawRequestById = (drawRequests = [], drawId = "") =>
  drawRequests.find((request) => String(request?.drawId || "") === String(drawId || "")) || null;

export const getDrawRequestLabel = (drawRequest, index = 0) =>
  drawRequest?.label?.trim() || `Draw request ${index + 1}`;

export const getFundingMonthlyInterest = (source = {}) =>
  (toNumber(source?.amount, 0) * (toNumber(source?.interestRate, 0) / 100)) / 12;

export const getFundingPointsCost = (source = {}) =>
  (toNumber(source?.amount, 0) * toNumber(source?.points, 0)) / 100;

export const getFundingPaymentDraft = (source = {}) => {
  const amount = toNumber(source?.amount, 0);
  const monthlyRate = toNumber(source?.interestRate, 0) / 100 / 12;
  const termMonths = toNumber(source?.termMonths, 0);
  const customAmount = toNumber(source?.paymentAmount, 0);

  if (source?.paymentType === "custom") {
    return customAmount;
  }

  if (source?.paymentType === "amortizing") {
    if (amount <= 0 || termMonths <= 0) {
      return 0;
    }

    if (monthlyRate <= 0) {
      return amount / termMonths;
    }

    return (
      (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1)
    );
  }

  if (source?.paymentType === "revolving") {
    if (customAmount > 0) {
      return customAmount;
    }

    return Math.max(amount * 0.03, getFundingMonthlyInterest(source));
  }

  return getFundingMonthlyInterest(source);
};

export const getFundingCurrentBalance = (source = {}) => {
  const currentBalance = toNumber(source?.currentBalance, 0);
  if (currentBalance > 0) {
    return currentBalance;
  }

  return toNumber(source?.amount, 0);
};

export const getTotalFundingAmount = (sources = []) =>
  sources.reduce((sum, source) => sum + toNumber(source?.amount, 0), 0);

export const getTotalFundingPointsCost = (sources = []) =>
  sources.reduce((sum, source) => sum + getFundingPointsCost(source), 0);

export const getTotalFundingMonthlyInterest = (sources = []) =>
  sources.reduce((sum, source) => sum + getFundingMonthlyInterest(source), 0);

export const getTotalFundingPaymentDraft = (sources = []) =>
  sources.reduce((sum, source) => {
    if (["at_draw", "at_sale"].includes(source?.paymentFrequency)) {
      return sum;
    }

    return sum + getFundingPaymentDraft(source);
  }, 0);

export const getTotalDrawCapacity = (sources = []) =>
  sources.reduce((sum, source) => {
    if (!isDrawAwareSource(source)) {
      return sum;
    }

    const explicitLimit = toNumber(source?.drawLimit, 0);
    if (explicitLimit > 0) {
      return sum + explicitLimit;
    }

    return sum + toNumber(source?.amount, 0);
  }, 0);

export const getTotalDrawRequested = (drawRequests = []) =>
  drawRequests.reduce((sum, request) => sum + toNumber(request?.amountRequested, 0), 0);

export const getTotalDrawFunded = (drawRequests = []) =>
  drawRequests.reduce((sum, request) => sum + toNumber(request?.amountFunded, 0), 0);

export const getTotalDrawnFromSources = (sources = []) =>
  sources.reduce((sum, source) => sum + toNumber(source?.drawnAmount, 0), 0);

export const getDrawSummary = (sources = [], drawRequests = []) => {
  const capacity = getTotalDrawCapacity(sources);
  const requested = getTotalDrawRequested(drawRequests);
  const fundedFromRequests = getTotalDrawFunded(drawRequests);
  const fundedFromSources = getTotalDrawnFromSources(sources);
  const funded = fundedFromRequests > 0 ? fundedFromRequests : fundedFromSources;
  const activeRequests = drawRequests.filter((request) =>
    ["requested", "approved", "holdback"].includes(request?.status)
  ).length;

  return {
    capacity,
    requested,
    funded,
    remaining: Math.max(capacity - funded, 0),
    activeRequests,
  };
};
