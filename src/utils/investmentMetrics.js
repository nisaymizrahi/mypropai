const hasValue = (value) => value !== undefined && value !== null && value !== "";

export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const formatCurrency = (value = 0, options = {}) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
  }).format(toNumber(value, 0));

const sumBudgetItems = (budgetItems = []) =>
  budgetItems.reduce((sum, item) => sum + toNumber(item?.budgetedAmount, 0), 0);

const sumOriginalBudgetItems = (budgetItems = []) =>
  budgetItems.reduce(
    (sum, item) =>
      sum + toNumber(item?.originalBudgetAmount ?? item?.budgetedAmount, 0),
    0
  );

const sumCommittedBudgetItems = (budgetItems = []) =>
  budgetItems.reduce(
    (sum, item) =>
      sum +
      (Array.isArray(item?.awards)
        ? item.awards.reduce((awardSum, award) => awardSum + toNumber(award?.amount, 0), 0)
        : 0),
    0
  );

const sumLegacyBudget = (investment) =>
  Array.isArray(investment?.budget)
    ? investment.budget.reduce((sum, item) => sum + toNumber(item?.amount, 0), 0)
    : 0;

export const getInvestmentAnalysisMetrics = (investment = {}, options = {}) => {
  const budgetItems = Array.isArray(options.budgetItems) ? options.budgetItems : [];
  const expenses = Array.isArray(options.expenses) ? options.expenses : [];

  const legacyDeal = investment?.dealAnalysis || {};
  const legacyFinancing = investment?.financingDetails?.purchaseLoan || {};
  const legacyHolding = legacyDeal?.holdingCosts || {};
  const legacySelling = legacyDeal?.sellingCosts || {};

  const purchasePrice = toNumber(investment?.purchasePrice, 0);
  const arv = toNumber(investment?.arv, 0);
  const rentEstimate = toNumber(investment?.rentEstimate, 0);

  const buyClosingInput = hasValue(investment?.buyClosingCost)
    ? toNumber(investment.buyClosingCost, 0)
    : toNumber(legacyDeal?.buyingCosts, 0);
  const buyClosingIsPercent = hasValue(investment?.buyClosingCost)
    ? Boolean(investment?.buyClosingIsPercent)
    : false;

  const loanAmount = hasValue(investment?.loanAmount)
    ? toNumber(investment.loanAmount, 0)
    : toNumber(legacyFinancing?.loanAmount, 0);
  const interestRate = hasValue(investment?.interestRate)
    ? toNumber(investment.interestRate, 0)
    : toNumber(legacyFinancing?.interestRate, 0);
  const loanTerm = hasValue(investment?.loanTerm) ? toNumber(investment.loanTerm, 12) : 12;
  const loanPoints = hasValue(investment?.loanPoints) ? toNumber(investment.loanPoints, 0) : 0;

  const holdingMonths = hasValue(investment?.holdingMonths)
    ? toNumber(investment.holdingMonths, 0)
    : toNumber(legacyHolding?.durationMonths, 0);
  const monthlyHoldingFromFields =
    toNumber(investment?.taxes, 0) +
    toNumber(investment?.insurance, 0) +
    toNumber(investment?.utilities, 0) +
    toNumber(investment?.otherMonthly, 0);
  const monthlyHoldingCost =
    monthlyHoldingFromFields > 0
      ? monthlyHoldingFromFields
      : toNumber(legacyHolding?.monthlyAmount, 0);

  const sellClosingInput = hasValue(investment?.sellClosingCost)
    ? toNumber(investment.sellClosingCost, 0)
    : toNumber(legacySelling?.value, 0);
  const sellClosingIsPercent = hasValue(investment?.sellClosingCost)
    ? Boolean(investment?.sellClosingIsPercent)
    : Boolean(legacySelling?.isPercentage);

  const totalBudget =
    sumBudgetItems(budgetItems) ||
    toNumber(investment?.totalBudget, 0) ||
    sumLegacyBudget(investment);
  const totalOriginalBudget =
    sumOriginalBudgetItems(budgetItems) ||
    toNumber(investment?.totalBudget, 0) ||
    sumLegacyBudget(investment);
  const totalCommitted = sumCommittedBudgetItems(budgetItems);
  const totalSpent = expenses.reduce((sum, item) => sum + toNumber(item?.amount, 0), 0);
  const unassignedSpent = expenses
    .filter((item) => !item?.budgetItem)
    .reduce((sum, item) => sum + toNumber(item?.amount, 0), 0);

  const calcBuyingCost = buyClosingIsPercent
    ? (purchasePrice * buyClosingInput) / 100
    : buyClosingInput;
  const usesFinanceFormula = loanAmount > 0 && (interestRate > 0 || loanPoints > 0);
  const calcFinanceCost = usesFinanceFormula
    ? ((loanAmount * (interestRate / 100)) / 12) * loanTerm + (loanPoints / 100) * loanAmount
    : toNumber(legacyDeal?.financingCosts, 0);
  const calcHoldingCost = monthlyHoldingCost * holdingMonths;
  const calcSellCost = sellClosingIsPercent ? (arv * sellClosingInput) / 100 : sellClosingInput;
  const totalCost = purchasePrice + calcBuyingCost + totalBudget + calcFinanceCost + calcHoldingCost;
  const allInCost = totalCost + calcSellCost;
  const profit = arv - allInCost;
  const downPayment = Math.max(purchasePrice - loanAmount, 0);
  const cashInvested = downPayment + calcBuyingCost + totalBudget + calcHoldingCost + calcFinanceCost;
  const roiOnCash = cashInvested > 0 ? (profit / cashInvested) * 100 : 0;
  const roiOnTotalCost = totalCost > 0 ? (profit / totalCost) * 100 : 0;
  const annualizedROI = roiOnCash / ((holdingMonths || 1) / 12);
  const projectedEquity = arv - loanAmount;
  const progress = toNumber(investment?.progress, 0);

  return {
    purchasePrice,
    arv,
    rentEstimate,
    buyClosingInput,
    buyClosingIsPercent,
    loanAmount,
    interestRate,
    loanTerm,
    loanPoints,
    holdingMonths,
    monthlyHoldingCost,
    sellClosingInput,
    sellClosingIsPercent,
    totalBudget,
    totalOriginalBudget,
    totalCommitted,
    totalSpent,
    unassignedSpent,
    calcBuyingCost,
    calcFinanceCost,
    calcHoldingCost,
    calcSellCost,
    totalCost,
    allInCost,
    profit,
    downPayment,
    cashInvested,
    roiOnCash,
    roiOnTotalCost,
    annualizedROI,
    projectedEquity,
    progress,
    breakevenARV: totalCost + calcSellCost,
    remainingBudget: totalBudget - totalSpent,
    remainingOriginalBudget: totalOriginalBudget - totalSpent,
    committedVariance: totalCommitted - totalOriginalBudget,
    outstandingCommitted: totalCommitted - totalSpent,
    budgetPercent: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
  };
};
