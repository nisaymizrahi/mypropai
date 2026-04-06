import { API_BASE_URL } from "../../config";
import { buildSelectionSummary, composeAddress, normalizeComparableRecord } from "../../utils/compsReport";
import { QA_TOKEN, isQaMode } from "./config";

const QA_NOW = "2026-04-05T14:30:00.000Z";
const QA_REFERENCE_DATE = new Date(QA_NOW);
const API_PATHNAME = new URL(API_BASE_URL).pathname.replace(/\/+$/, "");

const QA_USER = {
  _id: "qa-user-1",
  email: "qa@fliprop.local",
  firstName: "Morgan",
  lastName: "QA",
  companyName: "Fliprop QA Lab",
  role: "operator",
};

const QA_SUBJECT = {
  addressLine1: "742 Evergreen Terrace",
  city: "Springfield",
  state: "IL",
  zipCode: "62704",
  county: "Sangamon",
  latitude: 39.78172,
  longitude: -89.65015,
  propertyType: "single-family",
  bedrooms: 4,
  bathrooms: 2.5,
  squareFootage: 1920,
  lotSize: 7200,
  yearBuilt: 1965,
  sellerAskingPrice: 285000,
  rehabEstimate: 45000,
  targetOffer: 276000,
  arv: 392000,
  listingStatus: "Active",
  listedDate: "2026-03-16T00:00:00.000Z",
  daysOnMarket: 20,
  lastSalePrice: 219000,
  lastSaleDate: "2019-08-14T00:00:00.000Z",
};

QA_SUBJECT.address = composeAddress(QA_SUBJECT);

const QA_DEFAULT_DEAL = {
  strategy: "flip",
  askingPrice: QA_SUBJECT.sellerAskingPrice,
  rehabEstimate: QA_SUBJECT.rehabEstimate,
  holdingPeriodMonths: 6,
  acquisitionClosingCostPercent: 2,
  sellingCostPercent: 8,
  interestRatePercent: 10,
  financingPointsPercent: 2,
  loanToCostPercent: 85,
  annualTaxes: 5200,
  monthlyInsurance: 150,
  monthlyUtilities: 150,
  monthlyMaintenance: 120,
  contingencyPercent: 7,
  desiredProfitMarginPercent: 15,
  notes:
    "Cosmetic renovation assumed. Roof and mechanicals appear serviceable, but the investor story depends on keeping the rehab scope disciplined.",
};

const QA_SUGGESTIONS = [
  {
    id: "qa-subject-primary",
    place_name: QA_SUBJECT.address,
    center: [QA_SUBJECT.longitude, QA_SUBJECT.latitude],
  },
  {
    id: "qa-subject-alt",
    place_name: "740 Evergreen Terrace, Springfield, IL 62704",
    center: [-89.64952, 39.78111],
  },
];

const PRIMARY_COMPS = [
  {
    id: "primary-1",
    address: "733 Evergreen Terrace, Springfield, IL 62704",
    propertyType: "single-family",
    salePrice: 332000,
    saleDate: "2026-03-22T00:00:00.000Z",
    distance: 0.18,
    bedrooms: 4,
    bathrooms: 2.5,
    squareFootage: 1880,
    lotSize: 6900,
    yearBuilt: 1967,
    latitude: 39.78113,
    longitude: -89.64941,
    daysOnMarket: 11,
    similarityScore: 92,
    whySelected: "Closest renovated sale with nearly identical bedroom count and layout.",
    sourceLabel: "RentCast AVM",
    category: "primary",
  },
  {
    id: "primary-2",
    address: "801 Maple Drive, Springfield, IL 62704",
    propertyType: "single-family",
    salePrice: 347000,
    saleDate: "2026-02-18T00:00:00.000Z",
    distance: 0.34,
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 2015,
    lotSize: 7600,
    yearBuilt: 1971,
    latitude: 39.78244,
    longitude: -89.6527,
    daysOnMarket: 8,
    similarityScore: 88,
    whySelected: "Slightly larger but strong finish quality and a clean seller signal.",
    sourceLabel: "RentCast AVM",
    category: "primary",
  },
  {
    id: "primary-3",
    address: "612 Oak Lane, Springfield, IL 62704",
    propertyType: "single-family",
    salePrice: 319000,
    saleDate: "2026-01-26T00:00:00.000Z",
    distance: 0.47,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1765,
    lotSize: 6400,
    yearBuilt: 1962,
    latitude: 39.78011,
    longitude: -89.64772,
    daysOnMarket: 14,
    similarityScore: 83,
    whySelected: "Useful lower-bound comp with comparable lot size and older finish level.",
    sourceLabel: "RentCast AVM",
    category: "primary",
  },
  {
    id: "primary-4",
    address: "915 Lincoln Court, Springfield, IL 62704",
    propertyType: "single-family",
    salePrice: 356000,
    saleDate: "2025-12-18T00:00:00.000Z",
    distance: 0.71,
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 2080,
    lotSize: 8050,
    yearBuilt: 1974,
    latitude: 39.78482,
    longitude: -89.65561,
    daysOnMarket: 9,
    similarityScore: 81,
    whySelected: "Premium renovation comp that helps define the realistic upside ceiling.",
    sourceLabel: "RentCast AVM",
    category: "primary",
  },
];

const RECENT_SALES = [
  {
    id: "recent-1",
    address: "455 Walnut Street, Springfield, IL 62704",
    propertyType: "single-family",
    salePrice: 301000,
    saleDate: "2025-11-08T00:00:00.000Z",
    distance: 0.93,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1710,
    lotSize: 6150,
    yearBuilt: 1960,
    latitude: 39.77934,
    longitude: -89.64282,
    daysOnMarket: 16,
    similarityScore: 75,
    whySelected: "Nearby recorded sale that shows the lower end of the local range.",
    sourceLabel: "Public record",
    category: "recent_sale",
    status: "Closed",
    listingType: "Recorded sale",
  },
  {
    id: "recent-2",
    address: "1024 Monroe Street, Springfield, IL 62704",
    propertyType: "single-family",
    salePrice: 364000,
    saleDate: "2025-09-20T00:00:00.000Z",
    distance: 1.24,
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 2140,
    lotSize: 8200,
    yearBuilt: 1976,
    latitude: 39.7868,
    longitude: -89.66143,
    daysOnMarket: 13,
    similarityScore: 73,
    whySelected: "Useful upper-end sale from the same pocket with good DOM context.",
    sourceLabel: "Public record",
    category: "recent_sale",
    status: "Closed",
    listingType: "Recorded sale",
  },
];

const ACTIVE_MARKET = [
  {
    id: "active-1",
    address: "520 Birch Street, Springfield, IL 62704",
    propertyType: "single-family",
    salePrice: 349900,
    listedDate: "2026-03-29T00:00:00.000Z",
    distance: 0.64,
    bedrooms: 4,
    bathrooms: 2.5,
    squareFootage: 1995,
    lotSize: 7400,
    yearBuilt: 1970,
    latitude: 39.78431,
    longitude: -89.64685,
    daysOnMarket: 7,
    similarityScore: 79,
    whySelected: "Competing active listing that frames the current market ceiling.",
    sourceLabel: "MLS snapshot",
    category: "active_market",
    status: "Active",
    listingType: "For sale",
  },
  {
    id: "active-2",
    address: "677 Adams Street, Springfield, IL 62704",
    propertyType: "single-family",
    salePrice: 329000,
    listedDate: "2026-03-18T00:00:00.000Z",
    distance: 0.88,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1825,
    lotSize: 6800,
    yearBuilt: 1964,
    latitude: 39.78042,
    longitude: -89.6436,
    daysOnMarket: 12,
    similarityScore: 77,
    whySelected: "Active alternative with a similar finish level and realistic list-to-close expectation.",
    sourceLabel: "MLS snapshot",
    category: "active_market",
    status: "Active",
    listingType: "For sale",
  },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const getRequestJson = async (request) => {
  try {
    return await request.clone().json();
  } catch (error) {
    return {};
  }
};

const isAuthorized = (request) =>
  String(request.headers.get("Authorization") || request.headers.get("authorization") || "") ===
  `Bearer ${QA_TOKEN}`;

const monthsSince = (value) => {
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return Number.POSITIVE_INFINITY;
  return (
    (QA_REFERENCE_DATE.getFullYear() - date.getFullYear()) * 12 +
    (QA_REFERENCE_DATE.getMonth() - date.getMonth())
  );
};

const matchesPropertyType = (comp, propertyType) => {
  if (!propertyType) return true;
  if (propertyType === "multi-family-any") return comp.propertyType === "multi-family";
  if (propertyType === "multi-family-2-4") {
    return comp.propertyType === "multi-family" && Number(comp.unitCount || 0) >= 2 && Number(comp.unitCount || 0) <= 4;
  }
  if (propertyType === "multi-family-5-plus") {
    return comp.propertyType === "multi-family" && Number(comp.unitCount || 0) >= 5;
  }
  return comp.propertyType === propertyType;
};

const matchesNumericRange = (value, minimum, maximum) => {
  if (minimum !== null && minimum !== undefined && minimum !== "" && Number(value) < Number(minimum)) {
    return false;
  }
  if (maximum !== null && maximum !== undefined && maximum !== "" && Number(value) > Number(maximum)) {
    return false;
  }
  return true;
};

const filterComps = (items, filters = {}) =>
  items
    .filter((comp) => Number(comp.distance || 0) <= Number(filters.radius || 1))
    .filter((comp) => matchesPropertyType(comp, filters.propertyType))
    .filter((comp) => matchesNumericRange(comp.bedrooms || 0, filters.minBedrooms, filters.maxBedrooms))
    .filter((comp) => matchesNumericRange(comp.bathrooms || 0, filters.minBathrooms, filters.maxBathrooms))
    .filter((comp) => matchesNumericRange(comp.squareFootage || 0, filters.minSquareFootage, filters.maxSquareFootage))
    .filter((comp) => matchesNumericRange(comp.yearBuilt || 0, filters.minYearBuilt, filters.maxYearBuilt))
    .filter((comp) => {
      const freshnessWindow = Number(filters.saleDateMonths || 6);
      const referenceDate = comp.saleDate || comp.listedDate;
      return monthsSince(referenceDate) <= freshnessWindow;
    })
    .sort((left, right) => Number(left.distance || 0) - Number(right.distance || 0));

const buildSummary = (subject, comps) => buildSelectionSummary(subject, comps, null);

const buildValuation = (subject, primaryComps, recentSales, activeMarket) => {
  const primarySummary = buildSummary(subject, primaryComps);
  const recentSaleSummary = buildSummary(subject, recentSales);
  const activeMarketSummary = buildSummary(subject, activeMarket);

  return {
    blendedEstimate: primarySummary.estimatedValue,
    blendedLow: primarySummary.estimatedValueLow,
    blendedHigh: primarySummary.estimatedValueHigh,
    rentCastEstimate: primarySummary.estimatedValue,
    rentCastLow: primarySummary.estimatedValueLow,
    rentCastHigh: primarySummary.estimatedValueHigh,
    primaryCompMedian: primarySummary.medianSoldPrice,
    primaryCompAverage: primarySummary.averageSoldPrice,
    recentSaleMedian: recentSaleSummary.medianSoldPrice,
    activeMarketMedian: activeMarketSummary.medianSoldPrice,
    notes: [
      "Primary valuation comps drive the blended value range in this QA scenario.",
      "Recent sales and active listings remain visible so the report can highlight what supports value versus what only frames the market.",
    ],
  };
};

const buildDealAnalysis = (deal, valuation) => {
  const askingPrice = Number(deal.askingPrice || 0);
  const rehabEstimate = Number(deal.rehabEstimate || 0);
  const acquisitionClosing = askingPrice * (Number(deal.acquisitionClosingCostPercent || 0) / 100);
  const contingency = rehabEstimate * (Number(deal.contingencyPercent || 0) / 100);
  const annualTaxes = Number(deal.annualTaxes || 0);
  const monthlyCarry =
    Number(deal.monthlyInsurance || 0) +
    Number(deal.monthlyUtilities || 0) +
    Number(deal.monthlyMaintenance || 0) +
    annualTaxes / 12;
  const holdingMonths = Number(deal.holdingPeriodMonths || 0);
  const holdingCosts = monthlyCarry * holdingMonths;
  const baseProjectCost = askingPrice + rehabEstimate + acquisitionClosing + contingency + holdingCosts;
  const loanAmount = baseProjectCost * (Number(deal.loanToCostPercent || 0) / 100);
  const financingPoints = loanAmount * (Number(deal.financingPointsPercent || 0) / 100);
  const interestCarry =
    loanAmount * (Number(deal.interestRatePercent || 0) / 100 / 12) * holdingMonths;
  const exitValue = Number(valuation.blendedEstimate || 0);
  const sellingCosts = exitValue * (Number(deal.sellingCostPercent || 0) / 100);
  const totalProjectCost = baseProjectCost + financingPoints + interestCarry + sellingCosts;
  const estimatedProfit = exitValue - totalProjectCost;
  const cashNeeded = Math.max(totalProjectCost - loanAmount, 1);
  const estimatedMonthlyRent = 2460;

  if (deal.strategy === "hold" || deal.strategy === "rental") {
    const stabilizedBasis = baseProjectCost + financingPoints;
    const grossYieldPercent = stabilizedBasis
      ? (estimatedMonthlyRent * 12 * 100) / stabilizedBasis
      : 0;
    const onePercentRule = stabilizedBasis ? (estimatedMonthlyRent * 100) / stabilizedBasis : 0;
    const equitySpread = Number(valuation.blendedEstimate || 0) - stabilizedBasis;

    return {
      mode: "hold",
      metrics: {
        stabilizedBasis,
        estimatedMonthlyRent,
        grossYieldPercent,
        onePercentRule,
        loanAmount,
        equitySpread,
        totalProjectCost: stabilizedBasis,
      },
      costBreakdown: [
        { label: "Purchase price", group: "acquisition", amount: askingPrice },
        { label: "Closing costs", group: "acquisition", amount: acquisitionClosing },
        { label: "Renovation", group: "rehab", amount: rehabEstimate },
        { label: "Contingency", group: "rehab", amount: contingency },
        { label: "Financing points", group: "financing", amount: financingPoints },
      ],
    };
  }

  return {
    mode: "flip",
    metrics: {
      totalProjectCost,
      exitValue,
      estimatedProfit,
      marginPercent: exitValue ? (estimatedProfit * 100) / exitValue : 0,
      loanAmount,
      cashOnCashPercent: cashNeeded ? (estimatedProfit * 100) / cashNeeded : 0,
    },
    costBreakdown: [
      { label: "Purchase price", group: "acquisition", amount: askingPrice },
      { label: "Closing costs", group: "acquisition", amount: acquisitionClosing },
      { label: "Renovation", group: "rehab", amount: rehabEstimate },
      { label: "Contingency", group: "rehab", amount: contingency },
      { label: "Holding costs", group: "carry", amount: holdingCosts },
      { label: "Financing points", group: "financing", amount: financingPoints },
      { label: "Interest carry", group: "financing", amount: interestCarry },
      { label: "Selling costs", group: "exit", amount: sellingCosts },
    ],
  };
};

const buildAiVerdict = (subject, valuation, analysis, primaryComps) => {
  const spread = Number(valuation.blendedEstimate || 0) - Number(subject.sellerAskingPrice || 0);
  const compSupport = primaryComps.length >= 4 ? "strong" : primaryComps.length >= 3 ? "usable" : "thin";
  const verdict = spread > 40000 ? "Good spread with manageable risk" : spread > 0 ? "Workable but price-sensitive" : "Risky at current ask";

  return {
    verdict,
    compSupport,
    confidence: primaryComps.length >= 4 ? "High" : "Medium",
    headline: `${verdict}.`,
    executiveSummary: `${subject.address} reads as a ${analysis.mode === "hold" ? "hybrid hold" : "flip"} candidate with ${compSupport} comp support. The report surfaces value, market context, and the cost stack in one place, but the go/no-go signal could still be even more visually dominant for first-time users.`,
    valueTakeaway: `Primary comps support a blended value of ${Number(valuation.blendedEstimate || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} against an ask of ${Number(subject.sellerAskingPrice || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}.`,
    dealTakeaway:
      analysis.mode === "hold"
        ? `On the hold assumptions, the model supports a gross yield of ${Number(analysis.metrics?.grossYieldPercent || 0).toFixed(1)}% with rent comps around $2.4k to $2.5k per month.`
        : `On the current flip assumptions, the model shows an estimated profit of ${Number(analysis.metrics?.estimatedProfit || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}.`,
    upsideFactors: [
      "Primary comps cluster tightly enough to make the value story understandable.",
      "The cost stack is transparent enough to explain the model to an investor or partner.",
      "The premium report packaging is credible for internal review and client-facing conversations.",
    ],
    riskFlags: [
      "The renovation assumption is still the biggest swing factor in the decision.",
      "Recent sales and active listings support the story, but the page could state the risky-deal boundary more bluntly.",
      "A first-time user may still want the strongest conclusion pinned even higher on the page.",
    ],
    pricingRecommendation: `Use ${Number(valuation.blendedLow || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} to ${Number(valuation.blendedEstimate || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} as the practical offer band while rehab bids are still being confirmed.`,
    offerStrategy: "Lead with the comp-backed median, then justify a conservative bid through the rehab and carry assumptions rather than abstract percentage rules alone.",
  };
};

const buildMarketContext = () => ({
  saleData: {
    medianPrice: 338000,
    medianPricePerSquareFoot: 178,
    medianDaysOnMarket: 12,
    newListings: 14,
    totalListings: 39,
  },
  notes: [
    "Nearby listing velocity remains healthy for homes that show well at the current size and finish tier.",
    "The market context supports the value story, but it does not erase rehab execution risk.",
  ],
});

const buildMasterReport = (subjectInput = {}, filtersInput = {}, dealInput = {}) => {
  const subject = {
    ...QA_SUBJECT,
    ...subjectInput,
  };
  subject.address = subject.address || composeAddress(subject);

  const deal = {
    ...QA_DEFAULT_DEAL,
    ...dealInput,
    askingPrice: dealInput.askingPrice ?? subject.sellerAskingPrice ?? QA_DEFAULT_DEAL.askingPrice,
    rehabEstimate: dealInput.rehabEstimate ?? subject.rehabEstimate ?? QA_DEFAULT_DEAL.rehabEstimate,
  };

  const filters = {
    radius: Number(filtersInput.radius || 1),
    saleDateMonths: Number(filtersInput.saleDateMonths || 6),
    maxComps: Number(filtersInput.maxComps || 8),
    propertyType: filtersInput.propertyType || "single-family",
    minBedrooms: filtersInput.minBedrooms ?? null,
    maxBedrooms: filtersInput.maxBedrooms ?? null,
    minBathrooms: filtersInput.minBathrooms ?? null,
    maxBathrooms: filtersInput.maxBathrooms ?? null,
    minSquareFootage: filtersInput.minSquareFootage ?? null,
    maxSquareFootage: filtersInput.maxSquareFootage ?? null,
    minLotSize: filtersInput.minLotSize ?? null,
    maxLotSize: filtersInput.maxLotSize ?? null,
    minYearBuilt: filtersInput.minYearBuilt ?? null,
    maxYearBuilt: filtersInput.maxYearBuilt ?? null,
  };

  const primary = filterComps(PRIMARY_COMPS, filters).slice(0, Math.min(Number(filters.maxComps || 8), 4));
  const recentSales = filterComps(RECENT_SALES, filters);
  const activeMarket = filterComps(ACTIVE_MARKET, filters);
  const valuation = buildValuation(subject, primary, recentSales, activeMarket);
  const dealAnalysis = buildDealAnalysis(deal, valuation);
  const aiVerdict = buildAiVerdict(subject, valuation, dealAnalysis, primary);
  const primarySummary = buildSummary(subject, primary);

  return {
    title: `${subject.address} - Master Deal Report`,
    generatedAt: QA_NOW,
    subject,
    address: subject.address,
    propertySnapshot: {
      address: subject.address,
      latitude: subject.latitude,
      longitude: subject.longitude,
      propertyType: "Single Family",
      squareFootage: subject.squareFootage,
      bedrooms: subject.bedrooms,
      bathrooms: subject.bathrooms,
      lotSize: subject.lotSize,
      yearBuilt: subject.yearBuilt,
      owner: {
        name: "Maple Street Holdings LLC",
        type: "LLC",
        occupied: false,
      },
      lastSalePrice: subject.lastSalePrice,
      lastSaleDate: subject.lastSaleDate,
      latestTax: {
        year: 2025,
        taxAmount: 5220,
        assessedValue: 241000,
      },
      hoaFee: null,
      parcelId: "14-22.0-377-012",
      legalDescription: "Evergreen Terrace Subdivision Lot 14",
    },
    dealInputs: deal,
    compFilters: filters,
    filters,
    comps: {
      primary: {
        items: primary,
        summary: {
          count: primary.length,
          medianPrice: primarySummary.medianSoldPrice,
          averagePrice: primarySummary.averageSoldPrice,
          medianPricePerSqft: primarySummary.medianPricePerSqft,
          averagePricePerSqft: primarySummary.averagePricePerSqft,
        },
        honestLabel: "Closest valuation comps used for the blended price indication.",
      },
      recentSales: {
        items: recentSales,
        honestLabel: "Nearby recorded sales that add recent transaction context.",
      },
      activeMarket: {
        items: activeMarket,
        honestLabel: "Current list-side competition that frames pricing pressure today.",
      },
      logic: {
        rawComparableCount: PRIMARY_COMPS.length + RECENT_SALES.length,
        candidateComparableCount: PRIMARY_COMPS.length,
        visiblePrimaryCount: primary.length,
        visibleRecentSaleCount: recentSales.length,
        visibleActiveMarketCount: activeMarket.length,
        notes: [
          "Primary comps are nearest and best-matched sales, while recent sales and active listings stay visible for context.",
          "The radius and bedroom filters materially change the visible comp set in this QA scenario.",
        ],
      },
      mapSet: [...primary, ...recentSales, ...activeMarket],
    },
    valuation,
    valuationContext: {
      price: valuation.blendedEstimate,
      priceRangeLow: valuation.blendedLow,
      priceRangeHigh: valuation.blendedHigh,
    },
    dealAnalysis,
    aiVerdict,
    marketContext: buildMarketContext(),
    recentComps: primary,
  };
};

const buildSavedMasterReport = ({
  reportId,
  subject,
  filters,
  deal,
  selectedComps,
  reportData,
  generatedAt = QA_NOW,
  title,
}) => {
  const baseReport = reportData
    ? {
        ...reportData,
        generatedAt,
      }
    : buildMasterReport(subject, filters, deal);

  const primaryComps = (selectedComps || baseReport.recentComps || []).map((comp, index) =>
    normalizeComparableRecord(comp, index)
  );
  const primarySummary = buildSummary(baseReport.subject, primaryComps);

  return {
    _id: reportId,
    kind: "comps",
    contextType: "standalone",
    title: title || baseReport.title,
    address: baseReport.subject?.address || baseReport.address,
    generatedAt,
    subjectSnapshot: baseReport.subject,
    filters: baseReport.compFilters || filters || {},
    dealSnapshot: baseReport.dealInputs || deal || {},
    valuationContext: baseReport.valuationContext,
    estimatedValue: baseReport.valuation?.blendedEstimate,
    estimatedValueLow: baseReport.valuation?.blendedLow,
    estimatedValueHigh: baseReport.valuation?.blendedHigh,
    averageSoldPrice: primarySummary.averageSoldPrice,
    medianSoldPrice: primarySummary.medianSoldPrice,
    lowSoldPrice: primarySummary.lowSoldPrice,
    highSoldPrice: primarySummary.highSoldPrice,
    averagePricePerSqft: primarySummary.averagePricePerSqft,
    medianPricePerSqft: primarySummary.medianPricePerSqft,
    lowPricePerSqft: primarySummary.lowPricePerSqft,
    highPricePerSqft: primarySummary.highPricePerSqft,
    averageDaysOnMarket: primarySummary.averageDaysOnMarket,
    medianDaysOnMarket: primarySummary.medianDaysOnMarket,
    lowDaysOnMarket: primarySummary.lowDaysOnMarket,
    highDaysOnMarket: primarySummary.highDaysOnMarket,
    saleCompCount: primaryComps.length,
    askingPriceDelta: primarySummary.askingPriceDelta,
    recommendedOfferLow: primarySummary.recommendedOfferLow,
    recommendedOfferHigh: primarySummary.recommendedOfferHigh,
    report: {
      headline: baseReport.aiVerdict?.headline,
      executiveSummary: baseReport.aiVerdict?.executiveSummary,
      pricingRecommendation: baseReport.aiVerdict?.pricingRecommendation,
      offerStrategy: baseReport.aiVerdict?.offerStrategy,
    },
    recentComps: primaryComps,
    reportData: baseReport,
    ...baseReport,
  };
};

const buildInitialSavedReport = () =>
  buildSavedMasterReport({
    reportId: "qa-saved-report-1",
    subject: QA_SUBJECT,
    filters: {
      radius: 1,
      saleDateMonths: 6,
      maxComps: 8,
      propertyType: "single-family",
    },
    deal: QA_DEFAULT_DEAL,
    reportData: buildMasterReport(QA_SUBJECT, { radius: 1, saleDateMonths: 6, maxComps: 8, propertyType: "single-family" }, QA_DEFAULT_DEAL),
    generatedAt: "2026-04-04T18:10:00.000Z",
    title: "742 Evergreen Terrace - Investor-ready master report",
  });

const createQaState = () => ({
  nextSavedReportId: 2,
  savedReports: [buildInitialSavedReport()],
  requests: [],
});

const buildPreviewPayload = (requestBody = {}) => {
  const nextSubject = {
    ...QA_SUBJECT,
    ...requestBody,
  };

  return {
    ...nextSubject,
    address: requestBody.address || composeAddress(nextSubject),
    addressLine1: requestBody.addressLine1 || QA_SUBJECT.addressLine1,
    city: requestBody.city || QA_SUBJECT.city,
    state: requestBody.state || QA_SUBJECT.state,
    zipCode: requestBody.zipCode || QA_SUBJECT.zipCode,
  };
};

const buildMapboxResponse = (url) => {
  const rawQuery = decodeURIComponent(url.pathname.split("/mapbox.places/")[1] || "").replace(/\.json$/, "");
  const query = rawQuery.toLowerCase();
  const features = QA_SUGGESTIONS.filter((suggestion) =>
    suggestion.place_name.toLowerCase().includes(query)
  );

  return {
    type: "FeatureCollection",
    query: rawQuery.split(" ").filter(Boolean),
    features: features.length ? features : [QA_SUGGESTIONS[0]],
  };
};

const handleApiRequest = async (request, state) => {
  const url = new URL(request.url, window.location.origin);
  const { pathname, searchParams } = url;

  if (url.hostname === "api.mapbox.com" && pathname.includes("/geocoding/v5/mapbox.places/")) {
    return jsonResponse(buildMapboxResponse(url));
  }

  state.requests.push({
    method: request.method,
    url: url.toString(),
    timestamp: new Date().toISOString(),
  });

  if (pathname === `${API_PATHNAME}/auth/login` && request.method === "POST") {
    return jsonResponse({ token: QA_TOKEN });
  }

  if (pathname === `${API_PATHNAME}/auth/logout` && request.method === "POST") {
    return jsonResponse({ ok: true });
  }

  if (pathname === `${API_PATHNAME}/auth/me`) {
    return isAuthorized(request)
      ? jsonResponse(QA_USER)
      : jsonResponse({ message: "Unauthorized" }, 401);
  }

  const protectedPaths = [
    `${API_PATHNAME}/billing/access`,
    `${API_PATHNAME}/billing/checkout/subscription`,
    `${API_PATHNAME}/billing/checkout/one-time`,
    `${API_PATHNAME}/leads/preview-property`,
    `${API_PATHNAME}/comps/report`,
    `${API_PATHNAME}/property-reports`,
    `${API_PATHNAME}/property-reports/comps`,
  ];

  if (protectedPaths.some((path) => pathname === path) && !isAuthorized(request)) {
    return jsonResponse({ message: "Unauthorized" }, 401);
  }

  if (pathname === `${API_PATHNAME}/billing/access`) {
    return jsonResponse({
      accessGranted: true,
      accessSource: "subscription_included",
      hasActiveSubscription: true,
      monthlyIncludedRemainingCount: 7,
      monthlyIncludedUsedCount: 3,
      monthlyIncludedLimit: 10,
      monthlyIncludedResetsAt: "2026-05-01T00:00:00.000Z",
      kind: searchParams.get("kind") || "comps_report",
    });
  }

  if (pathname === `${API_PATHNAME}/billing/checkout/subscription`) {
    return jsonResponse({ url: "https://fliprop.local/qa/subscription" });
  }

  if (pathname === `${API_PATHNAME}/billing/checkout/one-time`) {
    return jsonResponse({ url: "https://fliprop.local/qa/one-time" });
  }

  if (pathname === `${API_PATHNAME}/leads/preview-property`) {
    const body = await getRequestJson(request);
    return jsonResponse(buildPreviewPayload(body));
  }

  if (pathname === `${API_PATHNAME}/comps/report`) {
    const body = await getRequestJson(request);
    return jsonResponse(buildMasterReport(body.subject || {}, body.filters || {}, body.deal || {}));
  }

  if (pathname === `${API_PATHNAME}/property-reports` && request.method === "GET") {
    return jsonResponse(clone(state.savedReports));
  }

  if (pathname === `${API_PATHNAME}/property-reports/comps` && request.method === "POST") {
    const body = await getRequestJson(request);
    const reportId = `qa-saved-report-${state.nextSavedReportId}`;
    state.nextSavedReportId += 1;

    const savedReport = buildSavedMasterReport({
      reportId,
      subject: body.subject,
      filters: body.filters,
      deal: body.deal,
      selectedComps: body.selectedComps,
      reportData: body.reportData,
      generatedAt: QA_NOW,
      title: `${body.subject?.address || QA_SUBJECT.address} - Saved report ${state.nextSavedReportId - 1}`,
    });

    state.savedReports = [
      savedReport,
      ...state.savedReports.filter((item) => item._id !== savedReport._id),
    ];

    return jsonResponse(clone(savedReport), 201);
  }

  return null;
};

export const enableQaMode = () => {
  if (!isQaMode || typeof window === "undefined" || window.__flipropQaModeEnabled) {
    return;
  }

  window.__flipropQaModeEnabled = true;
  window.__FLIPROP_QA_MODE__ = true;

  const state = createQaState();
  const originalFetch = window.fetch.bind(window);

  window.__flipropQa = {
    state,
    token: QA_TOKEN,
  };

  window.fetch = async (input, init) => {
    const request =
      input instanceof Request ? new Request(input, init) : new Request(String(input), init);
    const mockedResponse = await handleApiRequest(request, state);

    if (mockedResponse) {
      return mockedResponse;
    }

    return originalFetch(input, init);
  };
};
