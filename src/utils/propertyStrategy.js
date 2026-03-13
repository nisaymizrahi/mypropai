export const PROPERTY_STRATEGIES = [
  { value: "flip", label: "Flip" },
  { value: "fix_and_rent", label: "Fix & Rent" },
  { value: "rental", label: "Rental" },
];

export const normalizeInvestmentStrategy = (value) => {
  if (!value || typeof value !== "string") {
    return "flip";
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, "_and_")
    .replace(/[\s-]+/g, "_");

  if (normalized === "rent") {
    return "rental";
  }

  return ["flip", "fix_and_rent", "rental"].includes(normalized) ? normalized : "flip";
};

export const getInvestmentStrategy = (investment) =>
  normalizeInvestmentStrategy(investment?.strategy || investment?.type);

export const getInvestmentStrategyLabel = (value) => {
  const strategy = normalizeInvestmentStrategy(value);

  if (strategy === "fix_and_rent") {
    return "Fix & Rent";
  }

  if (strategy === "rental") {
    return "Rental";
  }

  return "Flip";
};

export const canStartManagement = (investment) =>
  ["fix_and_rent", "rental"].includes(getInvestmentStrategy(investment));
