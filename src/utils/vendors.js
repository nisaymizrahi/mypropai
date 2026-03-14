export const VENDOR_SPECIALTY_OPTIONS = [
  "General Contractor",
  "Framer / Carpenter",
  "Electrician",
  "Plumber",
  "HVAC",
  "Roofer",
  "Painter",
  "Drywall",
  "Flooring",
  "Tile",
  "Cabinet Installer",
  "Kitchen / Bath Remodeler",
  "Appliance Repair",
  "Handyman",
  "Locksmith",
  "Pest Control",
  "Landscaping",
  "Cleaning / Turnover",
  "Junk Removal",
  "Concrete / Masonry",
  "Windows / Doors",
  "Siding / Gutters",
  "Architect",
  "Structural Engineer",
  "Surveyor",
  "Excavation / Grading",
  "Water / Mold Remediation",
  "Fire / Restoration",
  "Inspector",
  "Permit Expeditor",
];

export const VENDOR_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "preferred", label: "Preferred" },
  { value: "not_assignable", label: "Not assignable" },
  { value: "inactive", label: "Inactive" },
];

export const VENDOR_DOCUMENT_CATEGORY_OPTIONS = [
  "W-9",
  "Certificate of Insurance",
  "General Liability Insurance",
  "Workers' Comp",
  "Contractor License",
  "Business Registration",
  "Quote / Estimate",
  "Invoice",
  "Signed Contract / MSA",
  "Before / After Photos",
  "Other",
];

const REQUIRED_DOCUMENT_MATCHERS = [
  (category) => category === "w-9",
  (category) =>
    category === "certificate of insurance" ||
    category === "general liability insurance" ||
    category === "insurance",
];

const EXPIRING_WINDOW_DAYS = 30;

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.valueOf()) ? parsed : null;
};

export const formatVendorDate = (value, fallback = "Not set") => {
  const parsed = toDate(value);
  if (!parsed) return fallback;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getVendorSpecialties = (vendor = {}) => {
  if (Array.isArray(vendor.specialties) && vendor.specialties.length > 0) {
    return vendor.specialties.filter(Boolean);
  }

  return vendor.trade ? [vendor.trade] : [];
};

export const getVendorStatusLabel = (value) =>
  VENDOR_STATUS_OPTIONS.find((option) => option.value === value)?.label || "Active";

export const getVendorStatusClasses = (value) => {
  switch (value) {
    case "preferred":
      return "border border-verdigris-200 bg-verdigris-50 text-verdigris-700";
    case "not_assignable":
      return "border border-clay-200 bg-clay-50 text-clay-700";
    case "inactive":
      return "border border-ink-100 bg-ink-50 text-ink-500";
    case "active":
    default:
      return "border border-sand-200 bg-sand-50 text-sand-700";
  }
};

export const getVendorDocumentState = (document = {}) => {
  const expiresAt = toDate(document.expiresAt);

  if (!expiresAt) {
    return "current";
  }

  const now = new Date();
  const msUntilExpiry = expiresAt.valueOf() - now.valueOf();

  if (msUntilExpiry < 0) {
    return "expired";
  }

  if (msUntilExpiry <= EXPIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
    return "expiring";
  }

  return "current";
};

export const getVendorDocumentStateLabel = (document = {}) => {
  const state = getVendorDocumentState(document);
  if (state === "expired") return "Expired";
  if (state === "expiring") return "Expiring soon";
  return "Current";
};

export const getVendorComplianceState = (vendor = {}) => {
  if (vendor.status === "inactive") {
    return "inactive";
  }

  const documents = Array.isArray(vendor.documents) ? vendor.documents : [];
  const legacyCompliance = vendor.compliance || {};
  const normalizedCategories = documents.map((document) =>
    String(document.category || "").trim().toLowerCase()
  );

  const hasLegacyW9 = Boolean(String(legacyCompliance.w9_url || "").trim());
  const hasLegacyInsurance = Boolean(String(legacyCompliance.insurance_url || "").trim());
  const insuranceLegacyState = getVendorDocumentState({
    expiresAt: legacyCompliance.insurance_expiration_date,
  });

  const missingRequired = REQUIRED_DOCUMENT_MATCHERS.some((matcher, index) => {
    const hasDocument = normalizedCategories.some((category) => matcher(category));

    if (index === 0) {
      return !(hasDocument || hasLegacyW9);
    }

    return !(hasDocument || hasLegacyInsurance);
  });

  if (missingRequired) {
    return "missing";
  }

  const relevantDocuments = documents.filter((document) =>
    REQUIRED_DOCUMENT_MATCHERS.some((matcher) =>
      matcher(String(document.category || "").trim().toLowerCase())
    )
  );

  if (relevantDocuments.some((document) => getVendorDocumentState(document) === "expired")) {
    return "expired";
  }

  if (hasLegacyInsurance && insuranceLegacyState === "expired") {
    return "expired";
  }

  if (relevantDocuments.some((document) => getVendorDocumentState(document) === "expiring")) {
    return "expiring";
  }

  if (hasLegacyInsurance && insuranceLegacyState === "expiring") {
    return "expiring";
  }

  return "current";
};

export const getVendorComplianceLabel = (vendor = {}) => {
  const state = getVendorComplianceState(vendor);
  switch (state) {
    case "missing":
      return "Needs compliance";
    case "expired":
      return "Expired docs";
    case "expiring":
      return "Expiring soon";
    case "inactive":
      return "Inactive";
    case "current":
    default:
      return "Compliant";
  }
};

export const getVendorComplianceClasses = (vendor = {}) => {
  const state = getVendorComplianceState(vendor);
  switch (state) {
    case "missing":
    case "expired":
      return "border border-clay-200 bg-clay-50 text-clay-700";
    case "expiring":
      return "border border-sand-200 bg-sand-50 text-sand-700";
    case "inactive":
      return "border border-ink-100 bg-ink-50 text-ink-500";
    case "current":
    default:
      return "border border-verdigris-200 bg-verdigris-50 text-verdigris-700";
  }
};

export const vendorMatchesSearch = (vendor = {}, searchValue = "") => {
  const normalizedQuery = String(searchValue || "").trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [
    vendor.name,
    vendor.trade,
    ...(getVendorSpecialties(vendor) || []),
    vendor.description,
    vendor.notes,
    vendor.serviceArea,
    vendor.contactInfo?.contactName,
    vendor.contactInfo?.email,
    vendor.contactInfo?.phone,
    vendor.contactInfo?.address,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
};
