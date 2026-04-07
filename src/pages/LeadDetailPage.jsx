import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";
import {
  analyzeLeadComps,
  createOneTimeCheckout,
  getBidsForLead,
  getBillingAccess,
  getLeadDetails,
  getPropertyReports,
  previewLeadProperty,
  saveCompsReport,
  syncBillingCheckoutSession,
  updateLead,
} from "../utils/api";
import { searchAddressSuggestions } from "../utils/locationSearch";
import {
  buildAnalysisFromSavedReport,
  buildCompsFilterPayload,
  buildCompsFilters as buildMasterDealFilters,
  buildDealForm,
  buildDealPayload,
  buildSavedReportFromLegacySnapshot,
  countSavableComparables,
  normalizeMasterReport,
} from "../utils/compsReport";
import BidsTab from "../components/BidsTab";
import LeadDocumentsTab from "../components/LeadDocumentsTab";
import LeadProjectAnalysisCopilot from "../components/LeadProjectAnalysisCopilot";
import MasterDealReportWorkspace from "../components/MasterDealReportWorkspace";
import SavedCompsReportsTab from "../components/SavedCompsReportsTab";
import TasksPanel from "../components/TasksPanel";
import useSubscriptionCheckoutConsent from "../hooks/useSubscriptionCheckoutConsent";
import { INVESTOR_TERMS } from "../utils/investorTerminology";

const occupancyOptions = ["Unknown", "Vacant", "Owner Occupied", "Tenant Occupied"];
const leadStatusOptions = [
  "Potential",
  "Analyzing",
  "Offer Made",
  "Under Contract",
  "Closed - Won",
  "Closed - Lost",
];
const leadDetailTabs = [
  { id: "details", label: "Deal Details" },
  { id: "comps", label: "Deal Report" },
  { id: "saved-reports", label: "Saved Reports" },
  { id: "renovation", label: "Renovation" },
  { id: "bids", label: "Bids" },
  { id: "tasks", label: "Tasks" },
];
const projectAnalysisScenarioPresets = [
  {
    key: "light-cosmetic",
    label: "Light Cosmetic",
    strategyType: "light-cosmetic",
    rehabMultiplier: 0.72,
    arvMultiplier: 1,
    holdingMonths: 4,
    extensionPlanned: false,
    notes: "Fast-turn cosmetic refresh with limited scope creep.",
  },
  {
    key: "moderate",
    label: "Moderate",
    strategyType: "moderate",
    rehabMultiplier: 1,
    arvMultiplier: 1.05,
    holdingMonths: 6,
    extensionPlanned: false,
    notes: "Balanced rehab with key layout or systems upgrades where needed.",
  },
  {
    key: "full-gut",
    label: "Full Gut",
    strategyType: "full-gut",
    rehabMultiplier: 1.35,
    arvMultiplier: 1.12,
    holdingMonths: 8,
    extensionPlanned: false,
    notes: "Whole-home reset with deeper systems and finish work.",
  },
  {
    key: "extension",
    label: "Extension",
    strategyType: "extension",
    rehabMultiplier: 1.6,
    arvMultiplier: 1.18,
    holdingMonths: 10,
    extensionPlanned: true,
    notes: "Adds square footage and resale upside, but takes longer and needs more diligence.",
  },
];
const propertyTypeOptions = [
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
const renovationLevelOptions = [
  { value: "", label: "Select renovation level" },
  { value: "light-cosmetic", label: "Light cosmetic refresh" },
  { value: "moderate", label: "Moderate renovation" },
  { value: "heavy", label: "Heavy renovation" },
  { value: "full-gut", label: "Full gut rehab" },
];
const renovationScopeOptions = [
  {
    value: "full-gut-rehab",
    label: "Full gut rehab",
    description: "Whole-home reset with major systems and finishes.",
    trades: ["General contractor", "Electrical", "Plumbing", "HVAC", "Framing"],
    quoteItems: [
      "Full interior demo and debris haul-off",
      "Framing or layout corrections",
      "Electrical rough and finish pricing",
      "Plumbing rough and finish pricing",
      "HVAC replacement or major updates",
      "Drywall, paint, trim, and finish carpentry",
    ],
  },
  {
    value: "kitchen",
    label: "Kitchen",
    description: "Cabinets, countertops, appliances, and layout updates.",
    trades: ["Kitchen contractor", "Cabinetry", "Plumbing", "Electrical"],
    quoteItems: [
      "Cabinet, countertop, and appliance allowance",
      "Plumbing fixture and connection pricing",
      "Electrical upgrades for appliances and lighting",
      "Backsplash, tile, and finish scope",
    ],
  },
  {
    value: "bathrooms",
    label: "Bathrooms",
    description: "Bathroom remodels, tile, fixtures, and waterproofing.",
    trades: ["Bathroom contractor", "Plumbing", "Tile"],
    quoteItems: [
      "Per-bathroom remodel pricing",
      "Tile and waterproofing scope",
      "Fixture and vanity allowance",
      "Plumbing updates and finish install",
    ],
  },
  {
    value: "flooring",
    label: "Flooring",
    description: "Replace or refinish flooring throughout the property.",
    trades: ["Flooring installer"],
    quoteItems: [
      "Flooring demo and prep",
      "Material allowance by flooring type",
      "Installation pricing by square foot",
    ],
  },
  {
    value: "paint-drywall",
    label: "Paint and drywall",
    description: "Interior wall repair, texture, priming, and paint.",
    trades: ["Painter", "Drywall"],
    quoteItems: [
      "Drywall patch and texture pricing",
      "Interior paint pricing by room or square foot",
      "Trim and door painting allowance",
    ],
  },
  {
    value: "roof",
    label: "Roof",
    description: "Roof repair or full replacement scope.",
    trades: ["Roofer"],
    quoteItems: [
      "Roof replacement or repair pricing",
      "Decking or sheathing allowance if needed",
      "Gutter tie-in or replacement if applicable",
    ],
  },
  {
    value: "windows-doors",
    label: "Windows and doors",
    description: "Replace windows, exterior doors, or interior doors.",
    trades: ["Window installer", "Finish carpenter"],
    quoteItems: [
      "Window replacement count and pricing",
      "Exterior door replacement pricing",
      "Interior door and trim allowance",
    ],
  },
  {
    value: "hvac",
    label: "HVAC",
    description: "Heating, cooling, ducting, and ventilation updates.",
    trades: ["HVAC"],
    quoteItems: [
      "System replacement or repair pricing",
      "Ductwork modifications or replacement",
      "Thermostat and ventilation updates",
    ],
  },
  {
    value: "plumbing",
    label: "Plumbing",
    description: "Supply, drain, fixture, and water heater updates.",
    trades: ["Plumber"],
    quoteItems: [
      "Plumbing repair or repipe pricing",
      "Fixture replacement pricing",
      "Water heater replacement or relocation",
    ],
  },
  {
    value: "electrical",
    label: "Electrical",
    description: "Panel, wiring, fixtures, and outlet updates.",
    trades: ["Electrician"],
    quoteItems: [
      "Panel upgrade or replacement pricing",
      "Whole-home rewiring or targeted updates",
      "Fixture, switch, and outlet allowance",
    ],
  },
  {
    value: "structural",
    label: "Structural",
    description: "Framing, beam work, support repairs, and structural corrections.",
    trades: ["Structural engineer", "Framing contractor", "General contractor"],
    quoteItems: [
      "Structural review and engineering requirements",
      "Framing or beam modification pricing",
      "Wall removal, opening creation, or support work",
    ],
  },
  {
    value: "exterior-landscape",
    label: "Exterior and landscape",
    description: "Siding, fascia, paint, curb appeal, and site work.",
    trades: ["Exterior contractor", "Landscaping"],
    quoteItems: [
      "Exterior repair and paint pricing",
      "Curb appeal and cleanup scope",
      "Landscape refresh or grading allowance",
    ],
  },
];
const renovationItemStatusOptions = [
  { value: "planning", label: "Planning" },
  { value: "ready-to-quote", label: "Ready to quote" },
  { value: "quoted", label: "Quoted" },
  { value: "awarded", label: "Awarded" },
];
const renovationCategoryOptions = [
  ...renovationScopeOptions.map((scope) => ({ value: scope.value, label: scope.label })),
  { value: "custom", label: "Custom" },
];
const buildRenovationItemDraft = (item = {}) => ({
  itemId: item.itemId || "",
  category: item.category || "custom",
  name: item.name || "",
  budget: item.budget ?? "",
  status: item.status || "planning",
  scopeDescription: item.scopeDescription || "",
});

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return "—";
  return date.toLocaleDateString();
};

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return "";
  return date.toISOString().slice(0, 10);
};

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNullableDate = (value) => (value ? value : null);

const buildRenovationItemId = () =>
  `ren-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const findRenovationScopeOption = (value) =>
  renovationScopeOptions.find((scope) => scope.value === value) || null;

const getUniqueRenovationItemName = (existingItems = [], baseName) => {
  const normalizedBaseName = String(baseName || "Custom item").trim() || "Custom item";
  const existingNames = new Set(
    existingItems.map((item) => String(item.name || "").trim().toLowerCase()).filter(Boolean)
  );

  if (!existingNames.has(normalizedBaseName.toLowerCase())) {
    return normalizedBaseName;
  }

  let suffix = 2;
  while (existingNames.has(`${normalizedBaseName} ${suffix}`.toLowerCase())) {
    suffix += 1;
  }

  return `${normalizedBaseName} ${suffix}`;
};

const createRenovationItem = (input = {}, existingItems = []) => {
  const template = findRenovationScopeOption(input.category || input.value || "");
  const providedName = typeof input.name === "string" ? input.name.trim() : "";
  const baseName = providedName || template?.label || "Custom item";

  return {
    itemId:
      typeof input.itemId === "string" && input.itemId.trim()
        ? input.itemId.trim()
        : buildRenovationItemId(),
    name: providedName || getUniqueRenovationItemName(existingItems, baseName),
    category: input.category || template?.value || "custom",
    budget: input.budget ?? "",
    status: input.status || "planning",
    scopeDescription:
      typeof input.scopeDescription === "string" && input.scopeDescription.trim()
        ? input.scopeDescription.trim()
        : template?.description || "",
  };
};

const normalizeRenovationItems = (items = []) => {
  const normalizedItems = [];

  items.forEach((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return;
    }

    const nextItem = createRenovationItem(
      {
        itemId: item.itemId,
        name: item.name,
        category: item.category,
        budget: item.budget ?? "",
        status: item.status,
        scopeDescription: item.scopeDescription,
      },
      normalizedItems
    );

    if (
      nextItem.name ||
      nextItem.scopeDescription ||
      nextItem.budget !== "" ||
      nextItem.category !== "custom"
    ) {
      normalizedItems.push(nextItem);
    }
  });

  return normalizedItems;
};

const buildLegacyRenovationItems = (plan = {}) => {
  const items = [];

  if (Array.isArray(plan.selectedScopes)) {
    plan.selectedScopes.forEach((scope) => {
      const normalizedScope = String(scope || "").trim();
      if (!normalizedScope) return;

      items.push(
        createRenovationItem(
          {
            category: normalizedScope,
          },
          items
        )
      );
    });
  }

  const legacyNotes = [plan.layoutChanges, plan.contractorNotes, plan.additionalNotes]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join("\n\n");

  if (!items.length && legacyNotes) {
    items.push(
      createRenovationItem(
        {
          name: "General renovation notes",
          category: "custom",
          scopeDescription: legacyNotes,
        },
        items
      )
    );
  }

  return items;
};

const parseAddressLabel = (value = "") => {
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

const composeAddress = (parts = {}) =>
  [parts.addressLine1, parts.city, parts.state, parts.zipCode].filter(Boolean).join(", ");

const normalizePropertyType = (value) => {
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

const buildDetailsForm = (lead = {}) => {
  const parsedAddress = parseAddressLabel(lead.address || "");
  return {
    addressLine1: lead.addressLine1 || parsedAddress.addressLine1 || "",
    city: lead.city || parsedAddress.city || "",
    state: lead.state || parsedAddress.state || "",
    zipCode: lead.zipCode || parsedAddress.zipCode || "",
    status: lead.status || "Potential",
    propertyType: normalizePropertyType(lead.propertyType),
    bedrooms: lead.bedrooms ?? "",
    bathrooms: lead.bathrooms ?? "",
    squareFootage: lead.squareFootage ?? "",
    lotSize: lead.lotSize ?? "",
    yearBuilt: lead.yearBuilt ?? "",
    unitCount: lead.unitCount ?? "",
    listingStatus: lead.listingStatus || "",
    sellerAskingPrice: lead.sellerAskingPrice ?? "",
    daysOnMarket: lead.daysOnMarket ?? "",
    lastSalePrice: lead.lastSalePrice ?? "",
    lastSaleDate: formatDateInput(lead.lastSaleDate),
    sellerName: lead.sellerName || "",
    sellerPhone: lead.sellerPhone || "",
    sellerEmail: lead.sellerEmail || "",
    leadSource: lead.leadSource || "",
    occupancyStatus: lead.occupancyStatus || "Unknown",
    nextAction: lead.nextAction || "",
    followUpDate: formatDateInput(lead.followUpDate),
    targetOffer: lead.targetOffer ?? "",
    arv: lead.arv ?? "",
    rehabEstimate: lead.rehabEstimate ?? "",
    motivation: lead.motivation || "",
    notes: lead.notes || "",
  };
};

const buildRenovationForm = (lead = {}) => {
  const plan = lead.renovationPlan || {};
  const items = normalizeRenovationItems(plan.items);

  return {
    verifiedSquareFootage: plan.verifiedSquareFootage ?? lead.squareFootage ?? "",
    renovationLevel: plan.renovationLevel || "",
    extensionPlanned: Boolean(plan.extensionPlanned),
    extensionSquareFootage: plan.extensionSquareFootage ?? "",
    items: items.length ? items : buildLegacyRenovationItems(plan),
  };
};

const buildRenovationPayload = (form) => ({
  verifiedSquareFootage: toOptionalNumber(form.verifiedSquareFootage),
  renovationLevel: form.renovationLevel || "",
  extensionPlanned: Boolean(form.extensionPlanned),
  extensionSquareFootage: form.extensionPlanned
    ? toNullableNumber(form.extensionSquareFootage)
    : null,
  items: Array.isArray(form.items)
    ? form.items
        .map((item, index) => {
          const name = String(item?.name || "").trim();
          const scopeDescription = String(item?.scopeDescription || "").trim();
          const budget = toNullableNumber(item?.budget);

          if (!name && !scopeDescription && budget === null) {
            return null;
          }

          return {
            itemId:
              typeof item?.itemId === "string" && item.itemId.trim()
                ? item.itemId.trim()
                : `${buildRenovationItemId()}-${index}`,
            name: name || "Custom item",
            category: item?.category || "custom",
            budget,
            status: item?.status || "planning",
            scopeDescription,
          };
        })
        .filter(Boolean)
    : [],
});

const buildPreviewToDetailsForm = (preview = {}) => ({
  addressLine1: preview.addressLine1 || parseAddressLabel(preview.address || "").addressLine1 || "",
  city: preview.city || "",
  state: preview.state || "",
  zipCode: preview.zipCode || "",
  propertyType: normalizePropertyType(preview.propertyType),
  bedrooms: preview.bedrooms ?? "",
  bathrooms: preview.bathrooms ?? "",
  squareFootage: preview.squareFootage ?? "",
  lotSize: preview.lotSize ?? "",
  yearBuilt: preview.yearBuilt ?? "",
  unitCount: preview.unitCount ?? "",
  listingStatus: preview.listingStatus || "",
  sellerAskingPrice: preview.sellerAskingPrice ?? "",
  daysOnMarket: preview.daysOnMarket ?? "",
  lastSalePrice: preview.lastSalePrice ?? "",
  lastSaleDate: formatDateInput(preview.lastSaleDate),
});

const buildLiveLead = (lead, form) => ({
  ...lead,
  address: composeAddress(form) || lead.address,
  status: form.status || "Potential",
  propertyType: form.propertyType || "",
  bedrooms: toNullableNumber(form.bedrooms),
  bathrooms: toNullableNumber(form.bathrooms),
  squareFootage: toNullableNumber(form.squareFootage),
  lotSize: toNullableNumber(form.lotSize),
  yearBuilt: toNullableNumber(form.yearBuilt),
  unitCount: form.propertyType === "multi-family" ? toNullableNumber(form.unitCount) : null,
  listingStatus: form.listingStatus,
  sellerAskingPrice: toNullableNumber(form.sellerAskingPrice),
  daysOnMarket: toNullableNumber(form.daysOnMarket),
  lastSalePrice: toNullableNumber(form.lastSalePrice),
  lastSaleDate: toNullableDate(form.lastSaleDate),
  sellerName: form.sellerName,
  sellerPhone: form.sellerPhone,
  sellerEmail: form.sellerEmail,
  leadSource: form.leadSource,
  occupancyStatus: form.occupancyStatus || "Unknown",
  nextAction: form.nextAction,
  followUpDate: toNullableDate(form.followUpDate),
  targetOffer: toNullableNumber(form.targetOffer),
  arv: toNullableNumber(form.arv),
  rehabEstimate: toNullableNumber(form.rehabEstimate),
  motivation: form.motivation,
  notes: form.notes,
});

const roundToNearestThousand = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.round(parsed / 1000) * 1000;
};

const buildProjectAnalysisScenarioId = () =>
  `scenario-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeScenarioRecord = (scenario = {}, fallbackLabel = "Scenario") => ({
  scenarioId: scenario.scenarioId || buildProjectAnalysisScenarioId(),
  label: String(scenario.label || fallbackLabel).trim() || fallbackLabel,
  strategyType: String(scenario.strategyType || "").trim(),
  rehabEstimate:
    scenario.rehabEstimate === null || scenario.rehabEstimate === undefined
      ? ""
      : scenario.rehabEstimate,
  arv: scenario.arv === null || scenario.arv === undefined ? "" : scenario.arv,
  extensionPlanned: Boolean(scenario.extensionPlanned),
  extensionSquareFootage:
    scenario.extensionSquareFootage === null || scenario.extensionSquareFootage === undefined
      ? ""
      : scenario.extensionSquareFootage,
  holdingMonths:
    scenario.holdingMonths === null || scenario.holdingMonths === undefined
      ? ""
      : scenario.holdingMonths,
  notes: String(scenario.notes || ""),
});

const buildProjectAnalysisState = (lead = {}) => {
  const existing = lead.projectAnalysis || {};
  if (Array.isArray(existing.scenarios) && existing.scenarios.length > 0) {
    const scenarios = existing.scenarios.map((scenario, index) =>
      normalizeScenarioRecord(scenario, `Scenario ${index + 1}`)
    );
    const selectedScenarioId = scenarios.some(
      (scenario) => scenario.scenarioId === existing.selectedScenarioId
    )
      ? existing.selectedScenarioId
      : scenarios[0]?.scenarioId || "";

    return {
      scenarios,
      selectedScenarioId,
      aiSummary: String(existing.aiSummary || ""),
      lastAiUpdatedAt: existing.lastAiUpdatedAt || "",
    };
  }

  const detailedScopeTotal = Array.isArray(lead?.renovationPlan?.items)
    ? lead.renovationPlan.items.reduce((sum, item) => sum + (Number(item?.budget) || 0), 0)
    : 0;
  const baseRehab = Number(lead.rehabEstimate) || detailedScopeTotal || 0;
  const baseArv =
    Number(lead.arv) ||
    Number(lead.compsAnalysis?.estimatedValue) ||
    Number(lead.compsAnalysis?.estimatedValueHigh) ||
    0;

  const scenarios = projectAnalysisScenarioPresets.map((preset) =>
    normalizeScenarioRecord({
      scenarioId: buildProjectAnalysisScenarioId(),
      label: preset.label,
      strategyType: preset.strategyType,
      rehabEstimate: roundToNearestThousand(
        baseRehab ? baseRehab * preset.rehabMultiplier : detailedScopeTotal
      ),
      arv: roundToNearestThousand(baseArv ? baseArv * preset.arvMultiplier : 0),
      extensionPlanned: preset.extensionPlanned,
      extensionSquareFootage:
        preset.extensionPlanned && lead.squareFootage ? Math.round(Number(lead.squareFootage) * 0.18) : "",
      holdingMonths: preset.holdingMonths,
      notes: preset.notes,
    })
  );

  return {
    scenarios,
    selectedScenarioId: scenarios[0]?.scenarioId || "",
    aiSummary: "",
    lastAiUpdatedAt: "",
  };
};

const buildScenarioPayload = (scenario) => ({
  scenarioId: scenario.scenarioId,
  label: String(scenario.label || "").trim(),
  strategyType: String(scenario.strategyType || "").trim(),
  rehabEstimate: toNullableNumber(scenario.rehabEstimate),
  arv: toNullableNumber(scenario.arv),
  extensionPlanned: Boolean(scenario.extensionPlanned),
  extensionSquareFootage: scenario.extensionPlanned
    ? toNullableNumber(scenario.extensionSquareFootage)
    : null,
  holdingMonths: toNullableNumber(scenario.holdingMonths),
  notes: String(scenario.notes || "").trim(),
});

const buildScenarioProjection = ({
  scenario,
  liveLead,
  detailedScopeTotal,
  fallbackArv,
}) => {
  const acquisitionBasis = Number(liveLead.targetOffer) || Number(liveLead.sellerAskingPrice) || 0;
  const rehabEstimate =
    Number(scenario?.rehabEstimate) ||
    Number(liveLead.rehabEstimate) ||
    detailedScopeTotal ||
    0;
  const arv = Number(scenario?.arv) || Number(liveLead.arv) || fallbackArv || 0;
  const holdingMonths = Math.max(Number(scenario?.holdingMonths) || 0, 0);
  const holdingCost = acquisitionBasis > 0 ? roundToNearestThousand(acquisitionBasis * 0.006 * holdingMonths) : 0;
  const totalProjectCost = acquisitionBasis + rehabEstimate + holdingCost;
  const projectedProfit = arv - totalProjectCost;
  const marginPercent = arv > 0 ? projectedProfit / arv : null;

  let confidenceNote = "Add an ARV and rehab estimate to see a stronger read.";
  if (marginPercent !== null) {
    if (marginPercent >= 0.2) {
      confidenceNote = "Strong spread if the ARV and rehab hold.";
    } else if (marginPercent >= 0.1) {
      confidenceNote = "Reasonable spread, but this needs tighter contractor validation.";
    } else {
      confidenceNote = "Thin spread. Rework the assumptions before moving forward.";
    }
  }

  return {
    acquisitionBasis,
    rehabEstimate,
    arv,
    holdingMonths,
    holdingCost,
    totalProjectCost,
    projectedProfit,
    marginPercent,
    confidenceNote,
  };
};

const LoadingSpinner = () => (
  <div className="section-card flex items-center justify-center px-6 py-14">
    <div className="loading-ring h-10 w-10 animate-spin rounded-full" />
  </div>
);

const isSavedReportsBackendUnavailable = (error) =>
  String(error?.message || "").includes("Saved reports are not available on the server yet");

const buildLeadCompsAnalysisSnapshotFromReport = (report) => {
  if (!report?.generatedAt) return null;

  return {
    generatedAt: report.generatedAt,
    filters: report.compFilters || report.filters || null,
    valuationContext: report.valuationContext || null,
    estimatedValue: report.valuation?.blendedEstimate ?? report.estimatedValue ?? null,
    estimatedValueLow: report.valuation?.blendedLow ?? report.estimatedValueLow ?? null,
    estimatedValueHigh: report.valuation?.blendedHigh ?? report.estimatedValueHigh ?? null,
    averageSoldPrice: report.averageSoldPrice ?? report.comps?.primary?.summary?.averagePrice ?? null,
    medianSoldPrice: report.valuation?.primaryCompMedian ?? report.medianSoldPrice ?? null,
    lowSoldPrice: report.lowSoldPrice ?? null,
    highSoldPrice: report.highSoldPrice ?? null,
    averagePricePerSqft:
      report.averagePricePerSqft ?? report.comps?.primary?.summary?.averagePricePerSqft ?? null,
    medianPricePerSqft:
      report.medianPricePerSqft ?? report.comps?.primary?.summary?.medianPricePerSqft ?? null,
    lowPricePerSqft: report.lowPricePerSqft ?? null,
    highPricePerSqft: report.highPricePerSqft ?? null,
    averageDaysOnMarket: report.averageDaysOnMarket ?? null,
    medianDaysOnMarket: report.medianDaysOnMarket ?? null,
    lowDaysOnMarket: report.lowDaysOnMarket ?? null,
    highDaysOnMarket: report.highDaysOnMarket ?? null,
    saleCompCount: report.comps?.primary?.summary?.count ?? report.saleCompCount ?? null,
    askingPriceDelta: report.askingPriceDelta ?? null,
    recommendedOfferLow: report.recommendedOfferLow ?? null,
    recommendedOfferHigh: report.recommendedOfferHigh ?? null,
    report: report.aiVerdict || report.report || null,
    recentComps: Array.isArray(report.recentComps) ? report.recentComps : [],
  };
};

const SummaryStat = ({ label, value, hint }) => (
  <div className="metric-tile p-4">
    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">{label}</p>
    <p className="mt-3 text-lg font-medium text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const FormField = ({ label, hint, children, className = "" }) => (
  <label className={`space-y-2 ${className}`.trim()}>
    <span className="text-sm font-medium text-ink-700">{label}</span>
    {children}
    {hint ? <span className="block text-xs leading-5 text-ink-400">{hint}</span> : null}
  </label>
);

const DetailSection = ({ eyebrow, title, description, actions = null, children, className = "" }) => (
  <section className={`surface-panel px-6 py-7 sm:px-7 ${className}`.trim()}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 className="mt-4 text-2xl font-semibold text-ink-900">{title}</h2>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>

    <div className="mt-6">{children}</div>
  </section>
);

const getLeadStageToneClassName = (status) => {
  if (status === "Closed - Won") return "bg-emerald-600";
  if (status === "Closed - Lost") return "bg-rose-500";
  if (status === "Offer Made") return "bg-amber-500";
  if (status === "Under Contract") return "bg-sky-600";
  if (status === "Analyzing") return "bg-teal-600";
  return "bg-slate-500";
};

const TabButton = ({ active, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`lead-detail-tab-button ${active ? "lead-detail-tab-button-active" : ""}`}
    aria-current={active ? "page" : undefined}
    aria-selected={active}
    role="tab"
  >
    {label}
  </button>
);

const StageControl = ({ value, onChange, disabled, isSaving }) => (
  <div className="lead-detail-stage-shell">
    <span className="lead-detail-stage-label">Stage</span>
    <div className="lead-detail-stage-chip">
      <span
        className={`lead-detail-stage-dot ${getLeadStageToneClassName(value || "Potential")}`}
        aria-hidden="true"
      />
      <select
        value={value || "Potential"}
        onChange={onChange}
        disabled={disabled}
        className="lead-detail-stage-select"
        aria-label="Move pipeline stage"
      >
        {leadStatusOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="lead-detail-stage-caret" aria-hidden="true" />
    </div>
    {isSaving ? <span className="lead-detail-stage-saving">Saving...</span> : null}
  </div>
);

const RenovationItemModal = ({
  isOpen,
  draft,
  isEditing,
  onChange,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
          <div>
            <span className="eyebrow">{isEditing ? "Edit renovation item" : "Add renovation item"}</span>
            <h3 className="mt-3 text-2xl font-semibold text-ink-900">
              {isEditing ? "Update renovation item" : "Create renovation item"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Choose a preset item or custom scope, then set the budget and contractor-ready description.
            </p>
          </div>
          <button type="button" onClick={onClose} className="ghost-action">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
          <FormField label="Choose from list or custom">
            <select
              name="category"
              value={draft.category}
              onChange={onChange}
              className="auth-input appearance-none"
            >
              {renovationCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Budget">
            <input
              name="budget"
              type="number"
              value={draft.budget}
              onChange={onChange}
              className="auth-input"
              placeholder="0"
            />
          </FormField>

          <FormField label="Item name">
            <input
              name="name"
              value={draft.name}
              onChange={onChange}
              className="auth-input"
              placeholder="Kitchen remodel"
            />
          </FormField>

          <FormField label="Item status">
            <select
              name="status"
              value={draft.status}
              onChange={onChange}
              className="auth-input appearance-none"
            >
              {renovationItemStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Scope for contractor quote"
            hint="Describe exactly what this contractor should price, including any must-haves or finish level."
            className="md:col-span-2"
          >
            <textarea
              name="scopeDescription"
              rows="6"
              value={draft.scopeDescription}
              onChange={onChange}
              className="auth-input min-h-[180px]"
              placeholder="Example: demo existing kitchen, install shaker cabinets, quartz counters, undermount sink, new faucet, backsplash, and appliance hookups. Quote labor and material separately."
            />
          </FormField>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-ink-100 px-6 py-5">
          <button type="button" onClick={onClose} className="ghost-action">
            Cancel
          </button>
          <button type="button" onClick={onSave} className="primary-action">
            {isEditing ? "Save item" : "Add item"}
          </button>
        </div>
      </div>
    </div>
  );
};

const LeadDetailPage = ({ setDashboardHeaderConfig }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const selectedSuggestionRef = useRef("");
  const suppressSuggestionsRef = useRef(false);

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [analysis, setAnalysis] = useState(null);
  const [compsNotice, setCompsNotice] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [savedReportsLoading, setSavedReportsLoading] = useState(true);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [detailForm, setDetailForm] = useState(() => buildDetailsForm());
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSavingQuickStatus, setIsSavingQuickStatus] = useState(false);
  const [filters, setFilters] = useState(() => buildMasterDealFilters());
  const [dealOverrides, setDealOverrides] = useState({});

  const [renovationForm, setRenovationForm] = useState(() => buildRenovationForm());
  const [isSavingRenovation, setIsSavingRenovation] = useState(false);
  const [lastRenovationSavedAt, setLastRenovationSavedAt] = useState("");
  const [isRenovationItemModalOpen, setIsRenovationItemModalOpen] = useState(false);
  const [editingRenovationItemId, setEditingRenovationItemId] = useState(null);
  const [renovationItemDraft, setRenovationItemDraft] = useState(() =>
    buildRenovationItemDraft()
  );

  const [bids, setBids] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [showCompsWorkbench, setShowCompsWorkbench] = useState(false);
  const [showAllSnapshotComps, setShowAllSnapshotComps] = useState(false);
  const [projectAnalysisState, setProjectAnalysisState] = useState(() =>
    buildProjectAnalysisState()
  );
  const [isSavingProjectAnalysis, setIsSavingProjectAnalysis] = useState(false);
  const [billingAccess, setBillingAccess] = useState(null);
  const [isBillingAccessLoading, setIsBillingAccessLoading] = useState(true);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isMovingToPropertyWorkspace, setIsMovingToPropertyWorkspace] = useState(false);
  const subscriptionOffer = billingAccess?.subscriptionOffer || null;

  const handleSubscriptionCheckoutError = useCallback((error) => {
    setError(error.message || "Could not start the Pro checkout.");
  }, []);

  const {
    openSubscriptionConsent: handleStartSubscription,
    isStartingSubscription,
    subscriptionConsentDialog,
  } = useSubscriptionCheckoutConsent({
    planKey: "pro",
    monthlyPriceCents: subscriptionOffer?.monthlyPriceCents ?? null,
    trialPeriodDays: subscriptionOffer?.trialPeriodDays || 0,
    trialEligible: Boolean(billingAccess?.trialEligible),
    source: "lead_detail",
    onError: handleSubscriptionCheckoutError,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setSavedReportsLoading(true);
      const [leadData, bidsData, savedReportsData] = await Promise.all([
        getLeadDetails(id),
        getBidsForLead(id),
        getPropertyReports({
          kind: "comps",
          contextType: "lead",
          leadId: id,
        }).catch((savedReportsError) => {
          if (!isSavedReportsBackendUnavailable(savedReportsError)) {
            console.error("Failed to load saved lead reports", savedReportsError);
          }
          return [];
        }),
      ]);
      setLead(leadData);
      setBids(bidsData);

      const legacySavedReport = buildSavedReportFromLegacySnapshot(
        leadData,
        leadData.compsAnalysis,
        `legacy-${leadData._id || id}`
      );
      const nextSavedReports =
        savedReportsData.length > 0
          ? savedReportsData.map((report) => normalizeMasterReport(report, leadData))
          : legacySavedReport
            ? [normalizeMasterReport(legacySavedReport, leadData)]
            : [];

      setSavedReports(nextSavedReports);
      setAnalysis(
        nextSavedReports[0]
          ? buildAnalysisFromSavedReport(nextSavedReports[0], leadData)
          : null
      );
      setCompsNotice("");
      setFilters(
        buildMasterDealFilters(
          leadData,
          nextSavedReports[0]?.compFilters ||
            nextSavedReports[0]?.filters ||
            leadData.compsAnalysis?.filters ||
            {}
        )
      );
      setDealOverrides({});
    } catch (err) {
      setError(err.message || "Failed to load deal data.");
    } finally {
      setSavedReportsLoading(false);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!lead) return;
    const nextDetailForm = buildDetailsForm(lead);
    const nextRenovationForm = buildRenovationForm(lead);
    setDetailForm(nextDetailForm);
    setRenovationForm(nextRenovationForm);
    setProjectAnalysisState(buildProjectAnalysisState(lead));
    selectedSuggestionRef.current = composeAddress(nextDetailForm);
  }, [lead]);

  const loadBillingAccess = useCallback(async () => {
    try {
      setIsBillingAccessLoading(true);
      const access = await getBillingAccess("comps_report", id);
      setBillingAccess(access);
    } catch (err) {
      setBillingAccess(null);
    } finally {
      setIsBillingAccessLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBillingAccess();
  }, [loadBillingAccess]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      return;
    }

    const syncSession = async () => {
      try {
        await syncBillingCheckoutSession(sessionId);
        await refreshUser();
        await loadBillingAccess();
        toast.success("Comps report purchase confirmed.");
      } catch (err) {
        toast.error(err.message || "We could not confirm the billing session yet.");
      }
    };

    syncSession();
  }, [loadBillingAccess, location.search, refreshUser]);

  const addressQuery = useMemo(
    () =>
      composeAddress({
        addressLine1: detailForm.addressLine1,
        city: detailForm.city,
        state: detailForm.state,
        zipCode: detailForm.zipCode,
      }),
    [detailForm.addressLine1, detailForm.city, detailForm.state, detailForm.zipCode]
  );

  useEffect(() => {
    const query = addressQuery.trim();
    if (suppressSuggestionsRef.current || query.length < 4 || query === selectedSuggestionRef.current) {
      setSuggestions([]);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(query, controller.signal);
        setSuggestions(results);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          console.error("Address suggestion error", fetchError);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [addressQuery]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const handleDealChange = (event) => {
    const { name, value } = event.target;
    setDealOverrides((previous) => ({ ...previous, [name]: value }));
  };

  const handleQuickStatusChange = async (event) => {
    const nextStatus = event.target.value;
    const previousStatus = detailForm.status || lead.status || "Potential";

    if (nextStatus === previousStatus) {
      return;
    }

    setDetailForm((previous) => ({
      ...previous,
      status: nextStatus,
    }));
    setIsSavingQuickStatus(true);

    try {
      const updatedLead = await updateLead(id, { status: nextStatus });
      setLead(updatedLead);
      setAnalysis((previous) =>
        previous
          ? {
              ...previous,
              subject: {
                ...previous.subject,
                ...updatedLead,
              },
            }
          : previous
      );
      toast.success(`Deal moved to ${nextStatus}.`);
    } catch (error) {
      setDetailForm((previous) => ({
        ...previous,
        status: previousStatus,
      }));
      toast.error(error.message || "Failed to update pipeline stage.");
    } finally {
      setIsSavingQuickStatus(false);
    }
  };

  const handleDetailChange = (event) => {
    const { name, value } = event.target;
    setDetailForm((previous) => {
      const next = {
        ...previous,
        [name]: value,
      };

      if (name === "propertyType" && value !== "multi-family") {
        next.unitCount = "";
      }

      return next;
    });

    if (["addressLine1", "city", "state", "zipCode"].includes(name)) {
      suppressSuggestionsRef.current = false;
      selectedSuggestionRef.current = "";
    }
  };

  const handleRenovationChange = (event) => {
    const { name, value } = event.target;
    setRenovationForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const closeRenovationItemModal = () => {
    setIsRenovationItemModalOpen(false);
    setEditingRenovationItemId(null);
    setRenovationItemDraft(buildRenovationItemDraft());
  };

  const openAddRenovationItemModal = () => {
    setEditingRenovationItemId(null);
    setRenovationItemDraft(buildRenovationItemDraft());
    setIsRenovationItemModalOpen(true);
  };

  const openEditRenovationItemModal = (item) => {
    setEditingRenovationItemId(item.itemId);
    setRenovationItemDraft(buildRenovationItemDraft(item));
    setIsRenovationItemModalOpen(true);
  };

  const handleRenovationDraftChange = (event) => {
    const { name, value } = event.target;

    setRenovationItemDraft((previous) => {
      const next = {
        ...previous,
        [name]: value,
      };

      if (name === "category") {
        const previousTemplate = findRenovationScopeOption(previous.category);
        const nextTemplate = findRenovationScopeOption(value);

        if (!previous.name || previous.name === previousTemplate?.label) {
          next.name = nextTemplate?.label || "";
        }

        if (!previous.scopeDescription || previous.scopeDescription === previousTemplate?.description) {
          next.scopeDescription = nextTemplate?.description || "";
        }
      }

      return next;
    });
  };

  const handleSaveRenovationItemDraft = () => {
    const normalizedName =
      String(renovationItemDraft.name || "").trim() ||
      findRenovationScopeOption(renovationItemDraft.category)?.label ||
      "Custom item";

    setRenovationForm((previous) => {
      const existingItems = previous.items.filter((item) => item.itemId !== editingRenovationItemId);
      const nextItem = createRenovationItem(
        {
          ...renovationItemDraft,
          itemId: editingRenovationItemId || renovationItemDraft.itemId,
          name: normalizedName,
          budget: renovationItemDraft.budget,
          scopeDescription: renovationItemDraft.scopeDescription,
          status: renovationItemDraft.status,
        },
        existingItems
      );

      return {
        ...previous,
        items: editingRenovationItemId
          ? previous.items.map((item) => (item.itemId === editingRenovationItemId ? nextItem : item))
          : [...previous.items, nextItem],
      };
    });

    closeRenovationItemModal();
  };

  const handleDeleteRenovationItem = (itemId) => {
    if (!window.confirm("Delete this renovation item?")) {
      return;
    }

    setRenovationForm((previous) => ({
      ...previous,
      items: previous.items.filter((item) => item.itemId !== itemId),
    }));

    if (editingRenovationItemId === itemId) {
      closeRenovationItemModal();
    }
  };

  const handlePreviewLookup = async (addressOverride, fieldOverrides = {}) => {
    const previewSource = {
      ...detailForm,
      ...fieldOverrides,
    };
    const address = addressOverride || composeAddress(previewSource);

    if (!address.trim()) {
      toast.error("Enter an address first.");
      return;
    }

    setIsPreviewLoading(true);
    setError("");

    try {
      const preview = await previewLeadProperty({
        address,
        addressLine1: previewSource.addressLine1,
        city: previewSource.city,
        state: previewSource.state,
        zipCode: previewSource.zipCode,
        propertyType: previewSource.propertyType || undefined,
        bedrooms: toOptionalNumber(previewSource.bedrooms),
        bathrooms: toOptionalNumber(previewSource.bathrooms),
        squareFootage: toOptionalNumber(previewSource.squareFootage),
        lotSize: toOptionalNumber(previewSource.lotSize),
        yearBuilt: toOptionalNumber(previewSource.yearBuilt),
        sellerAskingPrice: toOptionalNumber(previewSource.sellerAskingPrice),
        listingStatus: previewSource.listingStatus || undefined,
      });

      const mappedPreview = buildPreviewToDetailsForm(preview);
      suppressSuggestionsRef.current = true;
      setDetailForm((previous) => {
        const next = {
          ...previous,
          ...mappedPreview,
          sellerAskingPrice:
            mappedPreview.sellerAskingPrice !== ""
              ? mappedPreview.sellerAskingPrice
              : previewSource.sellerAskingPrice,
        };
        selectedSuggestionRef.current = composeAddress(next) || address;
        return next;
      });
      setRenovationForm((previous) => ({
        ...previous,
        verifiedSquareFootage:
          previous.verifiedSquareFootage || mappedPreview.squareFootage || previous.verifiedSquareFootage,
      }));
      setSuggestions([]);
      toast.success("Property facts refreshed.");
    } catch (previewError) {
      setError(previewError.message || "Failed to refresh property facts.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    const parsedAddress = parseAddressLabel(suggestion.place_name);
    suppressSuggestionsRef.current = true;
    selectedSuggestionRef.current = composeAddress(parsedAddress) || suggestion.place_name;
    setSuggestions([]);
    setDetailForm((previous) => ({
      ...previous,
      ...parsedAddress,
    }));
    await handlePreviewLookup(suggestion.place_name, parsedAddress);
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setError("");
    setCompsNotice("");
    try {
      const result = await analyzeLeadComps(id, {
        filters: buildCompsFilterPayload(filters),
        deal: buildDealPayload(dealForm),
      });
      if (result?.noResults) {
        setAnalysis(null);
        setCompsNotice(
          result.msg ||
            "No comparable properties matched the selected filters. Try widening the radius or relaxing the size filters."
        );
        setLead((previous) => ({
          ...previous,
          ...(result.subject || {}),
        }));
        toast(result.msg || "No comparable properties matched the selected filters.");
        return;
      }
      const normalized = normalizeMasterReport(result, liveLead);
      setAnalysis(normalized);
      setCompsNotice("");
      setLead((previous) => ({
        ...previous,
        ...normalized.subject,
      }));
      await loadBillingAccess();
    } catch (err) {
      setCompsNotice("");
      setError(err.message || "Analysis failed.");
      toast.error(err.message || "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = async ({
    subject,
    filters: reportFilters,
    deal: reportDeal,
    valuationContext,
    selectedComps,
    reportData,
  }) => {
    if (countSavableComparables(selectedComps) < 3) {
      const message = "Select at least 3 comparable sales before saving.";
      setError(message);
      toast.error(message);
      return;
    }

    setIsSavingReport(true);
    setError("");

    try {
      const savedReport = await saveCompsReport({
        contextType: "lead",
        leadId: id,
        subject,
        deal: reportDeal,
        filters: reportFilters,
        valuationContext,
        selectedComps,
        reportData,
      });
      const normalized = normalizeMasterReport(savedReport, subject);

      setSavedReports((previous) => [
        normalized,
        ...previous.filter(
          (report) =>
            report._id !== normalized._id && !String(report._id || "").startsWith("legacy-")
        ),
      ]);
      setAnalysis(normalized);
      setLead((previous) =>
        previous
          ? {
              ...previous,
              compsAnalysis: buildLeadCompsAnalysisSnapshotFromReport(normalized),
            }
          : previous
      );
      setActiveTab("comps");
      setShowCompsWorkbench(true);
      toast.success("Master Deal Report saved.");
    } catch (err) {
      setError(err.message || "Failed to save comps report.");
      toast.error(err.message || "Failed to save comps report.");
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleBuyReport = async () => {
    setIsStartingCheckout(true);
    setError("");
    try {
      const kind = billingAccess?.hasActiveSubscription ? "pro_comps_topup_10" : "comps_pack_10";
      const result = await createOneTimeCheckout({
        kind,
        returnPath: window.location.pathname,
      });
      window.location.href = result.url;
    } catch (err) {
      setError(err.message || "Could not start the report checkout.");
      setIsStartingCheckout(false);
    }
  };

  const handleSaveDetails = async () => {
    setIsSavingDetails(true);
    setError("");
    try {
      const payload = {
        address: composeAddress(detailForm),
        addressLine1: detailForm.addressLine1,
        city: detailForm.city,
        state: detailForm.state,
        zipCode: detailForm.zipCode,
        status: detailForm.status || "Potential",
        propertyType: detailForm.propertyType,
        bedrooms: toNullableNumber(detailForm.bedrooms),
        bathrooms: toNullableNumber(detailForm.bathrooms),
        squareFootage: toNullableNumber(detailForm.squareFootage),
        lotSize: toNullableNumber(detailForm.lotSize),
        yearBuilt: toNullableNumber(detailForm.yearBuilt),
        unitCount:
          detailForm.propertyType === "multi-family"
            ? toNullableNumber(detailForm.unitCount)
            : null,
        listingStatus: detailForm.listingStatus,
        sellerAskingPrice: toNullableNumber(detailForm.sellerAskingPrice),
        daysOnMarket: toNullableNumber(detailForm.daysOnMarket),
        lastSalePrice: toNullableNumber(detailForm.lastSalePrice),
        lastSaleDate: toNullableDate(detailForm.lastSaleDate),
        sellerName: detailForm.sellerName,
        sellerPhone: detailForm.sellerPhone,
        sellerEmail: detailForm.sellerEmail,
        leadSource: detailForm.leadSource,
        occupancyStatus: detailForm.occupancyStatus || "Unknown",
        nextAction: detailForm.nextAction,
        followUpDate: toNullableDate(detailForm.followUpDate),
        targetOffer: toNullableNumber(detailForm.targetOffer),
        arv: toNullableNumber(detailForm.arv),
        rehabEstimate: toNullableNumber(detailForm.rehabEstimate),
        motivation: detailForm.motivation,
        notes: detailForm.notes,
      };

      const updatedLead = await updateLead(id, payload);
      setLead(updatedLead);
      setAnalysis((previous) =>
        previous
          ? {
              ...previous,
              subject: {
                ...previous.subject,
                ...updatedLead,
              },
            }
          : previous
      );
      toast.success("Deal details saved.");
    } catch (err) {
      setError(err.message || "Failed to save deal details.");
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleSaveRenovation = async () => {
    setIsSavingRenovation(true);
    setError("");
    try {
      const updatedLead = await updateLead(id, {
        renovationPlan: buildRenovationPayload(renovationForm),
      });
      setLead(updatedLead);
      setRenovationForm(buildRenovationForm(updatedLead));
      setLastRenovationSavedAt(new Date().toISOString());
      toast.success("Renovation plan saved. It will stay here when you reopen the deal.");
    } catch (err) {
      setError(err.message || "Failed to save renovation plan.");
    } finally {
      setIsSavingRenovation(false);
    }
  };

  const handleScenarioChange = (scenarioId, field, value) => {
    setProjectAnalysisState((previous) => ({
      ...previous,
      scenarios: previous.scenarios.map((scenario) =>
        scenario.scenarioId === scenarioId
          ? {
              ...scenario,
              [field]:
                field === "extensionPlanned"
                  ? Boolean(value)
                  : value,
            }
          : scenario
      ),
    }));
  };

  const handleAddCustomScenario = () => {
    const newScenario = normalizeScenarioRecord({
      scenarioId: buildProjectAnalysisScenarioId(),
      label: `Custom ${projectAnalysisState.scenarios.length + 1}`,
      strategyType: "custom",
      rehabEstimate: liveLead.rehabEstimate || renovationBudgetTotal || "",
      arv:
        liveLead.arv ||
        analysis?.valuation?.blendedEstimate ||
        analysis?.estimatedValue ||
        "",
      extensionPlanned: false,
      extensionSquareFootage: "",
      holdingMonths: 6,
      notes: "Custom scenario for testing a different path.",
    });

    setProjectAnalysisState((previous) => ({
      ...previous,
      scenarios: [...previous.scenarios, newScenario],
      selectedScenarioId: newScenario.scenarioId,
    }));
  };

  const persistProjectAnalysis = useCallback(
    async (nextProjectAnalysis, successMessage) => {
      setIsSavingProjectAnalysis(true);
      setError("");

      try {
        const payload = {
          selectedScenarioId: nextProjectAnalysis.selectedScenarioId,
          aiSummary: nextProjectAnalysis.aiSummary || "",
          lastAiUpdatedAt: nextProjectAnalysis.lastAiUpdatedAt || null,
          scenarios: nextProjectAnalysis.scenarios.map(buildScenarioPayload),
        };

        const updatedLead = await updateLead(id, {
          projectAnalysis: payload,
        });
        setLead(updatedLead);
        toast.success(successMessage);
      } catch (saveError) {
        setError(saveError.message || "Failed to save project analysis.");
        toast.error(saveError.message || "Failed to save project analysis.");
      } finally {
        setIsSavingProjectAnalysis(false);
      }
    },
    [id]
  );

  const handleSaveProjectAnalysis = async () => {
    await persistProjectAnalysis(projectAnalysisState, "Project analysis saved.");
  };

  const handleApplyProjectAnalysisSuggestions = async (patchBundle) => {
    const nextProjectAnalysis = {
      ...projectAnalysisState,
      scenarios: projectAnalysisState.scenarios.map((scenario) => {
        const patchRecord = (patchBundle?.scenarioPatches || []).find(
          (item) => item?.scenarioId === scenario.scenarioId
        );
        if (!patchRecord?.patch) {
          return scenario;
        }

        return normalizeScenarioRecord({
          ...scenario,
          ...patchRecord.patch,
          rehabEstimate:
            patchRecord.patch.rehabEstimate !== undefined
              ? patchRecord.patch.rehabEstimate
              : scenario.rehabEstimate,
          arv: patchRecord.patch.arv !== undefined ? patchRecord.patch.arv : scenario.arv,
          extensionPlanned:
            patchRecord.patch.extensionPlanned !== undefined
              ? patchRecord.patch.extensionPlanned
              : scenario.extensionPlanned,
          extensionSquareFootage:
            patchRecord.patch.extensionSquareFootage !== undefined
              ? patchRecord.patch.extensionSquareFootage
              : scenario.extensionSquareFootage,
          holdingMonths:
            patchRecord.patch.holdingMonths !== undefined
              ? patchRecord.patch.holdingMonths
              : scenario.holdingMonths,
        });
      }),
      aiSummary:
        patchBundle?.summaryPatch?.aiSummary !== undefined
          ? patchBundle.summaryPatch.aiSummary
          : projectAnalysisState.aiSummary,
      lastAiUpdatedAt: new Date().toISOString(),
    };

    setProjectAnalysisState(nextProjectAnalysis);
    await persistProjectAnalysis(nextProjectAnalysis, "AI suggestions applied.");
  };

  const propertyWorkspaceId =
    lead && (typeof lead.property === "object" ? lead.property?._id : lead.property);
  const propertyWorkspaceActive = Boolean(lead?.inPropertyWorkspace && propertyWorkspaceId);
  const liveLead = useMemo(() => buildLiveLead(lead || {}, detailForm), [lead, detailForm]);
  const dealForm = {
    ...buildDealForm(analysis?.dealInputs || savedReports[0]?.dealSnapshot || {}, liveLead),
    ...dealOverrides,
  };
  const workingTargetOffer =
    detailForm.targetOffer === "" ? null : Number(detailForm.targetOffer);
  const showsUnitCount = detailForm.propertyType === "multi-family";
  const renovationBudgetTotal = renovationForm.items.reduce(
    (sum, item) => sum + (Number(item.budget) || 0),
    0
  );
  const renovationBudgetedItemCount = renovationForm.items.filter(
    (item) => item.budget !== "" && item.budget !== null && item.budget !== undefined
  ).length;
  const renovationItemsCount = renovationForm.items.length;
  const handleOpenPropertyWorkspace = useCallback(() => {
    if (!propertyWorkspaceId) {
      toast.error("This deal is not linked to a Property Workspace yet.");
      return;
    }

    navigate(`/properties/${encodeURIComponent(propertyWorkspaceId)}`);
  }, [navigate, propertyWorkspaceId]);

  const handleMoveToPropertyWorkspace = useCallback(async () => {
    if (!propertyWorkspaceId) {
      toast.error("This deal is not linked to a Property Workspace yet.");
      return;
    }

    if ((lead?.status || detailForm.status) !== "Closed - Won") {
      toast.error("Only Closed - Won deals can move into Property Workspace.");
      return;
    }

    try {
      setIsMovingToPropertyWorkspace(true);
      const updatedLead = await updateLead(id, {
        inPropertyWorkspace: true,
      });
      setLead(updatedLead);
      toast.success("Moved to Property Workspace.");
      navigate(`/properties/${encodeURIComponent(propertyWorkspaceId)}`);
    } catch (moveError) {
      toast.error(moveError.message || "Failed to move this deal into Property Workspace.");
    } finally {
      setIsMovingToPropertyWorkspace(false);
    }
  }, [detailForm.status, id, lead?.status, navigate, propertyWorkspaceId]);
  const workspaceAction = propertyWorkspaceActive ? (
    <button
      type="button"
      onClick={handleOpenPropertyWorkspace}
      className="primary-action"
    >
      Open Property Workspace
    </button>
  ) : propertyWorkspaceId && liveLead.status === "Closed - Won" ? (
    <button
      type="button"
      onClick={handleMoveToPropertyWorkspace}
      disabled={isMovingToPropertyWorkspace}
      className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isMovingToPropertyWorkspace ? "Moving..." : "Move to Property Workspace"}
    </button>
  ) : null;

  if (loading) return <LoadingSpinner />;
  if (error && !lead) return <p className="p-4 text-center text-red-500">{error}</p>;
  if (!lead) return <p className="p-4 text-center">Deal not found.</p>;

  const propertySummaryLabel =
    [
      liveLead.propertyType,
      liveLead.squareFootage ? `${Number(liveLead.squareFootage).toLocaleString()} sqft` : null,
      liveLead.bedrooms ? `${liveLead.bedrooms} bd` : null,
      liveLead.bathrooms ? `${liveLead.bathrooms} ba` : null,
    ]
      .filter(Boolean)
      .join(" • ") || "Property facts still coming together";
  const workspaceStatusLabel = propertyWorkspaceActive
    ? "In Property Workspace"
    : propertyWorkspaceId
      ? "Linked property ready"
      : "Property Workspace pending";
  const workspaceStatusHint = propertyWorkspaceActive
    ? "Property execution is already unlocked."
    : propertyWorkspaceId
      ? "Close the deal to move it into Property Workspace."
      : "This deal has not been linked into Property Workspace yet.";
  const marketStatusLabel =
    liveLead.listingStatus || liveLead.sellerAskingPrice ? "On market" : "Off market";
  const marketStatusHint =
    liveLead.listingStatus || liveLead.sellerAskingPrice
      ? liveLead.listingStatus || "Listing status captured"
      : "Listing details have not been captured yet.";
  const overviewRiskFlags = [
    ...(Array.isArray(liveLead.marketSearchAssessment?.match?.riskFlags)
      ? liveLead.marketSearchAssessment.match.riskFlags
      : []),
    ...(Array.isArray(analysis?.aiVerdict?.riskFlags) ? analysis.aiVerdict.riskFlags : []),
    ...(Array.isArray(analysis?.report?.riskFlags) ? analysis.report.riskFlags : []),
  ].filter(Boolean);
  const nextStepSummary =
    liveLead.nextAction ||
    liveLead.marketSearchAssessment?.match?.nextStep ||
    analysis?.aiVerdict?.nextSteps?.[0] ||
    "Add the next action so the team knows what happens after this review.";
  const snapshotComps = Array.isArray(analysis?.recentComps)
    ? analysis.recentComps
    : Array.isArray(lead?.compsAnalysis?.recentComps)
      ? lead.compsAnalysis.recentComps
      : [];
  const visibleSnapshotComps = showAllSnapshotComps ? snapshotComps : snapshotComps.slice(0, 4);
  const selectedScenario =
    projectAnalysisState.scenarios.find(
      (scenario) => scenario.scenarioId === projectAnalysisState.selectedScenarioId
    ) || projectAnalysisState.scenarios[0] || null;
  const fallbackScenarioArv =
    Number(analysis?.valuation?.blendedEstimate) ||
    Number(analysis?.estimatedValue) ||
    Number(lead?.compsAnalysis?.estimatedValue) ||
    0;
  const selectedScenarioProjection = selectedScenario
    ? buildScenarioProjection({
        scenario: selectedScenario,
        liveLead,
        detailedScopeTotal: renovationBudgetTotal,
        fallbackArv: fallbackScenarioArv,
      })
    : null;
  const projectAnalysisDelta =
    liveLead.rehabEstimate !== null &&
    liveLead.rehabEstimate !== undefined &&
    renovationBudgetTotal
      ? renovationBudgetTotal - Number(liveLead.rehabEstimate || 0)
      : null;
  const activeConfidenceLabel =
    analysis?.aiVerdict?.confidence ||
    analysis?.report?.confidence ||
    lead?.compsAnalysis?.report?.confidence ||
    "Not rated";
  const arValueRangeLabel =
    analysis?.valuation?.blendedLow && analysis?.valuation?.blendedHigh
      ? `${formatCurrency(analysis.valuation.blendedLow)} - ${formatCurrency(
          analysis.valuation.blendedHigh
        )}`
      : lead?.compsAnalysis?.estimatedValueLow && lead?.compsAnalysis?.estimatedValueHigh
        ? `${formatCurrency(lead.compsAnalysis.estimatedValueLow)} - ${formatCurrency(
            lead.compsAnalysis.estimatedValueHigh
          )}`
        : formatCurrency(liveLead.arv || fallbackScenarioArv);
  const recommendedOfferLabel =
    analysis?.recommendedOfferLow && analysis?.recommendedOfferHigh
      ? `${formatCurrency(analysis.recommendedOfferLow)} - ${formatCurrency(
          analysis.recommendedOfferHigh
        )}`
      : lead?.compsAnalysis?.recommendedOfferLow && lead?.compsAnalysis?.recommendedOfferHigh
        ? `${formatCurrency(lead.compsAnalysis.recommendedOfferLow)} - ${formatCurrency(
            lead.compsAnalysis.recommendedOfferHigh
          )}`
        : formatCurrency(liveLead.targetOffer);

  return (
    <div className="space-y-4">
      <section className="lead-detail-tab-rail sticky top-40 z-20 md:top-28 xl:top-24">
        <div className="lead-detail-tab-track">
          <div className="lead-detail-tab-list" role="tablist" aria-label="Deal sections">
            {leadDetailTabs.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                label={tab.label}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
          <StageControl
            value={detailForm.status || "Potential"}
            onChange={handleQuickStatusChange}
            disabled={isSavingQuickStatus}
            isSaving={isSavingQuickStatus}
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-[16px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {activeTab === "details" && (
        <div className="space-y-5">
          <section className="surface-panel-strong overflow-hidden px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <span className="eyebrow">Deal brief</span>
                <h2 className="mt-4 font-display text-[2.15rem] leading-[0.96] text-ink-900">
                  Keep the deal thesis, pricing, and next move in one place
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500">
                  This is the acquisition desk view for the record. Update the property facts,
                  market posture, seller context, and pricing plan as the team learns more.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="workspace-counter-pill">{detailForm.status || "Potential"}</span>
                <span className="workspace-counter-pill">{workspaceStatusLabel}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryStat
                label="Property"
                value={propertySummaryLabel}
                hint={liveLead.address || "Address still needs confirmation"}
              />
              <SummaryStat
                label="Pricing"
                value={`Ask ${formatCurrency(liveLead.sellerAskingPrice)}`}
                hint={`Target ${formatCurrency(workingTargetOffer)}`}
              />
              <SummaryStat
                label="Market posture"
                value={marketStatusLabel}
                hint={marketStatusHint}
              />
              <SummaryStat
                label="Workspace"
                value={workspaceStatusLabel}
                hint={workspaceStatusHint}
              />
            </div>
          </section>

          <DetailSection
            eyebrow="Deal profile"
            title="Property facts and stage"
            description="Capture the address, stage, and physical facts first. Use the lookup to refresh known property data after the address changes."
            actions={
              <button
                type="button"
                onClick={() => handlePreviewLookup()}
                disabled={isPreviewLoading || !addressQuery.trim()}
                className="secondary-action inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ArrowPathIcon className={`h-4 w-4 ${isPreviewLoading ? "animate-spin" : ""}`} />
                {isPreviewLoading ? "Refreshing facts..." : "Refresh property facts"}
              </button>
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="relative md:col-span-2">
                <FormField label="Property address">
                  <input
                    name="addressLine1"
                    value={detailForm.addressLine1}
                    onChange={handleDetailChange}
                    className="auth-input"
                    placeholder="Start typing the property address..."
                  />
                </FormField>

                {suggestions.length > 0 ? (
                  <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-[16px] border border-ink-100 bg-white shadow-soft">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full border-b border-ink-100 px-4 py-3 text-left text-sm text-ink-700 transition hover:bg-sand-50 last:border-b-0"
                      >
                        {suggestion.place_name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <FormField label="City">
                <input
                  name="city"
                  value={detailForm.city}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="City"
                />
              </FormField>

              <FormField label="State">
                <input
                  name="state"
                  value={detailForm.state}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="State"
                />
              </FormField>

              <FormField label="Zip code">
                <input
                  name="zipCode"
                  value={detailForm.zipCode}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="Zip code"
                />
              </FormField>

              <FormField label="Deal stage">
                <select
                  name="status"
                  value={detailForm.status}
                  onChange={handleDetailChange}
                  className="auth-input appearance-none"
                >
                  {leadStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Property type">
                <select
                  name="propertyType"
                  value={detailForm.propertyType}
                  onChange={handleDetailChange}
                  className="auth-input appearance-none"
                >
                  {propertyTypeOptions.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Bedrooms">
                <input
                  name="bedrooms"
                  type="number"
                  value={detailForm.bedrooms}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="0"
                />
              </FormField>

              <FormField label="Bathrooms">
                <input
                  name="bathrooms"
                  type="number"
                  step="0.5"
                  value={detailForm.bathrooms}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="0"
                />
              </FormField>

              <FormField label="Square footage">
                <input
                  name="squareFootage"
                  type="number"
                  value={detailForm.squareFootage}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="0"
                />
              </FormField>

              <FormField label="Lot size">
                <input
                  name="lotSize"
                  type="number"
                  value={detailForm.lotSize}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="0"
                />
              </FormField>

              <FormField label="Year built">
                <input
                  name="yearBuilt"
                  type="number"
                  value={detailForm.yearBuilt}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="0"
                />
              </FormField>

              {showsUnitCount ? (
                <FormField label="Unit count">
                  <input
                    name="unitCount"
                    type="number"
                    value={detailForm.unitCount}
                    onChange={handleDetailChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </FormField>
              ) : null}
            </div>
          </DetailSection>

          <DetailSection
            eyebrow="Market posture"
            title="Listing and sales context"
            description="Keep the active listing details here when the property is on market so the team can compare the seller’s posture with the current deal thesis."
          >
            <div className="rounded-[18px] border border-ink-100 bg-sand-50/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">Market status</p>
                  <p className="mt-1 text-sm text-ink-500">
                    Capture the listing posture, ask, and last trade data in one place.
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    liveLead.listingStatus || liveLead.sellerAskingPrice
                      ? "bg-verdigris-50 text-verdigris-700"
                      : "bg-white text-ink-600 ring-1 ring-ink-100"
                  }`}
                >
                  {marketStatusLabel}
                </span>
              </div>

              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <FormField label="Listing status">
                  <input
                    name="listingStatus"
                    value={detailForm.listingStatus}
                    onChange={handleDetailChange}
                    className="auth-input"
                    placeholder="For Sale, Pending, Off Market"
                  />
                </FormField>

                <FormField label="Asking price">
                  <input
                    name="sellerAskingPrice"
                    type="number"
                    value={detailForm.sellerAskingPrice}
                    onChange={handleDetailChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </FormField>

                <FormField label="Days on market">
                  <input
                    name="daysOnMarket"
                    type="number"
                    value={detailForm.daysOnMarket}
                    onChange={handleDetailChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </FormField>

                <FormField label="Last sale price">
                  <input
                    name="lastSalePrice"
                    type="number"
                    value={detailForm.lastSalePrice}
                    onChange={handleDetailChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </FormField>

                <FormField label="Last sale date">
                  <input
                    name="lastSaleDate"
                    type="date"
                    value={detailForm.lastSaleDate}
                    onChange={handleDetailChange}
                    className="auth-input"
                  />
                </FormField>
              </div>
            </div>
          </DetailSection>

          <DetailSection
            eyebrow="Seller and strategy"
            title="Seller context and pricing plan"
            description="Save the seller details, pricing anchors, and next move so the deal stays decision-ready between follow-ups."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Seller name">
                <input
                  name="sellerName"
                  value={detailForm.sellerName}
                  onChange={handleDetailChange}
                  className="auth-input"
                />
              </FormField>

              <FormField label="Deal source">
                <input
                  name="leadSource"
                  value={detailForm.leadSource}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="Agent, referral, direct mail..."
                />
              </FormField>

              <FormField label="Seller phone">
                <input
                  name="sellerPhone"
                  value={detailForm.sellerPhone}
                  onChange={handleDetailChange}
                  className="auth-input"
                />
              </FormField>

              <FormField label="Seller email">
                <input
                  name="sellerEmail"
                  type="email"
                  value={detailForm.sellerEmail}
                  onChange={handleDetailChange}
                  className="auth-input"
                />
              </FormField>

              <FormField label="Occupancy">
                <select
                  name="occupancyStatus"
                  value={detailForm.occupancyStatus}
                  onChange={handleDetailChange}
                  className="auth-input appearance-none"
                >
                  {occupancyOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Next move">
                <input
                  name="nextAction"
                  value={detailForm.nextAction}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="Call seller, request photos, line up contractor..."
                />
              </FormField>

              <FormField label="Target offer">
                <input
                  name="targetOffer"
                  type="number"
                  value={detailForm.targetOffer}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="0"
                />
              </FormField>

              <FormField label="Follow-up date">
                <input
                  name="followUpDate"
                  type="date"
                  value={detailForm.followUpDate}
                  onChange={handleDetailChange}
                  className="auth-input"
                />
              </FormField>

              <FormField label="ARV / exit value">
                <input
                  name="arv"
                  type="number"
                  value={detailForm.arv}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="0"
                />
              </FormField>

              <FormField label="Current rehab estimate">
                <input
                  name="rehabEstimate"
                  type="number"
                  value={detailForm.rehabEstimate}
                  onChange={handleDetailChange}
                  className="auth-input"
                  placeholder="0"
                />
              </FormField>

              <FormField label="Seller motivation" className="md:col-span-2">
                <textarea
                  rows="3"
                  name="motivation"
                  value={detailForm.motivation}
                  onChange={handleDetailChange}
                  className="auth-input min-h-[110px]"
                  placeholder="Why is this seller likely to negotiate, move quickly, or sell below market?"
                />
              </FormField>

              <FormField label="Deal notes" className="md:col-span-2">
                <textarea
                  rows="4"
                  name="notes"
                  value={detailForm.notes}
                  onChange={handleDetailChange}
                  className="auth-input min-h-[140px]"
                  placeholder="Anything the team should remember about this opportunity..."
                />
              </FormField>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={isSavingDetails}
                className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingDetails ? "Saving..." : "Save deal details"}
              </button>
            </div>
          </DetailSection>
        </div>
      )}

      {activeTab === "comps" && (
        <MasterDealReportWorkspace
          subject={liveLead}
          report={analysis}
          filters={filters}
          deal={dealForm}
          onFilterChange={handleFilterChange}
          onDealChange={handleDealChange}
          isAnalyzing={isAnalyzing}
          onRunAnalysis={handleRunAnalysis}
          billingAccess={billingAccess}
          isBillingAccessLoading={isBillingAccessLoading}
          onStartSubscription={handleStartSubscription}
          isStartingSubscription={isStartingSubscription}
          onBuyReport={handleBuyReport}
          isStartingCheckout={isStartingCheckout}
          onSaveReport={handleSaveReport}
          isSavingReport={isSavingReport}
          saveButtonLabel="Save Deal Report"
          runButtonLabel="Run Deal Report"
          showOneTimeCheckout
          reportNotice={compsNotice}
          renderSubjectPanel={() => (
            <div className="surface-panel px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-ink-900">Current deal snapshot</h3>
                  <p className="mt-1 text-sm text-ink-500">
                    These numbers come from the details saved on this deal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className="ghost-action"
                >
                  Edit details
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Property
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    {[
                      liveLead.propertyType,
                      liveLead.squareFootage
                        ? `${Number(liveLead.squareFootage).toLocaleString()} sqft`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" • ") || "No property facts yet"}
                  </p>
                </div>
                <div className="rounded-[18px] bg-sand-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Pricing
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    Ask {formatCurrency(liveLead.sellerAskingPrice)}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    Target {formatCurrency(workingTargetOffer)}
                  </p>
                </div>
              </div>
            </div>
          )}
        />
      )}

      {activeTab === "saved-reports" && (
        <SavedCompsReportsTab
          reports={savedReports}
          isLoading={savedReportsLoading}
          title="Saved Deal Reports"
          description="Every saved report for this deal lives here so you can compare underwriting cases over time."
          emptyTitle="No deal reports saved yet"
          emptyMessage="Run the Deal Report, save it, and the deal's report history will appear here."
        />
      )}

      {activeTab === "renovation" && (
        <div className="space-y-6">
          <section className="surface-panel px-6 py-6 sm:px-7">
            <span className="eyebrow">Renovation planning and estimate</span>
            <h2 className="mt-4 text-2xl font-semibold text-ink-900">
              Build the scope before you price the job
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Set the project basics first, then build a clear renovation item list with budgets and contractor-ready scopes.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                label="Verified square footage"
                hint="Confirm the usable square footage before building the estimate."
              >
                <input
                  name="verifiedSquareFootage"
                  type="number"
                  value={renovationForm.verifiedSquareFootage}
                  onChange={handleRenovationChange}
                  className="auth-input"
                  placeholder="0"
                />
              </FormField>

              <FormField label="Renovation level">
                <select
                  name="renovationLevel"
                  value={renovationForm.renovationLevel}
                  onChange={handleRenovationChange}
                  className="auth-input appearance-none"
                >
                  {renovationLevelOptions.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Will there be an extension?">
                <select
                  name="extensionPlanned"
                  value={renovationForm.extensionPlanned ? "yes" : "no"}
                  onChange={(event) =>
                    setRenovationForm((previous) => ({
                      ...previous,
                      extensionPlanned: event.target.value === "yes",
                      extensionSquareFootage:
                        event.target.value === "yes" ? previous.extensionSquareFootage : "",
                    }))
                  }
                  className="auth-input appearance-none"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </FormField>

              <FormField label="Extension square footage">
                <input
                  name="extensionSquareFootage"
                  type="number"
                  value={renovationForm.extensionSquareFootage}
                  onChange={handleRenovationChange}
                  className="auth-input"
                  placeholder={renovationForm.extensionPlanned ? "0" : "Not needed"}
                  disabled={!renovationForm.extensionPlanned}
                />
              </FormField>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <SummaryStat
              label="Total Renovation Budget"
              value={renovationBudgetedItemCount ? formatCurrency(renovationBudgetTotal) : "—"}
              hint={
                renovationBudgetedItemCount
                  ? `${renovationBudgetedItemCount} of ${renovationItemsCount} items budgeted`
                  : "Add budgets to your renovation items"
              }
            />
            <SummaryStat
              label="Renovation Items"
              value={renovationItemsCount}
              hint={renovationItemsCount ? "Items currently in the plan" : "No items added yet"}
            />
            <SummaryStat
              label="Extension"
              value={
                renovationForm.extensionPlanned
                  ? renovationForm.extensionSquareFootage
                    ? `${Number(renovationForm.extensionSquareFootage).toLocaleString()} sqft`
                    : "Yes"
                  : "No"
              }
              hint={
                renovationForm.verifiedSquareFootage
                  ? `Verified size ${Number(renovationForm.verifiedSquareFootage).toLocaleString()} sqft`
                  : "Square footage not verified yet"
              }
            />
          </div>

          <section className="surface-panel px-6 py-6 sm:px-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="eyebrow">Renovation plan list</span>
                <h3 className="mt-3 text-2xl font-semibold text-ink-900">Build the scope list</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Add renovation items one by one, set the budget, and write what the contractor should quote.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddRenovationItemModal}
                className="primary-action inline-flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add renovation item
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {renovationItemsCount ? (
                renovationForm.items.map((item) => {
                  const categoryLabel =
                    renovationCategoryOptions.find((option) => option.value === item.category)?.label ||
                    "Custom";
                  const statusLabel =
                    renovationItemStatusOptions.find((option) => option.value === item.status)?.label ||
                    "Planning";

                  return (
                    <div
                      key={item.itemId}
                      className="rounded-[24px] border border-ink-100 bg-white px-5 py-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold text-ink-900">
                              {item.name || "Untitled item"}
                            </h4>
                            <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                              {categoryLabel}
                            </span>
                            <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
                            {item.scopeDescription || "No scope description added yet."}
                          </p>
                        </div>

                        <div className="rounded-[18px] bg-sand-50 px-4 py-4 text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                            Budget
                          </p>
                          <p className="mt-2 text-lg font-semibold text-ink-900">
                            {item.budget !== "" && item.budget !== null && item.budget !== undefined
                              ? formatCurrency(item.budget)
                              : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEditRenovationItemModal(item)}
                          className="ghost-action inline-flex items-center gap-2"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Edit item
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRenovationItem(item.itemId)}
                          className="ghost-action inline-flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete item
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-ink-200 bg-sand-50/70 px-5 py-10 text-center">
                  <h4 className="text-xl font-semibold text-ink-900">No renovation items yet</h4>
                  <p className="mt-2 text-sm leading-6 text-ink-500">
                    Click <span className="font-semibold text-ink-900">Add renovation item</span> to choose from the preset list or create a custom one.
                  </p>
                </div>
              )}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-500">
              {lastRenovationSavedAt
                ? `Saved ${formatDate(lastRenovationSavedAt)}. Your renovation items and budgets are stored on this deal.`
                : "Save renovation plan to store the item list, budgets, and project setup on this deal."}
            </p>
            <button
              type="button"
              onClick={handleSaveRenovation}
              disabled={isSavingRenovation}
              className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSavingRenovation ? "Saving..." : "Save renovation plan"}
            </button>
          </div>
        </div>
      )}

      <RenovationItemModal
        isOpen={isRenovationItemModalOpen}
        draft={renovationItemDraft}
        isEditing={Boolean(editingRenovationItemId)}
        onChange={handleRenovationDraftChange}
        onClose={closeRenovationItemModal}
        onSave={handleSaveRenovationItemDraft}
      />

      {activeTab === "bids" && (
        <BidsTab
          leadId={id}
          bids={bids}
          renovationItems={renovationForm.items}
          onUpdate={fetchData}
        />
      )}

      {activeTab === "tasks" && (
        <TasksPanel
          eyebrow="Deal tasks"
          title="Deal follow-up and execution tasks"
          description="Create deal-specific work here, or tie the task to this property so it also appears in the property record and the main task center."
          query={{
            sourceType: "lead",
            sourceId: id,
            propertyKey: propertyWorkspaceId || undefined,
            match: propertyWorkspaceId ? "any" : undefined,
          }}
          defaults={{
            sourceType: "lead",
            sourceId: id,
            sourceLabel: liveLead.address || INVESTOR_TERMS.deal.singular,
            propertyKey: propertyWorkspaceId || "",
          }}
          emptyTitle="No deal tasks yet"
          emptyDescription="Add the first follow-up, diligence item, or contractor action for this deal."
        />
      )}

      {subscriptionConsentDialog}
    </div>
  );
};

export default LeadDetailPage;
