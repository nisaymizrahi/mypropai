const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const HOLDING_MONTHS_BY_STATUS = {
  Potential: 6,
  Analyzing: 5,
  "Offer Made": 4,
  "Under Contract": 3,
  "Closed - Won": 2,
  "Closed - Lost": 6,
};

export const DEAL_ASSET_PATHS = {
  verdict: {
    good: "/assets/ai/deal-good.svg",
    medium: "/assets/ai/deal-medium.svg",
    bad: "/assets/ai/deal-bad.svg",
  },
  score: "/assets/ai/deal-score-visual.svg",
  profit: "/assets/ai/profit-meter.svg",
  risk: "/assets/ai/risk-indicator.svg",
  ui: {
    analyze: "/assets/ui/button-analyze-deal.svg",
    comps: "/assets/ui/button-run-comps.svg",
    insight: "/assets/ui/ai-insight-card.svg",
    investment: "/assets/ui/add-investment-panel.svg",
    dashboard: "/assets/ui/dashboard-cards-fintech.svg",
  },
  charts: {
    roi: "/assets/ui/roi-chart-style.svg",
    profit: "/assets/ui/profit-breakdown-pie.svg",
    rehab: "/assets/ui/rehab-cost-breakdown.svg",
  },
  marketing: {
    hero: "/assets/marketing/hero-dashboard.svg",
    preview: "/assets/marketing/dashboard-preview-mock.svg",
    beforeAfter: "/assets/marketing/property-before-after.svg",
    listings: "/assets/marketing/property-listing-cards.svg",
    brand: "/assets/marketing/brand-visual.svg",
  },
};

export const DEAL_TONE = {
  good: {
    label: "Strong Flip Opportunity",
    scoreLabel: "Strong buy box",
    risk: "low",
    accent: "#0f9f6e",
    soft: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.18)",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    panelClass: "bg-emerald-50/70 text-emerald-900",
    chipClass: "bg-emerald-600 text-white",
  },
  medium: {
    label: "Moderate Risk",
    scoreLabel: "Needs tighter pricing",
    risk: "medium",
    accent: "#d97706",
    soft: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.2)",
    badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    panelClass: "bg-amber-50/70 text-amber-900",
    chipClass: "bg-amber-500 text-white",
  },
  bad: {
    label: "Not Profitable",
    scoreLabel: "Needs repricing",
    risk: "high",
    accent: "#dc2626",
    soft: "rgba(248, 113, 113, 0.12)",
    border: "rgba(248, 113, 113, 0.22)",
    badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    panelClass: "bg-rose-50/70 text-rose-900",
    chipClass: "bg-rose-600 text-white",
  },
};

export const RISK_LEVELS = {
  low: {
    label: "Low risk",
    accentClass: "text-emerald-700",
    bgClass: "bg-emerald-50",
    barClass: "bg-emerald-500",
  },
  medium: {
    label: "Medium risk",
    accentClass: "text-amber-700",
    bgClass: "bg-amber-50",
    barClass: "bg-amber-500",
  },
  high: {
    label: "High risk",
    accentClass: "text-rose-700",
    bgClass: "bg-rose-50",
    barClass: "bg-rose-500",
  },
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCompactCurrency = (value = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(toNumber(value, 0));

export const formatDealCurrency = (value = 0) => currencyFormatter.format(toNumber(value, 0));

export const formatDealCompactCurrency = (value = 0) => formatCompactCurrency(value);

export const formatDealPercent = (value = 0) => `${percentFormatter.format(toNumber(value, 0))}%`;

const buildFallbackRiskFlags = ({ rehabRatio, compCount, pricingPressure, roi, nextAction }) => {
  const flags = [];

  if (rehabRatio >= 0.2) {
    flags.push("Renovation scope is heavy relative to projected exit value.");
  }

  if (compCount < 3) {
    flags.push("Comparable support is still thin for a confident go/no-go call.");
  }

  if (pricingPressure > 0) {
    flags.push("Current asking price sits above the recommended pricing comfort zone.");
  }

  if (roi <= 10) {
    flags.push("Modeled ROI is too compressed for a margin of safety.");
  }

  if (nextAction) {
    flags.push(`Next diligence step: ${nextAction}.`);
  }

  return flags.slice(0, 3);
};

const buildRehabBreakdown = (rehabEstimate) => {
  const total = Math.max(toNumber(rehabEstimate, 0), 0);

  return [
    { label: "Interior finishes", amount: total * 0.34, color: "bg-amber-400" },
    { label: "Systems", amount: total * 0.24, color: "bg-sky-500" },
    { label: "Exterior", amount: total * 0.18, color: "bg-emerald-500" },
    { label: "Contingency", amount: total * 0.14, color: "bg-rose-400" },
    { label: "Permits + labor buffer", amount: total * 0.1, color: "bg-violet-400" },
  ];
};

const buildAiSummary = ({
  verdict,
  score,
  profit,
  roi,
  spread,
  compCount,
  riskFlags,
  confidenceLabel,
  nextAction,
}) => {
  if (verdict === "good") {
    return {
      headline: "Strong flip opportunity",
      detail: `Modeled spread of ${formatDealCurrency(spread)} with ${formatDealPercent(
        roi
      )} ROI. The deal scores ${score}/100 and still leaves room for contingency.`,
      recommendation: nextAction || "Move into comps confirmation and contractor validation this week.",
      confidenceLabel,
      bullets: [
        `Projected profit: ${formatDealCurrency(profit)}`,
        `${compCount} comp${compCount === 1 ? "" : "s"} supporting the value story`,
        riskFlags[0] || "Primary risk sits in rehab execution, not in headline pricing.",
      ],
    };
  }

  if (verdict === "medium") {
    return {
      headline: "Moderate risk",
      detail: `The upside exists, but the margin compresses fast. Current assumptions show ${formatDealPercent(
        roi
      )} ROI with ${compCount} comparable signal${compCount === 1 ? "" : "s"}.`,
      recommendation: nextAction || "Tighten price, confirm rehab bids, and re-run the comp set before committing.",
      confidenceLabel,
      bullets: [
        `Projected profit: ${formatDealCurrency(profit)}`,
        `Spread over basis: ${formatDealCurrency(spread)}`,
        riskFlags[0] || "This deal needs a cleaner pricing entry to feel durable.",
      ],
    };
  }

  return {
    headline: "Not profitable",
    detail: `Under the current assumptions, the deal does not clear the return threshold. It lands at ${formatDealPercent(
      roi
    )} ROI and needs a lower basis or smaller scope.`,
    recommendation: nextAction || "Reprice aggressively or pause the opportunity until the scope changes.",
    confidenceLabel,
    bullets: [
      `Modeled loss / thin spread: ${formatDealCurrency(profit)}`,
      `Value gap: ${formatDealCurrency(spread)}`,
      riskFlags[0] || "Current asking price and rehab load are misaligned with the projected exit.",
    ],
  };
};

const getValuationBounds = (lead, arv) => {
  const low =
    toNumber(lead?.compsAnalysis?.valuationContext?.priceRangeLow, 0) ||
    toNumber(lead?.compsAnalysis?.estimatedValueLow, 0) ||
    Math.max(arv * 0.95, 0);
  const high =
    toNumber(lead?.compsAnalysis?.valuationContext?.priceRangeHigh, 0) ||
    toNumber(lead?.compsAnalysis?.estimatedValueHigh, 0) ||
    Math.max(arv * 1.04, 0);

  return { low, high };
};

export const buildLeadIntelligence = (lead = {}) => {
  const askingPrice = toNumber(lead?.sellerAskingPrice, 0);
  const targetOffer = toNumber(lead?.targetOffer, 0);
  const purchasePrice = targetOffer || askingPrice;
  const arv =
    toNumber(lead?.arv, 0) ||
    toNumber(lead?.compsAnalysis?.estimatedValue, 0) ||
    toNumber(lead?.compsAnalysis?.valuationContext?.price, 0);
  const rehabEstimate =
    toNumber(lead?.rehabEstimate, 0) ||
    (Array.isArray(lead?.renovationPlan?.items)
      ? lead.renovationPlan.items.reduce(
          (sum, item) => sum + toNumber(item?.budget, 0),
          0
        )
      : 0);
  const acquisitionClosing = purchasePrice * 0.03;
  const contingency = rehabEstimate * 0.12;
  const holdingMonths = HOLDING_MONTHS_BY_STATUS[lead?.status] || 5;
  const monthlyCarry = Math.max(purchasePrice * 0.0016, 850);
  const holdingCosts = monthlyCarry * holdingMonths;
  const sellingCosts = arv * 0.06;
  const totalBasis =
    purchasePrice + acquisitionClosing + rehabEstimate + contingency + holdingCosts;
  const totalProjectCost = totalBasis + sellingCosts;
  const profit = arv - totalProjectCost;
  const spread = arv - purchasePrice - rehabEstimate;
  const roi = totalBasis > 0 ? (profit / totalBasis) * 100 : 0;
  const margin = arv > 0 ? (profit / arv) * 100 : 0;
  const profitPerMonth = holdingMonths > 0 ? profit / holdingMonths : profit;
  const compCount =
    toNumber(lead?.compsAnalysis?.saleCompCount, 0) ||
    (Array.isArray(lead?.compsAnalysis?.recentComps) ? lead.compsAnalysis.recentComps.length : 0);
  const pricingRecommendationLow = toNumber(lead?.compsAnalysis?.recommendedOfferLow, 0);
  const pricingRecommendationHigh = toNumber(lead?.compsAnalysis?.recommendedOfferHigh, 0);
  const pricingPressure =
    askingPrice && pricingRecommendationHigh ? askingPrice - pricingRecommendationHigh : 0;
  const dataCompleteness = [
    purchasePrice > 0,
    rehabEstimate > 0,
    arv > 0,
    compCount > 0,
    Boolean(lead?.nextAction),
    Boolean(lead?.followUpDate),
  ].filter(Boolean).length;
  const rehabRatio = arv > 0 ? rehabEstimate / arv : 0;
  const providedRiskFlags = Array.isArray(lead?.compsAnalysis?.report?.riskFlags)
    ? lead.compsAnalysis.report.riskFlags.filter(Boolean)
    : [];
  const fallbackRiskFlags = buildFallbackRiskFlags({
    rehabRatio,
    compCount,
    pricingPressure,
    roi,
    nextAction: lead?.nextAction,
  });
  const riskFlags = [...new Set([...providedRiskFlags, ...fallbackRiskFlags])].slice(0, 3);
  const confidenceLabel =
    lead?.compsAnalysis?.report?.confidence ||
    (compCount >= 5 ? "High confidence" : compCount >= 3 ? "Medium confidence" : "Low confidence");

  let score = 50;
  score += clamp(margin * 1.5, -18, 22);
  score += clamp(roi * 0.5, -12, 18);
  score += clamp(compCount * 2.4, 0, 12);
  score += dataCompleteness * 2.4;
  score -= riskFlags.length * 4;
  score -= rehabRatio >= 0.22 ? 7 : rehabRatio >= 0.17 ? 3 : 0;
  score -= pricingPressure > 0 ? 6 : 0;
  score = Math.round(clamp(score, 0, 100));

  const verdict = score >= 74 ? "good" : score >= 52 ? "medium" : "bad";
  const riskLevel =
    score >= 74 && riskFlags.length <= 2 ? "low" : score >= 52 ? "medium" : "high";
  const tone = DEAL_TONE[verdict];
  const aiSummary = buildAiSummary({
    verdict,
    score,
    profit,
    roi,
    spread,
    compCount,
    riskFlags,
    confidenceLabel,
    nextAction: lead?.nextAction,
  });
  const valuationBounds = getValuationBounds(lead, arv);
  const costBreakdown = [
    { label: "Purchase", amount: purchasePrice, color: "bg-ink-900" },
    { label: "Close", amount: acquisitionClosing, color: "bg-sand-400" },
    { label: "Rehab", amount: rehabEstimate, color: "bg-amber-500" },
    { label: "Contingency", amount: contingency, color: "bg-amber-300" },
    { label: "Carry", amount: holdingCosts, color: "bg-sky-500" },
    { label: "Exit", amount: sellingCosts, color: "bg-rose-400" },
  ];
  const totalCosts = costBreakdown.reduce((sum, item) => sum + item.amount, 0);

  return {
    id: lead?._id || lead?.address || "deal",
    lead,
    address: lead?.address || "Untitled lead",
    propertyType: lead?.propertyType || "Property",
    bedrooms: toNumber(lead?.bedrooms, 0),
    bathrooms: toNumber(lead?.bathrooms, 0),
    squareFootage: toNumber(lead?.squareFootage, 0),
    score,
    verdict,
    tone,
    riskLevel,
    confidenceLabel,
    askingPrice,
    targetOffer,
    purchasePrice,
    acquisitionClosing,
    rehabEstimate,
    contingency,
    holdingCosts,
    holdingMonths,
    sellingCosts,
    totalBasis,
    totalProjectCost,
    totalCosts,
    arv,
    valuationBounds,
    profit,
    spread,
    roi,
    margin,
    profitPerMonth,
    compCount,
    pricingPressure,
    pricingRecommendationLow,
    pricingRecommendationHigh,
    nextAction: lead?.nextAction || "Run comps and confirm rehab scope.",
    followUpDate: lead?.followUpDate || null,
    listingStatus: lead?.listingStatus || "Off-market lead",
    status: lead?.status || "Potential",
    sellerName: lead?.sellerName || "",
    riskFlags,
    aiSummary,
    costBreakdown,
    rehabBreakdown: buildRehabBreakdown(rehabEstimate),
    assetPaths: {
      verdict: DEAL_ASSET_PATHS.verdict[verdict],
      score: DEAL_ASSET_PATHS.score,
      profit: DEAL_ASSET_PATHS.profit,
      risk: DEAL_ASSET_PATHS.risk,
    },
  };
};

export const summarizeLeadPortfolio = (leads = []) => {
  const analyses = leads.map((lead) => buildLeadIntelligence(lead));
  const ordered = [...analyses].sort((left, right) => right.score - left.score);
  const count = analyses.length;
  const defaults = {
    count: 0,
    analyses: [],
    orderedAnalyses: [],
    featured: null,
    averageScore: 0,
    averageROI: 0,
    averageProfit: 0,
    riskCounts: { low: 0, medium: 0, high: 0 },
    verdictCounts: { good: 0, medium: 0, bad: 0 },
    profitPool: 0,
  };

  if (!count) {
    return defaults;
  }

  const riskCounts = analyses.reduce(
    (accumulator, analysis) => ({
      ...accumulator,
      [analysis.riskLevel]: accumulator[analysis.riskLevel] + 1,
    }),
    { low: 0, medium: 0, high: 0 }
  );

  const verdictCounts = analyses.reduce(
    (accumulator, analysis) => ({
      ...accumulator,
      [analysis.verdict]: accumulator[analysis.verdict] + 1,
    }),
    { good: 0, medium: 0, bad: 0 }
  );

  const averageScore =
    analyses.reduce((sum, analysis) => sum + analysis.score, 0) / Math.max(count, 1);
  const averageROI =
    analyses.reduce((sum, analysis) => sum + analysis.roi, 0) / Math.max(count, 1);
  const averageProfit =
    analyses.reduce((sum, analysis) => sum + analysis.profit, 0) / Math.max(count, 1);
  const profitPool = analyses.reduce((sum, analysis) => sum + analysis.profit, 0);

  return {
    count,
    analyses,
    orderedAnalyses: ordered,
    featured: ordered[0],
    averageScore,
    averageROI,
    averageProfit,
    riskCounts,
    verdictCounts,
    profitPool,
  };
};

const MARKETING_DEALS = [
  {
    _id: "showcase-strong",
    address: "2148 Laurel Canyon Dr, Nashville, TN",
    propertyType: "Single family",
    bedrooms: 4,
    bathrooms: 3,
    squareFootage: 2180,
    sellerAskingPrice: 372000,
    targetOffer: 348000,
    arv: 492000,
    rehabEstimate: 54000,
    status: "Analyzing",
    listingStatus: "Pocket listing",
    nextAction: "Lock contractor walk and finalize offer band.",
    compsAnalysis: {
      saleCompCount: 5,
      recommendedOfferLow: 338000,
      recommendedOfferHigh: 352000,
      report: {
        confidence: "High confidence",
        riskFlags: ["Roof age should be confirmed before releasing earnest money."],
      },
    },
  },
  {
    _id: "showcase-medium",
    address: "879 Greenleaf Ave, Charlotte, NC",
    propertyType: "Townhome",
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1760,
    sellerAskingPrice: 294000,
    targetOffer: 286000,
    arv: 372000,
    rehabEstimate: 52000,
    status: "Potential",
    listingStatus: "MLS active",
    nextAction: "Validate HVAC and revise the carry window.",
    compsAnalysis: {
      saleCompCount: 3,
      recommendedOfferLow: 272000,
      recommendedOfferHigh: 282000,
      report: {
        confidence: "Medium confidence",
        riskFlags: ["Entry pricing is slightly above the current comfort range."],
      },
    },
  },
  {
    _id: "showcase-bad",
    address: "61 Stonegate Loop, Tampa, FL",
    propertyType: "Single family",
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1625,
    sellerAskingPrice: 338000,
    targetOffer: 328000,
    arv: 382000,
    rehabEstimate: 64000,
    status: "Analyzing",
    listingStatus: "MLS active",
    nextAction: "Reprice or pause until rehab scope is reduced.",
    compsAnalysis: {
      saleCompCount: 2,
      recommendedOfferLow: 286000,
      recommendedOfferHigh: 301000,
      report: {
        confidence: "Low confidence",
        riskFlags: ["The exit spread is too thin if the current scope is real."],
      },
    },
  },
];

export const marketingDealShowcase = MARKETING_DEALS.map((lead) => buildLeadIntelligence(lead));
