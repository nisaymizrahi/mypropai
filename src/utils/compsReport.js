export const propertyTypeOptions = [
  { value: "", label: "Select property type" },
  { value: "single-family", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi-family", label: "Multi-Family" },
  { value: "mixed-use", label: "Mixed Use" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "other", label: "Other" },
];

export const compsPropertyTypeOptions = [
  { value: "", label: "Any property type" },
  { value: "single-family", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi-family-any", label: "Multi-Family (Any)" },
  { value: "multi-family-2-4", label: "Multi-Family (2-4 units)" },
  { value: "multi-family-5-plus", label: "Multi-Family (5+ units)" },
  { value: "mixed-use", label: "Mixed Use" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Vacant Land" },
  { value: "other", label: "Other" },
];

export const dealStrategyOptions = [
  { value: "flip", label: "Flip" },
  { value: "wholetail", label: "Wholetail" },
  { value: "hold", label: "Hold" },
  { value: "rental", label: "Rental" },
];

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return "—";
  return date.toLocaleDateString();
};

export const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const toNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const toInputValue = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  return String(value);
};

export const parseAddressLabel = (value = "") => {
  const [addressLine1 = "", city = "", region = ""] = String(value)
    .split(",")
    .map((part) => part.trim());
  const regionTokens = region.split(/\s+/).filter(Boolean);

  return {
    addressLine1,
    city,
    state: regionTokens[0] || "",
    zipCode: regionTokens[1] || "",
  };
};

export const composeAddress = (parts = {}) =>
  [parts.addressLine1, parts.city, parts.state, parts.zipCode].filter(Boolean).join(", ");

export const normalizePropertyType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (!normalized) return "";
  if (propertyTypeOptions.some((option) => option.value === normalized)) return normalized;
  if (normalized.includes("single")) return "single-family";
  if (normalized.includes("condo")) return "condo";
  if (normalized.includes("town")) return "townhouse";
  if (normalized.includes("multi")) return "multi-family";
  if (normalized.includes("mixed")) return "mixed-use";
  if (normalized.includes("commercial")) return "commercial";
  if (normalized.includes("land") || normalized.includes("lot")) return "land";
  return "other";
};

export const deriveCompsPropertyTypeFilter = (propertyType, unitCount) => {
  const normalizedType = normalizePropertyType(propertyType);
  const normalizedUnitCount = toNullableNumber(unitCount);

  if (!normalizedType) return "";
  if (normalizedType === "other") return "";
  if (normalizedType !== "multi-family") return normalizedType;
  if (normalizedUnitCount !== null && normalizedUnitCount >= 5) return "multi-family-5-plus";
  if (normalizedUnitCount !== null && normalizedUnitCount >= 2) return "multi-family-2-4";
  return "multi-family-any";
};

export const buildCompsFilters = (subject = {}, savedFilters = {}) => ({
  radius: toInputValue(savedFilters.radius ?? 1),
  saleDateMonths: toInputValue(savedFilters.saleDateMonths ?? 6),
  maxComps: toInputValue(savedFilters.maxComps ?? 8),
  propertyType:
    savedFilters.propertyType !== undefined
      ? String(savedFilters.propertyType || "")
      : deriveCompsPropertyTypeFilter(subject.propertyType, subject.unitCount),
  minBedrooms: toInputValue(savedFilters.minBedrooms),
  maxBedrooms: toInputValue(savedFilters.maxBedrooms),
  minBathrooms: toInputValue(savedFilters.minBathrooms),
  maxBathrooms: toInputValue(savedFilters.maxBathrooms),
  minSquareFootage: toInputValue(savedFilters.minSquareFootage),
  maxSquareFootage: toInputValue(savedFilters.maxSquareFootage),
  minLotSize: toInputValue(savedFilters.minLotSize),
  maxLotSize: toInputValue(savedFilters.maxLotSize),
  minYearBuilt: toInputValue(savedFilters.minYearBuilt),
  maxYearBuilt: toInputValue(savedFilters.maxYearBuilt),
});

export const buildDealForm = (deal = {}, subject = {}) => ({
  strategy: String(deal.strategy || "flip"),
  askingPrice: toInputValue(deal.askingPrice ?? subject.sellerAskingPrice),
  rehabEstimate: toInputValue(deal.rehabEstimate ?? subject.rehabEstimate),
  holdingPeriodMonths: toInputValue(deal.holdingPeriodMonths ?? 6),
  acquisitionClosingCostPercent: toInputValue(deal.acquisitionClosingCostPercent ?? 2),
  sellingCostPercent: toInputValue(deal.sellingCostPercent ?? 8),
  interestRatePercent: toInputValue(deal.interestRatePercent ?? 10),
  financingPointsPercent: toInputValue(deal.financingPointsPercent ?? 2),
  loanToCostPercent: toInputValue(deal.loanToCostPercent ?? 85),
  annualTaxes: toInputValue(deal.annualTaxes),
  monthlyInsurance: toInputValue(deal.monthlyInsurance ?? 150),
  monthlyUtilities: toInputValue(deal.monthlyUtilities ?? 150),
  monthlyMaintenance: toInputValue(deal.monthlyMaintenance ?? 120),
  contingencyPercent: toInputValue(deal.contingencyPercent ?? 7),
  desiredProfitMarginPercent: toInputValue(deal.desiredProfitMarginPercent ?? 15),
  notes: String(deal.notes || ""),
});

export const buildCompsReportForm = (subject = {}) => {
  const parsedAddress = parseAddressLabel(subject.address || "");

  return {
    addressLine1: subject.addressLine1 || parsedAddress.addressLine1 || "",
    city: subject.city || parsedAddress.city || "",
    state: subject.state || parsedAddress.state || "",
    zipCode: subject.zipCode || parsedAddress.zipCode || "",
    county: subject.county || "",
    latitude: subject.latitude ?? "",
    longitude: subject.longitude ?? "",
    propertyType: normalizePropertyType(subject.propertyType),
    bedrooms: subject.bedrooms ?? "",
    bathrooms: subject.bathrooms ?? "",
    squareFootage: subject.squareFootage ?? subject.sqft ?? "",
    lotSize: subject.lotSize ?? "",
    yearBuilt: subject.yearBuilt ?? "",
    unitCount: subject.unitCount ?? "",
    sellerAskingPrice: subject.sellerAskingPrice ?? "",
    rehabEstimate: subject.rehabEstimate ?? "",
    targetOffer: subject.targetOffer ?? "",
    arv: subject.arv ?? "",
    listingStatus: subject.listingStatus || "",
    listedDate: subject.listedDate || "",
    daysOnMarket: subject.daysOnMarket ?? "",
    lastSalePrice: subject.lastSalePrice ?? "",
    lastSaleDate: subject.lastSaleDate || "",
  };
};

export const buildPreviewToCompsReportForm = (preview = {}) => ({
  addressLine1: preview.addressLine1 || parseAddressLabel(preview.address || "").addressLine1 || "",
  city: preview.city || "",
  state: preview.state || "",
  zipCode: preview.zipCode || "",
  county: preview.county || "",
  latitude: preview.latitude ?? "",
  longitude: preview.longitude ?? "",
  propertyType: normalizePropertyType(preview.propertyType),
  bedrooms: preview.bedrooms ?? "",
  bathrooms: preview.bathrooms ?? "",
  squareFootage: preview.squareFootage ?? "",
  lotSize: preview.lotSize ?? "",
  yearBuilt: preview.yearBuilt ?? "",
  unitCount: preview.unitCount ?? "",
  sellerAskingPrice: preview.sellerAskingPrice ?? "",
  rehabEstimate: preview.rehabEstimate ?? "",
  arv: preview.arv ?? "",
  listingStatus: preview.listingStatus || "",
  listedDate: preview.listedDate || "",
  daysOnMarket: preview.daysOnMarket ?? "",
  lastSalePrice: preview.lastSalePrice ?? "",
  lastSaleDate: preview.lastSaleDate || "",
});

export const buildStandaloneCompsSubject = (form = {}) => ({
  address: composeAddress(form),
  addressLine1: form.addressLine1 || "",
  city: form.city || "",
  state: form.state || "",
  zipCode: form.zipCode || "",
  county: form.county || "",
  latitude: toNullableNumber(form.latitude),
  longitude: toNullableNumber(form.longitude),
  propertyType: form.propertyType || "",
  bedrooms: toNullableNumber(form.bedrooms),
  bathrooms: toNullableNumber(form.bathrooms),
  squareFootage: toNullableNumber(form.squareFootage),
  lotSize: toNullableNumber(form.lotSize),
  yearBuilt: toNullableNumber(form.yearBuilt),
  unitCount: form.propertyType === "multi-family" ? toNullableNumber(form.unitCount) : null,
  sellerAskingPrice: toNullableNumber(form.sellerAskingPrice),
  rehabEstimate: toNullableNumber(form.rehabEstimate),
  targetOffer: toNullableNumber(form.targetOffer),
  arv: toNullableNumber(form.arv),
  listingStatus: form.listingStatus || "",
  listedDate: form.listedDate || null,
  daysOnMarket: toNullableNumber(form.daysOnMarket),
  lastSalePrice: toNullableNumber(form.lastSalePrice),
  lastSaleDate: form.lastSaleDate || null,
});

export const buildComparableId = (comp = {}, fallbackIndex = 0) => {
  if (comp.id) return String(comp.id);

  const parts = [
    comp.address,
    comp.saleDate,
    comp.salePrice ?? comp.price,
    comp.latitude ?? comp.lat,
    comp.longitude ?? comp.lng,
    fallbackIndex,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return parts.join("|") || `comp-${fallbackIndex}`;
};

export const normalizeComparableRecord = (comp = {}, fallbackIndex = 0) => {
  const salePrice = toNullableNumber(comp.salePrice ?? comp.price);
  const squareFootage = toNullableNumber(comp.squareFootage ?? comp.sqft);
  const rawPricePerSqft =
    toNullableNumber(comp.pricePerSqft) ??
    (salePrice !== null && squareFootage ? salePrice / squareFootage : null);

  return {
    id: buildComparableId(comp, fallbackIndex),
    address: comp.address || "",
    propertyType: comp.propertyType || "",
    unitCount: toNullableNumber(comp.unitCount),
    salePrice,
    saleDate: comp.saleDate || null,
    distance: toNullableNumber(comp.distance),
    bedrooms: toNullableNumber(comp.bedrooms ?? comp.beds),
    bathrooms: toNullableNumber(comp.bathrooms ?? comp.baths),
    squareFootage,
    lotSize: toNullableNumber(comp.lotSize),
    yearBuilt: toNullableNumber(comp.yearBuilt),
    latitude: toNullableNumber(comp.latitude ?? comp.lat),
    longitude: toNullableNumber(comp.longitude ?? comp.lng),
    pricePerSqft: rawPricePerSqft,
    status: comp.status || "",
    listingType: comp.listingType || "",
    removedDate: comp.removedDate || null,
    daysOnMarket: toNullableNumber(comp.daysOnMarket),
    correlation: toNullableNumber(comp.correlation),
    relevanceScore: toNullableNumber(comp.relevanceScore),
    similarityScore: toNullableNumber(comp.similarityScore),
    whySelected: comp.whySelected || comp.selectionReason || "",
    sourceLabel: comp.sourceLabel || "",
    category: comp.category || "",
    dateSource: comp.dateSource || comp.rawDateSource || "",
    estimatedValue: toNullableNumber(comp.estimatedValue),
  };
};

export const buildCompsFilterPayload = (filters = {}) => ({
  radius: toNullableNumber(filters.radius),
  saleDateMonths: toNullableNumber(filters.saleDateMonths),
  maxComps: toNullableNumber(filters.maxComps),
  propertyType: filters.propertyType || "",
  minBedrooms: toNullableNumber(filters.minBedrooms),
  maxBedrooms: toNullableNumber(filters.maxBedrooms),
  minBathrooms: toNullableNumber(filters.minBathrooms),
  maxBathrooms: toNullableNumber(filters.maxBathrooms),
  minSquareFootage: toNullableNumber(filters.minSquareFootage),
  maxSquareFootage: toNullableNumber(filters.maxSquareFootage),
  minLotSize: toNullableNumber(filters.minLotSize),
  maxLotSize: toNullableNumber(filters.maxLotSize),
  minYearBuilt: toNullableNumber(filters.minYearBuilt),
  maxYearBuilt: toNullableNumber(filters.maxYearBuilt),
});

export const buildDealPayload = (deal = {}) => ({
  strategy: deal.strategy || "flip",
  askingPrice: toNullableNumber(deal.askingPrice),
  rehabEstimate: toNullableNumber(deal.rehabEstimate),
  holdingPeriodMonths: toNullableNumber(deal.holdingPeriodMonths),
  acquisitionClosingCostPercent: toNullableNumber(deal.acquisitionClosingCostPercent),
  sellingCostPercent: toNullableNumber(deal.sellingCostPercent),
  interestRatePercent: toNullableNumber(deal.interestRatePercent),
  financingPointsPercent: toNullableNumber(deal.financingPointsPercent),
  loanToCostPercent: toNullableNumber(deal.loanToCostPercent),
  annualTaxes: toNullableNumber(deal.annualTaxes),
  monthlyInsurance: toNullableNumber(deal.monthlyInsurance),
  monthlyUtilities: toNullableNumber(deal.monthlyUtilities),
  monthlyMaintenance: toNullableNumber(deal.monthlyMaintenance),
  contingencyPercent: toNullableNumber(deal.contingencyPercent),
  desiredProfitMarginPercent: toNullableNumber(deal.desiredProfitMarginPercent),
  notes: String(deal.notes || "").trim(),
});

export const createEmptyMasterReport = () => null;

export const normalizeMasterReportTitle = (value = "", fallbackAddress = "Property") => {
  const title = String(value || "").trim();
  if (!title) {
    return `${fallbackAddress || "Property"} - Master Deal Report`;
  }

  if (title.includes("AI Comps Report")) {
    return title.replace("AI Comps Report", "Master Deal Report");
  }

  if (title.includes("Saved comps snapshot")) {
    return title.replace("Saved comps snapshot", "Saved Master Deal Report");
  }

  return title;
};

export const getMasterReportPrimaryComps = (report = null) =>
  Array.isArray(report?.comps?.primary?.items) ? report.comps.primary.items : [];

export const getMasterReportMapComps = (report = null) =>
  Array.isArray(report?.comps?.mapSet) ? report.comps.mapSet : getMasterReportPrimaryComps(report);

export const normalizeMasterReport = (report = {}, fallbackSubject = {}) => {
  if (!report?.generatedAt) return null;

  const subject = report.subject || report.subjectSnapshot || fallbackSubject || {};
  return {
    ...report,
    title: normalizeMasterReportTitle(report.title, subject.address || report.address || "Property"),
    subject,
    propertySnapshot: report.propertySnapshot || report.reportData?.propertySnapshot || null,
    dealInputs: report.dealInputs || report.dealSnapshot || report.reportData?.dealInputs || null,
    compFilters: report.compFilters || report.filters || report.reportData?.compFilters || null,
    comps:
      report.comps ||
      report.reportData?.comps || {
        primary: {
          items: Array.isArray(report.recentComps) ? report.recentComps : [],
          summary: {
            count: report.saleCompCount || (Array.isArray(report.recentComps) ? report.recentComps.length : 0),
            medianPrice: report.medianSoldPrice ?? null,
            averagePrice: report.averageSoldPrice ?? null,
            medianPricePerSqft: report.medianPricePerSqft ?? null,
            averagePricePerSqft: report.averagePricePerSqft ?? null,
          },
        },
        recentSales: { items: [] },
        activeMarket: { items: [] },
        logic: null,
        mapSet: Array.isArray(report.recentComps) ? report.recentComps : [],
      },
    valuation:
      report.valuation ||
      report.reportData?.valuation || {
        blendedEstimate: report.estimatedValue ?? null,
        blendedLow: report.estimatedValueLow ?? null,
        blendedHigh: report.estimatedValueHigh ?? null,
        primaryCompMedian: report.medianSoldPrice ?? null,
        primaryCompAverage: report.averageSoldPrice ?? null,
      },
    dealAnalysis: report.dealAnalysis || report.reportData?.dealAnalysis || null,
    aiVerdict: report.aiVerdict || report.report || report.reportData?.aiVerdict || null,
    marketContext: report.marketContext || report.reportData?.marketContext || null,
    recentComps: Array.isArray(report.recentComps)
      ? report.recentComps
      : getMasterReportPrimaryComps(report),
    reportData: report.reportData || null,
  };
};

export const countSavableComparables = (comps = []) =>
  comps
    .map((comp, index) => normalizeComparableRecord(comp, index))
    .filter(
      (comp) =>
        Boolean(comp.address) && comp.salePrice !== null && comp.salePrice !== undefined
    ).length;

const average = (values = []) => {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const median = (values = []) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const roundCurrency = (value) => {
  if (value === null || value === undefined) return null;
  return Math.round(Number(value) / 1000) * 1000;
};

export const buildSelectionSummary = (subject = {}, comps = [], valuationContext = null) => {
  const normalizedComps = comps
    .map((comp, index) => normalizeComparableRecord(comp, index))
    .filter((comp) => comp.address && comp.salePrice);

  const salePrices = normalizedComps.map((comp) => comp.salePrice).filter((value) => value !== null);
  const pricePerSqftValues = normalizedComps
    .map((comp) => comp.pricePerSqft)
    .filter((value) => value !== null && value !== undefined);
  const daysOnMarketValues = normalizedComps
    .map((comp) => comp.daysOnMarket)
    .filter((value) => value !== null && value !== undefined);
  const medianPricePerSqft = median(pricePerSqftValues);
  const subjectSquareFootage = toNullableNumber(subject.squareFootage ?? subject.sqft);
  const soldEstimate =
    subjectSquareFootage && medianPricePerSqft
      ? medianPricePerSqft * subjectSquareFootage
      : median(salePrices);

  const estimatedValue = valuationContext?.price ?? soldEstimate;
  const estimatedValueLow =
    valuationContext?.priceRangeLow ?? (estimatedValue ? estimatedValue * 0.94 : null);
  const estimatedValueHigh =
    valuationContext?.priceRangeHigh ?? (estimatedValue ? estimatedValue * 1.06 : null);
  const askingPrice = toNullableNumber(subject.sellerAskingPrice);
  const askingPriceDelta = askingPrice && estimatedValue ? askingPrice - estimatedValue : null;

  return {
    saleCompCount: normalizedComps.length,
    averageSoldPrice: roundCurrency(average(salePrices)),
    medianSoldPrice: roundCurrency(median(salePrices)),
    lowSoldPrice: salePrices.length ? roundCurrency(Math.min(...salePrices)) : null,
    highSoldPrice: salePrices.length ? roundCurrency(Math.max(...salePrices)) : null,
    averagePricePerSqft: average(pricePerSqftValues)
      ? Math.round(average(pricePerSqftValues))
      : null,
    medianPricePerSqft: medianPricePerSqft ? Math.round(medianPricePerSqft) : null,
    lowPricePerSqft: pricePerSqftValues.length ? Math.round(Math.min(...pricePerSqftValues)) : null,
    highPricePerSqft: pricePerSqftValues.length ? Math.round(Math.max(...pricePerSqftValues)) : null,
    averageDaysOnMarket: daysOnMarketValues.length ? Math.round(average(daysOnMarketValues)) : null,
    medianDaysOnMarket: daysOnMarketValues.length ? Math.round(median(daysOnMarketValues)) : null,
    lowDaysOnMarket: daysOnMarketValues.length ? Math.min(...daysOnMarketValues) : null,
    highDaysOnMarket: daysOnMarketValues.length ? Math.max(...daysOnMarketValues) : null,
    estimatedValue: roundCurrency(estimatedValue),
    estimatedValueLow: roundCurrency(estimatedValueLow),
    estimatedValueHigh: roundCurrency(estimatedValueHigh),
    askingPrice,
    askingPriceDelta: roundCurrency(askingPriceDelta),
    recommendedOfferLow: estimatedValueLow ? roundCurrency(estimatedValueLow * 0.98) : null,
    recommendedOfferHigh: estimatedValue ? roundCurrency(estimatedValue) : null,
  };
};

export const buildAnalysisFromSavedReport = (report = {}, fallbackSubject = {}) => {
  if (!report?.generatedAt) return null;
  if (report?.reportData || report?.propertySnapshot || report?.dealSnapshot) {
    return normalizeMasterReport(report, fallbackSubject);
  }

  return {
    subject: report.subjectSnapshot || fallbackSubject || {},
    summary: {
      saleCompCount: report.saleCompCount ?? null,
      estimatedValue: report.estimatedValue ?? null,
      estimatedValueLow: report.estimatedValueLow ?? null,
      estimatedValueHigh: report.estimatedValueHigh ?? null,
      averageSoldPrice: report.averageSoldPrice ?? null,
      medianSoldPrice: report.medianSoldPrice ?? null,
      lowSoldPrice: report.lowSoldPrice ?? null,
      highSoldPrice: report.highSoldPrice ?? null,
      averagePricePerSqft: report.averagePricePerSqft ?? null,
      medianPricePerSqft: report.medianPricePerSqft ?? null,
      lowPricePerSqft: report.lowPricePerSqft ?? null,
      highPricePerSqft: report.highPricePerSqft ?? null,
      averageDaysOnMarket: report.averageDaysOnMarket ?? null,
      medianDaysOnMarket: report.medianDaysOnMarket ?? null,
      lowDaysOnMarket: report.lowDaysOnMarket ?? null,
      highDaysOnMarket: report.highDaysOnMarket ?? null,
      askingPrice: toNullableNumber(
        fallbackSubject?.sellerAskingPrice ?? report.subjectSnapshot?.sellerAskingPrice
      ),
      askingPriceDelta: report.askingPriceDelta ?? null,
      recommendedOfferLow: report.recommendedOfferLow ?? null,
      recommendedOfferHigh: report.recommendedOfferHigh ?? null,
    },
    comps: Array.isArray(report.recentComps) ? report.recentComps : [],
    ai: report.report || null,
    filters: report.filters || buildCompsFilters(fallbackSubject || report.subjectSnapshot || {}),
    valuationContext: report.valuationContext || null,
    generatedAt: report.generatedAt,
  };
};

export const buildSavedReportFromLegacySnapshot = (
  subject = {},
  snapshot = {},
  fallbackId = "legacy-comps-report"
) => {
  if (!snapshot?.generatedAt) return null;

  return {
    _id: fallbackId,
    kind: "comps",
    contextType: "lead",
    title: `${subject.address || "Property"} - Saved Master Deal Report`,
    address: subject.address || "",
    generatedAt: snapshot.generatedAt,
    subjectSnapshot: subject,
    filters: snapshot.filters || null,
    valuationContext: snapshot.valuationContext || null,
    estimatedValue: snapshot.estimatedValue ?? null,
    estimatedValueLow: snapshot.estimatedValueLow ?? null,
    estimatedValueHigh: snapshot.estimatedValueHigh ?? null,
    averageSoldPrice: snapshot.averageSoldPrice ?? null,
    medianSoldPrice: snapshot.medianSoldPrice ?? null,
    lowSoldPrice: snapshot.lowSoldPrice ?? null,
    highSoldPrice: snapshot.highSoldPrice ?? null,
    averagePricePerSqft: snapshot.averagePricePerSqft ?? null,
    medianPricePerSqft: snapshot.medianPricePerSqft ?? null,
    lowPricePerSqft: snapshot.lowPricePerSqft ?? null,
    highPricePerSqft: snapshot.highPricePerSqft ?? null,
    averageDaysOnMarket: snapshot.averageDaysOnMarket ?? null,
    medianDaysOnMarket: snapshot.medianDaysOnMarket ?? null,
    lowDaysOnMarket: snapshot.lowDaysOnMarket ?? null,
    highDaysOnMarket: snapshot.highDaysOnMarket ?? null,
    saleCompCount: snapshot.saleCompCount ?? null,
    askingPriceDelta: snapshot.askingPriceDelta ?? null,
    recommendedOfferLow: snapshot.recommendedOfferLow ?? null,
    recommendedOfferHigh: snapshot.recommendedOfferHigh ?? null,
    report: snapshot.report || null,
    recentComps: Array.isArray(snapshot.recentComps) ? snapshot.recentComps : [],
  };
};
