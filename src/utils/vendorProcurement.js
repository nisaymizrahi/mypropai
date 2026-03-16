import { getVendorDocumentState } from "./vendors";

const normalizeCategory = (value) => String(value || "").trim().toLowerCase();

const getSafeDocuments = (vendor = {}) => {
  const documents = Array.isArray(vendor?.documents) ? [...vendor.documents] : [];
  const compliance = vendor?.compliance || {};

  const hasW9Document = documents.some(
    (document) => normalizeCategory(document.category) === "w-9"
  );
  const hasInsuranceDocument = documents.some((document) => {
    const category = normalizeCategory(document.category);
    return (
      category === "certificate of insurance" ||
      category === "general liability insurance" ||
      category === "workers' comp" ||
      category.includes("insurance")
    );
  });

  if (!hasW9Document && compliance.w9_url) {
    documents.push({
      _id: "legacy-w9",
      displayName: "Legacy W-9",
      category: "W-9",
      fileUrl: compliance.w9_url,
      uploadedAt: vendor?.updatedAt || vendor?.createdAt || null,
      source: "legacy",
    });
  }

  if (!hasInsuranceDocument && compliance.insurance_url) {
    documents.push({
      _id: "legacy-insurance",
      displayName: "Legacy insurance",
      category: "Certificate of Insurance",
      fileUrl: compliance.insurance_url,
      uploadedAt: vendor?.updatedAt || vendor?.createdAt || null,
      expiresAt: compliance.insurance_expiration_date || null,
      source: "legacy",
    });
  }

  return documents;
};

const PROCUREMENT_REQUIREMENTS = [
  {
    id: "quote",
    label: "Quote / estimate",
    description: "Pricing or scope backup that proves the vendor submitted a real bid.",
    stage: "bidding",
    required: true,
    matchers: [(category) => category === "quote / estimate"],
  },
  {
    id: "w9",
    label: "W-9",
    description: "Needed to onboard and pay the vendor cleanly.",
    stage: "onboarding",
    required: true,
    assignmentBlocking: true,
    paymentBlocking: true,
    matchers: [(category) => category === "w-9"],
  },
  {
    id: "insurance",
    label: "Insurance",
    description: "COI, liability, or workers' comp coverage for active assignments.",
    stage: "onboarding",
    required: true,
    assignmentBlocking: true,
    matchers: [
      (category) =>
        category === "certificate of insurance" ||
        category === "general liability insurance" ||
        category === "workers' comp" ||
        category.includes("insurance"),
    ],
  },
  {
    id: "license",
    label: "License / registration",
    description: "Trade credentials and business registration when the scope requires it.",
    stage: "onboarding",
    required: false,
    matchers: [
      (category) => category === "contractor license" || category === "business registration",
    ],
  },
  {
    id: "contract",
    label: "Contract / PO / scope",
    description: "Signed contract, purchase order, or scope agreement for awarded work.",
    stage: "contracting",
    required: true,
    assignmentBlocking: true,
    paymentBlocking: true,
    matchers: [
      (category) =>
        category === "signed contract / msa" ||
        category === "purchase order" ||
        category === "scope of work" ||
        category === "change order",
    ],
  },
  {
    id: "invoice",
    label: "Invoice / payment app",
    description: "Invoice or payment application before funds go out.",
    stage: "payment",
    required: true,
    paymentBlocking: true,
    matchers: [
      (category) => category === "invoice" || category === "payment application",
    ],
  },
  {
    id: "lien-waiver",
    label: "Lien waiver",
    description: "Recommended payment backup for progress draws or final payouts.",
    stage: "payment",
    required: false,
    matchers: [
      (category) =>
        category === "conditional lien waiver" ||
        category === "unconditional lien waiver",
    ],
  },
];

const PROCUREMENT_STAGES = [
  {
    id: "bidding",
    label: "Bidding",
    description: "Scope and pricing backup before you award work.",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    description: "Tax, insurance, and credential files so the vendor is safe to use.",
  },
  {
    id: "contracting",
    label: "Contracting",
    description: "Written agreement or purchase order connected to the work.",
  },
  {
    id: "payment",
    label: "Payment",
    description: "Invoice support and waiver documentation before money leaves.",
  },
];

const isRequirementSatisfied = (requirement) =>
  requirement.state === "current" || requirement.state === "expiring";

const sortDocumentsForRequirement = (documents = []) =>
  [...documents].sort((left, right) => {
    const stateScore = { current: 3, expiring: 2, expired: 1, missing: 0 };
    const leftScore = stateScore[getVendorDocumentState(left)] || 0;
    const rightScore = stateScore[getVendorDocumentState(right)] || 0;

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return (
      new Date(right.expiresAt || right.uploadedAt || right.createdAt || 0) -
      new Date(left.expiresAt || left.uploadedAt || left.createdAt || 0)
    );
  });

const getRequirementState = (requirement, vendorDocuments) => {
  const matches = vendorDocuments.filter((document) => {
    const category = normalizeCategory(document.category);
    return requirement.matchers.some((matcher) => matcher(category));
  });

  if (matches.length === 0) {
    return {
      ...requirement,
      state: "missing",
      matchedDocument: null,
      matchedDocuments: [],
    };
  }

  const [matchedDocument] = sortDocumentsForRequirement(matches);

  return {
    ...requirement,
    state: getVendorDocumentState(matchedDocument),
    matchedDocument,
    matchedDocuments: matches,
  };
};

const getStageState = (requirements) => {
  const requiredItems = requirements.filter((item) => item.required);
  const requiredComplete = requiredItems.filter(isRequirementSatisfied).length;
  const blockingCount = requiredItems.filter(
    (item) => item.state === "missing" || item.state === "expired"
  ).length;
  const warningCount = requirements.filter((item) => item.state === "expiring").length;
  const recommendedMissing = requirements.filter((item) => !item.required && item.state === "missing")
    .length;

  if (blockingCount > 0) {
    return "attention";
  }

  if (warningCount > 0 || recommendedMissing > 0) {
    return "warning";
  }

  if (requiredItems.length > 0 && requiredComplete === requiredItems.length) {
    return "complete";
  }

  if (requiredComplete > 0) {
    return "in_progress";
  }

  return "pending";
};

export const getVendorProcurementStateLabel = (state) => {
  switch (state) {
    case "ready_to_pay":
      return "Ready to pay";
    case "ready_to_assign":
      return "Ready to assign";
    case "renewal_watch":
      return "Renewal watch";
    case "in_progress":
      return "Packet in progress";
    case "missing":
    default:
      return "Needs packet";
  }
};

export const getVendorProcurementStateClasses = (state) => {
  switch (state) {
    case "ready_to_pay":
      return "border border-verdigris-200 bg-verdigris-50 text-verdigris-700";
    case "ready_to_assign":
      return "border border-sky-200 bg-sky-50 text-sky-700";
    case "renewal_watch":
      return "border border-sand-200 bg-sand-50 text-sand-700";
    case "in_progress":
      return "border border-ink-100 bg-ink-50 text-ink-600";
    case "missing":
    default:
      return "border border-clay-200 bg-clay-50 text-clay-700";
  }
};

export const getVendorProcurementStageClasses = (state) => {
  switch (state) {
    case "complete":
      return {
        chip: "border border-verdigris-200 bg-verdigris-50 text-verdigris-700",
        card: "border-verdigris-100 bg-verdigris-50/60",
      };
    case "warning":
      return {
        chip: "border border-sand-200 bg-sand-50 text-sand-700",
        card: "border-sand-100 bg-sand-50/55",
      };
    case "attention":
      return {
        chip: "border border-clay-200 bg-clay-50 text-clay-700",
        card: "border-clay-100 bg-clay-50/60",
      };
    case "in_progress":
      return {
        chip: "border border-sky-200 bg-sky-50 text-sky-700",
        card: "border-sky-100 bg-sky-50/55",
      };
    case "pending":
    default:
      return {
        chip: "border border-ink-100 bg-ink-50 text-ink-600",
        card: "border-ink-100 bg-ink-50/55",
      };
  }
};

export const getVendorProcurementSummary = (vendor = {}) => {
  const documents = getSafeDocuments(vendor);
  const requirements = PROCUREMENT_REQUIREMENTS.map((requirement) =>
    getRequirementState(requirement, documents)
  );

  const assignmentRequirements = requirements.filter((item) => item.assignmentBlocking);
  const paymentRequirements = requirements.filter((item) => item.paymentBlocking);
  const requiredRequirements = requirements.filter((item) => item.required);

  const blockingIssues = requiredRequirements.filter(
    (item) => item.state === "missing" || item.state === "expired"
  );
  const renewalsDue = requirements.filter((item) => item.state === "expiring");

  const assignmentReady = assignmentRequirements.every(isRequirementSatisfied);
  const paymentReady = paymentRequirements.every(isRequirementSatisfied);
  const completedRequiredCount = requiredRequirements.filter(isRequirementSatisfied).length;

  let overallState = "missing";
  if (paymentReady) {
    overallState = renewalsDue.length > 0 ? "renewal_watch" : "ready_to_pay";
  } else if (assignmentReady) {
    overallState = renewalsDue.length > 0 ? "renewal_watch" : "ready_to_assign";
  } else if (completedRequiredCount > 0 || documents.length > 0) {
    overallState = "in_progress";
  }

  const stages = PROCUREMENT_STAGES.map((stage) => {
    const stageRequirements = requirements.filter((item) => item.stage === stage.id);
    return {
      ...stage,
      requirements: stageRequirements,
      state: getStageState(stageRequirements),
    };
  });

  const nextActions = [
    ...blockingIssues.map((item) =>
      item.state === "expired" ? `Renew ${item.label}` : `Upload ${item.label}`
    ),
    ...renewalsDue.map((item) => `Renew ${item.label}`),
  ].slice(0, 4);

  return {
    documents,
    requirements,
    stages,
    overallState,
    overallLabel: getVendorProcurementStateLabel(overallState),
    assignmentReady,
    paymentReady,
    requiredCount: requiredRequirements.length,
    completedRequiredCount,
    blockingIssues,
    blockingIssuesCount: blockingIssues.length,
    renewalsDue,
    renewalsDueCount: renewalsDue.length,
    nextActions,
  };
};
