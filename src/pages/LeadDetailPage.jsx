import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  HomeModernIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import { useAuth } from "../context/AuthContext";
import {
  analyzeLeadComps,
  createOneTimeCheckout,
  createSubscriptionCheckout,
  getBidsForLead,
  getBillingAccess,
  getLeadDetails,
  previewLeadProperty,
  syncBillingCheckoutSession,
  updateLead,
} from "../utils/api";
import { getLocationProviderName, searchAddressSuggestions } from "../utils/locationSearch";
import BidsTab from "../components/BidsTab";

const occupancyOptions = ["Unknown", "Vacant", "Owner Occupied", "Tenant Occupied"];
const leadStatusOptions = [
  "Potential",
  "Analyzing",
  "Offer Made",
  "Under Contract",
  "Closed - Won",
  "Closed - Lost",
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
    label: "Structural and layout changes",
    description: "Framing, beam work, wall moves, and structural repairs.",
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
  return {
    verifiedSquareFootage: plan.verifiedSquareFootage ?? lead.squareFootage ?? "",
    renovationLevel: plan.renovationLevel || "",
    extensionPlanned: Boolean(plan.extensionPlanned),
    extensionSquareFootage: plan.extensionSquareFootage ?? "",
    selectedScopes: Array.isArray(plan.selectedScopes) ? plan.selectedScopes : [],
    layoutChanges: plan.layoutChanges || "",
    contractorNotes: plan.contractorNotes || "",
    additionalNotes: plan.additionalNotes || "",
  };
};

const buildRenovationPayload = (form) => ({
  verifiedSquareFootage: toOptionalNumber(form.verifiedSquareFootage),
  renovationLevel: form.renovationLevel || "",
  extensionPlanned: Boolean(form.extensionPlanned),
  extensionSquareFootage: form.extensionPlanned
    ? toOptionalNumber(form.extensionSquareFootage)
    : undefined,
  selectedScopes: Array.isArray(form.selectedScopes) ? form.selectedScopes : [],
  layoutChanges: form.layoutChanges || "",
  contractorNotes: form.contractorNotes || "",
  additionalNotes: form.additionalNotes || "",
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

const buildRenovationChecklist = (form) => {
  const selectedScopes = Array.isArray(form.selectedScopes) ? form.selectedScopes : [];
  const selectedDefinitions = renovationScopeOptions.filter((scope) =>
    selectedScopes.includes(scope.value)
  );
  const tradeSet = new Set();
  const quotePackages = selectedDefinitions.map((scope) => {
    scope.trades.forEach((trade) => tradeSet.add(trade));
    return {
      title: scope.label,
      items: scope.quoteItems,
    };
  });

  if (form.extensionPlanned) {
    ["Architect or designer", "Structural engineer", "General contractor", "Framing contractor"].forEach(
      (trade) => tradeSet.add(trade)
    );
    quotePackages.unshift({
      title: "Extension / addition pricing",
      items: [
        "Permit, plan, or design assumptions",
        "Foundation and framing pricing for the new square footage",
        "Roof tie-in, exterior enclosure, and weatherproofing",
        "Electrical, plumbing, and HVAC tie-ins for the addition",
      ],
    });
  }

  return {
    trades: [...tradeSet],
    quotePackages,
  };
};

const buildRenovationPrompt = (lead, form) => {
  const scopeLabels = renovationScopeOptions
    .filter((scope) => form.selectedScopes.includes(scope.value))
    .map((scope) => scope.label);
  const verifiedSquareFootage = toOptionalNumber(form.verifiedSquareFootage);
  const extensionSquareFootage = toOptionalNumber(form.extensionSquareFootage);

  return [
    `Create a renovation planning and estimate outline for ${lead.address || "this property"}.`,
    `Current square footage: ${verifiedSquareFootage ? `${verifiedSquareFootage} sqft` : "not confirmed yet"}.`,
    `Property type: ${lead.propertyType || "not set"}.`,
    `Renovation level: ${form.renovationLevel || "not selected"}.`,
    `Extension planned: ${form.extensionPlanned ? "Yes" : "No"}${form.extensionPlanned && extensionSquareFootage ? `, approximately ${extensionSquareFootage} sqft` : ""}.`,
    `Selected renovation scopes: ${scopeLabels.length ? scopeLabels.join(", ") : "none selected yet"}.`,
    `Layout or structural notes: ${form.layoutChanges || "none provided"}.`,
    `Contractor quote priorities: ${form.contractorNotes || "none provided"}.`,
    `Additional notes: ${form.additionalNotes || "none provided"}.`,
    "Return a line-item estimate approach, a recommended contractor quote list, a likely trade sequence, and major cost-risk flags.",
  ].join("\n");
};

const LoadingSpinner = () => (
  <div className="section-card flex items-center justify-center px-6 py-16">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-turquoise" />
  </div>
);

const SummaryStat = ({ label, value, hint }) => (
  <div className="metric-tile p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
    <p className="mt-3 text-2xl font-semibold text-ink-900">{value}</p>
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

const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
      active ? "bg-ink-900 text-white shadow-soft" : "text-ink-600 hover:bg-white hover:text-ink-900"
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

const LeadDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const selectedSuggestionRef = useRef("");

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detailForm, setDetailForm] = useState(() => buildDetailsForm());
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewMetadata, setPreviewMetadata] = useState(null);
  const [filters, setFilters] = useState({
    radius: "1",
    saleDateMonths: "6",
    maxComps: "8",
  });

  const [renovationForm, setRenovationForm] = useState(() => buildRenovationForm());
  const [isSavingRenovation, setIsSavingRenovation] = useState(false);

  const [bids, setBids] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [billingAccess, setBillingAccess] = useState(null);
  const [isBillingAccessLoading, setIsBillingAccessLoading] = useState(true);
  const [isStartingSubscription, setIsStartingSubscription] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leadData, bidsData] = await Promise.all([getLeadDetails(id), getBidsForLead(id)]);
      setLead(leadData);
      setBids(bidsData);

      if (leadData.compsAnalysis?.generatedAt) {
        setAnalysis({
          subject: leadData,
          summary: {
            saleCompCount: leadData.compsAnalysis.saleCompCount,
            estimatedValue: leadData.compsAnalysis.estimatedValue,
            estimatedValueLow: leadData.compsAnalysis.estimatedValueLow,
            estimatedValueHigh: leadData.compsAnalysis.estimatedValueHigh,
            averageSoldPrice: leadData.compsAnalysis.averageSoldPrice,
            medianSoldPrice: leadData.compsAnalysis.medianSoldPrice,
            averagePricePerSqft: leadData.compsAnalysis.averagePricePerSqft,
            medianPricePerSqft: leadData.compsAnalysis.medianPricePerSqft,
            askingPrice: leadData.sellerAskingPrice,
            askingPriceDelta: leadData.compsAnalysis.askingPriceDelta,
            recommendedOfferLow: leadData.compsAnalysis.recommendedOfferLow,
            recommendedOfferHigh: leadData.compsAnalysis.recommendedOfferHigh,
          },
          comps: leadData.compsAnalysis.recentComps || [],
          ai: leadData.compsAnalysis.report || null,
          generatedAt: leadData.compsAnalysis.generatedAt,
        });
      } else {
        setAnalysis(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load lead data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!lead) return;
    const nextDetailForm = buildDetailsForm(lead);
    setDetailForm(nextDetailForm);
    setRenovationForm(buildRenovationForm(lead));
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
    if (query.length < 4 || query === selectedSuggestionRef.current) {
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
      setPreviewMetadata(null);
      if (name === "addressLine1") {
        selectedSuggestionRef.current = "";
      }
    }
  };

  const handleRenovationChange = (event) => {
    const { name, type, checked, value } = event.target;
    setRenovationForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleScopeToggle = (scopeValue) => {
    setRenovationForm((previous) => {
      const selectedScopes = previous.selectedScopes.includes(scopeValue)
        ? previous.selectedScopes.filter((scope) => scope !== scopeValue)
        : [...previous.selectedScopes, scopeValue];

      return {
        ...previous,
        selectedScopes,
      };
    });
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
      setDetailForm((previous) => ({
        ...previous,
        ...mappedPreview,
      }));
      setRenovationForm((previous) => ({
        ...previous,
        verifiedSquareFootage:
          previous.verifiedSquareFootage || mappedPreview.squareFootage || previous.verifiedSquareFootage,
      }));
      setPreviewMetadata(preview.metadata || null);
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
    selectedSuggestionRef.current = suggestion.place_name;
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
    try {
      const result = await analyzeLeadComps(id, filters);
      setAnalysis(result);
      setLead((previous) => ({
        ...previous,
        ...result.subject,
      }));
      await loadBillingAccess();
    } catch (err) {
      setError(err.message || "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartSubscription = async () => {
    setIsStartingSubscription(true);
    try {
      const { url } = await createSubscriptionCheckout("pro");
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Could not start the Pro checkout.");
      setIsStartingSubscription(false);
    }
  };

  const handleBuyReport = async () => {
    setIsStartingCheckout(true);
    setError("");
    try {
      const result = await createOneTimeCheckout({ kind: "comps_report", resourceId: id });
      if (result.alreadyUnlocked) {
        toast.success(result.msg || "This lead already has a purchased report ready to run.");
        await loadBillingAccess();
        setIsStartingCheckout(false);
        return;
      }

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
      toast.success("Lead details saved.");
    } catch (err) {
      setError(err.message || "Failed to save lead details.");
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
      toast.success("Renovation plan saved.");
    } catch (err) {
      setError(err.message || "Failed to save renovation plan.");
    } finally {
      setIsSavingRenovation(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !lead) return <p className="p-4 text-center text-red-500">{error}</p>;
  if (!lead) return <p className="p-4 text-center">Lead not found.</p>;

  const propertyWorkspaceId =
    typeof lead.property === "object" ? lead.property?._id : lead.property;
  const propertyWorkspacePath = propertyWorkspaceId
    ? `/properties/${encodeURIComponent(propertyWorkspaceId)}`
    : "";
  const liveLead = buildLiveLead(lead, detailForm);
  const quoteChecklist = buildRenovationChecklist(renovationForm);
  const renovationPrompt = buildRenovationPrompt(liveLead, renovationForm);
  const askVsEstimateLabel = !analysis?.summary?.askingPriceDelta
    ? "No ask vs estimate comparison yet"
    : `${formatCurrency(Math.abs(analysis.summary.askingPriceDelta))} ${
        analysis.summary.askingPriceDelta > 0 ? "above" : "below"
      } the estimated value`;
  const workingTargetOffer =
    detailForm.targetOffer === "" ? null : Number(detailForm.targetOffer);
  const workingRehabEstimate =
    detailForm.rehabEstimate === "" ? null : Number(detailForm.rehabEstimate);
  const workingExitValue =
    detailForm.arv === "" ? analysis?.summary?.estimatedValue ?? null : Number(detailForm.arv);
  const askingPrice = liveLead.sellerAskingPrice;
  const askGap =
    askingPrice !== null && askingPrice !== undefined && workingTargetOffer !== null
      ? askingPrice - workingTargetOffer
      : null;
  const projectedSpread =
    workingExitValue !== null && workingTargetOffer !== null
      ? workingExitValue - workingTargetOffer - (workingRehabEstimate || 0)
      : null;
  const showsUnitCount = detailForm.propertyType === "multi-family";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/leads" className="ghost-action">
          Back to leads
        </Link>
        {propertyWorkspacePath ? (
          <Link to={propertyWorkspacePath} className="secondary-action">
            Open property record
          </Link>
        ) : null}
      </div>

      <section className="surface-panel-strong relative overflow-hidden px-6 py-7 sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(59,143,129,0.18),transparent_62%)] lg:block" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="eyebrow">Lead detail</span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                {liveLead.address}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
                Keep the property facts, seller context, renovation plan, comps work, and contractor bid workflow connected on one lead.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-white">
                  {liveLead.status || "Potential"}
                </span>
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-100">
                  {liveLead.propertyType || "Property type pending"}
                </span>
                {liveLead.squareFootage ? (
                  <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-100">
                    {Number(liveLead.squareFootage).toLocaleString()} sqft
                  </span>
                ) : null}
                {liveLead.bedrooms || liveLead.bathrooms ? (
                  <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink-700 ring-1 ring-ink-100">
                    {[liveLead.bedrooms ? `${liveLead.bedrooms} bd` : null, liveLead.bathrooms ? `${liveLead.bathrooms} ba` : null]
                      .filter(Boolean)
                      .join(" • ")}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="section-card min-w-[260px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Next action
              </p>
              <p className="mt-3 text-lg font-semibold text-ink-900">
                {liveLead.nextAction || "No next action yet"}
              </p>
              <p className="mt-2 text-sm text-ink-500">
                {liveLead.followUpDate
                  ? `Follow up ${formatDate(liveLead.followUpDate)}`
                  : "No follow-up date scheduled"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryStat label="Asking Price" value={formatCurrency(liveLead.sellerAskingPrice)} />
            <SummaryStat
              label="Target Offer"
              value={formatCurrency(workingTargetOffer)}
              hint={askGap !== null ? `${formatCurrency(askGap)} below asking` : "Set your offer target"}
            />
            <SummaryStat
              label="Exit Value"
              value={formatCurrency(workingExitValue)}
              hint={detailForm.arv ? "Using your saved ARV" : "Falls back to AI comps estimate"}
            />
            <SummaryStat
              label="Projected Spread"
              value={formatCurrency(projectedSpread)}
              hint={
                workingRehabEstimate
                  ? `After ${formatCurrency(workingRehabEstimate)} rehab estimate`
                  : "Add rehab estimate for a better spread"
              }
            />
          </div>
        </div>
      </section>

      <div className="section-card flex flex-wrap items-center gap-2 p-2">
        <TabButton
          active={activeTab === "details"}
          icon={HomeModernIcon}
          label="Details"
          onClick={() => setActiveTab("details")}
        />
        <TabButton
          active={activeTab === "comps"}
          icon={SparklesIcon}
          label="AI Comps Analysis"
          onClick={() => setActiveTab("comps")}
        />
        <TabButton
          active={activeTab === "renovation"}
          icon={WrenchScrewdriverIcon}
          label="Renovation Plan"
          onClick={() => setActiveTab("renovation")}
        />
        <TabButton
          active={activeTab === "bids"}
          icon={ClipboardDocumentListIcon}
          label="Bid Management"
          onClick={() => setActiveTab("bids")}
        />
      </div>

      {error ? (
        <div className="rounded-[20px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {activeTab === "details" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_360px]">
          <div className="section-card p-6 sm:p-7">
            <span className="eyebrow">Edit lead</span>
            <h2 className="mt-4 text-2xl font-semibold text-ink-900">Property, seller, and deal details</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Update the core information here whenever you learn something new about the opportunity.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="relative md:col-span-2">
                <FormField label="Address line">
                  <input
                    name="addressLine1"
                    value={detailForm.addressLine1}
                    onChange={handleDetailChange}
                    className="auth-input"
                    placeholder="Start typing the property address..."
                  />
                </FormField>

                {suggestions.length > 0 ? (
                  <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-[22px] border border-ink-100 bg-white shadow-luxe">
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

              <FormField label="Pipeline status">
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

              <div className="md:col-span-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handlePreviewLookup()}
                    disabled={isPreviewLoading || !addressQuery.trim()}
                    className="secondary-action inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ArrowPathIcon className={`h-4 w-4 ${isPreviewLoading ? "animate-spin" : ""}`} />
                    {isPreviewLoading ? "Refreshing details..." : "Refresh property facts"}
                  </button>
                  <p className="text-sm text-ink-500">
                    Use the lookup after editing the address to refresh property facts and listing info.
                  </p>
                </div>
              </div>

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

              <div className="md:col-span-2 mt-2 rounded-[24px] border border-ink-100 bg-sand-50/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">Sale status</p>
                    <p className="mt-1 text-sm text-ink-500">
                      Keep the active listing details here if the property is on market.
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      liveLead.listingStatus || liveLead.sellerAskingPrice
                        ? "bg-verdigris-50 text-verdigris-700"
                        : "bg-white text-ink-600 ring-1 ring-ink-100"
                    }`}
                  >
                    {liveLead.listingStatus || liveLead.sellerAskingPrice ? "For sale" : "Not listed"}
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

                  <FormField label="Sale price">
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

              <div className="md:col-span-2 mt-2">
                <h3 className="text-lg font-semibold text-ink-900">Seller and deal plan</h3>
                <p className="mt-1 text-sm text-ink-500">
                  Save the contact details, pricing targets, and the next move for this lead.
                </p>
              </div>

              <FormField label="Seller name">
                <input
                  name="sellerName"
                  value={detailForm.sellerName}
                  onChange={handleDetailChange}
                  className="auth-input"
                />
              </FormField>

              <FormField label="Lead source">
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

              <FormField label="Next action">
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

              <FormField label="Notes" className="md:col-span-2">
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
                {isSavingDetails ? "Saving..." : "Save details"}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="section-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Autofill
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-600">
                Address suggestions come from {getLocationProviderName()}, and the property lookup refreshes listing status plus any available property facts.
              </p>
              {previewMetadata ? (
                <div className="mt-4 rounded-[18px] bg-sand-50 px-4 py-3 text-sm text-ink-600">
                  {previewMetadata.propertyFound ? "Property facts found." : "No property facts found."}{" "}
                  {previewMetadata.activeListingFound
                    ? "Active sale listing found."
                    : "No active sale listing found."}
                </div>
              ) : null}
            </div>

            <div className="section-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Quick read
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500">Asking price</span>
                  <span className="font-semibold text-ink-900">
                    {formatCurrency(liveLead.sellerAskingPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500">Target gap</span>
                  <span className="font-semibold text-ink-900">{formatCurrency(askGap)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500">Spread preview</span>
                  <span className="font-semibold text-ink-900">
                    {formatCurrency(projectedSpread)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500">Follow-up</span>
                  <span className="font-semibold text-ink-900">
                    {detailForm.followUpDate ? formatDate(detailForm.followUpDate) : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="section-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Next tabs
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-ink-600">
                <p>Suggested next tabs after this phase: documents, photos, contractor contacts, and tasks or timeline.</p>
                <p>Those fit naturally after the renovation plan and bid workflow are in place.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "comps" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="section-card p-6">
              <h3 className="text-xl font-semibold text-ink-900">Run comps analysis</h3>
              <p className="mt-1 text-sm text-ink-500">
                Pull market comps around this property, generate pricing guidance, and summarize it with AI.
              </p>

              <div className="mt-4 rounded-[20px] border border-ink-100 bg-sand-50/70 p-4 text-sm">
                {isBillingAccessLoading ? (
                  <p className="text-ink-500">Checking report access...</p>
                ) : billingAccess?.accessGranted ? (
                  <div className="space-y-2 text-ink-700">
                    {billingAccess.accessSource === "subscription_included" ? (
                      <>
                        <p>
                          Pro includes 10 comps reports per month. You have{" "}
                          <span className="font-semibold">
                            {billingAccess.monthlyIncludedRemainingCount}
                          </span>{" "}
                          included report
                          {billingAccess.monthlyIncludedRemainingCount === 1 ? "" : "s"} left this month.
                        </p>
                        <p className="text-xs text-ink-500">
                          Used {billingAccess.monthlyIncludedUsedCount} of {billingAccess.monthlyIncludedLimit}
                          {billingAccess.monthlyIncludedResetsAt
                            ? `, resets on ${formatDate(billingAccess.monthlyIncludedResetsAt)}`
                            : ""}
                          .
                        </p>
                      </>
                    ) : (
                      <p>This lead already has a paid report purchase ready to run.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-ink-700">
                      {billingAccess?.hasActiveSubscription
                        ? `You have used all ${billingAccess.monthlyIncludedLimit || 10} included Pro comps reports for this month. Buy this lead's report one time to keep going.`
                        : "This report is a premium workflow. Upgrade to Pro for 10 included comps reports each month or buy this lead's report one time."}
                    </p>
                    <div className="flex flex-col gap-3">
                      {!billingAccess?.hasActiveSubscription ? (
                        <button
                          onClick={handleStartSubscription}
                          disabled={isStartingSubscription}
                          className="secondary-action w-full justify-center disabled:opacity-50"
                        >
                          {isStartingSubscription ? "Redirecting..." : "Upgrade to Pro"}
                        </button>
                      ) : null}
                      <button
                        onClick={handleBuyReport}
                        disabled={isStartingCheckout}
                        className="primary-action w-full justify-center disabled:opacity-50"
                      >
                        {isStartingCheckout ? "Redirecting..." : "Buy One-Time Report"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-4">
                <FormField label="Radius (miles)">
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    name="radius"
                    value={filters.radius}
                    onChange={handleFilterChange}
                    className="auth-input"
                  />
                </FormField>

                <FormField label="Comp freshness (months)">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="saleDateMonths"
                    value={filters.saleDateMonths}
                    onChange={handleFilterChange}
                    className="auth-input"
                  />
                </FormField>

                <FormField label="Max comps in report">
                  <input
                    type="number"
                    min="5"
                    max="12"
                    step="1"
                    name="maxComps"
                    value={filters.maxComps}
                    onChange={handleFilterChange}
                    className="auth-input"
                  />
                </FormField>

                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing || isBillingAccessLoading || !billingAccess?.accessGranted}
                  className="primary-action w-full justify-center disabled:opacity-50"
                >
                  {isAnalyzing ? "Analyzing..." : "Run AI Comps Report"}
                </button>
              </div>
            </div>

            <div className="section-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-ink-900">Current acquisition snapshot</h3>
                  <p className="mt-1 text-sm text-ink-500">
                    These numbers come from the details you save on the lead.
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
                    {[liveLead.propertyType, liveLead.squareFootage ? `${Number(liveLead.squareFootage).toLocaleString()} sqft` : null]
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
          </div>

          <div className="space-y-6">
            {analysis ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryStat
                    label="Estimated Value"
                    value={formatCurrency(analysis.summary.estimatedValue)}
                    hint={
                      analysis.summary.estimatedValueLow && analysis.summary.estimatedValueHigh
                        ? `${formatCurrency(analysis.summary.estimatedValueLow)} to ${formatCurrency(analysis.summary.estimatedValueHigh)}`
                        : null
                    }
                  />
                  <SummaryStat
                    label="Recommended Offer"
                    value={formatCurrency(analysis.summary.recommendedOfferHigh)}
                    hint={
                      analysis.summary.recommendedOfferLow
                        ? `${formatCurrency(analysis.summary.recommendedOfferLow)} to ${formatCurrency(analysis.summary.recommendedOfferHigh)}`
                        : null
                    }
                  />
                  <SummaryStat
                    label="Median Comp Price"
                    value={formatCurrency(analysis.summary.medianSoldPrice)}
                    hint={`${analysis.summary.saleCompCount || 0} comps used`}
                  />
                  <SummaryStat
                    label="Median Comp $ / Sqft"
                    value={
                      analysis.summary.medianPricePerSqft
                        ? `$${analysis.summary.medianPricePerSqft}`
                        : "—"
                    }
                    hint={askVsEstimateLabel}
                  />
                </div>

                <div className="section-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-ink-900">
                        {analysis.ai?.headline || "AI Market Readout"}
                      </h3>
                      <p className="mt-1 text-sm text-ink-500">
                        Generated {formatDate(analysis.generatedAt)}
                      </p>
                    </div>
                    {analysis.ai?.confidence ? (
                      <span className="rounded-full bg-verdigris-50 px-3 py-1 text-sm font-semibold text-verdigris-700">
                        {analysis.ai.confidence} confidence
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="space-y-5">
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Executive Summary
                        </h4>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">
                          {analysis.ai?.executiveSummary || "No AI summary was generated for this run."}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Pricing Recommendation
                        </h4>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">
                          {analysis.ai?.pricingRecommendation || "Pricing recommendation unavailable."}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Offer Strategy
                        </h4>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-600">
                          {analysis.ai?.offerStrategy || "Offer strategy unavailable."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Risk Flags
                        </h4>
                        {analysis.ai?.riskFlags?.length ? (
                          <ul className="mt-3 space-y-2 text-sm text-ink-600">
                            {analysis.ai.riskFlags.map((flag) => (
                              <li key={flag} className="rounded-[18px] bg-sand-50 px-4 py-3">
                                {flag}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-ink-500">No risk flags captured.</p>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-400">
                          Next Steps
                        </h4>
                        {analysis.ai?.nextSteps?.length ? (
                          <ul className="mt-3 space-y-2 text-sm text-ink-600">
                            {analysis.ai.nextSteps.map((step) => (
                              <li key={step} className="rounded-[18px] bg-sand-50 px-4 py-3">
                                {step}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-ink-500">No next steps captured.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="section-card p-6">
                  <h3 className="text-xl font-semibold text-ink-900">Comparable properties</h3>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-sand-50 text-left text-ink-500">
                        <tr>
                          <th className="p-3 font-semibold">Address</th>
                          <th className="p-3 font-semibold">Comp Price</th>
                          <th className="p-3 font-semibold">$ / Sqft</th>
                          <th className="p-3 font-semibold">Sqft</th>
                          <th className="p-3 font-semibold">Beds/Baths</th>
                          <th className="p-3 font-semibold">Distance</th>
                          <th className="p-3 font-semibold">Comp Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {analysis.comps.map((comp) => (
                          <tr key={`${comp.address}-${comp.saleDate}`}>
                            <td className="p-3 font-medium text-ink-900">{comp.address}</td>
                            <td className="p-3 text-ink-700">{formatCurrency(comp.salePrice)}</td>
                            <td className="p-3 text-ink-700">
                              {comp.pricePerSqft ? `$${Math.round(comp.pricePerSqft)}` : "—"}
                            </td>
                            <td className="p-3 text-ink-700">{comp.squareFootage || "—"}</td>
                            <td className="p-3 text-ink-700">
                              {[comp.bedrooms ?? "—", comp.bathrooms ?? "—"].join(" / ")}
                            </td>
                            <td className="p-3 text-ink-700">
                              {comp.distance ? `${comp.distance.toFixed(2)} mi` : "—"}
                            </td>
                            <td className="p-3 text-ink-700">{formatDate(comp.saleDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="section-card px-6 py-12 text-center">
                {isAnalyzing ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-ink-900">No comps report yet</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-500">
                      Run the report to pull comparable properties, estimate value, and generate an AI recommendation.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "renovation" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_380px]">
          <div className="section-card p-6 sm:p-7">
            <span className="eyebrow">Renovation planning and estimate</span>
            <h2 className="mt-4 text-2xl font-semibold text-ink-900">
              Build the scope before you price the job
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Answer the renovation questions here so later we can generate a stronger AI estimate and know exactly what quotes to request from contractors.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <FormField label="Verified square footage" hint="Confirm the usable square footage before building the estimate.">
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

              {renovationForm.extensionPlanned ? (
                <FormField label="Extension square footage">
                  <input
                    name="extensionSquareFootage"
                    type="number"
                    value={renovationForm.extensionSquareFootage}
                    onChange={handleRenovationChange}
                    className="auth-input"
                    placeholder="0"
                  />
                </FormField>
              ) : (
                <div />
              )}

              <div className="md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-ink-900">
                    What renovations does this property need?
                  </h3>
                  <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                    {renovationForm.selectedScopes.length} selected
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {renovationScopeOptions.map((scope) => {
                    const isActive = renovationForm.selectedScopes.includes(scope.value);
                    return (
                      <button
                        key={scope.value}
                        type="button"
                        onClick={() => handleScopeToggle(scope.value)}
                        className={`rounded-[20px] border px-4 py-4 text-left transition ${
                          isActive
                            ? "border-ink-900 bg-ink-900 text-white shadow-soft"
                            : "border-ink-100 bg-white text-ink-900 hover:border-ink-200 hover:bg-sand-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">{scope.label}</p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              isActive ? "bg-white/15 text-white" : "bg-sand-100 text-ink-500"
                            }`}
                          >
                            {isActive ? "Selected" : "Add"}
                          </span>
                        </div>
                        <p
                          className={`mt-2 text-sm leading-6 ${
                            isActive ? "text-white/80" : "text-ink-500"
                          }`}
                        >
                          {scope.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <FormField label="Layout or structural changes" className="md:col-span-2">
                <textarea
                  rows="4"
                  name="layoutChanges"
                  value={renovationForm.layoutChanges}
                  onChange={handleRenovationChange}
                  className="auth-input min-h-[130px]"
                  placeholder="Will walls move, rooms be reconfigured, or structural work be needed?"
                />
              </FormField>

              <FormField label="Contractor quote notes" className="md:col-span-2">
                <textarea
                  rows="4"
                  name="contractorNotes"
                  value={renovationForm.contractorNotes}
                  onChange={handleRenovationChange}
                  className="auth-input min-h-[130px]"
                  placeholder="What do you want each contractor quote to break out or clarify?"
                />
              </FormField>

              <FormField label="Additional renovation notes" className="md:col-span-2">
                <textarea
                  rows="4"
                  name="additionalNotes"
                  value={renovationForm.additionalNotes}
                  onChange={handleRenovationChange}
                  className="auth-input min-h-[130px]"
                  placeholder="Anything else the AI estimate or contractor scope should know?"
                />
              </FormField>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
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

          <div className="space-y-5">
            <div className="section-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Estimated scope footprint
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500">Verified sqft</span>
                  <span className="font-semibold text-ink-900">
                    {renovationForm.verifiedSquareFootage
                      ? `${Number(renovationForm.verifiedSquareFootage).toLocaleString()} sqft`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500">Extension</span>
                  <span className="font-semibold text-ink-900">
                    {renovationForm.extensionPlanned
                      ? `${
                          renovationForm.extensionSquareFootage
                            ? `${Number(renovationForm.extensionSquareFootage).toLocaleString()} sqft`
                            : "Yes"
                        }`
                      : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-ink-500">Renovation level</span>
                  <span className="font-semibold text-ink-900">
                    {renovationLevelOptions.find((option) => option.value === renovationForm.renovationLevel)
                      ?.label || "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="section-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Trades to quote
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {quoteChecklist.trades.length ? (
                  quoteChecklist.trades.map((trade) => (
                    <span
                      key={trade}
                      className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-700"
                    >
                      {trade}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-ink-500">
                    Select renovation scopes to build the quote list.
                  </p>
                )}
              </div>
            </div>

            <div className="section-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Contractor quote checklist
              </p>
              <div className="mt-4 space-y-4">
                {quoteChecklist.quotePackages.length ? (
                  quoteChecklist.quotePackages.map((quotePackage) => (
                    <div key={quotePackage.title} className="rounded-[18px] bg-sand-50 px-4 py-4">
                      <p className="text-sm font-semibold text-ink-900">{quotePackage.title}</p>
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-600">
                        {quotePackage.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink-500">
                    Once you choose the renovation scopes, this area will show exactly what quotes to request.
                  </p>
                )}
              </div>
            </div>

            <div className="section-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                AI prompt preview
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                This is the prompt foundation we can use when we build the renovation estimate AI.
              </p>
              <pre className="mt-4 whitespace-pre-wrap rounded-[18px] bg-ink-900 px-4 py-4 text-xs leading-6 text-white">
                {renovationPrompt}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === "bids" && <BidsTab leadId={id} bids={bids} onUpdate={fetchData} />}
    </div>
  );
};

export default LeadDetailPage;
